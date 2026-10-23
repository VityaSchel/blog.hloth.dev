package store

import (
	"encoding/json"
	"errors"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"slices"
	"sync"
	"testing"
	"time"
)

func within(t *testing.T, what string, f func()) {
	t.Helper()
	done := make(chan struct{})
	go func() {
		defer close(done)
		f()
	}()
	select {
	case <-done:
	case <-time.After(10 * time.Second):
		t.Fatalf("%s blocked", what)
	}
}

func TestWriteFile(t *testing.T) {
	path := statePath(t)
	must(t, os.WriteFile(path, []byte("old"), 0o644))

	must(t, writeFile(path, []byte("new")))
	if got := readFile(t, path); got != "new" {
		t.Errorf("content = %q, want %q", got, "new")
	}
	info, err := os.Stat(path)
	must(t, err)
	if mode := info.Mode().Perm(); mode != 0o600 {
		t.Errorf("mode = %o, want 600", mode)
	}
	expectOnlyStateFile(t, path)
}

func TestWriteFileFailureLeavesTargetAndNoTempFile(t *testing.T) {
	path := statePath(t)
	must(t, os.Mkdir(path, 0o700))
	must(t, os.WriteFile(filepath.Join(path, "keep"), nil, 0o600))

	if err := writeFile(path, []byte("new")); err == nil {
		t.Fatal("writeFile over a directory succeeded")
	}
	expectOnlyStateFile(t, path)
}

func TestGroupCommit(t *testing.T) {
	const waiters = 20
	path := statePath(t)
	s := open(t, path)

	var mu sync.Mutex
	var written []int
	started, release := make(chan struct{}), make(chan struct{})
	s.write = func(path string, data []byte) error {
		var st state
		if err := st.decode(data); err != nil {
			return err
		}
		mu.Lock()
		written = append(written, st.Views["post"])
		first := len(written) == 1
		mu.Unlock()
		if first {
			close(started)
			<-release
		}
		return writeFile(path, data)
	}

	var wg sync.WaitGroup
	addView := func(visitor int) {
		defer wg.Done()
		if _, err := s.AddView("post", fmt.Sprint(visitor), noon); err != nil {
			t.Error(err)
		}
	}
	wg.Add(1)
	go addView(0)
	<-started

	within(t, "a reader during a disk write", func() {
		if got := s.Views("post"); got != 1 {
			t.Errorf("Views during the write = %d, want 1", got)
		}
		s.Reactions("post")
		s.Subscription("https://push.example/a")
		s.Broadcasts()
	})

	wg.Add(waiters)
	for visitor := 1; visitor <= waiters; visitor++ {
		go addView(visitor)
	}
	within(t, "mutating memory during a disk write", func() {
		for s.Views("post") != waiters+1 {
			time.Sleep(time.Millisecond)
		}
	})
	if _, err := os.Stat(path); !errors.Is(err, fs.ErrNotExist) {
		t.Errorf("state file visible before the first write finished: %v", err)
	}

	close(release)
	wg.Wait()
	if want := []int{1, waiters + 1}; !slices.Equal(written, want) {
		t.Errorf("view counts written = %v, want %v: one write for the first change, one for all the others", written, want)
	}
	if got := open(t, path).Views("post"); got != waiters+1 {
		t.Errorf("Views after reopen = %d, want %d", got, waiters+1)
	}
}

func TestConcurrentMutationsAreDurableOnReturn(t *testing.T) {
	const workers = 32
	path := statePath(t)
	s := open(t, path)
	for i := range workers {
		subscribe(t, s, fmt.Sprintf("https://push.example/queued/%02d", i))
	}
	_, err := s.Enqueue("new", json.RawMessage(`{}`), noon)
	must(t, err)

	lastWritten := 0
	s.write = func(path string, data []byte) error {
		var st state
		if err := st.decode(data); err != nil {
			return err
		}
		if st.Views["post"] < lastWritten {
			t.Errorf("snapshot with %d views written after one with %d", st.Views["post"], lastWritten)
		}
		lastWritten = st.Views["post"]
		return writeFile(path, data)
	}

	stop, readerDone := make(chan struct{}), make(chan struct{})
	go func() {
		defer close(readerDone)
		for {
			select {
			case <-stop:
				return
			default:
			}
			if _, err := decodeFile(path); err != nil {
				t.Errorf("reader saw an incomplete file: %v", err)
				return
			}
		}
	}()

	var wg sync.WaitGroup
	for i := range workers {
		wg.Go(func() {
			own := fmt.Sprintf("post-%02d", i)
			endpoint := fmt.Sprintf("https://push.example/new/%02d", i)
			steps := []func() error{
				func() error { _, err := s.AddReaction(own, "👍"); return err },
				func() error { _, err := s.AddReaction("post", "👍"); return err },
				func() error { _, err := s.AddView("post", own, noon); return err },
				func() error { return s.Subscribe(endpoint, testSubscription) },
				func() error {
					return s.Settle("new", fmt.Sprintf("https://push.example/queued/%02d", i), true)
				},
			}
			for _, step := range steps {
				if err := step(); err != nil {
					t.Error(err)
					return
				}
			}
			onDisk, err := decodeFile(path)
			if err != nil {
				t.Error(err)
				return
			}
			if _, subscribed := onDisk.Subscriptions[endpoint]; !subscribed || onDisk.Reactions[own]["👍"] != 1 {
				t.Errorf("worker %d returned before its changes reached the disk", i)
			}
		})
	}
	wg.Wait()
	close(stop)
	<-readerDone

	reopened := open(t, path)
	if got := reopened.Reactions("post")["👍"]; got != workers {
		t.Errorf("shared reaction count = %d, want %d", got, workers)
	}
	if got := reopened.Views("post"); got != workers {
		t.Errorf("Views = %d, want %d", got, workers)
	}
	for i := range workers {
		if got := reopened.Reactions(fmt.Sprintf("post-%02d", i))["👍"]; got != 1 {
			t.Errorf("worker %d reaction count = %d, want 1", i, got)
		}
		if _, ok := reopened.Subscription(fmt.Sprintf("https://push.example/new/%02d", i)); !ok {
			t.Errorf("worker %d subscription lost", i)
		}
	}
	broadcasts := reopened.Broadcasts()
	if len(broadcasts) != 1 || broadcasts[0].Sent != workers || len(broadcasts[0].Pending) != 0 {
		t.Errorf("Broadcasts = %+v, want %d sent and nothing pending", broadcasts, workers)
	}
	expectOnlyStateFile(t, path)
}

func TestFailedWriteIsReportedAndRepairedByTheNextFlush(t *testing.T) {
	path := statePath(t)
	s := open(t, path)
	diskFull := errors.New("disk full")
	failing := true
	s.write = func(path string, data []byte) error {
		if failing {
			return diskFull
		}
		return writeFile(path, data)
	}

	if _, err := s.AddReaction("post", "👍"); !errors.Is(err, diskFull) {
		t.Fatalf("AddReaction error = %v, want %v", err, diskFull)
	}
	if err := s.Subscribe("https://push.example/a", testSubscription); !errors.Is(err, diskFull) {
		t.Fatalf("Subscribe error = %v, want %v", err, diskFull)
	}
	if err := s.Subscribe("https://push.example/a", testSubscription); !errors.Is(err, diskFull) {
		t.Fatalf("repeated Subscribe error = %v, want %v while the subscription is not on disk", err, diskFull)
	}
	if _, err := os.Stat(path); !errors.Is(err, fs.ErrNotExist) {
		t.Fatalf("state file exists after failed writes: %v", err)
	}

	failing = false
	subscribe(t, s, "https://push.example/a")
	reopened := open(t, path)
	if got := reopened.Reactions("post")["👍"]; got != 1 {
		t.Errorf("reaction count after repair = %d, want 1", got)
	}
	if _, ok := reopened.Subscription("https://push.example/a"); !ok {
		t.Error("subscription missing after repair")
	}
}
