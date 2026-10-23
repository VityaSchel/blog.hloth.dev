package main

import (
	"context"
	"errors"
	"io"
	"log"
	"maps"
	"net"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"blog.hloth.dev/backend/internal/testkit"
)

func TestMain(m *testing.M) {
	log.SetOutput(io.Discard)
	os.Exit(m.Run())
}

func testEnv(t *testing.T) map[string]string {
	public, private := testkit.VAPIDKeys(t)
	return map[string]string{
		"ORIGIN":               "http://localhost:4321",
		"REACTIONS_JWT_SECRET": strings.Repeat("j", 32),
		"IP_HASH_PEPPER":       strings.Repeat("p", 32),
		"PUBLIC_WEB_PUSH_KEY":  public,
		"PRIVATE_WEB_PUSH_KEY": private,
	}
}

func getenv(env map[string]string) func(string) string {
	return func(name string) string { return env[name] }
}

func TestLoadConfigDefaults(t *testing.T) {
	env := testEnv(t)
	env["NODE_ENV"] = "production"
	env["DATABASE_URL"] = "postgresql://ignored"
	cfg, err := loadConfig(getenv(env))
	if err != nil {
		t.Fatal(err)
	}
	if cfg.address != "127.0.0.1:3000" || cfg.stateFile != "state.json" || cfg.origin != env["ORIGIN"] {
		t.Fatalf("config = %+v", cfg)
	}

	env["HOST"], env["PORT"], env["STATE_DIRECTORY"] = "::1", "3001", "/var/lib/blog"
	cfg, err = loadConfig(getenv(env))
	if err != nil || cfg.address != "[::1]:3001" || cfg.stateFile != "/var/lib/blog/state.json" {
		t.Fatalf("config = %+v, %v", cfg, err)
	}

	env["STATE_FILE"] = "/srv/state/blog.json"
	cfg, err = loadConfig(getenv(env))
	if err != nil || cfg.stateFile != "/srv/state/blog.json" {
		t.Fatalf("STATE_FILE must win over STATE_DIRECTORY: %+v, %v", cfg, err)
	}
}

func TestLoadConfigRejects(t *testing.T) {
	tests := []struct {
		name, variable, value string
	}{
		{"missing ORIGIN", "ORIGIN", ""},
		{"ORIGIN with a trailing slash", "ORIGIN", "https://blog.example/"},
		{"ORIGIN with a path", "ORIGIN", "https://blog.example/blog"},
		{"ORIGIN without a scheme", "ORIGIN", "blog.example"},
		{"ORIGIN with another scheme", "ORIGIN", "ftp://blog.example"},
		{"ORIGIN without a host", "ORIGIN", "https://"},
		{"missing REACTIONS_JWT_SECRET", "REACTIONS_JWT_SECRET", ""},
		{"short REACTIONS_JWT_SECRET", "REACTIONS_JWT_SECRET", strings.Repeat("x", 31)},
		{"missing IP_HASH_PEPPER", "IP_HASH_PEPPER", ""},
		{"short IP_HASH_PEPPER", "IP_HASH_PEPPER", strings.Repeat("y", 31)},
		{"missing PUBLIC_WEB_PUSH_KEY", "PUBLIC_WEB_PUSH_KEY", ""},
		{"missing PRIVATE_WEB_PUSH_KEY", "PRIVATE_WEB_PUSH_KEY", ""},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			env := testEnv(t)
			env[test.variable] = test.value
			_, err := loadConfig(getenv(env))
			if err == nil {
				t.Fatal("accepted")
			}
			expectNamesVariableOnly(t, err, test.variable, env)
		})
	}
}

func expectNamesVariableOnly(t *testing.T, err error, variable string, env map[string]string) {
	t.Helper()
	if !strings.Contains(err.Error(), variable) {
		t.Fatalf("error %q does not name %s", err, variable)
	}
	for value := range maps.Values(env) {
		if len(value) > 8 && strings.Contains(err.Error(), value) {
			t.Fatalf("error %q contains a configured value", err)
		}
	}
}

func TestRunFailsBeforeListening(t *testing.T) {
	corrupt := filepath.Join(t.TempDir(), "state.json")
	if err := os.WriteFile(corrupt, []byte(`{"reactions":`), 0o600); err != nil {
		t.Fatal(err)
	}
	_, otherPrivate := testkit.VAPIDKeys(t)
	refuseListen := func(string, string) (net.Listener, error) { return nil, errors.New("run listened") }
	tests := []struct {
		name, variable, value, names string
	}{
		{"VAPID keys of different pairs", "PRIVATE_WEB_PUSH_KEY", otherPrivate, "PRIVATE_WEB_PUSH_KEY"},
		{"VAPID key that is not base64url", "PUBLIC_WEB_PUSH_KEY", "not a key", "PUBLIC_WEB_PUSH_KEY"},
		{"state directory that does not exist", "STATE_FILE", filepath.Join(t.TempDir(), "missing", "state.json"), "STATE_FILE"},
		{"corrupt state file", "STATE_FILE", corrupt, corrupt},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			env := testEnv(t)
			env["STATE_FILE"] = filepath.Join(t.TempDir(), "state.json")
			env[test.variable] = test.value
			err := run(t.Context(), getenv(env), refuseListen)
			if err == nil {
				t.Fatal("run returned without an error")
			}
			delete(env, "STATE_FILE")
			expectNamesVariableOnly(t, err, test.names, env)
		})
	}
	if data, _ := os.ReadFile(corrupt); string(data) != `{"reactions":` {
		t.Fatalf("the corrupt state file was modified: %q", data)
	}
}

type testRun struct {
	t         *testing.T
	origin    string
	address   string
	stateFile string
	listener  net.Listener
	cancel    context.CancelFunc
	stopped   chan error
}

func startRun(t *testing.T) *testRun {
	t.Helper()
	posts := testkit.NewFakeFeed(t, testkit.Post("first"))
	env := testEnv(t)
	env["ORIGIN"], env["PORT"] = posts.URL, "0"
	env["STATE_DIRECTORY"] = t.TempDir()
	ctx, cancel := context.WithCancel(t.Context())
	finished := make(chan struct{})
	t.Cleanup(func() {
		cancel()
		<-finished
	})
	listeners := make(chan net.Listener, 1)
	listen := func(network, address string) (net.Listener, error) {
		listener, err := net.Listen(network, address)
		if err == nil {
			listeners <- listener
		}
		return listener, err
	}
	r := &testRun{
		t:         t,
		origin:    posts.URL,
		stateFile: filepath.Join(env["STATE_DIRECTORY"], "state.json"),
		cancel:    cancel,
		stopped:   make(chan error, 1),
	}
	go func() {
		defer close(finished)
		r.stopped <- run(ctx, getenv(env), listen)
	}()
	select {
	case r.listener = <-listeners:
	case err := <-r.stopped:
		t.Fatalf("run returned before listening: %v", err)
	case <-time.After(10 * time.Second):
		t.Fatal("run did not listen")
	}
	r.address = r.listener.Addr().String()
	r.eventually("the server answers", func() bool {
		status, body := r.request("GET", "/posts/first/views", r.origin, "")
		return status == 200 && body == "0"
	})
	r.eventually("the broadcaster seeds the state file", func() bool {
		_, err := os.Stat(r.stateFile)
		return err == nil
	})
	return r
}

func (r *testRun) request(method, path, origin, body string) (int, string) {
	r.t.Helper()
	req, err := http.NewRequest(method, "http://"+r.address+path, strings.NewReader(body))
	if err != nil {
		r.t.Fatal(err)
	}
	req.Header.Set("Origin", origin)
	res, err := http.DefaultClient.Do(req)
	if err != nil {
		return 0, err.Error()
	}
	defer res.Body.Close()
	answer, _ := io.ReadAll(res.Body)
	return res.StatusCode, strings.TrimSpace(string(answer))
}

func (r *testRun) eventually(what string, done func() bool) {
	r.t.Helper()
	for deadline := time.Now().Add(10 * time.Second); !done(); time.Sleep(20 * time.Millisecond) {
		select {
		case err := <-r.stopped:
			r.t.Fatalf("run returned early: %v", err)
		default:
		}
		if time.Now().After(deadline) {
			r.t.Fatalf("timed out waiting until %s", what)
		}
	}
}

func (r *testRun) issueChallenge() {
	r.t.Helper()
	if status, body := r.request("POST", "/posts/first/reactions/challenge", r.origin, `{"reaction":"👍"}`); status != 200 {
		r.t.Fatalf("challenge answered %d: %s", status, body)
	}
}

// Under shutdownTimeout, so a broadcaster left running fails the test instead of being waited out.
func (r *testRun) wait() error {
	r.t.Helper()
	select {
	case err := <-r.stopped:
		return err
	case <-time.After(shutdownTimeout / 2):
		r.t.Fatal("run did not return before the shutdown deadline")
		return nil
	}
}

func (r *testRun) expectStateSaved() {
	r.t.Helper()
	state := testkit.ReadState(r.t, r.stateFile)
	if !maps.Equal(state.Notified, map[string]int{"first": 0}) {
		r.t.Fatalf("the broadcaster did not seed the state file: %v", state.Notified)
	}
	if len(state.Challenges) != 1 {
		r.t.Fatalf("challenges in the state file after shutdown = %v, want the one issued", state.Challenges)
	}
}

func TestRunServesUntilCanceled(t *testing.T) {
	r := startRun(t)
	if status, _ := r.request("GET", "/posts/first/views", "https://evil.example", ""); status != 403 {
		t.Fatalf("foreign origin answered %d", status)
	}
	r.issueChallenge()

	r.cancel()
	if err := r.wait(); err != nil {
		t.Fatalf("run returned %v after cancel, want nil", err)
	}
	if status, _ := r.request("GET", "/posts/first/views", r.origin, ""); status != 0 {
		t.Fatalf("the server still answers after shutdown: %d", status)
	}
	r.expectStateSaved()
}

func TestRunShutsDownWhenServingFails(t *testing.T) {
	r := startRun(t)
	r.issueChallenge()

	r.listener.Close()
	if err := r.wait(); !errors.Is(err, net.ErrClosed) {
		t.Fatalf("run returned %v, want the listener's error", err)
	}
	r.expectStateSaved()
}
