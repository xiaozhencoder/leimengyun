export enum MeasureTime {
  FASTING = 'FASTING',
  BEFORE_BREAKFAST = 'BEFORE_BREAKFAST',
  AFTER_BREAKFAST = 'AFTER_BREAKFAST',
  BEFORE_LUNCH = 'BEFORE_LUNCH',
  AFTER_LUNCH = 'AFTER_LUNCH',
  BEFORE_DINNER = 'BEFORE_DINNER',
  AFTER_DINNER = 'AFTER_DINNER',
  BEFORE_SLEEP = 'BEFORE_SLEEP',
  MIDNIGHT = 'MIDNIGHT',
  RANDOM = 'RANDOM',
}

export enum MealType {
  BREAKFAST = 'BREAKFAST',
  LUNCH = 'LUNCH',
  DINNER = 'DINNER',
  SNACK = 'SNACK',
}

export enum MedType {
  INSULIN = 'INSULIN',
  ORAL = 'ORAL',
}

export enum InjectionSite {
  ABDOMEN = 'ABDOMEN',
  THIGH = 'THIGH',
  ARM = 'ARM',
  BUTTOCK = 'BUTTOCK',
}

export enum BloodSugarLevel {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  VERY_HIGH = 'VERY_HIGH',
}

export function getBloodSugarLevel(value: number, isFasting: boolean): BloodSugarLevel {
  if (value < 3.9) return BloodSugarLevel.LOW
  if (isFasting) {
    if (value <= 6.1) return BloodSugarLevel.NORMAL
    if (value <= 7.0) return BloodSugarLevel.HIGH
    return BloodSugarLevel.VERY_HIGH
  }
  if (value <= 7.8) return BloodSugarLevel.NORMAL
  if (value <= 11.1) return BloodSugarLevel.HIGH
  return BloodSugarLevel.VERY_HIGH
}

export interface CreateBloodSugarDto {
  value: number
  measureTime: MeasureTime
  recordedAt: string
  note?: string
}

export interface CreateDietDto {
  mealType: MealType
  foodItems: { name: string; quantity: string; carbs: number }[]
  totalCarbs: number
  photoUrl?: string
  recordedAt: string
  note?: string
}

export interface CreateMedicationDto {
  medType: MedType
  medName: string
  dosage: number
  dosageUnit: string
  injectionSite?: InjectionSite
  recordedAt: string
  note?: string
}
