<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { useBridge } from '@/composables/useBridge'

const { t, locale } = useI18n()
const authStore = useAuthStore()
const { connect, disconnect, navigate, syncState } = useBridge()

const iframeRef = ref<HTMLIFrameElement | null>(null)

// 動態產生 iframe URL，包含 token
const legacyUrl = computed(() => {
  // 開發環境使用 localhost，生產環境使用相對路徑
  const isDev = import.meta.env.DEV
  const baseUrl = isDev 
    ? 'http://localhost:8080'
    : (import.meta.env.BASE_URL + 'legacy')
  const token = authStore.getToken()
  const lang = locale.value
  return `${baseUrl}/?token=${token}&lang=${lang}`
})

// 導航按鈕
const routes = computed(() => [
  { path: '/', label: t('nav.home'), icon: '🏠' },
  { path: '/dashboard', label: t('nav.dashboard'), icon: '📊' },
  { path: '/settings', label: t('nav.settings'), icon: '⚙️' }
])

function handleNavigate(route: string) {
  navigate(route)
}

function isActiveRoute(path: string): boolean {
  return authStore.currentLegacyRoute === path
}

function toggleLanguage() {
  const newLocale = locale.value === 'zh' ? 'en' : 'zh'
  locale.value = newLocale
  localStorage.setItem('locale', newLocale)
  // 通知 Vue2 語言變更
  if (authStore.isLegacyReady) {
    syncState('locale', newLocale)
  }
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
        <span class="brand-text">{{ $t('nav.brand') }}</span>
        <span class="brand-badge">{{ $t('nav.control') }}</span>
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
        <button class="lang-switch" @click="toggleLanguage">
          {{ locale === 'zh' ? 'EN' : '中文' }}
        </button>
        <span class="status-badge" :class="{ connected: authStore.isLegacyReady }">
          {{ authStore.isLegacyReady ? $t('nav.legacyConnected') : $t('nav.legacyConnecting') }}
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
        <p>{{ $t('common.loading') }}</p>
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
  gap: 0.75rem;
}

.lang-switch {
  padding: 0.25rem 0.75rem;
  background: rgba(102, 126, 234, 0.1);
  border: 1px solid rgba(102, 126, 234, 0.3);
  border-radius: 4px;
  color: #667eea;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.lang-switch:hover {
  background: rgba(102, 126, 234, 0.2);
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

