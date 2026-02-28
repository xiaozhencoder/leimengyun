import client from './client'

export interface LoginResult {
  token: string
  isNewUser: boolean
  user: { id: string; phone: string; role: string }
}

export function sendCode(phone: string) {
  return client.post('/auth/send-code', { phone })
}

export function login(phone: string, code: string): Promise<LoginResult> {
  return client.post('/auth/login', { phone, code })
}

export function getMe() {
  return client.get('/users/me')
}

export function createPatientProfile(data: {
  nickname: string
  gender: string
  birthDate: string
  diabetesType: string
  treatmentPlan: string
  diagnosisDate?: string
  height?: number
  weight?: number
}) {
  return client.post('/users/patient-profile', data)
}
