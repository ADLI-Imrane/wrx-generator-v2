# Database

Supabase PostgreSQL schema is defined by ordered SQL files in `supabase/migrations`. Start with `00001_initial_schema.sql`; apply all later migrations through `00010_atomic_qr_scan_count.sql` in filename order. Use `supabase db reset` only against a disposable local database; it deletes local data.

Core tables: `profiles` extends `auth.users`; `links` owns short URLs; `clicks` records visits; `qr_codes` owns QR definitions; `scans` records QR visits; `subscriptions` stores billing state. `qr_scans` is a legacy table from migration 00005. Current API analytics reads `scans` from migration 00006.

Migration 00007 renames `links.click_count` to `links.clicks`. A trigger increments `links.clicks` when a row is inserted into `clicks`; application code must not increment it a second time. Migration 00010 adds an atomic service-role RPC to increment `qr_codes.scans_count` after writing a row to `scans`.

Row level security policies were introduced in 00002 and revised in later migrations. The API uses a service-role client and therefore must check ownership explicitly before user-scoped reads or writes. Never expose the service-role key to the web app.

The seed file has no active user records. To test locally, create a user through Supabase Auth. Back up remote data before applying migrations to an existing Supabase project; this branch's migration has not been verified against a live remote database.
