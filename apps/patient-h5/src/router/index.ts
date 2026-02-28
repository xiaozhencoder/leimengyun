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
      { path: '', name: 'Home', component: () => import('@/views/home/HomePage.vue') },
      {
        path: 'records',
        name: 'Records',
        component: () => import('@/views/records/RecordsPage.vue'),
      },
      {
        path: 'messages',
        name: 'Messages',
        component: () => import('@/views/messages/MessagesPage.vue'),
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('@/views/profile/ProfilePage.vue'),
      },
    ],
  },
  {
    path: '/record/blood-sugar',
    name: 'RecordBloodSugar',
    component: () => import('@/views/record/RecordBloodSugar.vue'),
    meta: { auth: true },
  },
  {
    path: '/record/diet',
    name: 'RecordDiet',
    component: () => import('@/views/record/RecordDiet.vue'),
    meta: { auth: true },
  },
  {
    path: '/record/medication',
    name: 'RecordMedication',
    component: () => import('@/views/record/RecordMedication.vue'),
    meta: { auth: true },
  },
  {
    path: '/chat/:id',
    name: 'Chat',
    component: () => import('@/views/chat/ChatPage.vue'),
    meta: { auth: true },
  },
  {
    path: '/bind-doctor',
    name: 'BindDoctor',
    component: () => import('@/views/profile/BindDoctorPage.vue'),
    meta: { auth: true },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to, _from, next) => {
  const userStore = useUserStore()

  if (to.meta.auth && !userStore.isLoggedIn) {
    return next('/login')
  }

  if (to.meta.guest && userStore.isLoggedIn) {
    return next('/')
  }

  if (to.meta.auth && userStore.isLoggedIn && !userStore.userInfo) {
    await userStore.fetchUser()
    if (!userStore.isLoggedIn) return next('/login')
    if (!userStore.hasProfile && to.name !== 'Register') return next('/register')
  }

  next()
})

export default router
