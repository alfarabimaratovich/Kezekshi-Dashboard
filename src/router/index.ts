import { createRouter, createWebHistory } from 'vue-router'
import { useAuth } from '@/stores/useAuth'
import NProgress from 'nprogress'

const routes = [
  { path: '/', component: () => import('@/pages/Home.vue'), meta: { requiresAuth: true } },
  { path: '/stats', component: () => import('@/pages/Stats.vue'), meta: { requiresAuth: true } },
  { path: '/my-children', component: () => import('@/pages/MyChildren.vue'), meta: { requiresAuth: true } },
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

// Configure NProgress
NProgress.configure({ showSpinner: false })

// Simple guard: use localStorage 'isAuth' flag
router.beforeEach((to, from, next) => {
  NProgress.start()
  const { isAuth } = useAuth()
  if ((to.meta as any).requiresAuth && !isAuth.value) {
    next('/login')
  } else if (to.path === '/login' && isAuth.value) {
    next('/')
  } else {
    next()
  }
})

router.afterEach(() => {
  NProgress.done()
})

export default router
