import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import i18n from './i18n'
import { GuestBridge } from '@vue-hybrid-bridge/shared-bridge'

Vue.config.productionTip = false

// 建立 Bridge 實例
const bridge = new GuestBridge({ debug: true })

// 掛載到 Vue 原型，方便全域使用
Vue.prototype.$bridge = bridge

// 解析 URL query token
function parseQueryToken(): string | null {
  const urlParams = new URLSearchParams(window.location.search)
  return urlParams.get('token')
}

// 解析 URL query lang
function parseQueryLang(): string {
  const urlParams = new URLSearchParams(window.location.search)
  const lang = urlParams.get('lang')
  return lang === 'zh' ? 'zh' : 'en' // 預設英文
}

// 模擬登入（實際應用中應呼叫 API）
async function loginWithToken(token: string): Promise<{
  id: number
  name: string
  email: string
  token: string
}> {
  console.log('[Vue2] Logging in with token:', token)
  
  // 模擬 API 呼叫延遲
  await new Promise(resolve => setTimeout(resolve, 500))
  
  // 模擬取得使用者資料
  const user = {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    token: token
  }
  
  return user
}

// 初始化應用程式
async function initApp(): Promise<void> {
  // 連接 Bridge
  bridge.connect()
  
  // 監聽來自 Vue3 Host 的導航訊息
  bridge.on('NAVIGATE', (message) => {
    console.log('[Vue2] Navigate to:', message.route)
    router.push(message.route).catch((err: Error) => {
      if (err.name !== 'NavigationDuplicated') {
        console.error('[Vue2] Navigation error:', err)
      }
    })
  })

  // 監聽狀態同步
  bridge.on('STATE_SYNC', (message) => {
    console.log('[Vue2] State sync:', message.key, message.value)
    if (message.key === 'locale') {
      i18n.locale = message.value as string
      localStorage.setItem('locale', message.value as string)
    }
  })

  // 監聽事件
  bridge.on('EVENT', (message) => {
    console.log('[Vue2] Event received:', message.name, message.payload)
  })

  // 解析 URL token 並嘗試登入
  const token = parseQueryToken()
  
  if (token) {
    try {
      const user = await loginWithToken(token)
      
      // 儲存到 Vuex
      store.commit('auth/setUser', user)
      store.commit('auth/setAuthenticated', true)
      
      // 通知 Vue3 Host 登入完成
      bridge.authReady(user)
      
      console.log('[Vue2] Login successful:', user)
    } catch (error) {
      console.error('[Vue2] Login failed:', error)
      store.commit('auth/setAuthenticated', false)
    }
  } else {
    console.log('[Vue2] No token provided, staying as guest')
  }
  
  // 通知 Vue3 Host 應用程式已準備就緒
  bridge.ready()
  
  // 設定語言
  const lang = parseQueryLang()
  i18n.locale = lang
  localStorage.setItem('locale', lang)

  // 建立 Vue 實例
  new Vue({
    router,
    store,
    i18n,
    render: h => h(App)
  }).$mount('#app')

  // 監聽路由變化，通知 Vue3 Host 當前路由
  router.afterEach((to) => {
    bridge.emit('ROUTE_CHANGE', {
      path: to.path,
      name: to.name
    })
  })

  // 初始路由也通知一次
  bridge.emit('ROUTE_CHANGE', {
    path: router.currentRoute.path,
    name: router.currentRoute.name
  })
}

// 啟動應用程式
initApp()

