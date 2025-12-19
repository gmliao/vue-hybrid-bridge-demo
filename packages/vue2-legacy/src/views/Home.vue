<template>
  <div class="home">
    <div class="hero-card">
      <h1>🏠 首頁</h1>
      <p class="subtitle">歡迎來到 Vue2 Legacy App（TypeScript + Class Style）</p>
      
      <div class="info-section">
        <h2>登入狀態</h2>
        <div class="status-card" :class="{ authenticated: isAuthenticated }">
          <div class="status-icon">
            {{ isAuthenticated ? '✅' : '❌' }}
          </div>
          <div class="status-info">
            <template v-if="isAuthenticated">
              <p class="status-title">已登入</p>
              <p class="status-detail">使用者：{{ user?.name }}</p>
              <p class="status-detail">Email：{{ user?.email }}</p>
            </template>
            <template v-else>
              <p class="status-title">未登入</p>
              <p class="status-detail">URL 中未包含 token</p>
            </template>
          </div>
        </div>
      </div>

      <div class="info-section">
        <h2>技術說明</h2>
        <ul class="feature-list">
          <li>
            <span class="feature-icon">🔗</span>
            <span>透過 URL Query Token 進行登入驗證</span>
          </li>
          <li>
            <span class="feature-icon">📨</span>
            <span>使用 postMessage 與 Vue3 Host 通訊</span>
          </li>
          <li>
            <span class="feature-icon">🗂️</span>
            <span>Vuex + TypeScript 管理應用程式狀態</span>
          </li>
          <li>
            <span class="feature-icon">🎨</span>
            <span>vue-class-component 類別風格組件</span>
          </li>
          <li>
            <span class="feature-icon">🧭</span>
            <span>支援來自 Host 的路由導航</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { namespace } from 'vuex-class'
import type { User } from '@/store'

const authModule = namespace('auth')

@Component
export default class Home extends Vue {
  @authModule.Getter('isAuthenticated')
  isAuthenticated!: boolean

  @authModule.Getter('user')
  user!: User | null
}
</script>

<style scoped>
.home {
  display: flex;
  justify-content: center;
  padding: 2rem;
}

.hero-card {
  background: white;
  border-radius: 16px;
  padding: 2.5rem;
  max-width: 600px;
  width: 100%;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
}

.hero-card h1 {
  font-size: 2rem;
  color: #333;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: #666;
  font-size: 1.1rem;
  margin-bottom: 2rem;
}

.info-section {
  margin-top: 2rem;
}

.info-section h2 {
  font-size: 1.1rem;
  color: #333;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #667eea;
}

.status-card {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1.25rem;
  background: #f8f9fa;
  border-radius: 12px;
  border-left: 4px solid #dc3545;
}

.status-card.authenticated {
  border-left-color: #28a745;
}

.status-icon {
  font-size: 2rem;
}

.status-info {
  flex: 1;
}

.status-title {
  font-weight: 600;
  font-size: 1.1rem;
  color: #333;
  margin-bottom: 0.25rem;
}

.status-detail {
  color: #666;
  font-size: 0.9rem;
  margin-top: 0.25rem;
}

.feature-list {
  list-style: none;
  padding: 0;
}

.feature-list li {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid #eee;
}

.feature-list li:last-child {
  border-bottom: none;
}

.feature-icon {
  font-size: 1.25rem;
}
</style>
