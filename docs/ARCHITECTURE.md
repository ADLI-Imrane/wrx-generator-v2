# Architecture

WRX Generator is a pnpm 9 workspace coordinated by Turborepo. `apps/web` is a React/Vite dashboard. It authenticates with Supabase and sends its access token to `apps/api`, a NestJS REST server. The API validates the token with Supabase Auth and uses a service-role client for database operations. `packages/shared` contains types and plan limits; `packages/ui` contains reusable React components. `apps/extension` is partial and `apps/mobile` is currently a scaffold.

The API mounts authenticated routes under `/api`. Public redirects and QR scans are under `/r`; `/health` is also outside the prefix. PostgreSQL schema changes live in `supabase/migrations` and are applied in order. Stripe calls are in the billing module; the webhook endpoint needs the raw request body.

Request flow: browser → Supabase Auth → bearer token → NestJS guard → Supabase database. A short-link visit goes to `/r/:slug`; a QR scan goes to `/r/scan/:id`. Click and scan events feed the analytics endpoints. The redirect uses HTTP 302 so a changed destination is respected on later visits.

The service-role key must stay server-side. Only the anon key belongs in `VITE_*` or `EXPO_PUBLIC_*` variables. The local development setup is in [DEPLOYMENT.md](DEPLOYMENT.md).
