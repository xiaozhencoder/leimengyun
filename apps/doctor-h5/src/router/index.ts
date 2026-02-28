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
      { path: '', name: 'Patients', component: () => import('@/views/patients/PatientsPage.vue') },
      { path: 'messages', name: 'Messages', component: () => import('@/views/messages/MessagesPage.vue') },
      { path: 'profile', name: 'Profile', component: () => import('@/views/profile/ProfilePage.vue') },
    ],
  },
  {
    path: '/patient/:id',
    name: 'PatientDetail',
    component: () => import('@/views/patient-detail/PatientDetailPage.vue'),
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
