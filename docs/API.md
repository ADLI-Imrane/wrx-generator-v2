# API reference

Local server: `http://localhost:3000`. Interactive Swagger is at `/docs` when `NODE_ENV` is not `production`. Except where noted, routes have the `/api` prefix and require `Authorization: Bearer <Supabase access token>`.

| Area      | Routes                                                                                                                         | Notes                                                                      |
| --------- | ------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| Auth      | `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `POST /api/auth/refresh`, `GET/PUT /api/auth/me`   | Supabase-backed identity                                                   |
| Links     | `GET/POST /api/links`, `GET/PUT/DELETE /api/links/:id`, `GET /api/links/:id/stats`                                             | List accepts pagination, search and sort query parameters                  |
| QR        | `GET/POST /api/qr`, `GET/PUT/DELETE /api/qr/:id`, `GET /api/qr/:id/stats`, `GET /api/qr/:id/image`, `GET /api/qr/:id/download` | Download formats: PNG, SVG, PDF                                            |
| Analytics | `GET /api/analytics?timeRange=30d`                                                                                             | `7d`, `30d`, `90d`, `all`                                                  |
| Billing   | `/api/billing/*`                                                                                                               | Checkout, plan changes, usage and invoices; see Swagger for request bodies |
| Public    | `GET /r/:slug`, `GET /r/:slug/preview`, `POST /r/:slug/verify-password`, `GET /r/scan/:id`                                     | No bearer token                                                            |
| Health    | `GET /health`                                                                                                                  | No bearer token                                                            |

Create a link with `POST /api/links` and JSON such as `{"originalUrl":"https://example.com","title":"Example"}`. Create a QR code with `POST /api/qr` and `{"type":"url","content":"https://example.com"}`. The generated short URL is `${SHORT_URL_DOMAIN}/r/:slug`.

The API uses camelCase in JSON while database columns use snake_case. For current request validation and response details, Swagger and the DTOs in `apps/api/src/modules` are authoritative.
