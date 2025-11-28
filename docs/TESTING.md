# 🧪 Testing Guide

## Vue d'ensemble

WRX Generator V2 utilise une stratégie de test complète avec:

- **Unit Tests**: Vitest (Web) / Jest (API)
- **Integration Tests**: Testing Library
- **E2E Tests**: Playwright

## Structure des Tests

```
wrx-generator-v2/
├── apps/
│   ├── web/
│   │   ├── src/
│   │   │   ├── __tests__/          # Tests unitaires (à côté des fichiers)
│   │   │   ├── stores/*.test.ts    # Tests des stores
│   │   │   └── components/*.test.tsx # Tests des composants
│   │   ├── e2e/                    # Tests E2E Playwright
│   │   └── vitest.config.ts
│   └── api/
│       ├── src/**/*.spec.ts        # Tests unitaires
│       └── test/                   # Tests E2E NestJS
│           └── *.e2e-spec.ts
```

## Commandes

### Tests Unitaires

```bash
# Tous les tests
pnpm test

# Tests avec watch mode
pnpm --filter web test:watch
pnpm --filter api test:watch

# Tests avec couverture
pnpm test:cov

# Interface UI Vitest (web uniquement)
pnpm --filter web test:ui
```

### Tests E2E

```bash
# Web E2E avec Playwright
pnpm --filter web test:e2e

# Web E2E avec interface UI
pnpm --filter web test:e2e:ui

# API E2E
pnpm --filter api test:e2e
```

## Web App Tests (Vitest + Testing Library)

### Configuration

```typescript
// vitest.config.ts
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
});
```

### Test Utils

```typescript
import { render, screen, userEvent } from '@/test';

// Custom render avec providers
const { rerender } = render(<MyComponent />);

// Interactions utilisateur
const user = userEvent.setup();
await user.click(screen.getByRole('button'));
```

### Exemples de Tests

#### Test de Store (Zustand)

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from './auth.store';

describe('AuthStore', () => {
  beforeEach(() => {
    useAuthStore.getState().logout();
  });

  it('should login user', () => {
    const store = useAuthStore.getState();
    store.login(mockUser, mockSession);

    expect(store.user).toEqual(mockUser);
    expect(store.isAuthenticated).toBe(true);
  });
});
```

#### Test de Composant

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test';
import { LinkCard } from './LinkCard';

describe('LinkCard', () => {
  it('should display link title', () => {
    render(<LinkCard link={mockLink} />);

    expect(screen.getByText('Test Link')).toBeInTheDocument();
  });

  it('should call onCopy when copy button clicked', async () => {
    const onCopy = vi.fn();
    const user = userEvent.setup();

    render(<LinkCard link={mockLink} onCopy={onCopy} />);

    await user.click(screen.getByRole('button', { name: /copy/i }));
    expect(onCopy).toHaveBeenCalled();
  });
});
```

### Mocks Disponibles

```typescript
// Supabase Client
import { mockSupabaseClient, mockUser, mockSession } from '@/test/mocks/supabase';

// API Data
import { mockLinks, mockQRCodes, mockApi } from '@/test/mocks/api';
```

## API Tests (Jest + Supertest)

### Configuration

```json
// jest.config.json
{
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": "src",
  "testRegex": ".*\\.spec\\.ts$",
  "transform": {
    "^.+\\.(t|j)s$": "ts-jest"
  }
}
```

### Test de Service

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { LinksService } from './links.service';

describe('LinksService', () => {
  let service: LinksService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LinksService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<LinksService>(LinksService);
  });

  it('should create a link', async () => {
    const result = await service.create(userId, createDto);
    expect(result).toBeDefined();
    expect(result.short_code).toBeDefined();
  });
});
```

### Test E2E

```typescript
import * as request from 'supertest';

describe('Links (e2e)', () => {
  it('/links (GET)', () => {
    return request(app.getHttpServer())
      .get('/links')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  });
});
```

## E2E Tests (Playwright)

### Configuration

```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:5173',
  },
});
```

### Exemples

```typescript
import { test, expect } from '@playwright/test';

test('authentication flow', async ({ page }) => {
  await page.goto('/login');

  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');

  await expect(page).toHaveURL('/dashboard');
});

test('create short link', async ({ page }) => {
  await page.goto('/dashboard');

  await page.click('button:has-text("Create Link")');
  await page.fill('input[name="url"]', 'https://example.com');
  await page.click('button:has-text("Create")');

  await expect(page.locator('.link-card')).toBeVisible();
});
```

## Bonnes Pratiques

### 1. Arrange-Act-Assert

```typescript
it('should handle form submission', async () => {
  // Arrange
  const onSubmit = vi.fn();
  render(<Form onSubmit={onSubmit} />);

  // Act
  await user.type(screen.getByLabelText('Email'), 'test@example.com');
  await user.click(screen.getByRole('button', { name: /submit/i }));

  // Assert
  expect(onSubmit).toHaveBeenCalledWith({ email: 'test@example.com' });
});
```

### 2. User-Centric Testing

```typescript
// ❌ Éviter
expect(component.state.isOpen).toBe(true);

// ✅ Préférer
expect(screen.getByRole('dialog')).toBeVisible();
```

### 3. Isolation des Tests

```typescript
beforeEach(() => {
  // Reset stores
  useAuthStore.getState().logout();
  useUIStore.getState().reset();

  // Clear mocks
  vi.clearAllMocks();
});
```

### 4. Data-testid pour les cas complexes

```typescript
// Dans le composant
<div data-testid="complex-chart">...</div>

// Dans le test
expect(screen.getByTestId('complex-chart')).toBeInTheDocument();
```

## Coverage Requirements

| Package | Statements | Branches | Functions | Lines |
| ------- | ---------- | -------- | --------- | ----- |
| web     | 70%        | 60%      | 70%       | 70%   |
| api     | 80%        | 70%      | 80%       | 80%   |
| shared  | 90%        | 80%      | 90%       | 90%   |

## CI Integration

Les tests sont exécutés automatiquement sur chaque PR:

```yaml
# .github/workflows/ci.yml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm test
      - run: pnpm --filter web test:e2e
```

## Debugging

### Vitest UI

```bash
pnpm --filter web test:ui
```

### Playwright Debug Mode

```bash
pnpm --filter web test:e2e -- --debug
```

### Voir les logs de coverage

```bash
pnpm test:cov -- --reporter=verbose
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright](https://playwright.dev/)
- [Jest](https://jestjs.io/)
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
