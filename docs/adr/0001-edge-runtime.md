# ADR 0001 — Run WRX on Cloudflare Workers instead of a Node server

**Status:** accepted · **Date:** 2026-10-05

## Context

WRX v2 was a NestJS API plus Supabase. A link shortener's hot path is a single redirect, and its quality is measured by latency anywhere in the world. A Node server in one region adds 100–300 ms for distant visitors, and free hosting tiers put idle servers to sleep (cold starts of 30–50 s), which is fatal for a demo that recruiters open once.

## Decision

Rebuild the backend as a single Cloudflare Worker (Hono) with D1 (SQLite) for storage. The Worker also serves the React build as static assets, so app, API and short links share one origin.

## Consequences

- Redirects are decided in the data centre closest to the visitor, with no cold start, on the free plan.
- Geo data (`request.cf.country`, `city`) is available for free, which enables country routing and analytics without a GeoIP database.
- D1 is SQLite: no stored procedures, 100 bound parameters per query and, on the free plan, 50 queries per invocation. The analytics endpoint therefore runs as one batch, and the demo seed writes clicks as large multi-row inserts.
- NestJS-style modules are replaced by small Hono routers; validation moves to shared Zod schemas.
