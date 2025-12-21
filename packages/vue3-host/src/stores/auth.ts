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
   * 模擬取得登入交換憑證（login_ticket）
   * 實際應用中應從既有系統取得
   */
  function getLoginTicket(): string {
    // Demo 用途：使用固定的模擬 login_ticket
    return 'demo-login-ticket-12345'
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
