# CI/CD Documentation

## Vue d'ensemble

WRX Generator V2 utilise **GitHub Actions** pour automatiser les processus de CI/CD avec une approche moderne basée sur les workflows.

## Workflows

### 1. CI (Continuous Integration) - `ci.yml`

**Déclenchement**: Push et Pull Requests sur les branches `main` et `develop`

#### Jobs

| Job         | Description                          | Dépendances     |
| ----------- | ------------------------------------ | --------------- |
| `lint`      | Vérifie le style de code avec ESLint | -               |
| `typecheck` | Vérifie les types TypeScript         | -               |
| `build`     | Build tous les packages              | lint, typecheck |
| `test`      | Exécute les tests unitaires          | lint, typecheck |

#### Fonctionnalités

- **Matrix builds**: Node.js 18.x et 20.x
- **Caching**: pnpm store et Turborepo cache
- **Concurrency**: Annule les builds précédents du même PR
- **Artifacts**: Upload des rapports de couverture

### 2. CD (Continuous Deployment) - `deploy.yml`

**Déclenchement**: Merge sur `main` ou manuellement via `workflow_dispatch`

#### Environnements

| Environnement | Condition              | URL                       |
| ------------- | ---------------------- | ------------------------- |
| Staging       | Automatique sur `main` | staging.wrx-generator.com |
| Production    | Manuel uniquement      | wrx-generator.com         |

#### Secrets requis

```
VERCEL_TOKEN          # Token d'API Vercel
VERCEL_ORG_ID         # ID de l'organisation Vercel
VERCEL_PROJECT_ID     # ID du projet Vercel
SUPABASE_URL          # URL Supabase
SUPABASE_ANON_KEY     # Clé anonyme Supabase
SENTRY_DSN            # DSN Sentry (optionnel)
```

### 3. Release - `release.yml`

**Déclenchement**: Merge sur `main` (création de release automatique)

#### Fonctionnalités

- **Semantic versioning**: Basé sur les commits conventionnels
- **Changelog automatique**: Génération du CHANGELOG.md
- **GitHub Releases**: Création automatique des releases
- **NPM Publish**: Publication des packages (optionnel)

## Configuration locale

### Pré-requis

```bash
# Installation des dépendances
pnpm install

# Vérification lint
pnpm lint

# Vérification types
pnpm typecheck

# Build
pnpm build

# Tests
pnpm test
```

### Scripts disponibles

| Script               | Description                     |
| -------------------- | ------------------------------- |
| `pnpm lint`          | Lint tous les packages          |
| `pnpm lint:fix`      | Lint et corrige automatiquement |
| `pnpm typecheck`     | Vérifie les types TypeScript    |
| `pnpm build`         | Build tous les packages         |
| `pnpm test`          | Exécute les tests unitaires     |
| `pnpm test:coverage` | Tests avec couverture           |
| `pnpm test:e2e`      | Tests end-to-end (Playwright)   |

## Dependabot

Configuration automatique des mises à jour de dépendances:

- **Fréquence**: Hebdomadaire (Lundi 9h00 CET)
- **Groupes**:
  - Dependencies de développement
  - Dependencies de production
  - React & related
  - NestJS & related
  - Testing libraries
  - GitHub Actions

### Labels automatiques

- `dependencies`: Toutes les mises à jour
- `web`: Packages de l'app web
- `api`: Packages de l'API
- `automerge`: Pour auto-merge (patch versions)

## Conventions de commits

Utilisation des [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### Types

| Type              | Description             | Bump  |
| ----------------- | ----------------------- | ----- |
| `feat`            | Nouvelle fonctionnalité | Minor |
| `fix`             | Correction de bug       | Patch |
| `docs`            | Documentation           | -     |
| `style`           | Formatage               | -     |
| `refactor`        | Refactoring             | -     |
| `perf`            | Performance             | Patch |
| `test`            | Tests                   | -     |
| `chore`           | Maintenance             | -     |
| `ci`              | CI/CD                   | -     |
| `build`           | Build system            | -     |
| `BREAKING CHANGE` | Breaking change         | Major |

### Exemples

```bash
# Feature
git commit -m "feat(links): add bulk delete functionality"

# Bug fix
git commit -m "fix(qr): correct QR code scaling issue"

# Breaking change
git commit -m "feat(api)!: change response format for links endpoint"
```

## Environnements

### Staging

- **URL**: https://staging.wrx-generator.com
- **Déploiement**: Automatique sur merge dans `main`
- **Base de données**: Supabase (environnement staging)
- **Monitoring**: Sentry (environnement staging)

### Production

- **URL**: https://wrx-generator.com
- **Déploiement**: Manuel via workflow_dispatch
- **Base de données**: Supabase (environnement production)
- **Monitoring**: Sentry (environnement production)

## Troubleshooting

### Build échoue sur CI

1. **Vérifier les logs GitHub Actions**
2. **Reproduire localement**:
   ```bash
   pnpm install
   pnpm lint
   pnpm typecheck
   pnpm build
   pnpm test
   ```

### Tests échouent

1. **Vérifier la couverture**:
   ```bash
   pnpm test:coverage
   ```
2. **Exécuter un test spécifique**:
   ```bash
   pnpm test -- auth.store.test.ts
   ```

### Déploiement échoue

1. **Vérifier les secrets Vercel**
2. **Vérifier les variables d'environnement Supabase**
3. **Consulter les logs Vercel**

## Diagramme de flux

```
┌─────────────────────────────────────────────────────────────┐
│                         PULL REQUEST                         │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────┐  ┌───────────┐  ┌─────────┐  ┌──────────────┐  │
│  │  Lint   │  │ Typecheck │  │  Build  │  │    Test      │  │
│  │ (ESLint)│  │(TypeScript│  │(Turbo)  │  │(Vitest/Jest) │  │
│  └────┬────┘  └─────┬─────┘  └────┬────┘  └──────┬───────┘  │
│       │             │             │              │          │
│       └─────────────┴──────┬──────┴──────────────┘          │
│                            │                                 │
│                    ┌───────▼───────┐                        │
│                    │  PR Approved  │                        │
│                    └───────┬───────┘                        │
└────────────────────────────┼────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                         MERGE TO MAIN                        │
├─────────────────────────────────────────────────────────────┤
│  ┌────────────────┐      ┌────────────────┐                 │
│  │   CI Pipeline  │─────▶│ Deploy Staging │                 │
│  └────────────────┘      └───────┬────────┘                 │
│                                  │                          │
│                          ┌───────▼────────┐                 │
│                          │ Semantic Release│                │
│                          │  + Changelog   │                 │
│                          └───────┬────────┘                 │
│                                  │                          │
│                    ┌─────────────▼─────────────┐            │
│                    │ Manual: Deploy Production │            │
│                    └───────────────────────────┘            │
└─────────────────────────────────────────────────────────────┘
```

## Ressources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vercel CLI](https://vercel.com/docs/cli)
- [Semantic Release](https://semantic-release.gitbook.io/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Turborepo Caching](https://turbo.build/repo/docs/core-concepts/caching)
