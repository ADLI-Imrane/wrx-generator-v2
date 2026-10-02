# Database

Supabase PostgreSQL schema is defined by ordered SQL files in `supabase/migrations`. Start with `00001_initial_schema.sql`; apply all later migrations through `00011_harden_public_policies.sql` in filename order. Use `supabase db reset` only against a disposable local database; it deletes local data.

Core tables: `profiles` extends `auth.users`; `links` owns short URLs; `clicks` records visits; `qr_codes` owns QR definitions; `scans` records QR visits; `subscriptions` stores billing state. `qr_scans` is a legacy table from migration 00005. Current API analytics reads `scans` from migration 00006.

Migration 00007 renames `links.click_count` to `links.clicks`. A trigger increments `links.clicks` when a row is inserted into `clicks`; application code must not increment it a second time. Migration 00010 adds an atomic service-role RPC to increment `qr_codes.scans_count` after writing a row to `scans`.

Row level security policies were introduced in 00002 and revised in later migrations. The API uses a service-role client and therefore must check ownership explicitly before user-scoped reads or writes. Never expose the service-role key to the web app.

Migration 00011 removes anonymous access to links and direct analytics inserts. Redirects and analytics writes must go through the API. QR logo uploads by authenticated clients must use a first path segment equal to the user's UUID.

The seed file has no active user records. To test locally, create a user through Supabase Auth. On 2026-10-02, migrations 00001–00011 were applied in order through the Supabase SQL Editor to the initially empty `wrx_generator_v2` project (`lgvcnqxleqjvkqfckgyp`) and all returned success. The seven public tables were visible afterward. SQL Editor execution does not populate the Supabase CLI migration history, so **do not run `supabase db push` against this project** until its history has been reconciled. Back up remote data before future schema changes.
