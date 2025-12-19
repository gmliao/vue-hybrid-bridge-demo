<template>
  <div id="app" :class="{ 'in-iframe': isInIframe }">
    <!-- 只在非 iframe 模式下顯示導航列 -->
    <nav v-if="!isInIframe" class="legacy-nav">
      <div class="nav-brand">
        <span class="brand-icon">📦</span>
        <span class="brand-text">{{ $t('nav.brand') }}</span>
      </div>
      <div class="nav-links">
        <router-link to="/">{{ $t('nav.home') }}</router-link>
        <router-link to="/dashboard">{{ $t('nav.dashboard') }}</router-link>
        <router-link to="/settings">{{ $t('nav.settings') }}</router-link>
      </div>
      <div class="auth-status">
        <template v-if="isAuthenticated">
          <span class="status-badge success">{{ $t('nav.loggedIn') }}</span>
          <span class="user-name">{{ userName }}</span>
        </template>
        <template v-else>
          <span class="status-badge warning">{{ $t('nav.notLoggedIn') }}</span>
        </template>
      </div>
    </nav>
    <main class="legacy-main">
      <router-view />
    </main>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { namespace } from 'vuex-class'

const authModule = namespace('auth')

@Component
export default class App extends Vue {
  @authModule.Getter('isAuthenticated')
  isAuthenticated!: boolean

  @authModule.Getter('userName')
  userName!: string

  // 偵測是否在 iframe 中運行
  get isInIframe(): boolean {
    try {
      return window.self !== window.top
    } catch (e) {
      // 如果因為跨域無法存取 window.top，表示在 iframe 中
      return true
    }
  }
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

#app {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.legacy-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 2rem;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.brand-icon {
  font-size: 1.5rem;
}

.brand-text {
  font-size: 1.25rem;
  font-weight: 700;
  color: #333;
}

.nav-links {
  display: flex;
  gap: 1.5rem;
}

.nav-links a {
  text-decoration: none;
  color: #666;
  font-weight: 500;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.nav-links a:hover {
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
}

.nav-links a.router-link-exact-active {
  background: #667eea;
  color: white;
}

.auth-status {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-badge.success {
  background: #d4edda;
  color: #155724;
}

.status-badge.warning {
  background: #fff3cd;
  color: #856404;
}

.user-name {
  font-weight: 500;
  color: #333;
}

.legacy-main {
  padding: 2rem;
}

/* iframe 模式下填滿整個空間 */
#app.in-iframe {
  min-height: 100vh;
}

#app.in-iframe .legacy-main {
  min-height: 100vh;
}
</style>
