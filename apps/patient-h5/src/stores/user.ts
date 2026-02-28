import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getMe } from '@/api/auth'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '')
  const userInfo = ref<any>(null)

  const isLoggedIn = computed(() => !!token.value)
  const hasProfile = computed(() => !!userInfo.value?.patientProfile)
  const profile = computed(() => userInfo.value?.patientProfile)
  const nickname = computed(() => profile.value?.nickname || '糖友')

  function setToken(t: string) {
    token.value = t
    localStorage.setItem('token', t)
  }

  async function fetchUser() {
    try {
      const data = await getMe()
      userInfo.value = data
      return data
    } catch {
      logout()
      return null
    }
  }

  function logout() {
    token.value = ''
    userInfo.value = null
    localStorage.removeItem('token')
  }

  return { token, userInfo, isLoggedIn, hasProfile, profile, nickname, setToken, fetchUser, logout }
})
