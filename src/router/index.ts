import { createRouter, createWebHistory } from 'vue-router'
import { useAuth } from '@/stores/useAuth'

const routes = [
  { path: '/', component: () => import('@/pages/Home.vue'), meta: { requiresAuth: true } },
  { path: '/analytics', component: () => import('@/pages/Analytics.vue'), meta: { requiresAuth: true } },
  { path: '/stats', component: () => import('@/pages/Stats.vue'), meta: { requiresAuth: true } },
  { path: '/profile', component: () => import('@/pages/Profile.vue'), meta: { requiresAuth: true } },
  { path: '/login', component: () => import('@/pages/Login.vue'), meta: { hideNavbar: true } },
  { path: '/reset', component: () => import('@/pages/Reset.vue'), meta: { hideNavbar: true } },
  { path: '/register', component: () => import('@/pages/Register.vue'), meta: { hideNavbar: true } },
  { path: '/:pathMatch(.*)*', redirect: '/login' }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Simple guard: use localStorage 'isAuth' flag
router.beforeEach((to) => {
  const { isAuth } = useAuth()
  if ((to.meta as any).requiresAuth && !isAuth.value) {
    return { path: '/login' }
  }
  if (to.path === '/login' && isAuth.value) {
    return { path: '/' }
  }
})

export default router
