# 🚀 Launcher Ads - Phase 1: UI Dashboard

Une interface moderne et élégante pour gérer vos campagnes publicitaires multi-plateformes.

## ✨ Fonctionnalités

### 📱 Pages Créées

- **Dashboard** (`/dashboard`) - Vue d'ensemble avec statistiques et actions rapides
- **Launches** (`/launches`) - Page principale pour gérer vos campagnes
  - Header avec search bar
  - Section "Recommended Types" avec 4 types de campagnes
  - Liste des launches avec statut, progression, et actions
  - Modal "New Launch" pour créer une campagne
- **Templates** (`/templates`) - Page placeholder (coming soon)
- **Settings** (`/settings`) - Page placeholder (coming soon)

### 🎨 Design System

**Couleurs**
- Palette violette (#a855f7 comme couleur primaire)
- Fond clair (98% blanc)
- Bordures subtiles
- Hover states doux

**Typographie**
- **Inter** - Police principale (taille réduite pour un look moderne)
- **Plus Jakarta Sans** - Titres et headings
- Tailles: xs (12px), sm (13px), base (14px), lg (16px), xl (18px)

**Composants**
- Cards arrondies (border-radius: 0.75rem)
- Boutons avec hover effects
- Progress bars animées
- Status badges colorés
- Hover states avec shadow

### 🛠️ Stack Technique

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS avec design system custom
- **Icons**: Lucide React
- **State Management**: Zustand (état local)
- **Fonts**: Google Fonts (Inter + Plus Jakarta Sans)

## 🚀 Lancement

```bash
# Depuis la racine du projet (launcher-ads/)

# 1. Installer les dépendances (si pas déjà fait)
pnpm install

# 2. Lancer le dev server
pnpm dev

# L'app sera accessible sur http://localhost:3000
# Elle redirige automatiquement vers /dashboard
```

## 📂 Structure des Fichiers

```
apps/web/
├── app/
│   ├── (dashboard)/           # Layout groupe avec sidebar
│   │   ├── layout.tsx         # Layout principal avec sidebar
│   │   ├── dashboard/         # Page d'accueil
│   │   ├── launches/          # Page principale
│   │   ├── templates/         # Placeholder
│   │   └── settings/          # Placeholder
│   └── page.tsx               # Redirect vers /dashboard
│
├── components/
│   └── dashboard/
│       ├── sidebar.tsx        # Navigation latérale
│       ├── launch-type-cards.tsx  # Cards types recommandés
│       ├── launch-list.tsx    # Liste des launches
│       └── new-launch-modal.tsx   # Modal création launch
│
├── lib/
│   └── store/
│       └── launches.ts        # Zustand store
│
├── styles/
│   └── globals.css            # Thème violet + CSS variables
│
└── tailwind.config.ts         # Config Tailwind custom
```

## 🎯 Fonctionnalités Interactives

### Dashboard (`/dashboard`)
- Statistiques mockées (12 campagnes actives, 145.2K reach, etc.)
- Quick actions cliquables vers les autres pages

### Launches (`/launches`)

**Recommended Types**
- 4 cards avec hover effects
- Cliquables → ouvrent le modal "New Launch"

**Search Bar**
- Recherche en temps réel dans les launches
- Filtrage par nom, type, ou pays

**Liste des Launches** (4 launches mockés)
- Status badges (Draft/Active/Paused/Completed)
- Progress bar animée
- Actions:
  - 👁️ View (placeholder)
  - ▶️/⏸️ Play/Pause (toggle status)
  - 🗑️ Delete (supprime la launch)
- Formats affichés en chips

**Modal New Launch**
- Formulaire complet avec validation
- Champs:
  - Campaign Name (required)
  - Type (Lead Form/Landing Page/Redirect/Survey)
  - Country (dropdown avec 6 pays)
  - Objective (Conversions/Traffic/Awareness/etc.)
  - Budget ($) (required, min 100)
  - Formats (multi-select avec chips)
- Actions: Cancel / Create Launch
- Création instantanée dans le store Zustand

### Navigation
- Sidebar fixe à gauche
- Logo + nom de l'app
- 4 items (Dashboard/Launches/Templates/Settings)
- Templates désactivé avec badge "Soon"
- Footer avec profil utilisateur

## 🎨 Détails UI/UX

### Hover States
- Cards: border violet + shadow
- Buttons: couleur plus foncée + shadow
- Navigation: background accent
- Launch cards: border violet subtil

### Animations
- Progress bars: transition smooth
- Hover transforms (scale, translate)
- Modal: backdrop blur

### Responsive
- Grid adaptive (1 col → 4 cols selon breakpoints)
- Sidebar fixe (desktop)
- Layout fluide

### Colors
```css
--background: 0 0% 98%        /* Fond clair */
--primary: 270 91% 65%        /* Violet */
--border: 270 15% 90%         /* Bordures subtiles */
--muted: 270 20% 96%          /* Fond muted */
```

## 📝 Notes

- **Pas de backend requis** pour cette phase
- Données mockées dans Zustand store
- Pas d'API calls
- Navigation full client-side
- TypeScript strict activé

## ✅ Acceptance Criteria

- [x] `pnpm dev` démarre sans erreurs
- [x] UI conforme au style Sundays (violet, clean, aéré)
- [x] Navigation fluide entre les pages
- [x] Sidebar responsive avec items actifs
- [x] Page Launches avec toutes les sections
- [x] Modal New Launch fonctionnel
- [x] Recherche en temps réel
- [x] Actions (play/pause/delete) fonctionnelles
- [x] Zustand store gère l'état
- [x] Pas d'erreurs TypeScript/lint

## 🎯 Prochaines Étapes (Phase 2)

- Connecter au backend tRPC/NestJS
- Intégration réelle avec Meta Graph API
- Templates pré-remplis
- Analytics et métriques
- Settings avec config plateforme

---

**Enjoy ! 🚀**
