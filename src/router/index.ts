import { useSecurityStore } from '@/stores/securityStore'
import { useAuth } from '@/stores/useAuth'
import NProgress from 'nprogress'
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  { path: '/', name: 'home', component: () => import('@/pages/Home.vue'), meta: { requiresAuth: true } },
  { path: '/stats', name: 'stats', component: () => import('@/pages/Stats.vue'), meta: { requiresAuth: true } },
  { path: '/my-children', name: 'my-children', component: () => import('@/pages/MyChildren.vue'), meta: { requiresAuth: true } },
  { path: '/profile', name: 'profile', component: () => import('@/pages/Profile.vue'), meta: { requiresAuth: true } },
  { path: '/login', name: 'login', component: () => import('@/pages/Login.vue'), meta: { hideNavbar: true } },
  { path: '/reset', name: 'reset', component: () => import('@/pages/Reset.vue'), meta: { hideNavbar: true } },
  { path: '/register', name: 'register', component: () => import('@/pages/Register.vue'), meta: { hideNavbar: true } },
  { path: '/403', name: '403', component: () => import('@/pages/403.vue'), meta: { requiresAuth: true } },
  { path: '/:pathMatch(.*)*', redirect: '/login' }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Configure NProgress
NProgress.configure({ showSpinner: false })

// Simple guard: use localStorage 'isAuth' flag
router.beforeEach(async (to, from, next) => {
  NProgress.start()
  const auth = useAuth()
  const securityStore = useSecurityStore()

  // If user already logged in and opening login page -> go home
  if (to.path === '/login' && auth.isAuth.value) {
    next('/')
    return
  }

  // If route requires auth and user not authenticated -> to login
  if ((to.meta as any).requiresAuth && !auth.isAuth.value) {
    next('/login')
    return
  }

  // If user is authenticated but profile not yet loaded — wait for it
  if (auth.isAuth.value && !auth.userProfile?.value) {
    try {
      await auth.fetchProfile()
    } catch (err) {
      // failed to load profile (token expired / network) — force login
      next('/login')
      return
    }
  }

  // Don't run ACL for the 403 page itself (prevents infinite redirect)
  if (to.name === '403') {
    next()
    return
  }

  // Only check page-level access for routes that require authentication
  if ((to.meta as any).requiresAuth) {
    const pageName = typeof to.name === 'string' ? to.name : ''
    if (!securityStore.canAccessPage(pageName)) {
      next('/403')
      return
    }
    if (to.path === '/profile?tab=planning' && !securityStore.canAccessPage('planning')) {
      next('/403')
      return
    }
  }

  next()
})

router.afterEach(() => {
  NProgress.done()
})

export default router
