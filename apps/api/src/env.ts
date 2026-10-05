export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  JWT_SECRET: string;
  /** Optional public origin (e.g. https://wrx.example.com). Falls back to the request origin. */
  APP_ORIGIN?: string;
}

export interface Session {
  userId: string;
  via: 'cookie' | 'api-key';
  isDemo: boolean;
}

export type AppEnv = { Bindings: Env; Variables: { session: Session } };
