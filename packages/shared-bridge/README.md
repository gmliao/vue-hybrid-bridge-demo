# @vue-hybrid-bridge/shared-bridge

Vue3 Host 與 Vue2 Legacy 之間的 postMessage 通訊協議庫。

---

## 安裝

此套件為 monorepo 內部使用，透過 npm workspace 連結：

```json
{
  "dependencies": {
    "@vue-hybrid-bridge/shared-bridge": "1.0.0"
  }
}
```

---

## 快速開始

### Vue3 Host 端

```typescript
import { HostBridge } from '@vue-hybrid-bridge/shared-bridge'

const bridge = new HostBridge({ debug: true })

// 連接到 iframe
const iframe = document.querySelector('iframe')
bridge.connect(iframe)

// 監聽來自 Vue2 的訊息
bridge.on('READY', () => {
  console.log('Legacy app is ready')
})

bridge.on('AUTH_READY', (message) => {
  console.log('User:', message.user)
})

bridge.on('EVENT', (message) => {
  if (message.name === 'ROUTE_CHANGE') {
    console.log('Route changed:', message.payload)
  }
})

// 發送導航指令
bridge.navigate('/dashboard')

// 清理
bridge.disconnect()
```

### Vue2 Legacy 端（TypeScript）

```typescript
import { GuestBridge } from '@vue-hybrid-bridge/shared-bridge'

const bridge = new GuestBridge({ debug: true })

// 初始化連接
bridge.connect()

// 監聽導航
bridge.on('NAVIGATE', (message) => {
  router.push(message.route)
})

// 通知 Host
bridge.ready()
bridge.authReady({ id: 1, name: 'User', email: 'user@example.com' })

// 路由變化通知
router.afterEach((to) => {
  bridge.emit('ROUTE_CHANGE', { path: to.path, name: to.name })
})
```

---

## API 參考

### BridgeMessage 型別

```typescript
type BridgeMessage =
  | { type: 'READY' }
  | { type: 'AUTH_READY'; user: User }
  | { type: 'NAVIGATE'; route: string }
  | { type: 'STATE_SYNC'; key: string; value: unknown }
  | { type: 'EVENT'; name: string; payload?: unknown }
```

### User 型別

```typescript
interface User {
  id: string | number
  name: string
  email?: string
  [key: string]: unknown
}
```

### BridgeOptions

```typescript
interface BridgeOptions {
  /** 目標 origin，預設為 '*' */
  targetOrigin?: string
  /** 是否啟用除錯模式 */
  debug?: boolean
}
```

---

## HostBridge Class（Vue3 用）

### 方法

| 方法 | 參數 | 說明 |
|------|------|------|
| `connect(iframe)` | `HTMLIFrameElement` | 連接到 iframe |
| `disconnect()` | - | 斷開連接 |
| `send(message)` | `BridgeMessage` | 發送訊息 |
| `navigate(route)` | `string` | 發送導航指令 |
| `syncState(key, value)` | `string`, `unknown` | 同步狀態 |
| `emit(name, payload?)` | `string`, `unknown?` | 發送事件 |
| `on(type, handler)` | 訊息類型, 處理函式 | 監聽訊息，返回取消函式 |

### 範例

```typescript
const bridge = new HostBridge({ debug: true })

// 連接
bridge.connect(iframeElement)

// 監聽（返回取消函式）
const unsubscribe = bridge.on('AUTH_READY', (msg) => {
  console.log(msg.user)
})

// 發送
bridge.navigate('/settings')
bridge.syncState('theme', 'dark')
bridge.emit('custom-event', { data: 123 })

// 取消監聽
unsubscribe()

// 斷開
bridge.disconnect()
```

---

## GuestBridge Class（Vue2 用）

### 方法

| 方法 | 參數 | 說明 |
|------|------|------|
| `connect()` | - | 初始化連接 |
| `disconnect()` | - | 斷開連接 |
| `send(message)` | `BridgeMessage` | 發送訊息 |
| `ready()` | - | 通知 Host 已準備 |
| `authReady(user)` | `User` | 通知登入完成 |
| `syncState(key, value)` | `string`, `unknown` | 同步狀態 |
| `emit(name, payload?)` | `string`, `unknown?` | 發送事件 |
| `on(type, handler)` | 訊息類型, 處理函式 | 監聯訊息 |

### 範例

```typescript
const bridge = new GuestBridge({ debug: true })

bridge.connect()

// 通知狀態
bridge.ready()
bridge.authReady({ id: 1, name: 'User' })

// 發送自訂事件
bridge.emit('ROUTE_CHANGE', { path: '/dashboard' })

// 監聽
bridge.on('NAVIGATE', (msg) => {
  router.push(msg.route)
})

bridge.on('STATE_SYNC', (msg) => {
  console.log(msg.key, msg.value)
})
```

---

## 訊息類型說明

### READY

Vue2 Legacy App 啟動完成時發送。

```typescript
// Vue2 發送
bridge.ready()

// Vue3 接收
bridge.on('READY', () => {
  console.log('Legacy is ready')
})
```

### AUTH_READY

Vue2 完成登入驗證後發送。

```typescript
// Vue2 發送
bridge.authReady({
  id: 1,
  name: '測試使用者',
  email: 'test@example.com'
})

// Vue3 接收
bridge.on('AUTH_READY', (msg) => {
  authStore.setUser(msg.user)
})
```

### NAVIGATE

Vue3 Host 發送路由導航指令。

```typescript
// Vue3 發送
bridge.navigate('/dashboard')

// Vue2 接收
bridge.on('NAVIGATE', (msg) => {
  router.push(msg.route)
})
```

### STATE_SYNC

雙向狀態同步。

```typescript
// 發送
bridge.syncState('theme', 'dark')

// 接收
bridge.on('STATE_SYNC', (msg) => {
  console.log(msg.key, msg.value)
})
```

### EVENT

通用自訂事件，用於擴展通訊。

```typescript
// 發送（例如路由變化）
bridge.emit('ROUTE_CHANGE', { path: '/dashboard', name: 'Dashboard' })

// 接收
bridge.on('EVENT', (msg) => {
  if (msg.name === 'ROUTE_CHANGE') {
    const { path, name } = msg.payload
  }
})
```

---

## TypeScript 支援

### Vue2 型別擴展

```typescript
// shims-bridge.d.ts
import { GuestBridge } from '@vue-hybrid-bridge/shared-bridge'

declare module 'vue/types/vue' {
  interface Vue {
    $bridge: GuestBridge
  }
}
```

### 訊息驗證

```typescript
import { isValidBridgeMessage } from '@vue-hybrid-bridge/shared-bridge'

window.addEventListener('message', (event) => {
  if (isValidBridgeMessage(event.data)) {
    // 處理有效訊息
  }
})
```

---

## 安全性建議

### 指定 targetOrigin

```typescript
// 生產環境
const bridge = new HostBridge({
  targetOrigin: 'https://legacy.example.com'
})

const bridge = new GuestBridge({
  targetOrigin: 'https://host.example.com'
})
```

### 開發環境

```typescript
// 開發時可使用 '*'
const bridge = new HostBridge({
  targetOrigin: '*',
  debug: true
})
```

---

## 開發

```bash
# 開發模式（watch）
npm run dev

# 建構
npm run build
```

輸出檔案：
- `dist/index.js` - CommonJS
- `dist/index.mjs` - ES Module
- `dist/index.d.ts` - TypeScript 型別定義
