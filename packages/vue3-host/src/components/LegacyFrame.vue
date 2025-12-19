<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useBridge } from '@/composables/useBridge'

const authStore = useAuthStore()
const { connect, disconnect, navigate } = useBridge()

const iframeRef = ref<HTMLIFrameElement | null>(null)

// 動態產生 iframe URL，包含 token
const legacyUrl = computed(() => {
  const baseUrl = 'http://localhost:8080'
  const token = authStore.getToken()
  return `${baseUrl}/?token=${token}`
})

// 導航按鈕
const routes = [
  { path: '/', label: '首頁', icon: '🏠' },
  { path: '/dashboard', label: '儀表板', icon: '📊' },
  { path: '/settings', label: '設定', icon: '⚙️' }
]

function handleNavigate(route: string) {
  navigate(route)
}

function isActiveRoute(path: string): boolean {
  return authStore.currentLegacyRoute === path
}

function onIframeLoad() {
  if (iframeRef.value) {
    connect(iframeRef.value)
  }
}

onUnmounted(() => {
  disconnect()
})
</script>

<template>
  <div class="legacy-frame-container">
    <nav class="nav-bar">
      <div class="nav-brand">
        <span class="brand-icon">🚀</span>
        <span class="brand-text">Vue3 Host</span>
        <span class="brand-badge">控制中</span>
      </div>
      <div class="nav-links">
        <button
          v-for="route in routes"
          :key="route.path"
          class="nav-btn"
          :class="{ active: isActiveRoute(route.path) }"
          @click="handleNavigate(route.path)"
        >
          <span class="nav-icon">{{ route.icon }}</span>
          {{ route.label }}
        </button>
      </div>
      <div class="nav-status">
        <span class="status-badge" :class="{ connected: authStore.isLegacyReady }">
          {{ authStore.isLegacyReady ? '✓ Legacy 已連接' : '連接中...' }}
        </span>
      </div>
    </nav>
    
    <div class="iframe-wrapper">
      <iframe
        ref="iframeRef"
        :src="legacyUrl"
        @load="onIframeLoad"
        title="Vue2 Legacy App"
      ></iframe>
      
      <div class="iframe-overlay" v-if="!authStore.isLegacyReady">
        <div class="loading-spinner"></div>
        <p>正在載入 Legacy App...</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.legacy-frame-container {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

/* 模擬 Vue2 導航列樣式 */
.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 2rem;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.brand-icon {
  font-size: 1.5rem;
}

.brand-text {
  font-size: 1.25rem;
  font-weight: 700;
  color: #333;
}

.brand-badge {
  font-size: 0.7rem;
  font-weight: 600;
  padding: 0.2rem 0.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.nav-links {
  display: flex;
  gap: 0.75rem;
}

.nav-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: #666;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.nav-btn:hover {
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
}

.nav-btn.active {
  background: #667eea;
  color: white;
}

.nav-icon {
  font-size: 1rem;
}

.nav-status {
  display: flex;
  align-items: center;
}

.status-badge {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  background: #fff3cd;
  color: #856404;
}

.status-badge.connected {
  background: #d4edda;
  color: #155724;
}

.iframe-wrapper {
  flex: 1;
  position: relative;
  min-height: 0;
  overflow: hidden;
  background: #ffffff;
}

.iframe-wrapper iframe {
  width: 100%;
  height: 100%;
  border: none;
}

.iframe-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  color: rgba(255, 255, 255, 0.9);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>

