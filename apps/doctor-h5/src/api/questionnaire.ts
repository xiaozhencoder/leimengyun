import client from './client'

export function getTemplates(params?: { category?: string }) {
  return client.get('/questionnaire/templates', { params })
}

export function getTemplateById(id: string) {
  return client.get(`/questionnaire/templates/${id}`)
}

export function createAssignments(data: {
  templateId: string
  patientIds: string[]
  deadline: string
  message?: string
}) {
  return client.post('/questionnaire/assignments', data)
}

export function getSentAssignments(params?: {
  status?: string
  page?: number
  pageSize?: number
}) {
  return client.get('/questionnaire/assignments/sent', { params })
}

export function getAssignmentResult(id: string) {
  return client.get(`/questionnaire/assignments/${id}/result`)
}

export function addDoctorNote(id: string, doctorNote: string) {
  return client.put(`/questionnaire/assignments/${id}/note`, { doctorNote })
}

export function cancelAssignment(id: string) {
  return client.put(`/questionnaire/assignments/${id}/cancel`)
}

export function getStatsOverview() {
  return client.get('/questionnaire/stats/overview')
}

export function getPatientHistory(patientId: string) {
  return client.get(`/questionnaire/patients/${patientId}/history`)
}

export function getMyPatients() {
  return client.get('/users/my-patients')
}
