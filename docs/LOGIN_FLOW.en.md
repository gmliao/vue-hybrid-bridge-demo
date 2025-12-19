# Login Flow Documentation

## Core Principle

> **Vue2 login flow must maintain URL query token, cannot be changed.**

This is the most important constraint of this project. Any modifications must follow this principle.

---

## Flow Sequence Diagram

```mermaid
sequenceDiagram
    participant User as User
    participant Vue3 as Vue3 Host
    participant iframe as iframe
    participant Vue2 as Vue2 Legacy
    participant Vuex as Vuex Store
    participant Bridge as Message Bridge

    User->>Vue3: Access application
    Vue3->>Vue3: getToken()
    Note over Vue3: Get token from existing system<br/>(or use mock token)
    
    Vue3->>iframe: Set src="?token=XXX"
    iframe->>Vue2: Load page
    
    Vue2->>Vue2: parseQueryToken()
    Note over Vue2: Parse token from URL query
    
    alt token exists
        Vue2->>Vue2: loginWithToken(token)
        Note over Vue2: Call API to validate token<br/>(simulated in Demo)
        Vue2->>Vuex: commit('setUser', user)
        Vue2->>Vuex: commit('setAuthenticated', true)
        Vue2->>Bridge: authReady(user)
    else token doesn't exist
        Vue2->>Vue2: Maintain unauthenticated state
    end
    
    Vue2->>Bridge: ready()
    Bridge->>Vue3: onMessage(READY)
    Vue3->>Vue3: setLegacyReady(true)
    
    opt AUTH_READY
        Bridge->>Vue3: onMessage(AUTH_READY)
        Vue3->>Vue3: setUser(user)
        Vue3->>Vue3: Update navigation bar status
    end
```

---

## Code Reference

### Step 1: Vue3 Get Token

```typescript
// packages/vue3-host/src/stores/auth.ts
function getToken(): string {
  // Demo purpose: use fixed mock token
  // In real application, get from existing system
  return 'demo-token-12345'
}
```

### Step 2: Vue3 Load iframe (URL with token)

```typescript
// packages/vue3-host/src/components/LegacyFrame.vue
const legacyUrl = computed(() => {
  const baseUrl = 'http://localhost:8080'
  const token = authStore.getToken()
  return `${baseUrl}/?token=${token}`
})
```

```vue
<template>
  <iframe :src="legacyUrl" @load="onIframeLoad" />
</template>
```

### Step 3: Vue2 Parse URL Token

```typescript
// packages/vue2-legacy/src/main.ts
function parseQueryToken(): string | null {
  const urlParams = new URLSearchParams(window.location.search)
  return urlParams.get('token')
}
```

### Step 4: Vue2 Login and Report

```typescript
// packages/vue2-legacy/src/main.ts
const token = parseQueryToken()

if (token) {
  const user = await loginWithToken(token)
  
  // Write to Vuex
  store.commit('auth/setUser', user)
  store.commit('auth/setAuthenticated', true)
  
  // Report via Bridge
  bridge.authReady(user)
}

// Notify ready (regardless of login status)
bridge.ready()
```

### Step 5: Vue3 Receive Messages

```typescript
// packages/vue3-host/src/composables/useBridge.ts
bridge.on('READY', () => {
  authStore.setLegacyReady(true)
})

bridge.on('AUTH_READY', (message) => {
  authStore.setUser(message.user)
})
```

---

## State Responsibility Division

| Item | Owner | Description |
|------|-------|-------------|
| Token Source | Vue3 or existing system | Generate and pass token |
| Token Validation | Vue2 | Get from URL and validate |
| Login Status Determination | Vue2 | Single source of truth (SSOT) |
| User Information | Vue2 → Vue3 | Sync via AUTH_READY |
| UI Navigation Status | Vue3 | Display purpose |
| Route Control | Vue3 → Vue2 | NAVIGATE message |

---

## Error Handling

### Token Doesn't Exist

```typescript
// packages/vue2-legacy/src/main.ts
const token = parseQueryToken()

if (!token) {
  console.log('[Vue2] No token provided, staying as guest')
  // Maintain unauthenticated state, don't send AUTH_READY
  bridge.ready() // Still notify Vue3 that ready
}
```

### Login Failed

```typescript
try {
  const user = await loginWithToken(token)
  store.commit('auth/setUser', user)
  bridge.authReady(user)
} catch (error) {
  console.error('[Vue2] Login failed:', error)
  store.commit('auth/setAuthenticated', false)
  // Don't send AUTH_READY, Vue3 maintains unauthenticated state
}
```

---

## User Information Structure

```typescript
interface User {
  id: number
  name: string
  email: string
  token?: string
  [key: string]: unknown  // Can extend other fields
}
```

---

## Acceptance Criteria

| Criteria | Status |
|----------|--------|
| Vue3 iframe URL correctly includes token | ✅ |
| Vue2 successfully logs in following original flow | ✅ |
| Vue3 receives notification after Vue2 login completes | ✅ |
| Vue3 navigation bar displays user information | ✅ |
| No token → Vue2 shows unauthenticated state | ✅ |
| Vue2 original login core logic not modified | ✅ |

---

## Checklist

Before modifying any login-related code, confirm:

- [ ] Is URL token login flow maintained?
- [ ] Is Vue2 still responsible for login status determination?
- [ ] Is bridge only used for state reporting?
- [ ] Is Vue2 original login logic unmodified?
- [ ] Is error handling complete?

---

**Language:** [English](./LOGIN_FLOW.en.md) | [中文版](./LOGIN_FLOW.zh.md)

