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

export const FASTING_MEASURE_TIMES = new Set([
  'FASTING', 'BEFORE_BREAKFAST', 'BEFORE_LUNCH', 'BEFORE_DINNER', 'BEFORE_SLEEP', 'MIDNIGHT',
])

export function isFastingMeasureTime(measureTime: string): boolean {
  return FASTING_MEASURE_TIMES.has(measureTime)
}

export const BLOOD_SUGAR_LEVEL_LABELS: Record<string, string> = {
  LOW: '偏低',
  NORMAL: '正常',
  HIGH: '偏高',
  VERY_HIGH: '高',
}

export const BLOOD_SUGAR_LEVEL_COLORS: Record<string, string> = {
  LOW: '#3B82F6',
  NORMAL: '#1AAD6E',
  HIGH: '#FFB020',
  VERY_HIGH: '#FF4D4F',
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

export const QUESTIONNAIRE_CATEGORY_LABELS: Record<string, string> = {
  BLOOD_SUGAR_MANAGEMENT: '血糖管理',
  DIET_MANAGEMENT: '饮食管理',
  EXERCISE_MANAGEMENT: '运动管理',
  MEDICATION_ADHERENCE: '用药依从',
  QUALITY_OF_LIFE: '生活质量',
  HYPOGLYCEMIA_RISK: '低血糖风险',
  FOOT_CARE: '足部护理',
  MENTAL_HEALTH: '心理状态',
  CUSTOM: '自定义',
}

export const QUESTIONNAIRE_CATEGORY_ICONS: Record<string, string> = {
  BLOOD_SUGAR_MANAGEMENT: '📊',
  DIET_MANAGEMENT: '🍱',
  EXERCISE_MANAGEMENT: '🏃',
  MEDICATION_ADHERENCE: '💊',
  QUALITY_OF_LIFE: '❤️',
  HYPOGLYCEMIA_RISK: '⚠️',
  FOOT_CARE: '🦶',
  MENTAL_HEALTH: '🧠',
  CUSTOM: '📋',
}

export const SCORE_LEVELS = [
  { min: 80, label: '优秀', color: '#1AAD6E', desc: '管理非常好，继续保持' },
  { min: 60, label: '良好', color: '#3B82F6', desc: '总体不错，仍有提升空间' },
  { min: 40, label: '一般', color: '#FFB020', desc: '需要改善部分习惯' },
  { min: 0, label: '较差', color: '#FF4D4F', desc: '建议加强管理，多与医生沟通' },
]

export function getScoreLevel(totalScore: number, maxScore: number) {
  const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0
  for (const level of SCORE_LEVELS) {
    if (percentage >= level.min) return { ...level, percentage: Math.round(percentage * 10) / 10 }
  }
  return { ...SCORE_LEVELS[SCORE_LEVELS.length - 1], percentage: 0 }
}
