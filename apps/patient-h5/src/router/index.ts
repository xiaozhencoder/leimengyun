import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/home',
  },
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
    path: '/home',
    name: 'Home',
    component: () => import('@/views/home/Home.vue'),
    meta: { tabBar: true },
  },
  {
    path: '/record/blood-sugar',
    name: 'RecordBloodSugar',
    component: () => import('@/views/record/RecordBloodSugar.vue'),
  },
  {
    path: '/record/diet',
    name: 'RecordDiet',
    component: () => import('@/views/record/RecordDiet.vue'),
  },
  {
    path: '/record/medication',
    name: 'RecordMedication',
    component: () => import('@/views/record/RecordMedication.vue'),
  },
  {
    path: '/records',
    name: 'Records',
    component: () => import('@/views/records/Records.vue'),
    meta: { tabBar: true },
  },
  {
    path: '/messages',
    name: 'Messages',
    component: () => import('@/views/messages/Messages.vue'),
    meta: { tabBar: true },
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
    meta: { tabBar: true },
  },
  {
    path: '/profile/health',
    name: 'HealthProfile',
    component: () => import('@/views/profile/HealthProfile.vue'),
  },
  {
    path: '/bind-doctor',
    name: 'BindDoctor',
    component: () => import('@/views/profile/BindDoctor.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem('token')
  if (to.meta.requiresAuth === false) {
    next()
    return
  }
  if (!token) {
    next({ path: '/login', query: { redirect: to.fullPath } })
    return
  }
  next()
})

export default router
