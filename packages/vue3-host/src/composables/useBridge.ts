import { ref } from 'vue'
import { HostBridge } from '@vue-hybrid-bridge/shared-bridge'
import { useAuthStore } from '@/stores/auth'

const defaultLegacyOrigin = import.meta.env.DEV ? 'http://localhost:8080' : window.location.origin
const legacyOrigin = (import.meta.env.VITE_LEGACY_ORIGIN as string | undefined) || defaultLegacyOrigin
const allowedOriginsEnv = (import.meta.env.VITE_BRIDGE_ALLOWED_ORIGINS as string | undefined)
const allowedOrigins = allowedOriginsEnv
  ? allowedOriginsEnv.split(',').map(origin => origin.trim()).filter(Boolean)
  : [legacyOrigin]
const bridge = new HostBridge({
  debug: true,
  targetOrigin: legacyOrigin,
  allowedOrigins
})

// Track listeners to avoid duplicate bindings
let handlersSetup = false

export function useBridge() {
  const authStore = useAuthStore()
  const iframeRef = ref<HTMLIFrameElement | null>(null)

  function connect(iframe: HTMLIFrameElement) {
    bridge.connect(iframe)
    
    // Bind listeners only on first connect
    if (!handlersSetup) {
      handlersSetup = true
      
      // Listen for READY
      bridge.on('READY', () => {
        console.log('[Vue3] Legacy app is ready')
        authStore.setLegacyReady(true)
      })

      // Listen for AUTH_READY
      bridge.on('AUTH_READY', (message) => {
        console.log('[Vue3] Legacy auth ready:', message.user)
        authStore.setUser(message.user)
      })

      // Listen for STATE_SYNC
      bridge.on('STATE_SYNC', (message) => {
        console.log('[Vue3] State sync:', message.key, message.value)
      })

      // Listen for EVENT
      bridge.on('EVENT', (message) => {
        console.log('[Vue3] Event received:', message.name, message.payload)
        
        // Handle route change event
        if (message.name === 'ROUTE_CHANGE' && message.payload) {
          const payload = message.payload as { path: string; name: string }
          authStore.setLegacyRoute(payload.path)
        }
      })
    }
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
