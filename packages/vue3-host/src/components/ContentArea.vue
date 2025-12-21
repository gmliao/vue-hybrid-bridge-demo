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

// Ensure isLegacyReady is always boolean
const isLegacyReady = computed(() => {
  const ready = Boolean(authStore.isLegacyReady)
  console.log('[Vue3] ContentArea isLegacyReady computed:', ready, 'raw value:', authStore.isLegacyReady)
  return ready
})

// Build iframe URL with login_ticket (computed once per load)
const legacyUrl = computed(() => {
  const isDev = import.meta.env.DEV
  const baseUrl = isDev 
    ? 'http://localhost:8080'
    : (import.meta.env.BASE_URL + 'legacy')
  const loginTicket = authStore.getLoginTicket()
  const lang = locale.value
  return `${baseUrl}/?login_ticket=${loginTicket}&lang=${lang}`
})

function onIframeLoad() {
  console.log('[Vue3] Iframe loaded, iframeRef:', iframeRef.value?.iframeRef, 'hasIframeLoaded:', hasIframeLoaded.value)
  if (iframeRef.value?.iframeRef && !hasIframeLoaded.value) {
    console.log('[Vue3] Calling connect...')
    connect(iframeRef.value.iframeRef)
    hasIframeLoaded.value = true
  } else {
    console.warn('[Vue3] Cannot connect: iframeRef missing or already connected')
  }
}

// Watch view switch to pause/resume 3D rendering
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
      :is-ready="isLegacyReady"
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

/* Disable interactions when hidden */
.content-wrapper > *[style*="display: none"] {
  pointer-events: none;
  visibility: hidden;
}
</style>
