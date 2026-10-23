package main

import (
	"cmp"
	"context"
	"errors"
	"fmt"
	"log"
	"net"
	"net/http"
	"net/url"
	"os"
	"os/signal"
	"path/filepath"
	"syscall"
	"time"

	"blog.hloth.dev/backend/internal/api"
	"blog.hloth.dev/backend/internal/broadcast"
	"blog.hloth.dev/backend/internal/feed"
	"blog.hloth.dev/backend/internal/pow"
	"blog.hloth.dev/backend/internal/store"
	"blog.hloth.dev/backend/internal/webpush"
)

const (
	vapidSubject    = "https://blog.hloth.dev"
	minSecretBytes  = 32
	sendTimeout     = 10 * time.Second
	shutdownTimeout = 15 * time.Second
)

type config struct {
	origin          string
	jwtSecret       string
	pepper          string
	vapidPublicKey  string
	vapidPrivateKey string
	address         string
	stateFile       string
}

func main() {
	log.SetFlags(0)
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	// Restoring the default handlers lets a second signal kill a stuck shutdown.
	context.AfterFunc(ctx, stop)
	if err := run(ctx, os.Getenv, net.Listen); err != nil {
		log.Fatal(err)
	}
}

func loadConfig(getenv func(string) string) (config, error) {
	cfg := config{
		origin:          getenv("ORIGIN"),
		jwtSecret:       getenv("REACTIONS_JWT_SECRET"),
		pepper:          getenv("IP_HASH_PEPPER"),
		vapidPublicKey:  getenv("PUBLIC_WEB_PUSH_KEY"),
		vapidPrivateKey: getenv("PRIVATE_WEB_PUSH_KEY"),
		address:         net.JoinHostPort(cmp.Or(getenv("HOST"), "127.0.0.1"), cmp.Or(getenv("PORT"), "3000")),
		stateFile:       cmp.Or(getenv("STATE_FILE"), filepath.Join(getenv("STATE_DIRECTORY"), "state.json")),
	}
	for _, name := range []string{"ORIGIN", "REACTIONS_JWT_SECRET", "IP_HASH_PEPPER", "PUBLIC_WEB_PUSH_KEY", "PRIVATE_WEB_PUSH_KEY"} {
		if getenv(name) == "" {
			return config{}, fmt.Errorf("%s is not set", name)
		}
	}
	origin, err := url.Parse(cfg.origin)
	if err != nil || (origin.Scheme != "http" && origin.Scheme != "https") || origin.Host == "" || origin.Scheme+"://"+origin.Host != cfg.origin {
		return config{}, errors.New("ORIGIN must be scheme://host[:port] without a path or trailing slash")
	}
	for _, name := range []string{"REACTIONS_JWT_SECRET", "IP_HASH_PEPPER"} {
		if len(getenv(name)) < minSecretBytes {
			return config{}, fmt.Errorf("%s must be at least %d bytes long", name, minSecretBytes)
		}
	}
	return cfg, nil
}

func run(ctx context.Context, getenv func(string) string, listen func(network, address string) (net.Listener, error)) error {
	cfg, err := loadConfig(getenv)
	if err != nil {
		return err
	}
	sender, err := webpush.NewSender(cfg.vapidPublicKey, cfg.vapidPrivateKey, vapidSubject, sendTimeout)
	if err != nil {
		return fmt.Errorf("PUBLIC_WEB_PUSH_KEY and PRIVATE_WEB_PUSH_KEY: %w", err)
	}
	state, err := store.Open(cfg.stateFile)
	if err != nil {
		return fmt.Errorf("STATE_FILE: %w", err)
	}
	posts := feed.New(cfg.origin, nil)
	listener, err := listen("tcp", cfg.address)
	if err != nil {
		return err
	}
	challenges := pow.New([]byte(cfg.jwtSecret), []byte(cfg.pepper), state)
	httpServer := &http.Server{
		Handler:           api.New(cfg.origin, cfg.pepper, state, posts, challenges),
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       10 * time.Second,
		WriteTimeout:      30 * time.Second,
		IdleTimeout:       2 * time.Minute,
	}

	ctx, stopBroadcaster := context.WithCancel(ctx)
	broadcasterDone := make(chan struct{})
	go func() {
		defer close(broadcasterDone)
		broadcast.Run(ctx, posts, state, sender)
	}()
	served := make(chan error, 1)
	go func() { served <- httpServer.Serve(listener) }()
	log.Printf("listening on http://%s", listener.Addr())

	var serveErr error
	select {
	case serveErr = <-served:
	case <-ctx.Done():
	}
	stopBroadcaster()
	shutdown(httpServer, broadcasterDone, state)
	return serveErr
}

func shutdown(httpServer *http.Server, broadcasterDone <-chan struct{}, state *store.Store) {
	ctx, cancel := context.WithTimeout(context.Background(), shutdownTimeout)
	defer cancel()
	if err := httpServer.Shutdown(ctx); err != nil {
		log.Printf("shutdown: %v", err)
	}
	select {
	case <-broadcasterDone:
	case <-ctx.Done():
		log.Print("shutdown: a push is still in flight and stays queued")
	}
	if err := state.Flush(); err != nil {
		log.Printf("shutdown: %v", err)
	}
}
