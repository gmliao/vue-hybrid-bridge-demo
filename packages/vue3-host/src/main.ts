import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import i18n from './i18n'
import router from './router'

import './styles/main.css'

// Handle login_ticket at startup (read from URL query)
// Security best practice: clear URL params after reading
function handleSSOTicket(): boolean {
  const currentUrl = new URL(window.location.href)
  const searchParams = new URLSearchParams(currentUrl.search)
  const searchTicket = searchParams.get('login_ticket')
  let ticket = searchTicket
  let cleaned = false

  if (searchTicket) {
    cleaned = true
  } else if (currentUrl.hash.includes('?')) {
    const [, hashQuery] = currentUrl.hash.split('?')
    const hashParams = new URLSearchParams(hashQuery)
    const hashTicket = hashParams.get('login_ticket')

    if (hashTicket) {
      ticket = hashTicket
      cleaned = true
    }
  }
  
  if (ticket) {
    // Store ticket in sessionStorage
    sessionStorage.setItem('login_ticket', ticket)
    
    // Clear URL params via router once ready
    return cleaned
  }

  return false
}

// Process login ticket before app boot
const shouldClearQuery = handleSSOTicket()

const app = createApp(App)

const pinia = createPinia()
// @ts-expect-error - Pinia instance is compatible with Vue Plugin at runtime
app.use(pinia)
app.use(i18n)
app.use(router)

router.isReady().then(() => {
  if (shouldClearQuery) {
    router.replace({
      path: router.currentRoute.value.path,
      query: {},
      hash: router.currentRoute.value.hash
    }).catch(() => {})
  }
})

app.mount('#app')
