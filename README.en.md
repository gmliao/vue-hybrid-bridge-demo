# Vue Hybrid Bridge Demo <span style="float: right;">[English](./README.en.md) | [中文版](./README.zh.md)</span>

This project is a technical demonstration that integrates Vue2 Legacy into Vue3 Host using iframe + Message Bridge, while **maintaining the existing login flow unchanged**. The URL token authentication mechanism is preserved.

---

## Screenshot Preview

![Demo Screenshot](./docs/images/demo-screenshot.png)

**Features:**
- Top white navigation bar is controlled by **Vue3 Host** (shows "Vue3 Host In Control" badge)
- Navigation buttons (Home, Dashboard, Settings) control Vue2 routes from Vue3
- Top right shows language toggle button (中文/EN) and Legacy connection status
- Bottom purple area is **Vue2 Legacy** iframe content
- Vue2 automatically hides native navigation bar in iframe mode
- Login status is passed via URL token, verified by Vue2 and reported to Vue3
- **Language Toggle**: Default English, click top right language button (shows "中文") to switch to Chinese, Vue3 and Vue2 languages sync

---

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
├── README.md                       # This file (entry point)
├── README.en.md                    # English version
├── README.zh.md                    # Chinese version
├── AGENTS.md                       # AI collaboration constraints
│
├── docs/
│   ├── ARCHITECTURE.md             # Architecture design doc
│   ├── ARCHITECTURE.en.md          # English version
│   ├── ARCHITECTURE.zh.md          # Chinese version
│   ├── LOGIN_FLOW.md               # Login flow doc
│   ├── LOGIN_FLOW.en.md            # English version
│   ├── LOGIN_FLOW.zh.md            # Chinese version
│   ├── INTEGRATION_GUIDE.md        # Integration guide
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
| URL Token Login | Vue2 parses token from URL query, maintains original flow |
| Bridge Communication | postMessage bidirectional communication |
| State Sync | Vue2 notifies Vue3 via AUTH_READY after login |
| Route Navigation | Vue3 can control Vue2 routes |
| Route Status Report | Vue2 notifies Vue3 on route changes |
| iframe Mode Detection | Vue2 automatically hides navigation bar in iframe |
| TypeScript Support | Both sides use TypeScript |
| Class Style Components | Vue2 uses vue-class-component |
| **Language Toggle** | **Default English, supports switching to Chinese, Vue3/Vue2 language sync** |

---

## Hard Constraints

### Cannot Change

- ✅ Vue2 login flow maintains: **URL query token**
- ✅ Vue2 still responsible for final "is logged in" determination
- ❌ Cannot remove URL token
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
- URL Token Compatibility Layer
- Message Bridge (postMessage)
- Progressive Migration
- Strangler Fig Pattern
- TypeScript + Class Style Components

---

<div align="center" style="margin-top: 30px; padding: 15px; background-color: #f5f5f5; border-radius: 5px;">

---

**Language:** [English](./README.en.md) | [中文版](./README.zh.md)

