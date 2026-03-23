# 🏠 Chorify

**Application de gestion des tâches ménagères avec gamification légère.**

Minimaliste, rapide, sans friction. Maximum 3 interactions pour valider une tâche.

---

## 🚀 Stack technique

| Couche | Technologie |
|--------|-------------|
| Frontend | React Native (Expo SDK 52) + TypeScript |
| State | Zustand |
| Backend | Supabase (PostgreSQL + Auth + Realtime) |
| CI/CD | Codemagic + GitHub Actions |
| Notifications | Expo Notifications |

---

## 📁 Structure du projet

```
chorify/
├── App.tsx                    # Point d'entrée
├── app.json                   # Config Expo
├── codemagic.yaml             # Pipeline CI/CD
├── supabase/
│   └── schema.sql             # Schéma complet BDD
├── src/
│   ├── navigation/            # React Navigation (tabs + stack)
│   ├── screens/               # 7 écrans
│   │   ├── FloorPlanScreen    # Plan SVG interactif (principal)
│   │   ├── TaskListScreen     # Liste groupée par statut/zone
│   │   ├── HistoryScreen      # Historique avec suppression
│   │   ├── AgendaScreen       # Vue calendrier
│   │   ├── StatsScreen        # Statistiques & contributions
│   │   ├── AdminScreen        # Gestion cibles/tâches/foyer
│   │   └── AuthScreen         # Connexion / Inscription
│   ├── components/            # Composants réutilisables
│   ├── store/                 # Zustand (4 stores)
│   ├── services/              # Supabase CRUD + notifications
│   ├── hooks/                 # useTaskStatus, useStreak, useRealtime
│   ├── types/                 # Types TypeScript
│   └── utils/                 # Couleurs, dates, statuts
└── .github/workflows/ci.yml  # GitHub Actions
```

---

## ⚡ Installation

### Prérequis

- Node.js 18+
- npm ou yarn
- Expo CLI (`npm install -g expo-cli`)
- Un projet Supabase (gratuit sur [supabase.com](https://supabase.com))

### 1. Cloner et installer

```bash
git clone https://github.com/VOTRE_USER/chorify.git
cd chorify
npm install
```

### 2. Configurer Supabase

1. Créez un projet sur [supabase.com](https://supabase.com)
2. Allez dans **SQL Editor** et exécutez le contenu de `supabase/schema.sql`
3. Copiez `.env.example` en `.env` :

```bash
cp .env.example .env
```

4. Remplissez les variables avec vos clés Supabase (Settings → API) :

```
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

### 3. Activer le Realtime

Dans Supabase Dashboard → Database → Replication, activez les tables :
- `task_completions`
- `task_definitions`
- `targets`

### 4. Lancer

```bash
npx expo start
```

Scanner le QR code avec Expo Go (Android) ou l'app Camera (iOS).

---

## 🎨 Logique métier

### Statuts par couleur

| Couleur | Condition | Signification |
|---------|-----------|---------------|
| 🟢 Vert | 0–60% du délai écoulé | À jour |
| 🟠 Orange | 60–90% du délai | Bientôt à faire |
| 🔴 Rouge | 90–100%+ du délai | En retard |

Le calcul se base sur `last_completed_at` (ou `created_at` si jamais réalisée) par rapport à `max_interval_days`.

### Streak global

Nombre de jours consécutifs sans aucune tâche en rouge dans le foyer. Reset instantané dès qu'une tâche passe en rouge.

### Validation rapide (3 taps max)

1. **Tap** sur une cible du plan (ou une carte dans la liste)
2. **Tap** sur le bouton ✓ de la tâche
3. Confirmé !

---

## 🗄️ Base de données

### Tables principales

- **households** — Foyers
- **profiles** — Utilisateurs (liés à `auth.users`)
- **household_memberships** — Appartenance user ↔ foyer (multi-foyers supporté)
- **targets** — Cibles (zones + équipements, avec coordonnées SVG)
- **task_types** — Types de tâche (Nettoyer, Aspirer, Ranger…)
- **task_definitions** — Définitions (quel type + quelle cible + quel délai)
- **task_completions** — Réalisations (qui + quand)

### Vue enrichie

`task_status_view` — Vue SQL qui calcule automatiquement le `progress_ratio` et le `status` de chaque tâche.

### Fonctions RPC

- `get_household_streak(household_id)` — Calcule le streak
- `get_household_stats(household_id)` — Stats complètes (compteurs, contributions)

### Sécurité (RLS)

Row Level Security activé sur toutes les tables. Un utilisateur ne voit que les données des foyers auxquels il appartient.

---

## 🔔 Notifications

Push via Expo Notifications :
- **Orange** → rappel léger ("Pensez-y dans les prochains jours")
- **Rouge** → notification prioritaire ("Tâche en retard !")

Configuration dans `src/services/notifications.ts`.

---

## 🏗️ CI/CD

### GitHub Actions (`.github/workflows/ci.yml`)

À chaque push/PR sur `main` ou `dev` :
- TypeScript check
- ESLint

### Codemagic (`codemagic.yaml`)

À chaque push sur `main` ou `dev` :
1. `npm ci`
2. `tsc --noEmit`
3. `expo prebuild`
4. Build APK (Android) ou `.app` (iOS Simulator)
5. Artefact envoyé par email

### Setup Codemagic

1. Connectez votre repo GitHub sur [codemagic.io](https://codemagic.io)
2. Ajoutez les variables d'environnement dans un groupe `supabase` :
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
3. Les builds se déclenchent automatiquement

---

## 🌿 Stratégie Git

```
main ──────────────────────── Production
  └── dev ─────────────────── Intégration
        ├── feature/floor-plan
        ├── feature/stats
        └── fix/streak-calc
```

- `feature/*` → merge dans `dev` via PR
- `dev` → merge dans `main` pour release
- CI sur chaque PR, CD sur push `main`

---

## 📱 Écrans

| # | Écran | Description |
|---|-------|-------------|
| 1 | **Plan interactif** | Vue principale — cibles colorées, tap pour valider |
| 2 | **Liste des tâches** | Groupement par statut ou zone, validation rapide |
| 3 | **Historique** | Toutes les réalisations, suppression par appui long |
| 4 | **Agenda** | Vue calendrier des échéances passées/futures |
| 5 | **Statistiques** | % à jour, contributions, streak |
| 6 | **Administration** | Gestion cibles, tâches, infos foyer |

---

## 🛠️ Commandes utiles

```bash
# Démarrer le dev server
npx expo start

# TypeScript check
npx tsc --noEmit

# Lint
npx eslint . --ext .ts,.tsx

# Prebuild natif (pour Codemagic ou build local)
npx expo prebuild --clean

# Build APK local
cd android && ./gradlew assembleDebug
```

---

## 📄 Licence

Projet privé.
