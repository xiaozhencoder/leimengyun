import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/auth/LoginPage.vue'),
  },
  {
    path: '/',
    component: () => import('@/components/TabLayout.vue'),
    children: [
      { path: '', name: 'Home', component: () => import('@/views/home/HomePage.vue') },
      { path: 'records', name: 'Records', component: () => import('@/views/records/RecordsPage.vue') },
      { path: 'messages', name: 'Messages', component: () => import('@/views/messages/MessagesPage.vue') },
      { path: 'profile', name: 'Profile', component: () => import('@/views/profile/ProfilePage.vue') },
    ],
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
    path: '/chat/:id',
    name: 'Chat',
    component: () => import('@/views/chat/ChatPage.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
