import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '@vue-hybrid-bridge/shared-bridge'

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null)
  const isLegacyReady = ref(false)
  const currentLegacyRoute = ref('/')

  // Getters
  const isAuthenticated = computed(() => user.value !== null)
  const userName = computed(() => user.value?.name ?? '')

  // Actions
  function setUser(newUser: User) {
    user.value = newUser
  }

  function clearUser() {
    user.value = null
  }

  function setLegacyReady(ready: boolean) {
    isLegacyReady.value = ready
  }

  function setLegacyRoute(route: string) {
    currentLegacyRoute.value = route
  }

  /**
   * Get login exchange credential (login_ticket)
   * Priority:
   * 1. sessionStorage login_ticket (stored by main.ts from URL)
   * 2. dev mode: fixed mock login_ticket
   * 3. prod mode: empty string (use other source)
   *
   * Note: URL params are handled and cleared in main.ts
   */
  function getLoginTicket(): string {
    // 1. Read from sessionStorage (stored by main.ts)
    const storedTicket = sessionStorage.getItem('login_ticket')
    if (storedTicket) {
      return storedTicket
    }
    
    // 2. Dev mode: mock ticket
    if (import.meta.env.DEV) {
      return 'demo-login-ticket-12345'
    }
    
    // 3. Prod mode: empty string (use API/env/etc.)
    return ''
  }

  return {
    // State
    user,
    isLegacyReady,
    currentLegacyRoute,
    // Getters
    isAuthenticated,
    userName,
    // Actions
    setUser,
    clearUser,
    setLegacyReady,
    setLegacyRoute,
    getLoginTicket
  }
})
