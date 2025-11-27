# WRX Generator V2.0

> Plateforme de génération d'URLs raccourcies et de QR codes personnalisés

## 🚀 Aperçu

WRX Generator est une solution complète pour créer, gérer et suivre des liens raccourcis avec des QR codes personnalisables.

## 📦 Applications

| App              | Technologie         | Description                    |
| ---------------- | ------------------- | ------------------------------ |
| `apps/web`       | React + Vite        | Application web principale     |
| `apps/mobile`    | Expo + React Native | Application mobile iOS/Android |
| `apps/extension` | Manifest V3         | Extension Chrome               |
| `apps/api`       | NestJS              | Backend API REST               |

## 🏗️ Architecture

Parfait ! Le repository est créé. Je passe à l'étape suivante.

✅ Checklist de Démarrage
Créer le repository GitHub
Initialiser la structure du monorepo
Configurer pnpm workspace
Setup TypeScript config partagée
Configurer ESLint + Prettier
Setup Husky + lint-staged
Créer le projet Supabase
Configurer les variables d'environnement
Implémenter le backend NestJS de base
Créer la web app React
Tests unitaires
CI/CD GitHub Actions
📍 Étape 2 : Initialiser la structure du monorepo
Exécutez ces commandes dans PowerShell pour créer la structure complète du projet :

Ensuite, copiez ce contenu dans le fichier .gitignore :

Copiez ce contenu dans le fichier .nvmrc :

Copiez ce contenu dans le fichier README.md :

wrx-generator-v2/
├── apps/
│ ├── web/ # React + Vite
│ ├── mobile/ # Expo + React Native
│ ├── extension/ # Chrome Extension
│ └── api/ # NestJS Backend
├── packages/
│ ├── shared/ # Types et utilitaires partagés
│ ├── ui/ # Composants UI partagés
│ └── config/ # Configurations partagées
├── docs/ # Documentation
└── supabase/ # Migrations et seeds

## 🛠️ Prérequis

- Node.js >= 20.x
- pnpm >= 9.x
- Docker (pour Supabase local)

## 🚀 Installation

```bash
# Cloner le repository
git clone https://github.com/ADLI-Imrane/wrx-generator-v2.git
cd wrx-generator-v2

# Installer les dépendances
pnpm install

# Configurer les variables d'environnement
cp .env.example .env

# Démarrer tous les services en développement
pnpm dev

Parfait ! Le repository est créé. Je passe à l'étape suivante.

✅ Checklist de Démarrage
 Créer le repository GitHub
 Initialiser la structure du monorepo
 Configurer pnpm workspace
 Setup TypeScript config partagée
 Configurer ESLint + Prettier
 Setup Husky + lint-staged
 Créer le projet Supabase
 Configurer les variables d'environnement
 Implémenter le backend NestJS de base
 Créer la web app React
 Tests unitaires
 CI/CD GitHub Actions
📍 Étape 2 : Initialiser la structure du monorepo
Exécutez ces commandes dans PowerShell pour créer la structure complète du projet :

Ensuite, copiez ce contenu dans le fichier .gitignore :

Copiez ce contenu dans le fichier .nvmrc :

Copiez ce contenu dans le fichier README.md :

wrx-generator-v2/
├── apps/
│ ├── web/ # React + Vite
│ ├── mobile/ # Expo + React Native
│ ├── extension/ # Chrome Extension
│ └── api/ # NestJS Backend
├── packages/
│ ├── shared/ # Types et utilitaires partagés
│ ├── ui/ # Composants UI partagés
│ └── config/ # Configurations partagées
├── docs/ # Documentation
└── supabase/ # Migrations et seeds

📚 Documentation
Architecture
Guide de Contribution
API Reference
Guide de Déploiement
Base de Données
📄 Licence
MIT © WRX Generator Team

---

### 📋 Vérification

Après avoir exécuté les commandes, votre structure devrait ressembler à ceci :
wrx-generator-v2/
├── .github/
│ └── workflows/
├── apps/
│ ├── api/
│ │ └── src/
│ ├── extension/
│ │ └── src/
│ ├── mobile/
│ │ └── src/
│ └── web/
│ └── src/
├── docs/
│ ├── API.md
│ ├── ARCHITECTURE.md
│ ├── CONTRIBUTING.md
│ ├── DATABASE.md
│ └── DEPLOYMENT.md
├── packages/
│ ├── config/
│ ├── shared/
│ │ └── src/
│ └── ui/
│ └── src/
├── supabase/
│ └── migrations/
├── .env.example
├── .gitignore
├── .nvmrc
└── README.md

```
