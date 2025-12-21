<template>
  <div class="settings">
    <div class="settings-card">
      <h1>⚙️ {{ $t('settings.title') }}</h1>
      <p class="subtitle">{{ $t('settings.subtitle') }}</p>

      <div class="settings-section">
        <h2>{{ $t('settings.general') }}</h2>
        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-label">{{ $t('settings.darkMode') }}</span>
            <span class="setting-desc">{{ $t('settings.darkModeDesc') }}</span>
          </div>
          <label class="toggle">
            <input type="checkbox" v-model="darkMode">
            <span class="toggle-slider"></span>
          </label>
        </div>
        <div class="setting-item">
          <div class="setting-info">
            <span class="setting-label">{{ $t('settings.notifications') }}</span>
            <span class="setting-desc">{{ $t('settings.notificationsDesc') }}</span>
          </div>
          <label class="toggle">
            <input type="checkbox" v-model="notifications">
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>

      <div class="settings-section">
        <h2>{{ $t('settings.accountInfo') }}</h2>
        <div v-if="isAuthenticated" class="account-info">
          <div class="info-row">
            <span class="info-label">{{ $t('settings.username') }}</span>
            <span class="info-value">{{ user?.name }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">{{ $t('settings.email') }}</span>
            <span class="info-value">{{ user?.email }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">{{ $t('settings.apiToken') }}</span>
            <span class="info-value token">{{ user?.apiToken }}</span>
          </div>
        </div>
        <div v-else class="no-auth">
          <p>⚠️ {{ $t('settings.noAuth') }}</p>
        </div>
      </div>

      <div class="settings-section">
        <h2>{{ $t('settings.bridgeTest') }}</h2>
        <p class="section-desc">{{ $t('settings.bridgeTestDesc') }}</p>
        <div class="button-group">
          <button class="btn btn-primary" @click="sendTestEvent">
            📤 {{ $t('settings.sendTestEvent') }}
          </button>
          <button class="btn btn-secondary" @click="syncTestState">
            🔄 {{ $t('settings.syncTestState') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { namespace } from 'vuex-class'
import type { User } from '@/store'
import type { GuestBridge } from '@vue-hybrid-bridge/shared-bridge'

// 擴展 Vue 原型的型別定義
declare module 'vue/types/vue' {
  interface Vue {
    $bridge: GuestBridge
  }
}

const authModule = namespace('auth')

@Component
export default class Settings extends Vue {
  @authModule.Getter('isAuthenticated')
  isAuthenticated!: boolean

  @authModule.Getter('user')
  user!: User | null

  darkMode = false
  notifications = true

  sendTestEvent(): void {
    this.$bridge.emit('test-event', {
      message: 'Hello from Vue2 (TypeScript)!',
      timestamp: new Date().toISOString()
    })
    alert(this.$t('settings.testEventSent'))
  }

  syncTestState(): void {
    this.$bridge.syncState('settings', {
      darkMode: this.darkMode,
      notifications: this.notifications
    })
    alert(this.$t('settings.testStateSynced'))
  }
}
</script>

<style scoped>
.settings {
  display: flex;
  justify-content: center;
  padding: 2rem;
}

.settings-card {
  background: white;
  border-radius: 16px;
  padding: 2.5rem;
  max-width: 600px;
  width: 100%;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
}

.settings-card h1 {
  font-size: 2rem;
  color: #333;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: #666;
  font-size: 1.1rem;
  margin-bottom: 2rem;
}

.settings-section {
  margin-top: 2rem;
}

.settings-section h2 {
  font-size: 1.1rem;
  color: #333;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #667eea;
}

.section-desc {
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 1rem;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 0;
  border-bottom: 1px solid #eee;
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.setting-label {
  font-weight: 500;
  color: #333;
}

.setting-desc {
  font-size: 0.85rem;
  color: #999;
}

.toggle {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 26px;
}

.toggle input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: 0.3s;
  border-radius: 26px;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 20px;
  width: 20px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.3s;
  border-radius: 50%;
}

.toggle input:checked + .toggle-slider {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.toggle input:checked + .toggle-slider:before {
  transform: translateX(24px);
}

.account-info {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 1rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem 0;
  border-bottom: 1px solid #eee;
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  font-weight: 500;
  color: #666;
}

.info-value {
  color: #333;
}

.info-value.token {
  font-family: monospace;
  font-size: 0.85rem;
  background: #e9ecef;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

.no-auth {
  background: #fff3cd;
  border-radius: 12px;
  padding: 1.5rem;
  text-align: center;
  color: #856404;
}

.button-group {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.btn {
  padding: 0.75rem 1.25rem;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-secondary {
  background: #e9ecef;
  color: #333;
}

.btn-secondary:hover {
  background: #dee2e6;
}
</style>
