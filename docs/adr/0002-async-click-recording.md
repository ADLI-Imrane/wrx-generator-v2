# ADR 0002 — Record clicks after the redirect

**Status:** accepted · **Date:** 2026-10-05

## Context

Every redirect must log a click (time, country, city, device, browser, referrer, source, visitor). Writing it before answering would add a database round trip to every visit.

## Decision

Choose the destination, return the `302`, and write the click with `ctx.waitUntil()`. Bots are classified by user agent and not recorded. Unique visitors are a daily-rotating SHA-256 of IP + user agent + link id, truncated to 16 hex characters; raw IPs are never stored.

## Consequences

- Visitors never wait on analytics; a D1 hiccup cannot break a redirect.
- A link with a click limit may let a handful of extra visits through under burst traffic, because the count is updated asynchronously. This is acceptable for the product and documented.
- Hot link records are cached for 60 s in the Cache API; links with a click limit bypass the cache so their counts stay accurate.
