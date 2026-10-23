package api

import (
	"bufio"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"slices"
	"strconv"
	"strings"
	"testing"

	"blog.hloth.dev/backend/internal/pow"
	"blog.hloth.dev/backend/internal/store"
	"blog.hloth.dev/backend/internal/testkit"
)

const testOrigin = "https://blog.example"

const (
	succeeded       = `{"ok":true}`
	rejected        = `{"ok":false}`
	badRequest      = `{"ok":false,"error":"Bad Request"}`
	malformed       = `{"ok":false,"error":"Malformed Request"}`
	postNotFound    = `{"ok":false,"error":"Post not found"}`
	notFound        = `{"ok":false,"error":"Not Found"}`
	originRequired  = `{"ok":false,"error":"Origin header is required"}`
	crossSite       = `{"ok":false,"error":"Cross-site requests are not allowed"}`
	unavailable     = `{"ok":false,"error":"Service Unavailable"}`
	serverError     = `{"ok":false,"error":"Internal Server Error"}`
	payloadTooLarge = `{"ok":false,"error":"Payload Too Large"}`
)

func TestMain(m *testing.M) {
	log.SetOutput(io.Discard)
	os.Exit(m.Run())
}

type api struct {
	url   string
	path  string
	store *store.Store
}

type response struct {
	status int
	header http.Header
	body   string
}

func newAPI(t *testing.T, posts *testkit.FakeFeed) *api {
	t.Helper()
	return openAPI(t, posts, testkit.StatePath(t))
}

func openAPI(t *testing.T, posts *testkit.FakeFeed, path string) *api {
	t.Helper()
	state := testkit.OpenStore(t, path)
	pepper := strings.Repeat("p", 32)
	challenges := pow.New([]byte(strings.Repeat("s", 32)), []byte(pepper), state)
	srv := httptest.NewServer(New(testOrigin, pepper, state, posts.Feed(), challenges))
	t.Cleanup(srv.Close)
	return &api{url: srv.URL, path: path, store: state}
}

func (a *api) send(t *testing.T, method, path, body string, headers ...string) response {
	t.Helper()
	req, err := http.NewRequest(method, a.url+path, strings.NewReader(body))
	if err != nil {
		t.Fatal(err)
	}
	for pair := range slices.Chunk(headers, 2) {
		req.Header.Set(pair[0], pair[1])
	}
	res, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Fatal(err)
	}
	return readResponse(t, res)
}

func (a *api) sendRaw(t *testing.T, method, requestTarget string) response {
	t.Helper()
	conn, err := net.Dial("tcp", strings.TrimPrefix(a.url, "http://"))
	if err != nil {
		t.Fatal(err)
	}
	defer conn.Close()
	fmt.Fprintf(conn, "%s %s HTTP/1.1\r\nHost: api.example\r\nOrigin: %s\r\nConnection: close\r\n\r\n", method, requestTarget, testOrigin)
	res, err := http.ReadResponse(bufio.NewReader(conn), nil)
	if err != nil {
		t.Fatal(err)
	}
	return readResponse(t, res)
}

func readResponse(t *testing.T, res *http.Response) response {
	t.Helper()
	defer res.Body.Close()
	answer, err := io.ReadAll(res.Body)
	if err != nil {
		t.Fatal(err)
	}
	return response{res.StatusCode, res.Header, strings.TrimSuffix(string(answer), "\n")}
}

func (a *api) expectStateOmits(t *testing.T, fragments ...string) {
	t.Helper()
	file, err := os.ReadFile(a.path)
	if err != nil {
		t.Fatal(err)
	}
	for _, fragment := range fragments {
		if strings.Contains(string(file), fragment) {
			t.Errorf("the state file contains %s", fragment)
		}
	}
}

func jsonBody(v any) string {
	body, _ := json.Marshal(v)
	return string(body)
}

func subscription(endpoint, p256dh, auth string) map[string]any {
	return map[string]any{"endpoint": endpoint, "keys": map[string]any{"p256dh": p256dh, "auth": auth}}
}

func subscribeBody(endpoint, p256dh, auth string) string {
	return jsonBody(subscription(endpoint, p256dh, auth))
}

func (r response) expect(t *testing.T, status int, body string) {
	t.Helper()
	if r.status != status || r.body != body {
		t.Fatalf("got %d %s, want %d %s", r.status, r.body, status, body)
	}
	if contentType := r.header.Get("Content-Type"); body != "" && contentType != "application/json" {
		t.Fatalf("Content-Type = %q", contentType)
	}
}

func TestOriginRules(t *testing.T) {
	a := newAPI(t, testkit.NewFakeFeed(t, testkit.Post("first")))
	tests := []struct {
		name, method, path, origin string
		status                     int
		body                       string
		allowOrigin                string
	}{
		{"GET without Origin", "GET", "/posts/first/views", "", 200, "0", ""},
		{"HEAD without Origin", "HEAD", "/posts/first/views", "", 200, "", ""},
		{"GET same origin", "GET", "/posts/first/views", testOrigin, 200, "0", testOrigin},
		{"GET foreign origin", "GET", "/posts/first/views", "https://evil.example", 403, crossSite, ""},
		{"GET origin differing by case", "GET", "/posts/first/views", "https://BLOG.example", 403, crossSite, ""},
		{"GET null origin", "GET", "/posts/first/views", "null", 403, crossSite, ""},
		{"POST without Origin", "POST", "/posts/first/views", "", 400, originRequired, ""},
		{"POST foreign origin", "POST", "/posts/first/views", "https://evil.example", 403, crossSite, ""},
		{"POST same origin", "POST", "/posts/first/views", testOrigin, 200, `{"ok":true,"value":1}`, testOrigin},
		{"DELETE without Origin", "DELETE", "/notifications/web-push/x", "", 400, originRequired, ""},
		{"OPTIONS without Origin", "OPTIONS", "/posts/first/views", "", 400, originRequired, ""},
		{"OPTIONS foreign origin", "OPTIONS", "/posts/first/views", "https://evil.example", 403, crossSite, ""},
		{"unknown route is checked before routing", "POST", "/nope", "", 400, originRequired, ""},
		{"unknown route foreign origin", "GET", "/nope", "https://evil.example", 403, crossSite, ""},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			var headers []string
			if test.origin != "" {
				headers = []string{"Origin", test.origin}
			}
			res := a.send(t, test.method, test.path, "", headers...)
			res.expect(t, test.status, test.body)
			if got := res.header.Get("Access-Control-Allow-Origin"); got != test.allowOrigin {
				t.Errorf("Access-Control-Allow-Origin = %q, want %q", got, test.allowOrigin)
			}
			if got := res.header.Get("Vary"); got != "Origin" {
				t.Errorf("Vary = %q", got)
			}
		})
	}
	if views := a.store.Views("first"); views != 1 {
		t.Fatalf("rejected requests changed the view count: %d", views)
	}
}

func TestPreflight(t *testing.T) {
	a := newAPI(t, testkit.NewFakeFeed(t, testkit.Post("first")))
	for _, path := range []string{"/posts/first/reactions", "/notifications/web-push/https%3A%2F%2Ffcm.googleapis.com%2Fx"} {
		res := a.send(t, "OPTIONS", path, "", "Origin", testOrigin, "Access-Control-Request-Method", "DELETE", "Access-Control-Request-Headers", "content-type")
		res.expect(t, http.StatusNoContent, "")
		want := map[string]string{
			"Access-Control-Allow-Origin":  testOrigin,
			"Access-Control-Allow-Methods": "GET, POST, DELETE",
			"Access-Control-Allow-Headers": "Content-Type",
			"Vary":                         "Origin",
		}
		for name, value := range want {
			if got := res.header.Get(name); got != value {
				t.Errorf("%s: %s = %q, want %q", path, name, got, value)
			}
		}
		if age, err := strconv.Atoi(res.header.Get("Access-Control-Max-Age")); err != nil || age <= 0 {
			t.Errorf("Access-Control-Max-Age = %q", res.header.Get("Access-Control-Max-Age"))
		}
	}
}

func TestNotFound(t *testing.T) {
	a := newAPI(t, testkit.NewFakeFeed(t, testkit.Post("first")))
	for _, target := range []string{
		"GET /", "GET /posts", "GET /posts/first", "GET /posts/first/views/", "GET /posts/first/views/extra",
		"PUT /posts/first/views", "DELETE /posts/first/reactions", "GET /posts/first/reactions/challenge",
		"GET /notifications/web-push", "POST /notifications/web-push/x", "DELETE /notifications/web-push",
		"PATCH /notifications/web-push/x",
	} {
		method, path, _ := strings.Cut(target, " ")
		a.send(t, method, path, "", "Origin", testOrigin).expect(t, http.StatusNotFound, notFound)
	}
	a.send(t, "GET", "/posts/missing/views", "").expect(t, http.StatusNotFound, postNotFound)
	a.send(t, "GET", "/posts/a%00b/reactions", "").expect(t, http.StatusBadRequest, badRequest)
	a.send(t, "POST", "/posts/a%00b/views", "", "Origin", testOrigin).expect(t, http.StatusBadRequest, badRequest)
}

func TestRequestBodyErrors(t *testing.T) {
	a := newAPI(t, testkit.NewFakeFeed(t, testkit.Post("first")))
	reaction := strconv.Quote(reactions[0])
	valid := `"challenge":"x.y.z","reaction":` + reaction
	tests := []struct {
		name, path, body string
		status           int
		answer           string
	}{
		{"empty body", "/reactions/challenge", ``, 400, malformed},
		{"truncated JSON", "/reactions/challenge", `{"reaction":`, 400, malformed},
		{"trailing data", "/reactions/challenge", `{"reaction":` + reaction + `} x`, 400, malformed},
		{"not JSON", "/reactions", `reaction=x`, 400, malformed},
		{"array", "/reactions/challenge", `[]`, 400, badRequest},
		{"null", "/reactions/challenge", `null`, 400, badRequest},
		{"missing reaction", "/reactions/challenge", `{}`, 400, badRequest},
		{"unknown reaction", "/reactions/challenge", `{"reaction":"😀"}`, 400, badRequest},
		{"reaction of the wrong type", "/reactions/challenge", `{"reaction":1}`, 400, badRequest},
		{"missing challenge", "/reactions", `{"solutions":[1],"reaction":` + reaction + `}`, 400, badRequest},
		{"empty challenge", "/reactions", `{"challenge":"","solutions":[1],"reaction":` + reaction + `}`, 400, badRequest},
		{"missing solutions", "/reactions", `{` + valid + `}`, 400, badRequest},
		{"null solutions", "/reactions", `{"solutions":null,` + valid + `}`, 400, badRequest},
		{"negative solution", "/reactions", `{"solutions":[-1],` + valid + `}`, 400, badRequest},
		{"fractional solution", "/reactions", `{"solutions":[1.5],` + valid + `}`, 400, badRequest},
		{"string solution", "/reactions", `{"solutions":["1"],` + valid + `}`, 400, badRequest},
		{"solution above 2^53-1", "/reactions", `{"solutions":[9007199254740992],` + valid + `}`, 400, badRequest},
		{"unknown reaction on submit", "/reactions", `{"challenge":"x.y.z","solutions":[1],"reaction":"x"}`, 400, badRequest},
		{"largest solution is valid but unverified", "/reactions", `{"solutions":[9007199254740991],` + valid + `}`, 400, rejected},
		{"no solutions is valid but unverified", "/reactions", `{"solutions":[],` + valid + `}`, 400, rejected},
		{"body over 64 KiB", "/reactions/challenge", `{"reaction":"` + strings.Repeat("a", maxBodyBytes) + `"}`, 413, payloadTooLarge},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			a.send(t, "POST", "/posts/first"+test.path, test.body, "Origin", testOrigin).expect(t, test.status, test.answer)
		})
	}
	a.send(t, "POST", "/posts/missing/reactions/challenge", `{"reaction":`+reaction+`}`, "Origin", testOrigin).
		expect(t, 404, postNotFound)
	a.send(t, "POST", "/posts/missing/reactions", `{"solutions":[1],`+valid+`}`, "Origin", testOrigin).
		expect(t, 404, postNotFound)
}

func TestClientIP(t *testing.T) {
	tests := []struct {
		name       string
		forwarded  []string
		remoteAddr string
		want       string
	}{
		{"single entry", []string{"198.51.100.1"}, "127.0.0.1:5000", "198.51.100.1"},
		{"rightmost entry", []string{"1.1.1.1, 2.2.2.2 ,  198.51.100.1 "}, "127.0.0.1:5000", "198.51.100.1"},
		{"last header line", []string{"1.1.1.1", "2.2.2.2, 198.51.100.1"}, "127.0.0.1:5000", "198.51.100.1"},
		{"IPv6 is reduced to its /64", []string{"2001:db8:1:2:3:4:5:6"}, "127.0.0.1:5000", "2001:db8:1:2::"},
		{"IPv4-mapped IPv6", []string{"::ffff:198.51.100.1"}, "127.0.0.1:5000", "::ffff:198.51.100.1"},
		{"no header", nil, "192.0.2.4:5000", "192.0.2.4"},
		{"no header, IPv6 peer", nil, "[2001:db8::2]:5000", "2001:db8::"},
		{"empty header", []string{""}, "192.0.2.4:5000", "192.0.2.4"},
		{"empty rightmost entry", []string{"1.1.1.1, "}, "192.0.2.4:5000", "192.0.2.4"},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			r := httptest.NewRequest("POST", "/", nil)
			r.RemoteAddr = test.remoteAddr
			for _, value := range test.forwarded {
				r.Header.Add("X-Forwarded-For", value)
			}
			if got := clientIP(r); got != test.want {
				t.Fatalf("got %q, want %q", got, test.want)
			}
		})
	}
}

func TestFeedUnavailable(t *testing.T) {
	posts := testkit.NewFakeFeed(t, testkit.Post("first"))
	posts.SetDown(true)
	a := newAPI(t, posts)
	a.send(t, "GET", "/posts/first/views", "").expect(t, 503, unavailable)
	a.send(t, "POST", "/posts/first/views", "", "Origin", testOrigin).expect(t, 503, unavailable)
	a.send(t, "GET", "/posts/first/reactions", "").expect(t, 200, a.send(t, "GET", "/posts/other/reactions", "").body)
}

func TestKnownPostsSurviveAFeedOutage(t *testing.T) {
	posts := testkit.NewFakeFeed(t, testkit.Post("first"))
	a := newAPI(t, posts)
	a.send(t, "GET", "/posts/first/views", "").expect(t, 200, "0")
	posts.SetDown(true)
	a.send(t, "GET", "/posts/first/views", "").expect(t, 200, "0")
	a.send(t, "GET", "/posts/missing/views", "").expect(t, 404, postNotFound)
}

func TestStoreFailureAnswers500(t *testing.T) {
	a := newAPI(t, testkit.NewFakeFeed(t, testkit.Post("first")))
	if err := os.RemoveAll(filepath.Dir(a.path)); err != nil {
		t.Fatal(err)
	}
	a.send(t, "POST", "/posts/first/views", "", "Origin", testOrigin).expect(t, 500, serverError)
	p256dh, auth := testkit.SubscriberKeys(t)
	a.send(t, "POST", "/notifications/web-push", subscribeBody("https://web.push.apple.com/a", p256dh, auth), "Origin", testOrigin).expect(t, 500, serverError)
	a.send(t, "DELETE", "/notifications/web-push/https%3A%2F%2Fweb.push.apple.com%2Fa", "", "Origin", testOrigin).expect(t, 500, serverError)
	a.send(t, "GET", "/posts/first/reactions", "").expect(t, 200, a.send(t, "GET", "/posts/other/reactions", "").body)
}
