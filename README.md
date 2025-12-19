# Vue Hybrid Bridge Demo

本專案為技術展示用，目標是在**既有登入流程不可變更**的前提下，
以 Vue3 Host + iframe 方式整合 Vue2 Legacy，並透過 message bridge
同步狀態與導航，保留 URL token 登入機制。

---

## 1. 專案目標（Objective）

* 舊 Vue2 系統仍使用 **URL Query Token 登入**
* 新 Vue3 系統作為 Shell / Host
* 透過 iframe + Message Bridge 與 Vue2 整合
* 不破壞現行流程，同時**為未來登入重構預留出口**

---

## 2. 架構模式（Architecture Pattern）

* iframe-based Legacy Isolation
* Shell (Vue3) + Feature App (Vue2)
* Message-driven integration
* URL Token Compatibility Layer（新增）

---

## 3. 核心約束（Hard Constraints）

### 不可變更事項（必須遵守）

* ✅ Vue2 **登入流程維持：URL query token**
* ✅ Vue2 仍負責「是否已登入」的最終判定
* ❌ 不可移除 URL token
* ❌ 不可要求 Vue2 改為純 message 登入

### 可新增事項（允許）

* ✅ Vue3 **可產生 token 並帶入 iframe URL**
* ✅ Vue3 / Vue2 可額外透過 bridge 同步登入狀態
* ✅ Vue2 可在登入完成後回報狀態（READY / AUTHED）

---

## 4. Monorepo 結構（npm workspace）

（結構不變，略）

---

## 5. iframe 載入規格（含 URL Token）

### Vue3 Host（Shell）

* iframe URL 必須包含 token query
* 範例：

```ts
const iframeSrc = `${LEGACY_URL}/?token=${token}`
```

* Vue3 不負責驗證 token
* Vue3 僅負責「轉交 token」

### Vue2 Legacy App

* 啟動時：
  * 從 URL query 解析 token
  * 執行原有登入流程
* 登入成功後：
  * 初始化 Vuex 使用者狀態
  * 透過 bridge 回報登入完成

---

## 6. Bridge 溝通層（Message Bridge）

### 溝通角色定義

* URL token：**唯一登入入口（Legacy 責任）**
* Bridge：**狀態回報與輔助同步**

### Message Protocol（修正版）

```ts
type BridgeMessage =
  | { type: 'READY' }                         // Vue2 啟動完成
  | { type: 'AUTH_READY'; user: any }          // Vue2 已完成登入
  | { type: 'NAVIGATE'; route: string }        // Vue3 → Vue2
  | { type: 'STATE_SYNC'; key: string; value: any }
  | { type: 'EVENT'; name: string; payload?: any }
```

⚠️ **不再要求 AUTH_SYNC 作為主要登入手段**

---

## 7. 登入流程（最重要｜請原樣執行）

### 登入流程定義（不可改）

#### Step 1：Vue3 取得 token（模擬或來自既有系統）

```ts
const token = getToken()
```

#### Step 2：Vue3 載入 iframe（URL 帶 token）

```html
<iframe src="https://legacy-app/?token=XXX" />
```

#### Step 3：Vue2 啟動 → 解析 URL token

```ts
const token = parseQueryToken()
loginWithToken(token)
```

#### Step 4：Vue2 登入成功後

* 寫入 Vuex
* 發送 message

```ts
postMessage({
  type: 'AUTH_READY',
  user: currentUser
})
```

#### Step 5：Vue3 接收 AUTH_READY

* 更新 Pinia 使用者狀態
* 顯示 Header / 上方資訊

---

## 8. 導航控制（維持原規格）

### Vue3 → Vue2 路由導向

```ts
bridge.send({
  type: 'NAVIGATE',
  route: '/mission-log'
})
```

### Vue2 接收後

```ts
router.push(route)
```

---

## 9. 狀態同步原則（修正版）

### 同步責任分工

| 項目           | 主責          | 說明          |
| -------------- | ------------- | ------------- |
| Token 驗證     | Vue2          | URL token     |
| 是否登入       | Vue2          | 單一真實來源  |
| 使用者資訊     | Vue2 → Vue3   | AUTH_READY    |
| UI Header 狀態 | Vue3          | 顯示用途      |
| 導航事件       | Vue3 → Vue2   | Signal only   |

---

## 10. Demo 驗收條件（Acceptance Criteria）

### Demo 必須能做到：

1. Vue3 / Vue2 使用不同 Node 版本同時啟動
2. Vue3 iframe URL 正確帶入 token
3. Vue2 依原流程成功登入
4. Vue2 登入完成後 Vue3 Header 更新
5. Vue3 操作可導向 Vue2 路由
6. 若未帶 token → Vue2 顯示未登入狀態
7. 未修改 Vue2 原登入核心邏輯

---

## 11. 技術定位說明（對外可用）

> 本架構在**完全保留既有 URL Token 登入機制**的前提下，
> 透過 iframe 隔離與 Message Bridge，
> 讓新系統得以逐步接管 UI 與互動層，
> 而不引入整合風險。

---

## 12. 技術關鍵字（更新）

* iframe-based Legacy Integration
* URL Token Compatibility Layer
* Message Bridge (Non-auth-critical)
* Progressive Migration
* Strangler Fig Pattern

---

## 給 Codex 的建議指令

> 「請依照上述技術規格建立 npm workspace monorepo，Vue3 Host 以 iframe 載入 Vue2 Legacy，登入流程必須維持 URL token，並以 postMessage 回報登入完成與處理導航事件。」

---

如果需要，可補充「登入流程時序圖（sequence）」或建立最小可用的
`shared-bridge/protocol.ts`。
