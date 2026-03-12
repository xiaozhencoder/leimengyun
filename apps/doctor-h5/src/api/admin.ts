import client from './client'

export interface PendingDoctorItem {
  id: string
  userId: string
  realName: string
  hospital: string
  department: string
  title: string
  licenseNo: string
  verifyStatus: string
  user: { id: string; phone: string; createdAt: string }
}

export function getPendingDoctors(page = 1, pageSize = 20) {
  return client.get<{ list: PendingDoctorItem[]; total: number; hasMore: boolean }>(
    '/admin/doctors/pending',
    { params: { page, pageSize } },
  )
}

export function approveDoctor(doctorUserId: string) {
  return client.put(`/admin/doctors/${doctorUserId}/approve`)
}

export function rejectDoctor(doctorUserId: string, reason?: string) {
  return client.put(`/admin/doctors/${doctorUserId}/reject`, { reason: reason || undefined })
}
