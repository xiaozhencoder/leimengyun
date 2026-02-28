import client from './client'

export function sendCode(phone: string) {
  return client.post('/auth/send-code', { phone })
}

export function login(phone: string, code: string) {
  return client.post('/auth/login', { phone, code })
}

export function register(data: {
  nickname: string
  gender: string
  birthDate: string
  diabetesType: string
  treatmentPlan: string
  height?: number
  weight?: number
}) {
  return client.post('/auth/register/patient', data)
}

export function getProfile() {
  return client.get('/user/profile')
}
