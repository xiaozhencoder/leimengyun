import client from './client'

export function sendCode(phone: string) {
  return client.post('/auth/send-code', { phone })
}

export function login(phone: string, code: string) {
  return client.post('/auth/login', { phone, code })
}

export function getMe() {
  return client.get('/users/me')
}

export function createDoctorProfile(data: {
  realName: string
  hospital: string
  department: string
  title: string
  licenseNo: string
  specialties?: string
  bio?: string
}) {
  return client.post('/users/doctor-profile', data)
}
