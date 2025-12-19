<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { useBridge } from '@/composables/useBridge'
import Vue2Iframe from './Vue2Iframe.vue'
import SpaceInvaders from './SpaceInvaders.vue'

interface Props {
  view: 'legacy' | 'earth3d'
}

const props = defineProps<Props>()

const { locale } = useI18n()
const authStore = useAuthStore()
const { connect } = useBridge()

const iframeRef = ref<InstanceType<typeof Vue2Iframe> | null>(null)
const spaceInvadersRef = ref<InstanceType<typeof SpaceInvaders> | null>(null)
const hasIframeLoaded = ref(false)

// 動態產生 iframe URL，包含 token（只在首次載入時計算）
const legacyUrl = computed(() => {
  const isDev = import.meta.env.DEV
  const baseUrl = isDev 
    ? 'http://localhost:8080'
    : (import.meta.env.BASE_URL + 'legacy')
  const token = authStore.getToken()
  const lang = locale.value
  return `${baseUrl}/?token=${token}&lang=${lang}`
})

function onIframeLoad() {
  if (iframeRef.value?.iframeRef && !hasIframeLoaded.value) {
    connect(iframeRef.value.iframeRef)
    hasIframeLoaded.value = true
  }
}

// 監聽視圖切換，暫停/恢復 3D 渲染
watch(() => props.view, (newView) => {
  if (spaceInvadersRef.value && 'pause' in spaceInvadersRef.value && 'resume' in spaceInvadersRef.value) {
    if (newView === 'earth3d') {
      (spaceInvadersRef.value as any).resume()
    } else {
      (spaceInvadersRef.value as any).pause()
    }
  }
})
</script>

<template>
  <div class="content-wrapper">
    <!-- Vue2 Legacy iframe -->
    <Vue2Iframe
      v-show="view === 'legacy'"
      ref="iframeRef"
      :src="legacyUrl"
      :is-ready="authStore.isLegacyReady"
      @load="onIframeLoad"
    />
    
    <!-- Vue3 Space Invaders -->
    <SpaceInvaders 
      ref="spaceInvadersRef"
      v-show="view === 'earth3d'" 
    />
  </div>
</template>

<style scoped>
.content-wrapper {
  flex: 1;
  position: relative;
  min-height: 0;
  overflow: hidden;
  z-index: 1;
}

.content-wrapper > * {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

/* 隱藏時禁用交互 */
.content-wrapper > *[style*="display: none"] {
  pointer-events: none;
  visibility: hidden;
}
</style>

