import client from './client'
import type { CreateBloodSugarDto, CreateDietDto, CreateMedicationDto } from '@leimengyun/shared'

export function createBloodSugar(data: CreateBloodSugarDto) {
  return client.post('/health/blood-sugar', data)
}

export function getBloodSugars(params?: { page?: number; limit?: number }) {
  return client.get('/health/blood-sugar', { params })
}

export function createDiet(data: CreateDietDto) {
  return client.post('/health/diet', data)
}

export function getDiets(params?: { page?: number; limit?: number }) {
  return client.get('/health/diet', { params })
}

export function createMedication(data: CreateMedicationDto) {
  return client.post('/health/medication', data)
}

export function getMedications(params?: { page?: number; limit?: number }) {
  return client.get('/health/medication', { params })
}

export function getDashboard() {
  return client.get('/health/dashboard')
}

export function getTrend(params?: { days?: number }) {
  return client.get('/health/trend', { params })
}
