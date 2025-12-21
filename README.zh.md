# Vue Hybrid Bridge Demo <span style="float: right;">[English](./README.en.md) | [中文版](./README.zh.md)</span>

本專案為技術展示用，目標是在**既有登入流程不可變更**的前提下，
以 Vue3 Host + iframe 方式整合 Vue2 Legacy，並透過 Message Bridge
同步狀態與導航，保留 URL query 登入交換參數（`login_ticket`）。

## Purpose

本專案用小型、可隔離的原型，驗證從 Vue 2 遷移到 Vue 3 的可行路徑與關鍵架構假設。

目的是降低不確定性，提供技術洞見，作為後續實作與整合的參考。

## 🌐 線上展示

**[查看線上展示 →](https://gmliao.github.io/vue-hybrid-bridge-demo/?login_ticket=demo-login-ticket-12345)**  
Demo 連結已預先帶入 login_ticket，方便直接查看登入狀態。

---

## 截圖預覽

![Demo Screenshot](./docs/images/demo-screenshot.png?v=2)

**功能展示：**
- 上方白色導航列為 **Vue3 Host** 控制（顯示「Vue3 Host 控制中」標籤）
- 導航按鈕（首頁、儀表板、設定）由 Vue3 控制 Vue2 路由
- **Space Invaders** 按鈕開啟 Vue3 原生 3D 遊戲（使用 Babylon.js 引擎）
- 右上角顯示語言切換按鈕（中文/EN）和 Legacy 連接狀態
- 下方紫色區域為 **Vue2 Legacy** iframe 內容
- Vue2 在 iframe 模式下自動隱藏原生導航列
- 登入交換參數透過 URL query 傳遞（`login_ticket`），由 Vue2 驗證後回報給 Vue3
- **中英文切換**：預設英文，點擊右上角語言按鈕（顯示「中文」）可切換至中文，Vue3 與 Vue2 語言同步
- **響應式設計**：完整支援桌面、平板、手機等各種螢幕尺寸
- **虛擬控制**：手機/平板設備提供觸控友善的遊戲控制按鈕

## 快速啟動（Quick Start）

### 環境需求

- Node.js >= 16.0.0（建議使用 18.x）
- npm >= 8.0.0

### 安裝與啟動

```bash
# 1. 安裝依賴
npm install

# 2. 建構 shared-bridge
npm run build:bridge

# 3. 同時啟動 Vue3 Host 與 Vue2 Legacy
npm run dev
```

### 開發伺服器

| 應用程式 | 網址 | 技術棧 |
|---------|------|--------|
| Vue3 Host | http://localhost:5173 | Vite + Vue3 + Pinia + TypeScript |
| Vue2 Legacy | http://localhost:8080 | Webpack + Vue2 + Vuex + TypeScript + Class Style |

---

## 專案結構

```
vue-hybrid-bridge-demo/
├── package.json                    # npm workspace 根設定
├── README.md                       # 本文件（入口點）
├── README.en.md                    # 英文版
├── README.zh.md                    # 中文版
├── AGENTS.md                       # AI 協作約束規則
│
├── docs/
│   ├── ARCHITECTURE.md             # 架構設計文件
│   ├── ARCHITECTURE.en.md          # 英文版
│   ├── ARCHITECTURE.zh.md          # 中文版
│   ├── LOGIN_FLOW.md               # 登入流程說明
│   ├── LOGIN_FLOW.en.md            # 英文版
│   ├── LOGIN_FLOW.zh.md            # 中文版
│   ├── INTEGRATION_GUIDE.md        # 整合指南
│   ├── INTEGRATION_GUIDE.en.md     # 英文版
│   ├── INTEGRATION_GUIDE.zh.md     # 中文版
│   └── images/
│       └── demo-screenshot.png
│
└── packages/
    ├── shared-bridge/              # 通訊協議層
    │   ├── src/
    │   │   ├── protocol.ts         # BridgeMessage 型別
    │   │   ├── host.ts             # HostBridge（Vue3 用）
    │   │   └── guest.ts            # GuestBridge（Vue2 用）
    │   └── README.md               # Bridge API 文件
    │
    ├── vue3-host/                  # Vue3 Shell
    │   └── src/
    │       ├── App.vue
    │       ├── stores/auth.ts      # Pinia store
    │       ├── composables/useBridge.ts
    │       └── components/
    │           └── LegacyFrame.vue # iframe 容器 + 導航
    │
    └── vue2-legacy/                # Vue2 Feature App
        └── src/
            ├── main.ts             # 入口（TypeScript）
            ├── App.vue             # Class Style 組件
            ├── store/index.ts      # Vuex + TypeScript
            ├── router/index.ts
            └── views/              # 頁面組件（Class Style）
```

---

## 核心功能

### ✅ 已實作

| 功能 | 說明 |
|------|------|
| SSO 回跳交換參數 | Vue2 從 URL query 解析登入交換參數，維持原有流程 |
| Bridge 通訊 | postMessage 雙向通訊 |
| 狀態同步 | Vue2 登入後透過 AUTH_READY 通知 Vue3 |
| 路由導航 | Vue3 可控制 Vue2 的路由 |
| 路由狀態回報 | Vue2 路由變化時通知 Vue3 |
| iframe 模式偵測 | Vue2 在 iframe 中自動隱藏導航列 |
| TypeScript 支援 | 兩端皆使用 TypeScript |
| 類別風格組件 | Vue2 使用 vue-class-component |
| **中英文切換** | **預設英文，支援切換至中文，Vue3/Vue2 語言同步** |
| **Space Invaders 3D 遊戲** | **Vue3 原生 3D 遊戲，使用 Babylon.js 引擎，展示 Vue3 Host 能力** |
| **響應式設計 (RWD)** | **完整支援桌面、平板、手機等各種螢幕尺寸** |
| **虛擬控制** | **手機/平板設備提供觸控友善的虛擬按鈕** |
| **高解析度支援** | **自動支援 Retina 及高 DPI 螢幕的高解析度顯示** |

---

## 核心約束（Hard Constraints）

### 不可變更

- ✅ Vue2 登入流程維持：**URL query 登入交換參數**（`login_ticket`）
- ✅ Vue2 仍負責「是否已登入」的最終判定
- ❌ 不可移除初始進入時的 URL query `login_ticket`
- ❌ 不可要求 Vue2 改為純 message 登入

### 可新增

- ✅ Vue3 可產生 login_ticket 並帶入 iframe URL
- ✅ Vue3 / Vue2 可透過 bridge 同步登入狀態
- ✅ Vue2 可在登入完成後回報 AUTH_READY

---

## 可用指令

| 指令 | 說明 |
|------|------|
| `npm install` | 安裝所有依賴 |
| `npm run dev` | 同時啟動 Vue3 + Vue2 |
| `npm run dev:vue3` | 僅啟動 Vue3 Host |
| `npm run dev:vue2` | 僅啟動 Vue2 Legacy |
| `npm run build` | 建構所有專案 |
| `npm run build:bridge` | 建構 shared-bridge |

---

## 技術文件

- [架構設計文件](./docs/ARCHITECTURE.zh.md) | [English](./docs/ARCHITECTURE.en.md)
- [登入流程說明](./docs/LOGIN_FLOW.zh.md) | [English](./docs/LOGIN_FLOW.en.md)
- [整合指南](./docs/INTEGRATION_GUIDE.zh.md) | [English](./docs/INTEGRATION_GUIDE.en.md)
- [Bridge API 文件](./packages/shared-bridge/README.md)

> **注意：** 所有技術文件預設為英文版本。點擊文件開頭或結尾的語言連結可切換至中文版。

---

## 技術關鍵字

- iframe-based Legacy Integration
- SSO Redirect Parameter Compatibility Layer
- Message Bridge (postMessage)
- Progressive Migration
- Strangler Fig Pattern
- TypeScript + Class Style Components

---

## 驗證流程（SSO 風格）

此 demo 以常見的 SSO 回跳交換流程為藍本，同時維持 legacy 的登入邏輯。URL 參數被視為**登入交換參數**（`login_ticket`）。

1. 使用者完成 SSO，瀏覽器回跳並帶上 `login_ticket`
2. 前端讀取 `login_ticket`
3. 前端送至後端驗證（demo 由 Vue2 模擬登入）
4. 後端建立登入態（session 或 API token）
5. Vue3 / Vue2 透過 bridge 共享登入狀態（不傳遞原始票據）

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

- postMessage bridge 會驗證 origin allowlist 與訊息格式
- `login_ticket` 不可視為長效授權憑證
- 生產建議：讀取後使用 `history.replaceState` 清除 URL 參數，並設置 Referrer-Policy 為 `strict-origin-when-cross-origin`

---

## 退場策略（Decommission Plan）

此 demo 為過渡架構，建議以路由為單位逐步替換，並維持最小 bridge 集合。

- **替換單位：** 以頁面（route）為單位逐步替換
- **Bridge 最小集：** `AUTH_READY`, `NAVIGATE`, `EVENT: LOGOUT`（只保留必要事件）
- **拆除里程碑：**
  - Phase 1：Vue3 上線新功能（如 3D 模組）
  - Phase 2：高變動頁面逐步搬到 Vue3
  - Phase 3：Vue2 僅剩低頻頁面
  - Phase 4：移除 iframe 與 bridge

---

**Language:** [English](./README.en.md) | [中文版](./README.zh.md)
