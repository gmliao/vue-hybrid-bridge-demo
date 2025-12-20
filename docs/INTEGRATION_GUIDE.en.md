# Integration Guide

This document explains how to apply this Demo's pattern to real projects.

---

## Integration Steps Overview

1. Install shared-bridge package
2. Integrate GuestBridge on Vue2 side
3. Integrate HostBridge on Vue3 side
4. Implement iframe mode detection
5. Add Vue3 native features (optional)
6. Testing and validation

---

## Step 1: Install shared-bridge

### Method A: Copy to Project

Copy `packages/shared-bridge` to your project and reference in `package.json`:

```json
{
  "dependencies": {
    "@vue-hybrid-bridge/shared-bridge": "file:./shared-bridge"
  }
}
```

### Method B: Publish as Private Package

Build and publish to private npm registry.

---

## Step 2: Vue2 Side Integration

### 2.1 Install Related Packages

If using TypeScript + Class Style:

```bash
npm install vue-class-component vue-property-decorator vuex-class
npm install -D typescript @vue/cli-plugin-typescript
```

### 2.2 Create Bridge Instance

In `main.ts`:

```typescript
import { GuestBridge } from '@vue-hybrid-bridge/shared-bridge'

const hostOrigin = 'https://host.example.com'
const bridge = new GuestBridge({
  debug: true,
  targetOrigin: hostOrigin,
  allowedOrigins: [hostOrigin]
})
Vue.prototype.$bridge = bridge

async function initApp() {
  bridge.connect()
  
  // Listen for navigation
  bridge.on('NAVIGATE', (message) => {
    router.push(message.route)
  })
  
  // Parse token and login
  const token = parseQueryToken()
  if (token) {
    const user = await loginWithToken(token)
    store.commit('auth/setUser', user)
    bridge.authReady(user)
  }
  
  bridge.ready()
  
  // Route change notification
  router.afterEach((to) => {
    bridge.emit('ROUTE_CHANGE', { path: to.path })
  })
}
```

### 2.3 Implement iframe Detection

In `App.vue`:

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

Conditional rendering in template:

```vue
<nav v-if="!isInIframe" class="nav">
  <!-- Original navigation bar -->
</nav>
```

### 2.4 TypeScript Type Definitions

Create `shims-bridge.d.ts`:

```typescript
import { GuestBridge } from '@vue-hybrid-bridge/shared-bridge'

declare module 'vue/types/vue' {
  interface Vue {
    $bridge: GuestBridge
  }
}
```

---

## Step 3: Vue3 Side Integration

### 3.1 Create Composable

```typescript
// composables/useBridge.ts
import { HostBridge } from '@vue-hybrid-bridge/shared-bridge'
import { useAuthStore } from '@/stores/auth'

const legacyOrigin = 'https://legacy.example.com'
const bridge = new HostBridge({
  debug: true,
  targetOrigin: legacyOrigin,
  allowedOrigins: [legacyOrigin]
})

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

### 3.2 Create Auth Store

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

### 3.3 Create Container Components

#### LegacyContainer.vue

```vue
<template>
  <div class="legacy-container">
    <NavigationBar
      :current-view="currentView"
      :current-legacy-route="authStore.currentLegacyRoute"
      @navigate="handleNavigate"
    />
    <ContentArea :view="currentView" />
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import NavigationBar from './NavigationBar.vue'
import ContentArea from './ContentArea.vue'

const route = useRoute()
const currentView = ref<'legacy' | 'vue3-feature'>('legacy')

watch(() => route.path, (path) => {
  currentView.value = path === '/space-invaders' ? 'vue3-feature' : 'legacy'
}, { immediate: true })
</script>
```

#### ContentArea.vue

```vue
<template>
  <div class="content-wrapper">
    <Vue2Iframe
      v-show="view === 'legacy'"
      ref="iframeRef"
      :src="legacyUrl"
      @load="onIframeLoad"
    />
    <SpaceInvaders
      v-show="view === 'vue3-feature'"
      ref="spaceInvadersRef"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import Vue2Iframe from './Vue2Iframe.vue'
import SpaceInvaders from './SpaceInvaders.vue'
import { useBridge } from '@/composables/useBridge'

const props = defineProps<{
  view: 'legacy' | 'vue3-feature'
}>()

const { connect } = useBridge()
const iframeRef = ref()
const legacyUrl = computed(() => {
  return `${LEGACY_BASE_URL}/?token=${getToken()}`
})

function onIframeLoad() {
  if (iframeRef.value?.iframeRef) {
    connect(iframeRef.value.iframeRef)
  }
}
</script>
```

#### NavigationBar.vue

```vue
<template>
  <nav class="nav-bar">
    <!-- Legacy routes -->
    <button
      v-for="route in legacyRoutes"
      :class="{ active: currentView === 'legacy' && isActiveRoute(route.path) }"
      @click="$emit('navigate', route.path, 'legacy')"
    >
      {{ route.label }}
    </button>
    
    <div class="nav-divider"></div>
    
    <!-- Vue3 native features -->
    <button
      v-for="feature in vue3Features"
      :class="{ active: currentView === 'vue3-feature' }"
      @click="$emit('navigate', feature.path, 'vue3')"
    >
      {{ feature.label }}
    </button>
  </nav>
</template>
```

---

## Step 4: Add Vue3 Native Features

### 4.1 Create Vue3 Feature Component

Example: Space Invaders 3D Game

```vue
<!-- components/SpaceInvaders.vue -->
<template>
  <div class="space-invaders-container">
    <canvas ref="canvasRef"></canvas>
    <!-- Game UI -->
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Engine, Scene } from '@babylonjs/core'

const canvasRef = ref<HTMLCanvasElement | null>(null)
let engine: Engine | null = null

onMounted(() => {
  if (!canvasRef.value) return
  
  engine = new Engine(canvasRef.value, true, {
    adaptToDeviceRatio: true, // Enable high DPI support
  })
  
  const scene = createScene(engine)
  engine.runRenderLoop(() => scene.render())
})

onUnmounted(() => {
  engine?.dispose()
})
</script>
```

### 4.2 Add Route

In `router/index.ts`:

```typescript
import { createRouter, createWebHistory } from 'vue-router'
import LegacyContainer from '@/components/LegacyContainer.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: LegacyContainer,
    },
    {
      path: '/space-invaders',
      component: LegacyContainer,
      meta: { view: 'vue3-feature' }
    }
  ]
})
```

### 4.3 Update Navigation

In `NavigationBar.vue`:

```typescript
const vue3Features = computed(() => [
  { 
    path: '/space-invaders', 
    label: t('nav.spaceInvaders'), 
    icon: '🎮',
    type: 'vue3' as const 
  }
])
```

### 4.4 Responsive Design

Add RWD support for mobile/tablet:

```css
/* Virtual controls for mobile */
@media (max-width: 1024px) {
  .virtual-controls {
    display: flex;
  }
}
```

### 4.5 Internationalization

Add i18n keys:

```json
{
  "nav": {
    "spaceInvaders": "Space Invaders"
  },
  "spaceInvaders": {
    "title": "Space Invaders (Babylon.js 3D)",
    "startGame": "Start Game"
  }
}
```

---

## Step 5: Message Protocol

### Available Message Types

| Type | Direction | Description |
|------|-----------|-------------|
| `READY` | Vue2 → Vue3 | Legacy startup complete |
| `AUTH_READY` | Vue2 → Vue3 | Login complete, includes user data |
| `NAVIGATE` | Vue3 → Vue2 | Route navigation command |
| `STATE_SYNC` | Bidirectional | State synchronization |
| `EVENT` | Bidirectional | Generic events |

### Extending Events

Use `EVENT` type to pass custom events:

```typescript
// Vue2 send
bridge.emit('ROUTE_CHANGE', { path: '/dashboard' })

// Vue3 receive
bridge.on('EVENT', (message) => {
  if (message.name === 'ROUTE_CHANGE') {
    // Handle route change
  }
})
```

---

## Step 6: Validation Checklist

### Feature Validation

- [ ] Vue3 iframe URL correctly includes token
- [ ] Vue2 can parse URL token and login
- [ ] Vue3 receives AUTH_READY after Vue2 login
- [ ] Vue3 navigation buttons can control Vue2 routes
- [ ] Vue3 can receive notification when Vue2 route changes
- [ ] Vue2 hides navigation bar in iframe
- [ ] Vue2 shows navigation bar when accessed standalone
- [ ] Vue2 shows unauthenticated state when no token
- [ ] Vue3 native features can be accessed via navigation
- [ ] View switching between Legacy and Vue3 features works correctly
- [ ] Responsive design works on mobile/tablet
- [ ] Virtual controls work on touch devices (if applicable)

### Constraint Validation

- [ ] Vue2 login flow not modified
- [ ] URL token mechanism preserved
- [ ] Vue2 still single source of truth for login status

---

## Common Issues

### Q: vue-demi conflict?

Specify vue-demi version in `vite.config.ts`:

```typescript
resolve: {
  alias: {
    'vue-demi': resolve(rootDir, 'node_modules/vue-demi/lib/v3/index.mjs')
  }
}
```

### Q: Port already in use?

```bash
# Windows
netstat -ano | findstr :5173
taskkill /F /PID <PID>

# macOS/Linux
lsof -i :5173
kill -9 <PID>
```

### Q: TypeScript compilation errors?

Ensure `tsconfig.json` includes:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  }
}
```

---

## Code Examples

Complete examples can be found in:

- Vue2 entry: `packages/vue2-legacy/src/main.ts`
- Vue3 container: `packages/vue3-host/src/components/LegacyContainer.vue`
- Vue3 content area: `packages/vue3-host/src/components/ContentArea.vue`
- Vue3 native feature: `packages/vue3-host/src/components/SpaceInvaders.vue`
- Bridge API: `packages/shared-bridge/README.md`

---

**Language:** [English](./INTEGRATION_GUIDE.en.md) | [中文版](./INTEGRATION_GUIDE.zh.md)
