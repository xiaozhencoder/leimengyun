export enum QuestionnaireCategory {
  BLOOD_SUGAR_MANAGEMENT = 'BLOOD_SUGAR_MANAGEMENT',
  DIET_MANAGEMENT = 'DIET_MANAGEMENT',
  EXERCISE_MANAGEMENT = 'EXERCISE_MANAGEMENT',
  MEDICATION_ADHERENCE = 'MEDICATION_ADHERENCE',
  QUALITY_OF_LIFE = 'QUALITY_OF_LIFE',
  HYPOGLYCEMIA_RISK = 'HYPOGLYCEMIA_RISK',
  FOOT_CARE = 'FOOT_CARE',
  MENTAL_HEALTH = 'MENTAL_HEALTH',
  CUSTOM = 'CUSTOM',
}

export enum AssignmentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

export type QuestionType = 'single_choice' | 'multiple_choice' | 'rating' | 'number' | 'text' | 'date'

export interface QuestionOption {
  label: string
  value: string
  score?: number
}

export interface Question {
  id: string
  type: QuestionType
  title: string
  required: boolean
  options?: QuestionOption[]
  min?: number
  max?: number
  minLabel?: string
  maxLabel?: string
  unit?: string
  maxLength?: number
  placeholder?: string
  dimension?: string
}

export interface Answer {
  questionId: string
  value: string | string[] | number
  score?: number
}

export interface ScoreLevel {
  min: number
  label: string
  color: string
  desc: string
}
