<template>
  <div class="dashboard">
    <div class="dashboard-card">
      <h1>📊 儀表板</h1>
      <p class="subtitle">這是 Vue2 Legacy 的儀表板頁面</p>

      <div class="stats-grid">
        <div class="stat-card" v-for="stat in stats" :key="stat.label">
          <div class="stat-icon">{{ stat.icon }}</div>
          <div class="stat-info">
            <span class="stat-value">{{ stat.value }}</span>
            <span class="stat-label">{{ stat.label }}</span>
          </div>
        </div>
      </div>

      <div class="activity-section">
        <h2>最近活動</h2>
        <ul class="activity-list">
          <li v-for="(activity, index) in activities" :key="index">
            <span class="activity-icon">{{ activity.icon }}</span>
            <span class="activity-text">{{ activity.text }}</span>
            <span class="activity-time">{{ activity.time }}</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'

interface Stat {
  icon: string
  value: string
  label: string
}

interface Activity {
  icon: string
  text: string
  time: string
}

@Component
export default class Dashboard extends Vue {
  stats: Stat[] = [
    { icon: '👥', value: '1,234', label: '使用者' },
    { icon: '📝', value: '567', label: '任務' },
    { icon: '✅', value: '89%', label: '完成率' },
    { icon: '⏱️', value: '24h', label: '回應時間' }
  ]

  activities: Activity[] = [
    { icon: '🆕', text: '新增了一個任務', time: '5 分鐘前' },
    { icon: '✏️', text: '更新了使用者設定', time: '15 分鐘前' },
    { icon: '🔔', text: '收到系統通知', time: '1 小時前' },
    { icon: '📤', text: '匯出報表完成', time: '2 小時前' }
  ]
}
</script>

<style scoped>
.dashboard {
  display: flex;
  justify-content: center;
  padding: 2rem;
}

.dashboard-card {
  background: white;
  border-radius: 16px;
  padding: 2.5rem;
  max-width: 800px;
  width: 100%;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
}

.dashboard-card h1 {
  font-size: 2rem;
  color: #333;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: #666;
  font-size: 1.1rem;
  margin-bottom: 2rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  color: white;
}

.stat-icon {
  font-size: 2rem;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
}

.stat-label {
  font-size: 0.85rem;
  opacity: 0.9;
}

.activity-section h2 {
  font-size: 1.1rem;
  color: #333;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #667eea;
}

.activity-list {
  list-style: none;
  padding: 0;
}

.activity-list li {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 0;
  border-bottom: 1px solid #eee;
}

.activity-list li:last-child {
  border-bottom: none;
}

.activity-icon {
  font-size: 1.25rem;
}

.activity-text {
  flex: 1;
  color: #333;
}

.activity-time {
  font-size: 0.85rem;
  color: #999;
}
</style>
