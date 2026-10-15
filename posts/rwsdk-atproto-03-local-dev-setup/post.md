---
title: "RWSDK + ATP: Local Dev Setup"
excerpt: Every test hit against bsky.social is a problem waiting to happen — rate limits, audit trails, and no control over the data. This post sets up a local AT Protocol devnet so none of that matters.
thumbnail: thumbnail.png
date: '2026-10-14T20:00:00Z'
categories:
  - development
  - at-protocol
  - redwoodsdk
  - cloudflare
---

[Post 2](https://arsdehnel.com/posts/rwsdk-atproto-02-oauth) got OAuth working against a real Bluesky account. Every time you clicked "Sign in" during that development cycle, your Worker resolved your handle against `bsky.social`, initiated a Pushed Authorization Request against it, and exchanged tokens with it. That's fine for a quick proof of concept, but it's not a sustainable way to develop. Rate limits are real. Every test creates audit trail entries on production infrastructure you don't control. And when something breaks, you can't inspect or restart the thing you're talking to.

Post 3 fixes that. By the end you'll have a local AT Protocol stack running in Docker: a PDS, a DID registry, an SMTP sink.  With that the OAuth login will work against it without touching any production infrastructure. **Full transparency:** the core pieces of this `docker compose` setup were pulled from [OpenMeet-Team's atproto-devnet](https://github.com/OpenMeet-Team/atproto-devnet) repo.  

## What's actually running

Three services matter for this post:

**PLC** is the DID registry. When you create an account on AT Protocol, your identity is a `did:plc:*` identifier — something like `did:plc:bcu5cnyeyel3u7rtghyg34vi`. Resolving that DID to a DID document (which contains your PDS's public URL and signing keys) goes through a PLC server. In production that's `plc.directory`. In our devnet it needs to be local, because locally-created DIDs don't exist on the real `plc.directory`. The PLC server needs a Postgres database to store those records, so Postgres is in the stack too.

**PDS** is the Personal Data Server where accounts and records actually live. The PDS we run locally is the same one Bluesky operates in production (`ghcr.io/bluesky-social/pds`), just pointed at our local PLC instead of the real one.

**maildev** is an SMTP sink. This one surprised me as it turned out to be required. When you create an account on the PDS, even via the admin API, the PDS tries to send a welcome email. Without a running SMTP server it fails entirely. maildev accepts everything and exposes a web UI at port 1081 if you ever want to see what got sent.

## The two PDS env vars that matter most

After some trial and error, two environment variables were the difference between the PDS working and not:

```yaml
PDS_HOSTNAME: localhost
PDS_DEV_MODE: "true"
```

Without `PDS_HOSTNAME: localhost` you get `BadRequestError: Invalid origin` during OAuth. The PDS validates that the `Origin` header in the browser's requests matches its configured public URL. Setting the hostname to `localhost` makes that URL `http://localhost:3000`, which matches what the browser sends.

Without `PDS_DEV_MODE: "true"` you get `Error: Resource URL must use the https scheme`. The OAuth spec requires resource metadata to be served over HTTPS. Dev mode bypasses that check, which lets the PDS serve its OAuth endpoints over plain HTTP.

There's also a third one worth knowing about even if it's less obvious:

```yaml
PDS_DISABLE_SSRF_PROTECTION: "true"
```

Newer PDS builds added SSRF protection on outbound requests, which blocks the PDS from calling the local PLC server over an `http://` URL. Without this flag the PDS can't resolve DIDs from its own PLC, and account creation fails in a confusing way.

## Wiring the OAuth client to the devnet

With Post 2's client pointed at `bsky.social`, three things need to change for the local devnet:

```typescript
const { ATPROTO_PDS_URL: pdsUrl, ATPROTO_PLC_URL: plcUrl } = env;

const client = new NodeOAuthClient({
  handleResolver: pdsUrl,
  plcDirectoryUrl: plcUrl,
  allowHttp: pdsUrl.startsWith("http:"),
  // ...
});
```

**`handleResolver`** now points at the local PDS instead of `bsky.social`. The PDS has its own `com.atproto.identity.resolveHandle` endpoint and can resolve handles it knows about (like `alice.devnet.test`) directly without touching any external service.

**`plcDirectoryUrl`** overrides the default `https://plc.directory`. Without this, the OAuth client resolves `did:plc:*` identifiers against the real public PLC directory, which has never heard of your local test accounts.

**`allowHttp`** tells the OAuth client to accept `http://` URLs for OAuth server metadata and token endpoints. The default is to reject them as insecure. Since `PDS_DEV_MODE` makes the PDS serve over HTTP, the client needs to accept that.

The env vars are set in `wrangler.jsonc` and can be overridden with `.dev.vars` for local use:

```jsonc
"ATPROTO_PDS_URL": "http://localhost:3000",
"ATPROTO_PLC_URL": "http://localhost:2582"
```

To read them in the Worker, `import { env } from "cloudflare:workers"` is the clean approach as it means no threading through function parameters is required.

## A gotcha worth knowing: the two-URL split

One complication this post sidesteps but you'll run into it if you ever containerize your Worker alongside the devnet is that the URL your Worker uses to reach the PDS internally and the URL the browser uses to reach it are different things.

The PDS thinks its canonical URL is `http://localhost:3000` (because `PDS_HOSTNAME: localhost`). That URL appears in DID documents as the `serviceEndpoint`, and the browser can reach it via Docker's port forwarding. But if your Worker is running inside a Docker container on the same network, `localhost:3000` inside that container resolves to the container's own loopback not the PDS container. You'd need `pds:3000` for server-side fetches while the browser still sees `localhost:3000`.

The way to handle that is a fetch wrapper that rewrites the canonical URL to the Docker-internal URL for server-side requests. This post runs the Worker on the host with `pnpm dev`, so the split doesn't apply — `localhost:3000` reaches the Docker-forwarded PDS port from both the browser and the Worker process. But if you extend this setup to containerize the Worker, that's the thing to solve.

## The init script

The Docker Compose stack includes a one-shot Alpine container that runs after the PDS is healthy. It creates an invite code via the admin API, then seeds two test accounts:

```sh
curl -s -X POST "${PDS_URL}/xrpc/com.atproto.server.createAccount" \
  -H "Content-Type: application/json" \
  -d "{
    \"handle\": \"alice.devnet.test\",
    \"email\": \"alice@devnet.test\",
    \"password\": \"alice-devnet-pass\",
    \"inviteCode\": \"${INVITE_CODE}\"
  }"
```

One thing that bit me here: using `curl -sf` (the `-f` flag causes curl to exit non-zero on HTTP error responses) combined with `set -eu` at the top of the script means any failed account creation silently kills the whole script. The invite code would get created, account creation would fail, and the only evidence would be that `data/accounts.env` only contained the invite code line. Switching to `-s` and handling the error outside of the curl command (via the response body) fixed it.

Account credentials get written to `data/accounts.env` after the first `pnpm docker:up`. The full startup sequence is:

```sh
pnpm docker:up
pnpm dev
```

Then log in with `alice.devnet.test` / `alice-devnet-pass`.

## The proof

After logging in, the app fetches `com.atproto.repo.describeRepo` from the local PDS and displays the raw response. The key field is in the DID document:

```json
{
  "services": [{
    "id": "#atproto_pds",
    "type": "AtprotoPersonalDataServer",
    "serviceEndpoint": "http://localhost:3000"
  }]
}
```

`serviceEndpoint: "http://localhost:3000"` confirms the whole chain is working: the handle resolved against the local PDS, the DID was issued by the local PLC, and the OAuth session was established against local infrastructure. Nothing touched production.

## The companion code

The `post/03-devnet` branch has the full Docker Compose setup, init script, and OAuth client changes. Post 4 is lexicons and writing records — where the in-memory OAuth token store we've been deferring finally becomes a real problem.
