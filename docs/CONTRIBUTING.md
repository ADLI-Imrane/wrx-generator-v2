# Contributing

Work on `develop` and open a pull request to `main` after local checks. Keep changes focused and use conventional commits such as `fix(api): correct click count` or `docs: update local setup`. Do not commit `.env` files or keys.

Install dependencies with pnpm 9.14.2. Run `pnpm build`, `pnpm typecheck` and `pnpm test` before requesting review. Add or update a migration when changing persistent database structure; do not edit an already applied migration to change production behavior. Document new environment variables in the relevant `.env.example` file.

CI runs only for pull requests into `main` that touch API/web code, shared packages, migrations, dependency manifests, or the CI workflow. Mobile and extension changes need local checks. There are no automatic push builds, browser E2E jobs, coverage uploads or deployments. Review billing and database changes with extra care and verify them against a local Supabase instance.
