# 整合指南

**語言：** [English](./INTEGRATION_GUIDE.en.md) | [中文版](./INTEGRATION_GUIDE.zh.md)

---

本文件說明如何將此 Demo 的模式應用到實際專案中。

---

## 整合步驟總覽

1. 安裝 shared-bridge 套件
2. Vue2 端整合 GuestBridge
3. Vue3 端整合 HostBridge
4. 實作 iframe 模式偵測
5. 測試與驗證

---

## Step 1: 安裝 shared-bridge

### 方式 A：複製到專案中

將 `packages/shared-bridge` 複製到你的專案，並在 `package.json` 中引用：

```json
{
  "dependencies": {
    "@vue-hybrid-bridge/shared-bridge": "file:./shared-bridge"
  }
}
```

### 方式 B：發布為私有套件

建構並發布到私有 npm registry。

---

## Step 2: Vue2 端整合

### 2.1 安裝相關套件

如果使用 TypeScript + Class Style：

```bash
npm install vue-class-component vue-property-decorator vuex-class
npm install -D typescript @vue/cli-plugin-typescript
```

### 2.2 建立 Bridge 實例

在 `main.ts` 中：

```typescript
import { GuestBridge } from '@vue-hybrid-bridge/shared-bridge'

const bridge = new GuestBridge({ debug: true })
Vue.prototype.$bridge = bridge

async function initApp() {
  bridge.connect()
  
  // 監聽導航
  bridge.on('NAVIGATE', (message) => {
    router.push(message.route)
  })
  
  // 解析 token 並登入
  const token = parseQueryToken()
  if (token) {
    const user = await loginWithToken(token)
    store.commit('auth/setUser', user)
    bridge.authReady(user)
  }
  
  bridge.ready()
  
  // 路由變化通知
  router.afterEach((to) => {
    bridge.emit('ROUTE_CHANGE', { path: to.path })
  })
}
```

### 2.3 實作 iframe 偵測

在 `App.vue` 中：

```typescript
@Component
export default class App extends Vue {
  get isInIframe(): boolean {
    try {
      return window.self !== window.top
    } catch (e) {
      return true
    }
  }
}
```

模板中條件渲染：

```vue
<nav v-if="!isInIframe" class="nav">
  <!-- 原有導航列 -->
</nav>
```

### 2.4 TypeScript 型別定義

建立 `shims-bridge.d.ts`：

```typescript
import { GuestBridge } from '@vue-hybrid-bridge/shared-bridge'

declare module 'vue/types/vue' {
  interface Vue {
    $bridge: GuestBridge
  }
}
```

---

## Step 3: Vue3 端整合

### 3.1 建立 Composable

```typescript
// composables/useBridge.ts
import { HostBridge } from '@vue-hybrid-bridge/shared-bridge'
import { useAuthStore } from '@/stores/auth'

const bridge = new HostBridge({ debug: true })

export function useBridge() {
  const authStore = useAuthStore()

  function connect(iframe: HTMLIFrameElement) {
    bridge.connect(iframe)
    
    bridge.on('READY', () => {
      authStore.setLegacyReady(true)
    })
    
    bridge.on('AUTH_READY', (message) => {
      authStore.setUser(message.user)
    })
    
    bridge.on('EVENT', (message) => {
      if (message.name === 'ROUTE_CHANGE') {
        authStore.setLegacyRoute(message.payload.path)
      }
    })
  }

  function navigate(route: string) {
    bridge.navigate(route)
  }

  return { connect, navigate }
}
```

### 3.2 建立 Auth Store

```typescript
// stores/auth.ts
export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const isLegacyReady = ref(false)
  const currentLegacyRoute = ref('/')

  return {
    user,
    isLegacyReady,
    currentLegacyRoute,
    // ... actions
  }
})
```

### 3.3 建立 iframe 容器

```vue
<template>
  <div class="frame-container">
    <nav class="nav-bar">
      <button
        v-for="route in routes"
        :class="{ active: currentRoute === route.path }"
        @click="navigate(route.path)"
      >
        {{ route.label }}
      </button>
    </nav>
    <iframe
      ref="iframeRef"
      :src="legacyUrl"
      @load="onLoad"
    />
  </div>
</template>

<script setup>
const legacyUrl = computed(() => {
  return `${LEGACY_BASE_URL}/?token=${getToken()}`
})
</script>
```

---

## Step 4: Message Protocol

### 可用訊息類型

| 類型 | 方向 | 說明 |
|------|------|------|
| `READY` | Vue2 → Vue3 | Legacy 啟動完成 |
| `AUTH_READY` | Vue2 → Vue3 | 登入完成，含 user 資料 |
| `NAVIGATE` | Vue3 → Vue2 | 路由導航指令 |
| `STATE_SYNC` | 雙向 | 狀態同步 |
| `EVENT` | 雙向 | 通用事件 |

### 擴展事件

使用 `EVENT` 類型傳遞自訂事件：

```typescript
// Vue2 發送
bridge.emit('ROUTE_CHANGE', { path: '/dashboard' })

// Vue3 接收
bridge.on('EVENT', (message) => {
  if (message.name === 'ROUTE_CHANGE') {
    // 處理路由變化
  }
})
```

---

## Step 5: 驗證清單

### 功能驗證

- [ ] Vue3 iframe URL 正確帶入 token
- [ ] Vue2 能解析 URL token 並登入
- [ ] Vue2 登入後 Vue3 收到 AUTH_READY
- [ ] Vue3 導航按鈕能控制 Vue2 路由
- [ ] Vue2 路由變化 Vue3 能收到通知
- [ ] Vue2 在 iframe 中隱藏導航列
- [ ] Vue2 獨立存取時顯示導航列
- [ ] 未帶 token 時 Vue2 顯示未登入狀態

### 約束驗證

- [ ] Vue2 登入流程未被修改
- [ ] URL token 機制保留
- [ ] Vue2 仍為登入狀態的單一真實來源

---

## 常見問題

### Q: vue-demi 衝突怎麼辦？

在 `vite.config.ts` 中指定 vue-demi 版本：

```typescript
resolve: {
  alias: {
    'vue-demi': resolve(rootDir, 'node_modules/vue-demi/lib/v3/index.mjs')
  }
}
```

### Q: 端口被佔用？

```bash
# Windows
netstat -ano | findstr :5173
taskkill /F /PID <PID>

# macOS/Linux
lsof -i :5173
kill -9 <PID>
```

### Q: TypeScript 編譯錯誤？

確保 `tsconfig.json` 包含：

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "skipLibCheck": true
  }
}
```

---

## 程式碼範例

完整範例請參考：

- Vue2 入口：`packages/vue2-legacy/src/main.ts`
- Vue3 容器：`packages/vue3-host/src/components/LegacyFrame.vue`
- Bridge API：`packages/shared-bridge/README.md`

---

**語言：** [English](./INTEGRATION_GUIDE.en.md) | [中文版](./INTEGRATION_GUIDE.zh.md)

