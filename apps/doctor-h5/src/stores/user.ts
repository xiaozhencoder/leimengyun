import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface DoctorInfo {
  id: string
  phone: string
  realName: string
  hospital: string
  department: string
  title: string
  licenseNo: string
  specialties?: string
  bio?: string
  avatar?: string
  verifyStatus: string
}

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('doctor_token') || '')
  const doctor = ref<DoctorInfo | null>(null)

  const isLoggedIn = computed(() => !!token.value)
  const isVerified = computed(() => doctor.value?.verifyStatus === 'APPROVED')

  function setToken(t: string) {
    token.value = t
    localStorage.setItem('doctor_token', t)
  }

  function setDoctor(info: DoctorInfo) {
    doctor.value = info
  }

  function logout() {
    token.value = ''
    doctor.value = null
    localStorage.removeItem('doctor_token')
  }

  return { token, doctor, isLoggedIn, isVerified, setToken, setDoctor, logout }
})
