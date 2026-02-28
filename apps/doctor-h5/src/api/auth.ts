import client from './client'

export function sendSmsCode(phone: string) {
  return client.post('/auth/sms-code', { phone })
}

export function login(phone: string, code: string) {
  return client.post('/auth/login', { phone, code, role: 'DOCTOR' })
}

export function registerDoctor(data: {
  realName: string
  hospital: string
  department: string
  title: string
  licenseNo: string
  specialties?: string
  bio?: string
}) {
  return client.post('/auth/register/doctor', data)
}

export function getProfile() {
  return client.get('/auth/profile')
}
