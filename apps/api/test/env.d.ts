import type { D1Migration } from '@cloudflare/vitest-pool-workers';
declare global {
  namespace Cloudflare {
    interface Env {
      DB: D1Database;
      ASSETS: Fetcher;
      JWT_SECRET: string;
      TEST_MIGRATIONS: D1Migration[];
    }
  }
}
export {};
