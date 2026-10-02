# 🔗 WRX Generator V2.0

<div align="center">

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Node](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)
![pnpm](https://img.shields.io/badge/pnpm-%3E%3D9.0.0-orange.svg)

**Plateforme complète de génération d'URLs raccourcies et de QR codes personnalisés**

[Demo](https://wrx.link) · [Documentation](./docs) · [Report Bug](https://github.com/ADLI-Imrane/wrx-generator-v2/issues)

</div>

---

## ✨ Fonctionnalités

- 🔗 **URLs Raccourcies** - Créez des liens courts avec slugs personnalisés
- 📊 **Analytics Complets** - Suivez les clics, géolocalisation, appareils, navigateurs
- 🎨 **QR Codes Personnalisés** - Générez des QR codes avec couleurs et logos
- 🔐 **Liens Protégés** - Protection par mot de passe et dates d'expiration
- 💳 **Abonnements** - Plans Free, Pro et Business via Stripe
- 🌐 **Multi-plateforme** - Web; Mobile et Extension Chrome sont encore en développement

---

## 🏗️ Architecture

Ce projet utilise une architecture **monorepo** avec pnpm workspaces et Turborepo.

```
wrx-generator-v2/
├── apps/
│   ├── api/              # 🖥️  NestJS Backend API
│   ├── web/              # 🌐 React + Vite Web App
│   ├── mobile/           # 📱 Expo + React Native
│   └── extension/        # 🧩 Chrome Extension (Manifest V3)
├── packages/
│   ├── shared/           # 📦 Types, constants, utilities partagés
│   ├── ui/               # 🎨 Composants UI réutilisables
│   └── config/           # ⚙️  Configs TypeScript, ESLint, Prettier
├── supabase/
│   ├── migrations/       # 🗄️  Migrations SQL
│   └── seed.sql          # 🌱 Données de test
└── docs/                 # 📚 Documentation complète
```

---

## 📦 Stack Technique

### Applications

| App           | Stack                                | Description                   |
| ------------- | ------------------------------------ | ----------------------------- |
| **API**       | NestJS 10, Supabase, Stripe          | Backend REST API avec Swagger |
| **Web**       | React 18, Vite, TailwindCSS, Zustand | Application web principale    |
| **Mobile**    | Expo 52, React Native                | Structure initiale            |
| **Extension** | Manifest V3, React                   | Prototype Chrome              |

### Packages Partagés

| Package       | Description                                          |
| ------------- | ---------------------------------------------------- |
| `@wrx/shared` | Types TypeScript, constantes, utilitaires            |
| `@wrx/ui`     | Composants React réutilisables (Button, Input, Card) |
| `@wrx/config` | Configurations ESLint, TypeScript, Prettier          |

### Infrastructure

- **Base de données** : PostgreSQL via Supabase
- **Authentification** : Supabase Auth (Email, Google, GitHub)
- **Stockage** : Supabase Storage (logos QR, avatars)
- **Paiements** : Stripe (abonnements, webhooks)
- **Monorepo** : pnpm workspaces + Turborepo

---

## 🚀 Démarrage Rapide

### Prérequis

- **Node.js** >= 20.0.0
- **pnpm** >= 9.0.0
- **Docker** (optionnel, pour Supabase local)

### Installation

```bash
# 1. Cloner le repository
git clone https://github.com/ADLI-Imrane/wrx-generator-v2.git
cd wrx-generator-v2

# 2. Installer les dépendances
pnpm install

# 3. Configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec vos clés Supabase et Stripe

# 4. Construire le package partagé et démarrer API + Web dans deux terminaux
pnpm --filter @wrx/shared build
pnpm --filter @wrx/api dev
pnpm --filter @wrx/web dev
```

### Scripts Disponibles

```bash
# Développement
pnpm dev              # Démarre tous les apps en parallèle
pnpm --filter @wrx/api dev # Démarre uniquement l'API

# Build
pnpm build            # Build tous les packages
pnpm typecheck        # Vérifie les types TypeScript

# Qualité de code
pnpm lint             # Lint avec ESLint
pnpm format           # Format avec Prettier

# Tests
pnpm test             # Exécute tous les tests
pnpm test:cov         # Tests avec couverture

# Base de données
supabase db reset      # Réinitialise uniquement la base locale (efface ses données)
supabase status        # Affiche les URLs et clés locales
```

---

## 🔧 Configuration

### Variables d'Environnement

Créez un fichier `.env` à la racine :

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# API
API_URL=http://localhost:3000
CORS_ORIGINS=http://localhost:5173
```

Voir [.env.example](./.env.example) pour la liste complète.

---

## 📖 API Reference

L'API REST est documentée avec Swagger. En développement, accédez à :

```
http://localhost:3000/docs
```

### Endpoints Principaux

| Méthode | Endpoint             | Description          |
| ------- | -------------------- | -------------------- |
| `POST`  | `/api/auth/register` | Inscription          |
| `POST`  | `/api/auth/login`    | Connexion            |
| `GET`   | `/api/links`         | Liste des liens      |
| `POST`  | `/api/links`         | Créer un lien        |
| `GET`   | `/api/qr`            | Liste des QR codes   |
| `POST`  | `/api/qr`            | Générer un QR code   |
| `GET`   | `/:slug`             | Redirection publique |

Voir [docs/API.md](./docs/API.md) pour la documentation complète.

---

## 📊 Plans d'Abonnement

| Fonctionnalité              | Free | Pro | Business |
| --------------------------- | :--: | :-: | :------: |
| Liens                       |  10  | 100 |    ∞     |
| QR Codes                    |  5   | 50  |    ∞     |
| Clics/mois                  |  1K  | 10K |    ∞     |
| Slug personnalisé           |  ❌  | ✅  |    ✅    |
| Protection par mot de passe |  ❌  | ✅  |    ✅    |
| Analytics                   |  ❌  | ✅  |    ✅    |
| Logo QR personnalisé        |  ❌  | ✅  |    ✅    |
| API Access                  |  ❌  | ✅  |    ✅    |
| Support prioritaire         |  ❌  | ❌  |    ✅    |

---

## 📚 Documentation

| Document                                  | Description                      |
| ----------------------------------------- | -------------------------------- |
| [ARCHITECTURE.md](./docs/ARCHITECTURE.md) | Architecture détaillée du projet |
| [API.md](./docs/API.md)                   | Documentation de l'API REST      |
| [DATABASE.md](./docs/DATABASE.md)         | Schéma et migrations de la BDD   |
| [DEPLOYMENT.md](./docs/DEPLOYMENT.md)     | Guide de déploiement             |
| [CONTRIBUTING.md](./docs/CONTRIBUTING.md) | Guide de contribution            |

---

## 🤝 Contribution

Les contributions sont les bienvenues ! Consultez le [Guide de Contribution](./docs/CONTRIBUTING.md).

```bash
# 1. Fork le projet
# 2. Créer une branche feature
git checkout -b feat/amazing-feature

# 3. Commit avec Conventional Commits
git commit -m "feat(api): add amazing feature"

# 4. Push et créer une Pull Request
git push origin feat/amazing-feature
```

### Conventional Commits

Ce projet utilise les [Conventional Commits](https://www.conventionalcommits.org/) :

- `feat`: Nouvelle fonctionnalité
- `fix`: Correction de bug
- `docs`: Documentation
- `refactor`: Refactoring
- `test`: Tests
- `chore`: Maintenance

---

## 📄 Licence

Ce projet est sous licence **MIT**. Voir le fichier [LICENSE](./LICENSE) pour plus de détails.

---

<div align="center">

**Fait avec ❤️ par [ADLI Imrane](https://github.com/ADLI-Imrane)**

</div>
