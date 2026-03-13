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
        path: 'community',
        name: 'Community',
        component: () => import('@/views/community/CommunityPage.vue'),
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
  {
    path: '/health-profile',
    name: 'HealthProfile',
    component: () => import('@/views/profile/HealthProfilePage.vue'),
    meta: { auth: true },
  },
  {
    path: '/health-profile/edit',
    name: 'HealthProfileEdit',
    component: () => import('@/views/profile/HealthProfileEditPage.vue'),
    meta: { auth: true },
  },
  {
    path: '/role-select',
    name: 'RoleSelect',
    component: () => import('@/views/auth/RoleSelectPage.vue'),
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
  {
    path: '/health-report',
    name: 'HealthReport',
    component: () => import('@/views/profile/HealthReportPage.vue'),
    meta: { auth: true },
  },
  {
    path: '/community/post/:id',
    name: 'PostDetail',
    component: () => import('@/views/community/PostDetailPage.vue'),
    meta: { auth: true },
  },
  {
    path: '/community/publish',
    name: 'Publish',
    component: () => import('@/views/community/PublishPage.vue'),
    meta: { auth: true },
  },
  {
    path: '/community/topics',
    name: 'TopicSquare',
    component: () => import('@/views/community/TopicSquarePage.vue'),
    meta: { auth: true },
  },
  {
    path: '/community/topic/:id',
    name: 'TopicDetail',
    component: () => import('@/views/community/TopicDetailPage.vue'),
    meta: { auth: true },
  },
  {
    path: '/community/user/:id',
    name: 'UserProfile',
    component: () => import('@/views/community/UserProfilePage.vue'),
    meta: { auth: true },
  },
  {
    path: '/community/my',
    name: 'MyCommunity',
    component: () => import('@/views/community/MyCommunityPage.vue'),
    meta: { auth: true },
  },
  {
    path: '/community/search',
    name: 'CommunitySearch',
    component: () => import('@/views/community/SearchPage.vue'),
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
    const userData = await userStore.fetchUser()
    if (!userStore.isLoggedIn) return next('/login')
    // 用接口返回数据判断，避免 store 未及时更新导致误判为未完善档案
    const hasProfile = !!(userData as any)?.patientProfile
    if (!hasProfile && to.name !== 'Register' && to.name !== 'RoleSelect') return next('/register')
  }

  next()
})

export default router
