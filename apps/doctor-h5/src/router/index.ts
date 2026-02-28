import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/auth/LoginPage.vue'),
    meta: { guest: true },
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/auth/RegisterPage.vue'),
  },
  {
    path: '/',
    component: () => import('@/components/TabLayout.vue'),
    meta: { auth: true },
    children: [
      { path: '', name: 'Patients', component: () => import('@/views/patients/PatientsPage.vue') },
      { path: 'messages', name: 'Messages', component: () => import('@/views/messages/MessagesPage.vue') },
      { path: 'profile', name: 'Profile', component: () => import('@/views/profile/ProfilePage.vue') },
    ],
  },
  {
    path: '/patient/:id',
    name: 'PatientDetail',
    component: () => import('@/views/patient-detail/PatientDetailPage.vue'),
    meta: { auth: true },
  },
  {
    path: '/chat/:id',
    name: 'Chat',
    component: () => import('@/views/chat/ChatPage.vue'),
    meta: { auth: true },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to, _from, next) => {
  const userStore = useUserStore()

  if (to.meta.auth && !userStore.isLoggedIn) return next('/login')
  if (to.meta.guest && userStore.isLoggedIn) return next('/')

  if (to.meta.auth && userStore.isLoggedIn && !userStore.userInfo) {
    await userStore.fetchUser()
    if (!userStore.isLoggedIn) return next('/login')
    if (!userStore.hasProfile && to.name !== 'Register') return next('/register')
  }

  next()
})

export default router
