# 🏠 Chorify — Architecture Complète

## Vue d'ensemble

Application de gestion des tâches ménagères avec gamification légère.
Stack : React Native (Expo) + Supabase + GitHub + Codemagic.

---

## 📁 Structure du projet

```
chorify/
├── app.json
├── App.tsx
├── package.json
├── tsconfig.json
├── codemagic.yaml
├── .github/
│   └── workflows/
│       └── ci.yml
├── supabase/
│   └── schema.sql
├── src/
│   ├── navigation/
│   │   └── AppNavigator.tsx
│   ├── screens/
│   │   ├── FloorPlanScreen.tsx      # Écran principal — Plan SVG
│   │   ├── TaskListScreen.tsx       # Liste des tâches
│   │   ├── HistoryScreen.tsx        # Historique
│   │   ├── AgendaScreen.tsx         # Agenda
│   │   ├── StatsScreen.tsx          # Statistiques
│   │   ├── AdminScreen.tsx          # Administration
│   │   └── AuthScreen.tsx           # Authentification
│   ├── components/
│   │   ├── FloorPlan.tsx            # Plan SVG interactif
│   │   ├── TaskCard.tsx             # Carte de tâche
│   │   ├── StreakBanner.tsx         # Bannière streak
│   │   ├── QuickValidate.tsx        # Modale validation rapide
│   │   ├── StatusBadge.tsx          # Badge statut couleur
│   │   └── TargetNode.tsx           # Nœud cible sur le plan
│   ├── store/
│   │   ├── useAuthStore.ts
│   │   ├── useHouseholdStore.ts
│   │   ├── useTaskStore.ts
│   │   └── useStreakStore.ts
│   ├── services/
│   │   ├── supabase.ts              # Client Supabase
│   │   ├── tasks.ts                 # CRUD tâches
│   │   ├── completions.ts           # Réalisations
│   │   └── notifications.ts         # Push Expo
│   ├── hooks/
│   │   ├── useTaskStatus.ts         # Calcul statut vert/orange/rouge
│   │   └── useStreak.ts             # Calcul streak
│   ├── types/
│   │   └── index.ts                 # Types TypeScript
│   └── utils/
│       ├── colors.ts                # Palette
│       ├── dates.ts                 # Helpers date
│       └── status.ts                # Logique statut
```

---

## 🔄 Flux de données

```
Supabase (PostgreSQL)
    ↕ (realtime subscriptions + REST)
Services (src/services/)
    ↕
Zustand Stores (src/store/)
    ↕
Screens & Components (src/screens/ + src/components/)
```

---

## 🎯 Principes

1. **3 interactions max** pour valider une tâche
2. **Optimistic UI** — mise à jour immédiate, rollback si erreur
3. **Couleur = information** — vert/orange/rouge partout
4. **Minimaliste** — pas de surcharge visuelle
