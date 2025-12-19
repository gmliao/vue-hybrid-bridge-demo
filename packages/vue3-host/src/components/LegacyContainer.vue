<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useBridge } from '@/composables/useBridge'
import NavigationBar from './NavigationBar.vue'
import ContentArea from './ContentArea.vue'

const { locale } = useI18n()
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const { navigate, syncState, disconnect } = useBridge()

// 當前顯示模式：'legacy' 或 'earth3d'
const currentView = ref<'legacy' | 'earth3d'>('legacy')

// 監聽路由變化，同步視圖狀態
watch(() => route.path, (path) => {
  if (path === '/earth') {
    currentView.value = 'earth3d'
  } else {
    currentView.value = 'legacy'
  }
}, { immediate: true })

function handleNavigate(routePath: string, type: 'legacy' | 'vue3') {
  if (type === 'legacy') {
    currentView.value = 'legacy'
    navigate(routePath)
  } else if (type === 'vue3') {
    currentView.value = 'earth3d'
    router.push(routePath).catch(() => {})
  }
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

onUnmounted(() => {
  disconnect()
})
</script>

<template>
  <div class="legacy-container">
    <NavigationBar
      :current-view="currentView"
      :current-legacy-route="typeof authStore.currentLegacyRoute === 'string' ? authStore.currentLegacyRoute : '/'"
      @navigate="handleNavigate"
      @toggle-language="toggleLanguage"
    />
    
    <ContentArea :view="currentView" />
  </div>
</template>

<style scoped>
.legacy-container {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
</style>

