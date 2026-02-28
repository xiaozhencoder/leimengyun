export enum UserRole {
  PATIENT = 'PATIENT',
  DOCTOR = 'DOCTOR',
  ADMIN = 'ADMIN',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  BANNED = 'BANNED',
}

export enum DiabetesType {
  TYPE_1 = 'TYPE_1',
  TYPE_2 = 'TYPE_2',
  GESTATIONAL = 'GESTATIONAL',
  OTHER = 'OTHER',
}

export enum TreatmentPlan {
  CSII = 'CSII',
  MDI = 'MDI',
  ORAL = 'ORAL',
  LIFESTYLE = 'LIFESTYLE',
}

export enum DoctorTitle {
  CHIEF = 'CHIEF',
  ASSOCIATE_CHIEF = 'ASSOCIATE_CHIEF',
  ATTENDING = 'ATTENDING',
  RESIDENT = 'RESIDENT',
}

export enum VerifyStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum BindStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  REMOVED = 'REMOVED',
}

export interface LoginDto {
  phone: string
  code: string
}

export interface RegisterPatientDto {
  nickname: string
  gender: 'MALE' | 'FEMALE'
  birthDate: string
  diabetesType: DiabetesType
  treatmentPlan: TreatmentPlan
  diagnosisDate?: string
  height?: number
  weight?: number
}

export interface RegisterDoctorDto {
  realName: string
  hospital: string
  department: string
  title: DoctorTitle
  licenseNo: string
  specialties?: string
  bio?: string
}
