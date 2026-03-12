import client from './client'

export function getPatients(params?: { search?: string }) {
  return client.get('/doctor/patients', { params })
}

export function getPatientDetail(id: string) {
  return client.get(`/doctor/patients/${id}`)
}

export function getPendingBindRequests() {
  return client.get('/doctor/bind-requests', { params: { status: 'PENDING' } })
}

export function handleBindRequest(requestId: string, accept: boolean) {
  return client.post(`/doctor/bind-requests/${requestId}`, { accept })
}

export function getAlertPatients() {
  return client.get('/doctor/patients/alerts')
}

export function getDoctorStats() {
  return client.get('/doctor/stats')
}

export function updateProfile(data: Record<string, unknown>) {
  return client.put('/auth/profile', data)
}

export function updateDoctorProfile(data: {
  hospital?: string
  department?: string
  title?: string
  specialties?: string
  bio?: string
}) {
  return client.patch('/users/doctor-profile', data)
}
