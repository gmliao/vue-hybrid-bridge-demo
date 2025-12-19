<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'

interface Props {
  currentView: 'legacy' | 'earth3d'
  currentLegacyRoute: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  navigate: [routePath: string, type: 'legacy' | 'vue3']
  toggleLanguage: []
}>()

const { t, locale } = useI18n()
const authStore = useAuthStore()

// 導航按鈕（包含 Vue2 Legacy 路由和 Vue3 新功能）
const legacyRoutes = computed(() => [
  { path: '/', label: t('nav.home'), icon: '🏠', type: 'legacy' as const },
  { path: '/dashboard', label: t('nav.dashboard'), icon: '📊', type: 'legacy' as const },
  { path: '/settings', label: t('nav.settings'), icon: '⚙️', type: 'legacy' as const }
])

const vue3Features = computed(() => [
  { path: '/space-invaders', label: t('nav.earth3d'), icon: '🎮', type: 'vue3' as const }
])

function handleNavigate(routePath: string, type: 'legacy' | 'vue3') {
  emit('navigate', routePath, type)
}

function isActiveRoute(path: string): boolean {
  if (props.currentView !== 'legacy') return false
  return props.currentLegacyRoute === path
}
</script>

<template>
  <nav class="nav-bar">
    <div class="nav-brand">
      <span class="brand-icon">🚀</span>
      <span class="brand-text">{{ $t('nav.brand') }}</span>
      <span class="brand-badge">{{ $t('nav.control') }}</span>
    </div>
    <div class="nav-links">
      <button
        v-for="route in legacyRoutes"
        :key="route.path"
        class="nav-btn"
        :class="{ active: currentView === 'legacy' && isActiveRoute(route.path) }"
        @click="handleNavigate(route.path, 'legacy')"
      >
        <span class="nav-icon">{{ route.icon }}</span>
        {{ route.label }}
      </button>
      <div class="nav-divider"></div>
      <button
        v-for="feature in vue3Features"
        :key="feature.path"
        class="nav-btn vue3-feature"
        :class="{ active: currentView === 'earth3d' }"
        @click="handleNavigate(feature.path, 'vue3')"
      >
        <span class="nav-icon">{{ feature.icon }}</span>
        {{ feature.label }}
      </button>
    </div>
    <div class="nav-status">
      <button class="lang-switch" @click="$emit('toggleLanguage')">
        {{ locale === 'zh' ? 'EN' : '中文' }}
      </button>
      <span class="status-badge" :class="{ connected: authStore.isLegacyReady }">
        {{ authStore.isLegacyReady ? $t('nav.legacyConnected') : $t('nav.legacyConnecting') }}
      </span>
    </div>
  </nav>
</template>

<style scoped>
.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 2rem;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  position: relative;
  z-index: 10;
  flex-shrink: 0;
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
  align-items: center;
  gap: 0.75rem;
}

.nav-divider {
  width: 1px;
  height: 24px;
  background: rgba(0, 0, 0, 0.1);
  margin: 0 0.25rem;
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

.nav-btn.vue3-feature {
  /* 使用與其他按鈕相同的樣式 */
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

/* RWD: 平板 */
@media (max-width: 1024px) {
  .nav-bar {
    padding: 0.75rem 1.5rem;
  }
  
  .brand-text {
    font-size: 1.1rem;
  }
  
  .nav-btn {
    padding: 0.4rem 0.8rem;
    font-size: 0.85rem;
  }
  
  .nav-icon {
    font-size: 0.9rem;
  }
}

/* RWD: 手機 */
@media (max-width: 768px) {
  .nav-bar {
    padding: 0.75rem 1rem;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  
  .nav-brand {
    order: 1;
    flex: 1;
    min-width: 0;
  }
  
  .brand-text {
    font-size: 1rem;
    display: none; /* 隱藏文字，只顯示圖標和徽章 */
  }
  
  .brand-badge {
    font-size: 0.65rem;
    padding: 0.15rem 0.4rem;
  }
  
  .nav-links {
    order: 3;
    width: 100%;
    justify-content: center;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 0.5rem;
  }
  
  .nav-btn {
    padding: 0.4rem 0.7rem;
    font-size: 0.8rem;
    flex: 1;
    min-width: 0;
    justify-content: center;
  }
  
  .nav-btn span:not(.nav-icon) {
    display: none; /* 只顯示圖標 */
  }
  
  .nav-divider {
    display: none;
  }
  
  .nav-status {
    order: 2;
    gap: 0.5rem;
  }
  
  .status-badge {
    font-size: 0.7rem;
    padding: 0.2rem 0.5rem;
    white-space: nowrap;
  }
}

/* RWD: 小手機 */
@media (max-width: 480px) {
  .nav-bar {
    padding: 0.5rem 0.75rem;
  }
  
  .brand-icon {
    font-size: 1.2rem;
  }
  
  .nav-links {
    gap: 0.25rem;
  }
  
  .nav-btn {
    padding: 0.35rem 0.5rem;
    font-size: 0.75rem;
  }
  
  .lang-switch {
    padding: 0.2rem 0.5rem;
    font-size: 0.7rem;
  }
  
  .status-badge {
    font-size: 0.65rem;
    padding: 0.15rem 0.4rem;
  }
}
</style>

