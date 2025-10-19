-- CreateEnum
CREATE TYPE "UnitType" AS ENUM ('Fatec', 'Etec');

-- CreateEnum
CREATE TYPE "Finger" AS ENUM ('thumb_right', 'index_right', 'middle_right', 'ring_right', 'pinky_right', 'thumb_left', 'index_left', 'middle_left', 'ring_left', 'pinky_left');

-- CreateEnum
CREATE TYPE "PersonType" AS ENUM ('student', 'teacher', 'employee', 'coordinator', 'inspector', 'visitor');

-- CreateEnum
CREATE TYPE "Period" AS ENUM ('morning', 'afternoon', 'night', 'integral');

-- CreateEnum
CREATE TYPE "StudentStatus" AS ENUM ('active', 'inactive', 'transferred');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('entry', 'exit');

-- CreateTable
CREATE TABLE "Unit" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "unit_type" "UnitType" NOT NULL,
    "address" TEXT,
    "phone" VARCHAR(20),
    "unit_code" VARCHAR(6) NOT NULL,
    "is_extension" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Unit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "permission_level" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Person" (
    "id" SERIAL NOT NULL,
    "full_name" VARCHAR(100) NOT NULL,
    "birth_date" DATE,
    "cpf" VARCHAR(14) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "phone" VARCHAR(20),
    "type" "PersonType" NOT NULL,
    "main_unit_type" "UnitType" NOT NULL,
    "system_access_hash" TEXT,
    "temporary_password" TEXT,
    "password_reset_at" TIMESTAMP(3),
    "registration_unit_id" INTEGER NOT NULL,

    CONSTRAINT "Person_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Biometric" (
    "id" SERIAL NOT NULL,
    "template" BYTEA NOT NULL,
    "finger" "Finger" NOT NULL,
    "registration_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "device" VARCHAR(50) DEFAULT 'R307',
    "registration_unit_id" INTEGER NOT NULL,

    CONSTRAINT "Biometric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Student" (
    "id" SERIAL NOT NULL,
    "rm" VARCHAR(20) NOT NULL,
    "period" "Period" NOT NULL,
    "course" VARCHAR(50),
    "class" VARCHAR(20),
    "responsible" VARCHAR(100),
    "status" "StudentStatus" NOT NULL DEFAULT 'active',
    "person_id" INTEGER NOT NULL,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Employee" (
    "id" SERIAL NOT NULL,
    "registration_number" VARCHAR(20) NOT NULL,
    "admission_date" DATE,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "person_id" INTEGER NOT NULL,
    "role_id" INTEGER NOT NULL,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Teacher" (
    "id" SERIAL NOT NULL,
    "subjects" TEXT[],
    "can_teach_fatec" BOOLEAN NOT NULL DEFAULT false,
    "can_teach_etec" BOOLEAN NOT NULL DEFAULT false,
    "employee_id" INTEGER NOT NULL,

    CONSTRAINT "Teacher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Visitor" (
    "id" SERIAL NOT NULL,
    "company" VARCHAR(100),
    "visit_reason" TEXT,
    "registration_date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "visit_expiry_date" DATE,
    "person_id" INTEGER NOT NULL,
    "responsible_employee_id" INTEGER NOT NULL,

    CONSTRAINT "Visitor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PeopleBiometrics" (
    "person_id" INTEGER NOT NULL,
    "biometric_id" INTEGER NOT NULL,

    CONSTRAINT "PeopleBiometrics_pkey" PRIMARY KEY ("person_id","biometric_id")
);

-- CreateTable
CREATE TABLE "AccessLog" (
    "id" SERIAL NOT NULL,
    "access_time" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "event_type" "EventType" NOT NULL DEFAULT 'entry',
    "biometric_device" VARCHAR(50) DEFAULT 'R307',
    "python_verified" BOOLEAN NOT NULL DEFAULT false,
    "access_duration" INTEGER,
    "person_id" INTEGER,
    "unit_id" INTEGER NOT NULL,

    CONSTRAINT "AccessLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Token" (
    "id" SERIAL NOT NULL,
    "token" TEXT NOT NULL,
    "expiration" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "person_id" INTEGER NOT NULL,

    CONSTRAINT "Token_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TokenBlacklist" (
    "id" SERIAL NOT NULL,
    "token" TEXT NOT NULL,
    "expiration" TIMESTAMP(3) NOT NULL,
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TokenBlacklist_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Unit_unit_code_key" ON "Unit"("unit_code");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Person_cpf_key" ON "Person"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "Student_rm_key" ON "Student"("rm");

-- CreateIndex
CREATE UNIQUE INDEX "Student_person_id_key" ON "Student"("person_id");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_registration_number_key" ON "Employee"("registration_number");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_person_id_key" ON "Employee"("person_id");

-- CreateIndex
CREATE UNIQUE INDEX "Teacher_employee_id_key" ON "Teacher"("employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "Visitor_person_id_key" ON "Visitor"("person_id");

-- CreateIndex
CREATE UNIQUE INDEX "TokenBlacklist_token_key" ON "TokenBlacklist"("token");

-- AddForeignKey
ALTER TABLE "Person" ADD CONSTRAINT "Person_registration_unit_id_fkey" FOREIGN KEY ("registration_unit_id") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Biometric" ADD CONSTRAINT "Biometric_registration_unit_id_fkey" FOREIGN KEY ("registration_unit_id") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Teacher" ADD CONSTRAINT "Teacher_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Visitor" ADD CONSTRAINT "Visitor_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Visitor" ADD CONSTRAINT "Visitor_responsible_employee_id_fkey" FOREIGN KEY ("responsible_employee_id") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PeopleBiometrics" ADD CONSTRAINT "PeopleBiometrics_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PeopleBiometrics" ADD CONSTRAINT "PeopleBiometrics_biometric_id_fkey" FOREIGN KEY ("biometric_id") REFERENCES "Biometric"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessLog" ADD CONSTRAINT "AccessLog_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessLog" ADD CONSTRAINT "AccessLog_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Token" ADD CONSTRAINT "Token_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
