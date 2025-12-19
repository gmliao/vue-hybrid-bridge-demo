import { ref, onMounted, onUnmounted } from 'vue'
import { HostBridge } from '@vue-hybrid-bridge/shared-bridge'
import { useAuthStore } from '@/stores/auth'

const bridge = new HostBridge({ debug: true })

export function useBridge() {
  const authStore = useAuthStore()
  const iframeRef = ref<HTMLIFrameElement | null>(null)

  function connect(iframe: HTMLIFrameElement) {
    bridge.connect(iframe)
    
    // 監聽 READY 訊息
    bridge.on('READY', () => {
      console.log('[Vue3] Legacy app is ready')
      authStore.setLegacyReady(true)
    })

    // 監聽 AUTH_READY 訊息
    bridge.on('AUTH_READY', (message) => {
      console.log('[Vue3] Legacy auth ready:', message.user)
      authStore.setUser(message.user)
    })

    // 監聯 STATE_SYNC 訊息
    bridge.on('STATE_SYNC', (message) => {
      console.log('[Vue3] State sync:', message.key, message.value)
    })

    // 監聽 EVENT 訊息
    bridge.on('EVENT', (message) => {
      console.log('[Vue3] Event received:', message.name, message.payload)
      
      // 處理路由變化事件
      if (message.name === 'ROUTE_CHANGE' && message.payload) {
        const payload = message.payload as { path: string; name: string }
        authStore.setLegacyRoute(payload.path)
      }
    })

  }

  function disconnect() {
    bridge.disconnect()
  }

  function navigate(route: string) {
    bridge.navigate(route)
  }

  function syncState(key: string, value: unknown) {
    bridge.syncState(key, value)
  }

  function emit(name: string, payload?: unknown) {
    bridge.emit(name, payload)
  }

  return {
    iframeRef,
    connect,
    disconnect,
    navigate,
    syncState,
    emit
  }
}

