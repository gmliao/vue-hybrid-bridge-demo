<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
</script>

<template>
  <header class="app-header">
    <div class="header-content">
      <div class="logo">
        <span class="logo-icon">◆</span>
        <h1>Vue Hybrid Bridge</h1>
      </div>
      
      <div class="status-bar">
        <div class="status-item" :class="{ active: authStore.isLegacyReady }">
          <span class="status-dot"></span>
          <span>Legacy {{ authStore.isLegacyReady ? '已連接' : '連接中...' }}</span>
        </div>
        
        <div class="user-info" v-if="authStore.isAuthenticated">
          <div class="avatar">{{ authStore.userName.charAt(0).toUpperCase() }}</div>
          <span class="user-name">{{ authStore.userName }}</span>
        </div>
        <div class="user-info guest" v-else>
          <span>未登入</span>
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding: 0 2rem;
  height: 64px;
  display: flex;
  align-items: center;
}

.header-content {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.logo-icon {
  font-size: 1.5rem;
  color: #00d9ff;
  text-shadow: 0 0 10px rgba(0, 217, 255, 0.5);
}

.logo h1 {
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 1.25rem;
  font-weight: 600;
  color: #ffffff;
  margin: 0;
  letter-spacing: -0.02em;
}

.status-bar {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.6);
  transition: color 0.3s ease;
}

.status-item.active {
  color: #00ff88;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transition: background 0.3s ease, box-shadow 0.3s ease;
}

.status-item.active .status-dot {
  background: #00ff88;
  box-shadow: 0 0 8px rgba(0, 255, 136, 0.6);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.user-info.guest {
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.875rem;
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #00d9ff 0%, #00ff88 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.875rem;
  color: #1a1a2e;
}

.user-name {
  font-size: 0.875rem;
  color: #ffffff;
  font-weight: 500;
}
</style>

