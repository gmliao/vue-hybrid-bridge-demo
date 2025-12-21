# Vue Hybrid Bridge Demo <span style="float: right;">[English](./README.en.md) | [中文版](./README.zh.md)</span>

This project is a technical demonstration that integrates Vue2 Legacy into Vue3 Host using iframe + Message Bridge, while **maintaining the existing login flow unchanged**. The URL query login exchange parameter (demo uses `token`) is preserved.

## 🌐 Live Demo

**[View Live Demo →](https://gmliao.github.io/vue-hybrid-bridge-demo/)**

---

## Screenshot Preview

![Demo Screenshot](./docs/images/demo-screenshot.png?v=2)

**Key Features:**
- Top white navigation bar is controlled by **Vue3 Host** (shows "Vue3 Host In Control" badge)
- Navigation buttons (Home, Dashboard, Settings) control Vue2 routes from Vue3
- **Space Invaders** button opens Vue3 native 3D game (Babylon.js powered)
- Top right shows language toggle button (中文/EN) and Legacy connection status
- Bottom purple area is **Vue2 Legacy** iframe content
- Vue2 automatically hides native navigation bar in iframe mode
- Login exchange parameter is passed via URL query (demo uses `token`), verified by Vue2 and reported to Vue3
- **Language Toggle**: Default English, click top right language button (shows "中文") to switch to Chinese, Vue3 and Vue2 languages sync
- **Responsive Design**: Fully responsive layout adapts to desktop, tablet, and mobile screens
- **Virtual Controls**: Touch-friendly game controls for mobile/tablet devices

## Quick Start

### Requirements

- Node.js >= 16.0.0 (recommended 18.x)
- npm >= 8.0.0

### Installation & Start

```bash
# 1. Install dependencies
npm install

# 2. Build shared-bridge
npm run build:bridge

# 3. Start both Vue3 Host and Vue2 Legacy
npm run dev
```

### Development Servers

| Application | URL | Tech Stack |
|------------|-----|------------|
| Vue3 Host | http://localhost:5173 | Vite + Vue3 + Pinia + TypeScript |
| Vue2 Legacy | http://localhost:8080 | Webpack + Vue2 + Vuex + TypeScript + Class Style |

---

## Project Structure

```
vue-hybrid-bridge-demo/
├── package.json                    # npm workspace root config
├── README.md                       # This file (entry point, default English)
├── README.en.md                    # English version
├── README.zh.md                    # Chinese version
├── AGENTS.md                       # AI collaboration constraints
│
├── docs/
│   ├── ARCHITECTURE.md             # Architecture design doc (default English)
│   ├── ARCHITECTURE.en.md          # English version
│   ├── ARCHITECTURE.zh.md          # Chinese version
│   ├── LOGIN_FLOW.md               # Login flow doc (default English)
│   ├── LOGIN_FLOW.en.md            # English version
│   ├── LOGIN_FLOW.zh.md            # Chinese version
│   ├── INTEGRATION_GUIDE.md        # Integration guide (default English)
│   ├── INTEGRATION_GUIDE.en.md     # English version
│   ├── INTEGRATION_GUIDE.zh.md     # Chinese version
│   └── images/
│       └── demo-screenshot.png
│
└── packages/
    ├── shared-bridge/              # Communication protocol layer
    │   ├── src/
    │   │   ├── protocol.ts         # BridgeMessage types
    │   │   ├── host.ts             # HostBridge (for Vue3)
    │   │   └── guest.ts            # GuestBridge (for Vue2)
    │   └── README.md               # Bridge API docs
    │
    ├── vue3-host/                  # Vue3 Shell
    │   └── src/
    │       ├── App.vue
    │       ├── stores/auth.ts      # Pinia store
    │       ├── composables/useBridge.ts
    │       └── components/
    │           └── LegacyFrame.vue # iframe container + navigation
    │
    └── vue2-legacy/                # Vue2 Feature App
        └── src/
            ├── main.ts             # Entry (TypeScript)
            ├── App.vue             # Class Style component
            ├── store/index.ts      # Vuex + TypeScript
            ├── router/index.ts
            └── views/              # Page components (Class Style)
```

---

## Core Features

### ✅ Implemented

| Feature | Description |
|---------|-------------|
| SSO Redirect Parameter | Vue2 parses login exchange parameter from URL query, maintains original flow |
| Bridge Communication | postMessage bidirectional communication |
| State Sync | Vue2 notifies Vue3 via AUTH_READY after login |
| Route Navigation | Vue3 can control Vue2 routes |
| Route Status Report | Vue2 notifies Vue3 on route changes |
| iframe Mode Detection | Vue2 automatically hides navigation bar in iframe |
| TypeScript Support | Both sides use TypeScript |
| Class Style Components | Vue2 uses vue-class-component |
| **Language Toggle** | **Default English, supports switching to Chinese, Vue3/Vue2 language sync** |
| **Space Invaders 3D Game** | **Vue3 native 3D game powered by Babylon.js, demonstrates Vue3 Host capabilities** |
| **Responsive Design (RWD)** | **Full responsive support for desktop, tablet, and mobile devices** |
| **Virtual Controls** | **Touch-friendly virtual buttons for mobile/tablet gaming** |
| **High DPI Support** | **Automatic high-resolution display support for Retina and high-DPI screens** |

---

## Hard Constraints

### Cannot Change

- ✅ Vue2 login flow maintains: **URL query login exchange parameter** (demo uses `token`)
- ✅ Vue2 still responsible for final "is logged in" determination
- ❌ Cannot remove URL query parameter on initial entry (demo uses `token`)
- ❌ Cannot require Vue2 to use pure message login

### Can Add

- ✅ Vue3 can generate token and include in iframe URL
- ✅ Vue3 / Vue2 can sync login status via bridge
- ✅ Vue2 can report AUTH_READY after login completion

---

## Available Commands

| Command | Description |
|---------|-------------|
| `npm install` | Install all dependencies |
| `npm run dev` | Start both Vue3 + Vue2 |
| `npm run dev:vue3` | Start Vue3 Host only |
| `npm run dev:vue2` | Start Vue2 Legacy only |
| `npm run build` | Build all projects |
| `npm run build:bridge` | Build shared-bridge |

---

## Documentation

- [Architecture Design](./docs/ARCHITECTURE.md) | [中文版](./docs/ARCHITECTURE.zh.md)
- [Login Flow](./docs/LOGIN_FLOW.md) | [中文版](./docs/LOGIN_FLOW.zh.md)
- [Integration Guide](./docs/INTEGRATION_GUIDE.md) | [中文版](./docs/INTEGRATION_GUIDE.zh.md)
- [Bridge API Docs](./packages/shared-bridge/README.md)

> **Note:** All documentation files default to English. Click the language links at the top or bottom of each document to switch to Chinese.

---

## Technical Keywords

- iframe-based Legacy Integration
- SSO Redirect Parameter Compatibility Layer
- Message Bridge (postMessage)
- Progressive Migration
- Strangler Fig Pattern
- TypeScript + Class Style Components

---

## Authentication Flow (SSO-Style)

This demo mirrors a common SSO redirect exchange pattern while keeping the legacy flow intact. The URL parameter is treated as a **login exchange parameter** (here named `login_ticket` for clarity; the demo uses `token`).

1. User completes SSO; browser redirects back with `login_ticket`
2. Frontend reads `login_ticket` (demo reads `token`)
3. Frontend sends it to backend for verification (demo simulates login in Vue2)
4. Backend establishes login state (session or API token)
5. Vue3/Vue2 share login status via bridge (no raw ticket forwarded)

```mermaid
sequenceDiagram
  participant U as User Browser
  participant SSO as Upstream SSO
  participant FE as Frontend (Vue3 Host)
  participant BE as Backend
  participant V2 as Vue2 Legacy (iframe)

  U->>SSO: Authenticate
  SSO-->>U: Redirect with login_ticket
  U->>FE: Load /entry?login_ticket=...
  FE->>FE: Read login_ticket
  FE->>BE: POST /auth/exchange (login_ticket)
  BE-->>FE: Set session / return api token
  FE-->>V2: Bridge: AUTH_READY (no raw ticket)
```

## Security Notes

- postMessage bridge validates origin allowlist and message shape
- Do not treat `login_ticket` as a long-lived credential
- Recommended for production: clear URL parameters with `history.replaceState` and set Referrer-Policy to `strict-origin-when-cross-origin`

---

**Language:** [English](./README.en.md) | [中文版](./README.zh.md)
