import client from './client'

export function getMyPatients() {
  return client.get('/users/my-patients')
}

export function getPendingBinds() {
  return client.get('/users/pending-binds')
}

export function approveBind(bindId: string) {
  return client.put(`/users/bind/${bindId}/approve`)
}

export function rejectBind(bindId: string) {
  return client.put(`/users/bind/${bindId}/reject`)
}

export function unbindPatient(bindId: string) {
  return client.put(`/users/bind/${bindId}/unbind`)
}

export function getPatientHealthData(patientUserId: string, days = 7) {
  return client.get(`/users/patient/${patientUserId}/health-data`, { params: { days } })
}
