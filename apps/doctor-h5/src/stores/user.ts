import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getMe } from '@/api/auth'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('doc_token') || '')
  const userInfo = ref<any>(null)

  const isLoggedIn = computed(() => !!token.value)
  const hasProfile = computed(() => !!userInfo.value?.doctorProfile)
  const profile = computed(() => userInfo.value?.doctorProfile)

  function setToken(t: string) {
    token.value = t
    localStorage.setItem('doc_token', t)
  }

  function setUserInfo(data: any) {
    userInfo.value = data
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
    localStorage.removeItem('doc_token')
  }

  return { token, userInfo, isLoggedIn, hasProfile, profile, setToken, setUserInfo, fetchUser, logout }
})
