import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import i18n from './i18n'
import router from './router'

import './styles/main.css'

// Handle login_ticket at startup (read from URL query)
// Security best practice: clear URL params after reading
function handleSSOTicket(): void {
  const urlParams = new URLSearchParams(window.location.search)
  const ticket = urlParams.get('login_ticket')
  
  if (ticket) {
    // Store ticket in sessionStorage
    sessionStorage.setItem('login_ticket', ticket)
    
    // Clear URL params (security best practice)
    const newUrl = new URL(window.location.href)
    newUrl.searchParams.delete('login_ticket')
    if (!newUrl.searchParams.toString()) {
      newUrl.search = ''
    }
    window.history.replaceState({}, '', newUrl.toString())
  }
}

// Process login ticket before app boot
handleSSOTicket()

const app = createApp(App)

const pinia = createPinia()
// @ts-expect-error - Pinia instance is compatible with Vue Plugin at runtime
app.use(pinia)
app.use(i18n)
app.use(router)

app.mount('#app')
