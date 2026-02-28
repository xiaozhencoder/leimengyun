export const BLOOD_SUGAR_RANGE = {
  MIN: 1.0,
  MAX: 33.3,
  NORMAL_FASTING_MIN: 3.9,
  NORMAL_FASTING_MAX: 6.1,
  NORMAL_POSTPRANDIAL_MIN: 3.9,
  NORMAL_POSTPRANDIAL_MAX: 7.8,
  HIGH_FASTING: 7.0,
  HIGH_POSTPRANDIAL: 11.1,
} as const

export const SMS_CODE_EXPIRE_SECONDS = 300
export const SMS_MAX_DAILY_COUNT = 10
export const NOTE_MAX_LENGTH = 200
export const BIO_MAX_LENGTH = 500

export const MEASURE_TIME_LABELS: Record<string, string> = {
  FASTING: '空腹',
  BEFORE_BREAKFAST: '早餐前',
  AFTER_BREAKFAST: '早餐后',
  BEFORE_LUNCH: '午餐前',
  AFTER_LUNCH: '午餐后',
  BEFORE_DINNER: '晚餐前',
  AFTER_DINNER: '晚餐后',
  BEFORE_SLEEP: '睡前',
  MIDNIGHT: '凌晨',
  RANDOM: '随机',
}

export const MEAL_TYPE_LABELS: Record<string, string> = {
  BREAKFAST: '早餐',
  LUNCH: '午餐',
  DINNER: '晚餐',
  SNACK: '加餐',
}

export const DIABETES_TYPE_LABELS: Record<string, string> = {
  TYPE_1: '1型',
  TYPE_2: '2型',
  GESTATIONAL: '妊娠期',
  OTHER: '其他',
}

export const TREATMENT_PLAN_LABELS: Record<string, string> = {
  CSII: '胰岛素泵(CSII)',
  MDI: '多次注射(MDI)',
  ORAL: '口服药物',
  LIFESTYLE: '生活方式管理',
}
