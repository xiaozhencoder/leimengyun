import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/auth/Login.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/auth/Register.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/patients',
    name: 'Patients',
    component: () => import('@/views/patients/Patients.vue'),
    meta: { showTabBar: true },
  },
  {
    path: '/patients/:id',
    name: 'PatientDetail',
    component: () => import('@/views/patients/PatientDetail.vue'),
  },
  {
    path: '/messages',
    name: 'Messages',
    component: () => import('@/views/messages/Messages.vue'),
    meta: { showTabBar: true },
  },
  {
    path: '/chat/:id',
    name: 'Chat',
    component: () => import('@/views/chat/Chat.vue'),
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/profile/Profile.vue'),
    meta: { showTabBar: true },
  },
  {
    path: '/',
    redirect: '/patients',
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to) => {
  const userStore = useUserStore()
  const requiresAuth = to.meta.requiresAuth !== false

  if (requiresAuth && !userStore.isLoggedIn) {
    return { name: 'Login', query: { redirect: to.fullPath } }
  }
})

export default router
