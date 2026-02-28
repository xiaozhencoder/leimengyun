import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { DiabetesType, TreatmentPlan } from '@leimengyun/shared'

export interface UserInfo {
  id: string
  phone: string
  nickname: string
  avatar?: string
  role: string
}

export interface PatientProfile {
  gender: string
  birthDate: string
  diabetesType: DiabetesType
  treatmentPlan: TreatmentPlan
  diagnosisDate?: string
  height?: number
  weight?: number
}

export const useUserStore = defineStore('user', () => {
  const token = ref<string>(localStorage.getItem('token') || '')
  const userInfo = ref<UserInfo | null>(null)
  const profile = ref<PatientProfile | null>(null)

  function setToken(t: string) {
    token.value = t
    localStorage.setItem('token', t)
  }

  function setUserInfo(info: UserInfo) {
    userInfo.value = info
  }

  function setProfile(p: PatientProfile) {
    profile.value = p
  }

  function login(t: string, info: UserInfo) {
    setToken(t)
    setUserInfo(info)
  }

  function logout() {
    token.value = ''
    userInfo.value = null
    profile.value = null
    localStorage.removeItem('token')
  }

  return {
    token,
    userInfo,
    profile,
    setToken,
    setUserInfo,
    setProfile,
    login,
    logout,
  }
})
