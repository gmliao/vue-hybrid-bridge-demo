import { createRouter, createWebHistory } from 'vue-router'
import LegacyContainer from '@/components/LegacyContainer.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'legacy',
      component: LegacyContainer,
      meta: { title: 'Legacy App' }
    },
    {
      path: '/earth',
      name: 'earth3d',
      component: LegacyContainer,
      meta: { title: '3D Earth' }
    }
  ]
})

export default router

