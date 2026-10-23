# blog.hloth.dev backend

HTTP API for post reactions (proof of work), view counters and Web Push notifications about new posts. One static Go binary, standard library only. All state is one JSON file.

## Environment

| Variable | Meaning |
|---|---|
| `ORIGIN` | Frontend origin, for example `https://blog.hloth.dev` (no path, no trailing slash). Posts are read from `ORIGIN/rss.xml`. |
| `REACTIONS_JWT_SECRET` | At least 32 bytes. Signs proof-of-work challenges. |
| `IP_HASH_PEPPER` | At least 32 bytes. Mixed into the visitor hashes of the view counter and keys the clients of the challenge history. |
| `PUBLIC_WEB_PUSH_KEY`, `PRIVATE_WEB_PUSH_KEY` | VAPID pair from `bunx web-push generate-vapid-keys`. |
| `HOST` | Default `127.0.0.1`. |
| `PORT` | Default `3000`. |
| `STATE_FILE` | Default `$STATE_DIRECTORY/state.json` when systemd sets `STATE_DIRECTORY`, else `state.json` in the working directory. |

`NODE_ENV` and `DATABASE_URL` are ignored. The process exits with a message naming the variable when a required one is missing or invalid.

## Develop

Copy `.env.example` to `.env.development` and fill it in.

```sh
set -a; . ./.env.development; set +a; go run .
```

The frontend must be reachable at `ORIGIN`. Until `ORIGIN/rss.xml` has loaded once, routes that check a post answer 503.

The first start with an empty state marks every post in the feed as already notified and sends nothing.

## Test

```sh
! gofmt -l . | grep . && go vet ./... && go test -race ./... && test -z "$(go fix -diff ./...)"
```

Tests use local fake feed and push servers and temporary state files. `internal/api/reactions_test.go` compares `internal/api/reactions.go` with `../shared/src/reactions.ts`.

## Layout

| Path | Contents |
|---|---|
| `main.go` | Configuration from the environment, wiring, signals, graceful shutdown. |
| `internal/api` | Routes and middleware (`server.go`), one file per resource: reactions (with the 14 reactions mirrored from `shared/src/reactions.ts`), views, push subscriptions. |
| `internal/broadcast` | New-post detection, notification payloads, draining the push queue that `internal/store` persists. |
| `internal/feed` | RSS fetch, parse, cache. |
| `internal/fieldhash` | Length-prefixed SHA-256 shared by the client and visitor hashes. |
| `internal/pow` | Proof-of-work challenges. |
| `internal/store` | The JSON state file. |
| `internal/webpush` | Web Push encryption, VAPID, HTTP send. |
| `internal/testkit` | Helpers shared by tests; never linked into the binary. |
| `migrate/export-state.sql` | One-time export of the old PostgreSQL data into `state.json`. |

## Build

```sh
CGO_ENABLED=0 go build -trimpath .
```

## Service

hloth-build builds the binary from a signed commit and installs it as `/usr/local/bin/blog.hloth.dev-backend`. The unit needs `ExecStart=/usr/local/bin/blog.hloth.dev-backend`, the environment above and `StateDirectory=blog.hloth.dev-backend`. With `DynamicUser=yes` the state file is then `/var/lib/private/blog.hloth.dev-backend/state.json`. Run one instance only: the file has no lock.

On SIGTERM the server stops accepting requests, lets pushes that are in flight finish (at most 10 seconds), writes the challenge history and exits 0. A broadcast that was interrupted continues after the next start with the subscribers that are still pending.

A subscription is removed when its push service answers 404 or 410, or when every push to it failed until the broadcast expired (24 hours, then one last attempt) while at least one other subscriber was reached. If `POST /notifications/web-push` answers 503, the 1,000-subscription cap is full: stop the service and restore `subscriptions` in the state file from a backup taken before the flood.

Behind the proxy a client is its IPv4 address or its IPv6 /64 (the key of Caddy's `ipv6_prefix 64` rate limit), so all onion circuits count as one client.

## State file

`state.json` holds `reactions`, `views`, today's hashed `visitors`, `challenges`, `subscriptions`, the `notified` posts and the `broadcasts` queue. Every change but a new challenge is written to a temporary file, synced and renamed over the state file before the request is answered, so a backup snapshot always contains a complete document. The server refuses to start when the state file does not parse and never replaces a file it cannot read. The file contains the push subscriptions: do not start a development server with a copy of it.

`challenges` keeps the reaction difficulty across restarts: for each client, the Unix nanosecond times of the challenges issued to it in the last 24 hours, at most 24 (the difficulty stops at 32 bits, more than a day of work for a browser), for at most 100,000 clients and 1,000,000 times in all (about 20 MB). At a cap, a new challenge first drops the expired times, then, while the history is above 90% of either cap, forgets the clients whose last challenge is the oldest; the client asking keeps its history. A file over a cap loads trimmed the same way. A client is an IP address, a post and a reaction, keyed by HMAC-SHA256 with `IP_HASH_PEPPER` (16 bytes, base64url), so neither the address nor the challenge's `clientId` reaches the file. A challenge is written with the next change or at shutdown, so a crash forgets the ones issued since the last write. A file without `challenges` starts with an empty history.

## Migration from Postgres

`migrate/export-state.sql` prints the first state document from the old schema; the cutover installs its output as `state.json`. Challenges and `sent_notifications` are not migrated.
