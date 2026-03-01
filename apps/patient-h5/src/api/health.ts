import client from './client'

/** 获取用户本地「今天」的起止时间（ISO 字符串，供 API 使用） */
export function getLocalDayRange(): { start: string; end: string } {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
  return { start: start.toISOString(), end: end.toISOString() }
}

/** 将 ISO 时间字符串转为用户本地的 YYYY-MM-DD */
export function toLocalDateString(isoStr: string): string {
  const d = new Date(isoStr)
  const y = d.getFullYear()
  const m = (d.getMonth() + 1).toString().padStart(2, '0')
  const day = d.getDate().toString().padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function createBloodSugar(data: {
  value: number
  measureTime: string
  recordedAt: string
  note?: string
}) {
  return client.post('/health/blood-sugar', data)
}

export function getBloodSugars(days = 7, opts?: { start?: string; end?: string }) {
  const params = opts?.start && opts?.end ? { start: opts.start, end: opts.end } : { days }
  return client.get('/health/blood-sugar', { params })
}

export function createDiet(data: {
  mealType: string
  foodItems: { name: string; quantity: string; carbs: number }[]
  totalCarbs: number
  photoUrl?: string
  recordedAt: string
  note?: string
}) {
  return client.post('/health/diet', data)
}

export function getDiets(days = 7) {
  return client.get('/health/diet', { params: { days } })
}

export function createMedication(data: {
  medType: string
  medName: string
  dosage: number
  dosageUnit: string
  injectionSite?: string
  recordedAt: string
  note?: string
}) {
  return client.post('/health/medication', data)
}

export function getMedications(days = 7) {
  return client.get('/health/medication', { params: { days } })
}

export function getTodaySummary(opts?: { start?: string; end?: string }) {
  const params = opts?.start && opts?.end ? { start: opts.start, end: opts.end } : {}
  return client.get('/health/today-summary', { params })
}
