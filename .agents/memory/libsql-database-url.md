---
name: libsql vs Replit DATABASE_URL
description: Why server/db.ts must reject Replit's auto-injected Postgres DATABASE_URL
---

# libsql + Replit DATABASE_URL conflict

This app's `server/db.ts` uses `@libsql/client` (SQLite/Turso), NOT Postgres.

Replit auto-injects `DATABASE_URL` as a Postgres URL (e.g.
`postgresql://postgres:password@helium/heliumdb?sslmode=disable`) into the
environment even when no Postgres DB is intentionally used.

**Rule:** `resolveDbUrl()` in `server/db.ts` must only accept `libsql://`,
`http://`, `https://`, or `file:` URLs. Any Postgres URL (or empty) must fall
back to the local SQLite file. Passing a Postgres URL into `createClient()`
crashes at startup with `URL_PARAM_NOT_SUPPORTED: Unsupported URL query
parameter "sslmode"` — before the server binds a port, so deployment health
checks fail.

**Why:** non-obvious because the crash looks like a libsql bug, but the real
cause is Replit's environment injection colliding with a SQLite-based app.

# Autoscale + SQLite persistence caveat

Local SQLite (`file:data/aquasachet.db`) on an **autoscale** deployment is
ephemeral and per-instance: data is lost on restart/redeploy and diverges
across replicas. For durable data, use a remote libsql/Turso URL or deploy as
Reserved VM (persistent disk).

# @libsql/client must be a direct dependency

The app imports `@libsql/client` directly, so it must be declared in
package.json dependencies (not rely on it being a transitive dep) — pnpm's
strict node_modules can otherwise break the import on clean production installs.
