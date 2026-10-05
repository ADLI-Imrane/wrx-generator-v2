# ADR 0003 — One Zod schema per resource, shared by API, UI and docs

**Status:** accepted · **Date:** 2026-10-05

## Decision

`packages/shared` exports Zod 4 schemas (links, rules, QR designs, profiles, opportunities, contact requests). The Worker validates every request with them, the React forms reuse the same rules and error messages, and the OpenAPI 3.1 document is generated with `z.toJSONSchema`.

## Consequences

- A validation rule changes in one place and is enforced everywhere.
- API errors share one shape — `{ error: { code, message, fields } }` — so the UI can put each message under the right field.
