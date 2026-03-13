import client from './client'

export function getReceivedAssignments(params?: { status?: string; page?: number; pageSize?: number }) {
  return client.get('/questionnaire/assignments/received', { params })
}

export function getAssignmentDetail(id: string) {
  return client.get(`/questionnaire/assignments/${id}`)
}

export function submitResponse(id: string, data: { answers: any[]; duration: number }) {
  return client.post(`/questionnaire/assignments/${id}/submit`, data)
}

export function getAssignmentResult(id: string) {
  return client.get(`/questionnaire/assignments/${id}/result`)
}
