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
  {
    path: '/doctor-info',
    name: 'DoctorInfo',
    component: () => import('@/views/profile/DoctorInfoPage.vue'),
    meta: { auth: true },
  },
  {
    path: '/pending-doctors',
    name: 'PendingDoctors',
    component: () => import('@/views/admin/PendingDoctorsPage.vue'),
    meta: { auth: true, adminOnly: true },
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('@/views/profile/SettingsPage.vue'),
    meta: { auth: true },
  },
  {
    path: '/help',
    name: 'Help',
    component: () => import('@/views/profile/HelpPage.vue'),
    meta: { auth: true },
  },
  {
    path: '/about',
    name: 'About',
    component: () => import('@/views/profile/AboutPage.vue'),
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
  if (to.meta.guest && userStore.isLoggedIn) {
    const role = (userStore.userInfo as any)?.role
    return next(role === 'ADMIN' ? '/pending-doctors' : '/')
  }

  if (to.meta.auth && userStore.isLoggedIn && !userStore.userInfo) {
    const userData = await userStore.fetchUser()
    if (!userStore.isLoggedIn) return next('/login')
    const role = (userData as any)?.role
    const hasProfile = !!(userData as any)?.doctorProfile
    if (role === 'ADMIN') return next()
    if (!hasProfile && to.name !== 'Register') return next('/register')
  }

  if (to.meta.adminOnly && (userStore.userInfo as any)?.role !== 'ADMIN') return next('/')
  next()
})

export default router
