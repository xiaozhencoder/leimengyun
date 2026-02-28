import client from './client'

export function createBloodSugar(data: {
  value: number
  measureTime: string
  recordedAt: string
  note?: string
}) {
  return client.post('/health/blood-sugar', data)
}

export function getBloodSugars(days = 7) {
  return client.get('/health/blood-sugar', { params: { days } })
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

export function getTodaySummary() {
  return client.get('/health/today-summary')
}
