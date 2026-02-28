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
