/*
  Warnings:

  - You are about to drop the `AccessLog` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."AccessLog" DROP CONSTRAINT "AccessLog_person_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."AccessLog" DROP CONSTRAINT "AccessLog_unit_id_fkey";

-- DropTable
DROP TABLE "public"."AccessLog";

-- CreateTable
CREATE TABLE "BiometricLog" (
    "id" SERIAL NOT NULL,
    "access_time" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "event_type" "EventType" NOT NULL DEFAULT 'entry',
    "biometric_device" VARCHAR(50) DEFAULT 'R307',
    "is_authorized" BOOLEAN NOT NULL DEFAULT false,
    "person_id" INTEGER,
    "unit_id" INTEGER NOT NULL,

    CONSTRAINT "BiometricLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebAccessLog" (
    "id" SERIAL NOT NULL,
    "login_time" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "logout_time" TIMESTAMPTZ,
    "session_duration_minutes" INTEGER,
    "event_type" "EventType" NOT NULL,
    "person_id" INTEGER,
    "unit_id" INTEGER NOT NULL,

    CONSTRAINT "WebAccessLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "BiometricLog" ADD CONSTRAINT "BiometricLog_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BiometricLog" ADD CONSTRAINT "BiometricLog_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebAccessLog" ADD CONSTRAINT "WebAccessLog_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebAccessLog" ADD CONSTRAINT "WebAccessLog_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
