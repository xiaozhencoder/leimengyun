-- CreateEnum
CREATE TYPE "QuestionnaireCategory" AS ENUM ('BLOOD_SUGAR_MANAGEMENT', 'DIET_MANAGEMENT', 'EXERCISE_MANAGEMENT', 'MEDICATION_ADHERENCE', 'QUALITY_OF_LIFE', 'HYPOGLYCEMIA_RISK', 'FOOT_CARE', 'MENTAL_HEALTH', 'CUSTOM');

-- CreateEnum
CREATE TYPE "TemplateStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('PENDING', 'COMPLETED', 'EXPIRED', 'CANCELLED');

-- CreateTable
CREATE TABLE "questionnaire_templates" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" "QuestionnaireCategory" NOT NULL,
    "questions" JSONB NOT NULL,
    "total_score" INTEGER,
    "estimated_time" INTEGER NOT NULL DEFAULT 5,
    "is_system" BOOLEAN NOT NULL DEFAULT true,
    "creator_id" TEXT,
    "status" "TemplateStatus" NOT NULL DEFAULT 'ACTIVE',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "questionnaire_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questionnaire_assignments" (
    "id" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    "doctor_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "status" "AssignmentStatus" NOT NULL DEFAULT 'PENDING',
    "deadline" TIMESTAMP(3),
    "message" VARCHAR(200),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "questionnaire_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questionnaire_responses" (
    "id" TEXT NOT NULL,
    "assignment_id" TEXT NOT NULL,
    "answers" JSONB NOT NULL,
    "total_score" INTEGER,
    "dimension_scores" JSONB,
    "duration" INTEGER,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "doctor_note" TEXT,
    "noted_at" TIMESTAMP(3),

    CONSTRAINT "questionnaire_responses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "questionnaire_assignments_doctor_id_created_at_idx" ON "questionnaire_assignments"("doctor_id", "created_at");

-- CreateIndex
CREATE INDEX "questionnaire_assignments_patient_id_status_idx" ON "questionnaire_assignments"("patient_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "questionnaire_responses_assignment_id_key" ON "questionnaire_responses"("assignment_id");

-- AddForeignKey
ALTER TABLE "questionnaire_templates" ADD CONSTRAINT "questionnaire_templates_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questionnaire_assignments" ADD CONSTRAINT "questionnaire_assignments_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "questionnaire_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questionnaire_assignments" ADD CONSTRAINT "questionnaire_assignments_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questionnaire_assignments" ADD CONSTRAINT "questionnaire_assignments_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questionnaire_responses" ADD CONSTRAINT "questionnaire_responses_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "questionnaire_assignments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
