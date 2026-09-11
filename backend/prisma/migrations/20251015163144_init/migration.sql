/*
  Warnings:

  - You are about to alter the column `system_access_hash` on the `Person` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(60)`.
  - A unique constraint covering the columns `[email]` on the table `Person` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "public"."AccessLog" DROP CONSTRAINT "AccessLog_person_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."Employee" DROP CONSTRAINT "Employee_person_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."PeopleBiometrics" DROP CONSTRAINT "PeopleBiometrics_biometric_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."PeopleBiometrics" DROP CONSTRAINT "PeopleBiometrics_person_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."Student" DROP CONSTRAINT "Student_person_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."Teacher" DROP CONSTRAINT "Teacher_employee_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."Token" DROP CONSTRAINT "Token_person_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."Visitor" DROP CONSTRAINT "Visitor_person_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."Visitor" DROP CONSTRAINT "Visitor_responsible_employee_id_fkey";

-- AlterTable
ALTER TABLE "Person" ALTER COLUMN "system_access_hash" SET DATA TYPE VARCHAR(60);

-- AlterTable
ALTER TABLE "Visitor" ALTER COLUMN "responsible_employee_id" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Person_email_key" ON "Person"("email");

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Teacher" ADD CONSTRAINT "Teacher_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Visitor" ADD CONSTRAINT "Visitor_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Visitor" ADD CONSTRAINT "Visitor_responsible_employee_id_fkey" FOREIGN KEY ("responsible_employee_id") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PeopleBiometrics" ADD CONSTRAINT "PeopleBiometrics_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PeopleBiometrics" ADD CONSTRAINT "PeopleBiometrics_biometric_id_fkey" FOREIGN KEY ("biometric_id") REFERENCES "Biometric"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessLog" ADD CONSTRAINT "AccessLog_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Token" ADD CONSTRAINT "Token_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;
