---
title: "RWSDK + ATP: Deploy Prep"
excerpt: Wire up Cloudflare secrets, configure production environment variables, and deploy the app to a live Workers URL. The local dev stack got you here — this is what changes when you point it at prod.
thumbnail: thumbnail.png
date: '2026-10-26T16:00:00'
categories:
  - development
  - at-protocol
  - redwoodsdk
  - cloudflare
---

The app is feature-complete. OAuth works against any AT Protocol PDS, records land in D1, and the live feed pushes updates to connected clients. This post is about getting all of that running on a real Cloudflare Workers URL instead of `localhost`.

The short version of what changes: Wrangler environments replace the single `vars` block, real infrastructure IDs replace the local placeholders, and secrets get set via `wrangler secret put`. The application code itself doesn't change.

## Wrangler environments

The `wrangler.jsonc` from the earlier posts had a single `vars` block with `ATPROTO_PDS_URL` and friends pointing at `localhost`. That works for local dev but deployed environments need different values.

Wrangler [environments](https://developers.cloudflare.com/workers/wrangler/configuration/#environments) let you define separate configuration blocks for different deployment targets. This repo has three: `integration`, `staging`, and `production`. Each needs its own:

- `APP_URL` — the public URL for the deployed Worker (controls which OAuth client mode is used)
- KV namespace ID — for `KV_OAUTH_STATE`
- D1 database ID — for `DB`
- Durable Object bindings — `DO_APPVIEW_SYNC_STATE` and `DO_OAUTH_TOKEN`

```jsonc
// wrangler.jsonc (simplified)
"env": {
  "production": {
    "vars": {
      "APP_URL": "https://rwsdk-atproto-starter-production.your-account.workers.dev"
    },
    "kv_namespaces": [
      { "binding": "KV_OAUTH_STATE", "id": "<production-kv-namespace-id>" }
    ],
    "d1_databases": [
      {
        "binding": "DB",
        "database_name": "rwsdk-atproto-starter-production",
        "database_id": "<production-d1-database-id>",
        "migrations_dir": "drizzle"
      }
    ],
    "durable_objects": {
      "bindings": [
        { "name": "DO_APPVIEW_SYNC_STATE", "class_name": "AppViewSyncState" },
        { "name": "DO_OAUTH_TOKEN", "class_name": "OAuthToken" }
      ]
    }
  }
}
```

The root-level `vars` block only contains the local dev values (`ATPROTO_PDS_URL`, `ATPROTO_PLC_URL`). Those are intentionally absent from the deployed environments — without them, the app falls back to production AT Protocol infrastructure: `bsky.social` for handle resolution and `plc.directory` for DID lookups.

## First-time environment setup

For each environment you want to deploy to, run these once:

```sh
# Create the D1 database
wrangler d1 create rwsdk-atproto-starter-production

# Create the KV namespace
wrangler kv namespace create KV_OAUTH_STATE --env production
```

Both commands output an ID. Copy those into the `wrangler.jsonc` placeholders, then set `APP_URL` to the actual deployed URL.

## Setting secrets

Secrets aren't in `wrangler.jsonc` — they go in via `wrangler secret put` and are stored encrypted in Cloudflare's secret store:

```sh
wrangler secret put OAUTH_STATE_KV_ENCRYPTION_KEYS --env production
wrangler secret put OAUTH_TOKEN_KV_ENCRYPTION_KEYS --env production
wrangler secret put WEBHOOK_TAP_SECRET --env production
```

For the encryption key rings, the value is a JSON array of base64-encoded 32-byte keys. Generate one:

```sh
node -e "console.log(JSON.stringify([require('crypto').randomBytes(32).toString('base64')]))"
```

For `WEBHOOK_TAP_SECRET`, generate a random hex string and match it to the `TAP_ADMIN_PASSWORD` you set when deploying your Tap instance.

The `.dev.vars` file (copied from `.dev.vars.example`) holds the local dev equivalents. They use obviously-insecure placeholder values that are fine for local dev but should never be committed to production configuration.

## Running migrations

Apply D1 migrations to a deployed environment before the first deploy, and after any schema change:

```sh
wrangler d1 migrations apply DB --env production
```

This uses the same Drizzle-generated migration files under `drizzle/` as the local setup — the same migrations, different database.

## Deploying

```sh
wrangler deploy --env production
```

That's it. The `release` script in `package.json` wraps a build and deploy:

```sh
pnpm release
```

The first deploy creates the Worker. After that, Cloudflare handles routing to the deployed URL you set as `APP_URL`.

## What the local dev vars no longer do

With `APP_URL` set in the deployed environment, the OAuth client switches from loopback mode to the discoverable confidential client. The `ATPROTO_PDS_URL` and `ATPROTO_PLC_URL` vars are only present at the root level for local dev — deployed environments don't set them, so the OAuth client uses `bsky.social` for handle resolution and the handle resolver falls back to `plc.directory` for DID lookups.

The Tap registration call was already removed from the OAuth callback in Post 2 (`init.sh` handles that locally). In production there's a real relay doing that work. Nothing to add here.

## The companion code

The [`post/series-2/04-deploy-prep`](https://github.com/arsdehnel/rwsdk-atproto-starter/tree/post/series-2/04-deploy-prep) branch has the full environment configuration. The diff from the previous post is in [this PR](https://github.com/arsdehnel/rwsdk-atproto-starter/pull/103). The `README.md` on that branch has the complete first-time setup instructions.

## Up Next

[Post 5](./rwsdk-atp-s2-p5-next-steps) is the final post in the series. The app is running. Here's what to think about before pointing it at real users.
