# 架構設計文件

**語言：** [English](./ARCHITECTURE.en.md) | [中文版](./ARCHITECTURE.zh.md)

---

## 系統架構概覽

```mermaid
flowchart TB
    subgraph Vue3Host [Vue3 Host - Shell]
        Pinia[Pinia Store]
        LegacyContainer[LegacyContainer.vue]
        ContentArea[ContentArea.vue]
        NavigationBar[NavigationBar.vue]
        UseBridge[useBridge Composable]
        SpaceInvaders[SpaceInvaders.vue<br/>Vue3 原生功能]
        Vue2Iframe[Vue2Iframe.vue]
    end
    
    subgraph Vue2Legacy [Vue2 Legacy - iframe]
        Vuex[Vuex Store]
        Router[Vue Router]
        ClassComponents[Class Style Components]
        GuestBridgeVue2[GuestBridge]
    end
    
    subgraph SharedBridge [shared-bridge]
        Protocol[protocol.ts]
        HostBridge[HostBridge]
        GuestBridge[GuestBridge]
    end
    
    LegacyContainer --> NavigationBar
    LegacyContainer --> ContentArea
    ContentArea --> Vue2Iframe
    ContentArea --> SpaceInvaders
    Vue3Host -->|"iframe src=?token=XXX"| Vue2Legacy
    Vue2Legacy -->|"READY / AUTH_READY"| Vue3Host
    Vue3Host -->|"NAVIGATE"| Vue2Legacy
    Vue2Legacy -->|"ROUTE_CHANGE"| Vue3Host
    
    UseBridge --> HostBridge
    GuestBridgeVue2 --> GuestBridge
```

---

## 元件職責說明

### Vue3 Host（Shell）

| 元件 | 檔案 | 職責 |
|------|------|------|
| App | `App.vue` | 根容器，router view |
| LegacyContainer | `components/LegacyContainer.vue` | 主容器，管理視圖切換 |
| NavigationBar | `components/NavigationBar.vue` | 導航列、路由按鈕、語言切換 |
| ContentArea | `components/ContentArea.vue` | 內容區域，在 Legacy iframe 和 Vue3 功能間切換 |
| Vue2Iframe | `components/Vue2Iframe.vue` | Vue2 Legacy 的 iframe 包裝器 |
| SpaceInvaders | `components/SpaceInvaders.vue` | Vue3 原生 3D 遊戲（Babylon.js），展示 Vue3 能力 |
| useBridge | `composables/useBridge.ts` | Bridge 連接與事件處理 |
| auth store | `stores/auth.ts` | 認證狀態、Legacy 路由狀態 |

### Vue2 Legacy（Feature App）

| 元件 | 檔案 | 職責 |
|------|------|------|
| main | `main.ts` | 入口、Bridge 初始化、登入流程 |
| App | `App.vue` | 根容器、導航列（非 iframe 模式） |
| store | `store/index.ts` | Vuex auth module |
| router | `router/index.ts` | 路由設定 |
| Views | `views/*.vue` | 類別風格頁面組件 |

### shared-bridge

| 模組 | 檔案 | 職責 |
|------|------|------|
| protocol | `protocol.ts` | BridgeMessage 型別、驗證函式 |
| HostBridge | `host.ts` | Vue3 端 Bridge 類別 |
| GuestBridge | `guest.ts` | Vue2 端 Bridge 類別 |

---

## 資料流向

### 啟動流程

```mermaid
sequenceDiagram
    participant Vue3 as Vue3 Host
    participant iframe as iframe
    participant Vue2 as Vue2 Legacy

    Vue3->>Vue3: getToken()
    Vue3->>iframe: src="?token=XXX"
    iframe->>Vue2: 載入頁面
    Vue2->>Vue2: parseQueryToken()
    Vue2->>Vue2: loginWithToken(token)
    Vue2->>Vue2: Vuex commit
    Vue2->>Vue3: postMessage(READY)
    Vue2->>Vue3: postMessage(AUTH_READY)
    Vue3->>Vue3: Pinia setUser()
    Vue2->>Vue3: postMessage(ROUTE_CHANGE)
    Vue3->>Vue3: 更新導航列 active 狀態
```

### 導航流程

```mermaid
sequenceDiagram
    participant User as 使用者
    participant Vue3 as Vue3 Host
    participant Vue2 as Vue2 Legacy

    User->>Vue3: 點擊導航按鈕
    Vue3->>Vue2: postMessage(NAVIGATE)
    Vue2->>Vue2: router.push()
    Vue2->>Vue3: postMessage(ROUTE_CHANGE)
    Vue3->>Vue3: 更新 active 狀態
```

---

## 技術選型

### Vue3 Host

| 技術 | 版本 | 用途 |
|------|------|------|
| Vue | 3.4.x | 前端框架 |
| Vite | 5.x | 建構工具 |
| Pinia | 2.x | 狀態管理 |
| TypeScript | 5.x | 型別系統 |
| Babylon.js | 8.x | 3D 渲染引擎（用於 Space Invaders） |
| vue-i18n | 9.x | 國際化 |

### Vue2 Legacy

| 技術 | 版本 | 用途 |
|------|------|------|
| Vue | 2.6.x | 前端框架 |
| Vue CLI | 5.x | 建構工具 |
| Vuex | 3.x | 狀態管理 |
| vue-class-component | 7.x | 類別風格組件 |
| vue-property-decorator | 9.x | 裝飾器支援 |
| vuex-class | 0.3.x | Vuex 裝飾器 |
| TypeScript | 4.5.x | 型別系統 |

---

## 設計決策

### 1. 為何使用 iframe 隔離？

- Vue2 與 Vue3 執行環境完全獨立
- 避免 CSS / JS 衝突
- 可使用不同 Node 版本開發
- 符合 Strangler Fig Pattern

### 2. 為何保留 URL Token？

- 維持既有登入流程
- Vue2 端無需修改核心邏輯
- 單一真實來源（Vue2）
- 降低整合風險

### 3. Bridge 的角色

- **不是**登入的主要手段
- **是**狀態回報與事件傳遞的通道
- 輕量級、無狀態、雙向通訊

### 4. 為何使用類別風格組件？

- 與既有 Vue2 專案風格一致
- 更好的 TypeScript 支援
- 裝飾器語法更直觀

### 5. Vue3 原生功能

Vue3 Host 可以在 Legacy iframe 旁邊運行原生 Vue3 功能：

- **Space Invaders 3D 遊戲**：展示 Vue3 運行現代 3D 應用的能力
- **獨立路由**：Vue3 功能使用 Vue Router，與 Vue2 路由分離
- **視圖切換**：`ContentArea` 組件在 Legacy iframe 和 Vue3 功能間切換
- **響應式設計**：完整支援桌面、平板、手機的 RWD
- **虛擬控制**：手機遊戲的觸控友善控制

**架構模式：**
- Legacy 路由：透過 Bridge 控制，在 iframe 中顯示
- Vue3 路由：原生 Vue Router，以 Vue3 組件顯示
- 導航：統一的導航列控制兩種類型

---

## iframe 模式偵測

Vue2 可偵測自己是否在 iframe 中運行：

```typescript
get isInIframe(): boolean {
  try {
    return window.self !== window.top
  } catch (e) {
    return true // 跨域時無法存取 window.top
  }
}
```

用途：
- iframe 模式：隱藏導航列，由 Vue3 Host 控制
- 獨立模式：顯示完整導航列

---

## 安全性考量

### postMessage Origin

生產環境建議指定明確的 origin：

```typescript
// Vue3 Host
const bridge = new HostBridge({
  targetOrigin: 'https://legacy.example.com',
  allowedOrigins: ['https://legacy.example.com']
})

// Vue2 Legacy
const bridge = new GuestBridge({
  targetOrigin: 'https://host.example.com',
  allowedOrigins: ['https://host.example.com']
})
```

### Token 傳遞

- Token 透過 URL query 傳遞（符合既有流程）
- Vue2 負責驗證 token 有效性
- Bridge 不傳遞敏感憑證

---

**語言：** [English](./ARCHITECTURE.en.md) | [中文版](./ARCHITECTURE.zh.md)
