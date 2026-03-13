import client from './client'

export function searchDoctors(keyword?: string) {
  return client.get('/users/doctors', { params: { keyword } })
}

export function bindDoctor(doctorUserId: string) {
  return client.post(`/users/bind-doctor/${doctorUserId}`)
}

export function getMyDoctors() {
  return client.get('/users/my-doctors')
}

export function unbindDoctor(bindId: string) {
  return client.put(`/users/bind/${bindId}/unbind`)
}

export function updatePatientProfile(data: {
  nickname?: string
  gender?: string
  birthDate?: string
  diabetesType?: string
  treatmentPlan?: string
  diagnosisDate?: string
  height?: number
  weight?: number
}) {
  return client.patch('/users/patient-profile', data)
}
