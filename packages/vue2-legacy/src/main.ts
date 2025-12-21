import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import i18n from './i18n'
import { GuestBridge } from '@vue-hybrid-bridge/shared-bridge'

Vue.config.productionTip = false

const defaultHostOrigin = process.env.NODE_ENV !== 'production'
  ? 'http://localhost:5173'
  : window.location.origin
const hostOrigin = process.env.VUE_APP_HOST_ORIGIN || defaultHostOrigin
const allowedOriginsEnv = process.env.VUE_APP_BRIDGE_ALLOWED_ORIGINS
const allowedOrigins = allowedOriginsEnv
  ? allowedOriginsEnv.split(',').map((origin: string) => origin.trim()).filter(Boolean)
  : [hostOrigin]

// Create Bridge instance
const bridge = new GuestBridge({
  debug: true,
  targetOrigin: hostOrigin,
  allowedOrigins
})

// Attach to Vue prototype for global access
Vue.prototype.$bridge = bridge

// Parse URL query login_ticket (login exchange credential)
function parseLoginTicket(): string | null {
  const urlParams = new URLSearchParams(window.location.search)
  return urlParams.get('login_ticket')
}

// Parse URL query lang
function parseQueryLang(): string {
  const urlParams = new URLSearchParams(window.location.search)
  const lang = urlParams.get('lang')
  return lang === 'zh' ? 'zh' : 'en' // Default to English
}

// Simulate login exchange (real app should call API)
async function exchangeLoginTicket(loginTicket: string): Promise<{
  id: number
  name: string
  email: string
  apiToken: string
}> {
  console.log('[Vue2] Exchanging login ticket:', loginTicket)
  
  // Simulate API latency
  await new Promise(resolve => setTimeout(resolve, 500))
  
  // Simulate user payload
  const user = {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    apiToken: `api-token-from-${loginTicket}`
  }
  
  return user
}

// Initialize app
async function initApp(): Promise<void> {
  // Connect bridge
  bridge.connect()
  
  // Listen for navigation from Vue3 Host
  bridge.on('NAVIGATE', (message) => {
    console.log('[Vue2] Navigate to:', message.route)
    router.push(message.route).catch((err: Error) => {
      if (err.name !== 'NavigationDuplicated') {
        console.error('[Vue2] Navigation error:', err)
      }
    })
  })

  // Listen for state sync
  bridge.on('STATE_SYNC', (message) => {
    console.log('[Vue2] State sync:', message.key, message.value)
    if (message.key === 'locale') {
      i18n.locale = message.value as string
      localStorage.setItem('locale', message.value as string)
    }
  })

  // Listen for events
  bridge.on('EVENT', (message) => {
    console.log('[Vue2] Event received:', message.name, message.payload)
  })

  // Parse URL login_ticket and attempt login
  const loginTicket = parseLoginTicket()
  
  if (loginTicket) {
    try {
      const user = await exchangeLoginTicket(loginTicket)
      
      // Store in Vuex
      store.commit('auth/setUser', user)
      store.commit('auth/setAuthenticated', true)
      
      // Notify Vue3 Host auth ready
      bridge.authReady(user)
      
      console.log('[Vue2] Login successful:', user)
    } catch (error) {
      console.error('[Vue2] Login failed:', error)
      store.commit('auth/setAuthenticated', false)
    }
  } else {
    console.log('[Vue2] No login_ticket provided, staying as guest')
  }
  
  // Notify Vue3 Host app is ready
  bridge.ready()
  
  // Set language
  const lang = parseQueryLang()
  i18n.locale = lang
  localStorage.setItem('locale', lang)

  // Create Vue instance
  new Vue({
    router,
    store,
    i18n,
    render: h => h(App)
  }).$mount('#app')

  // Notify Vue3 Host on route change
  router.afterEach((to) => {
    bridge.emit('ROUTE_CHANGE', {
      path: to.path,
      name: to.name
    })
  })

  // Notify initial route
  bridge.emit('ROUTE_CHANGE', {
    path: router.currentRoute.path,
    name: router.currentRoute.name
  })
}

// Start app
initApp()
