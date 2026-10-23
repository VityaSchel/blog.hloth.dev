package broadcast

import (
	"context"
	"crypto/sha256"
	"encoding/base64"
	"errors"
	"log"
	"sync"
	"sync/atomic"
	"time"

	"blog.hloth.dev/backend/internal/feed"
	"blog.hloth.dev/backend/internal/store"
	"blog.hloth.dev/backend/internal/webpush"
)

const (
	refreshInterval   = 5 * time.Minute
	broadcastLifetime = 24 * time.Hour
	concurrentSends   = 10
	// RFC 8030 allows at most 32 base64url characters in Topic.
	topicBytes = 24
)

type broadcaster struct {
	feed   *feed.Feed
	store  *store.Store
	sender *webpush.Sender
}

func Run(ctx context.Context, posts *feed.Feed, state *store.Store, sender *webpush.Sender) {
	b := &broadcaster{feed: posts, store: state, sender: sender}
	ticker := time.NewTicker(refreshInterval)
	defer ticker.Stop()
	for {
		b.cycle(ctx)
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
		}
	}
}

func (b *broadcaster) cycle(ctx context.Context) {
	if err := b.enqueueNewPosts(ctx); err != nil && ctx.Err() == nil {
		log.Printf("broadcast: %v", err)
	}
	for _, queued := range b.store.Broadcasts() {
		if err := b.deliver(ctx, queued); err != nil {
			log.Printf("broadcast: post %s: %v", queued.PostID, err)
		}
	}
}

// An empty feed never seeds: every post appearing later would count as new.
func (b *broadcaster) enqueueNewPosts(ctx context.Context) error {
	posts, err := b.feed.Refresh(ctx)
	if err != nil || len(posts) == 0 {
		return err
	}
	ids := make([]string, len(posts))
	for i, post := range posts {
		ids[i] = post.ID
	}
	if seeded, err := b.store.SeedNotified(ids); err != nil || seeded {
		return err
	}
	now := time.Now()
	for _, post := range posts {
		payload, err := payloadFor(post)
		if err != nil {
			return err
		}
		queued, err := b.store.Enqueue(post.ID, payload, now)
		if err != nil {
			return err
		}
		if queued {
			log.Printf("broadcast: post %s: queued", post.ID)
		}
	}
	return nil
}

func (b *broadcaster) deliver(ctx context.Context, queued store.Broadcast) error {
	expired := time.Since(queued.StartedAt) >= broadcastLifetime
	var (
		sends   sync.WaitGroup
		settled atomic.Int64
		slots   = make(chan struct{}, concurrentSends)
		topic   = topicFor(queued.PostID)
	)
	for _, endpoint := range queued.Pending {
		if ctx.Err() != nil {
			break
		}
		select {
		case <-ctx.Done():
		case slots <- struct{}{}:
			sends.Go(func() {
				defer func() { <-slots }()
				if err := b.push(ctx, queued, endpoint, topic); err != nil {
					log.Printf("broadcast: post %s: %v", queued.PostID, err)
					return
				}
				settled.Add(1)
			})
		}
	}
	sends.Wait()
	allSettled := settled.Load() == int64(len(queued.Pending))
	lastAttemptFinished := expired && ctx.Err() == nil
	if !allSettled && !lastAttemptFinished {
		return nil
	}
	return b.store.Finish(queued.PostID)
}

// A send that already started is not canceled: an aborted request could still
// reach the subscriber and would be repeated after the restart.
func (b *broadcaster) push(ctx context.Context, queued store.Broadcast, endpoint, topic string) error {
	sub, subscribed := b.store.Subscription(endpoint)
	if !subscribed {
		return b.store.Settle(queued.PostID, endpoint, false)
	}
	err := b.sender.Send(context.WithoutCancel(ctx), endpoint, sub.P256dh, sub.Auth, queued.Payload, topic)
	if status, ok := errors.AsType[*webpush.StatusError](err); ok && status.SubscriptionGone() {
		if _, err := b.store.Unsubscribe(endpoint); err != nil {
			return err
		}
		return b.store.Settle(queued.PostID, endpoint, false)
	}
	if err != nil {
		return err
	}
	return b.store.Settle(queued.PostID, endpoint, true)
}

func topicFor(postID string) string {
	sum := sha256.Sum256([]byte(postID))
	return base64.RawURLEncoding.EncodeToString(sum[:topicBytes])
}
