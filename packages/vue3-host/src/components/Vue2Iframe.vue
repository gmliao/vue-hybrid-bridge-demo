<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  src: string
  isReady: boolean
}

defineProps<Props>()

const iframeRef = ref<HTMLIFrameElement | null>(null)

defineExpose({
  iframeRef
})
</script>

<template>
  <div class="iframe-wrapper">
    <iframe
      ref="iframeRef"
      :src="src"
      @load="$emit('load')"
      title="Vue2 Legacy App"
    ></iframe>
    
    <div class="iframe-overlay" v-if="!isReady">
      <div class="loading-spinner"></div>
      <p>{{ $t('common.loading') }}</p>
    </div>
  </div>
</template>

<style scoped>
.iframe-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  background: #ffffff;
  display: flex;
  flex-direction: column;
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

/* RWD: 移動設備優化 */
@media (max-width: 768px) {
  .iframe-wrapper iframe {
    -webkit-overflow-scrolling: touch;
  }
  
  .iframe-overlay {
    padding: 1rem;
  }
  
  .iframe-overlay p {
    font-size: 0.9rem;
    text-align: center;
  }
  
  .loading-spinner {
    width: 32px;
    height: 32px;
    border-width: 2px;
  }
}

@media (max-width: 480px) {
  .iframe-overlay {
    padding: 0.75rem;
  }
  
  .iframe-overlay p {
    font-size: 0.85rem;
  }
  
  .loading-spinner {
    width: 28px;
    height: 28px;
  }
}
</style>

