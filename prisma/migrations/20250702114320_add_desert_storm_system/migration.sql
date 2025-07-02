-- CreateEnum
CREATE TYPE "DesertStormStatus" AS ENUM ('PREPARATION', 'ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DesertStormResult" AS ENUM ('TEAM_A_VICTORY', 'TEAM_B_VICTORY', 'DRAW');

-- CreateEnum
CREATE TYPE "DesertStormTeam" AS ENUM ('TEAM_A', 'TEAM_B');

-- DropEnum
DROP TYPE "AllianceRole";

-- CreateTable
CREATE TABLE "DesertStormEvent" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "teamAName" TEXT NOT NULL DEFAULT 'Équipe A',
    "teamBName" TEXT NOT NULL DEFAULT 'Équipe B',
    "teamAScore" INTEGER NOT NULL DEFAULT 0,
    "teamBScore" INTEGER NOT NULL DEFAULT 0,
    "status" "DesertStormStatus" NOT NULL DEFAULT 'PREPARATION',
    "result" "DesertStormResult",
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DesertStormEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DesertStormParticipant" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "team" "DesertStormTeam" NOT NULL,
    "totalKills" INTEGER NOT NULL DEFAULT 0,
    "totalDeaths" INTEGER NOT NULL DEFAULT 0,
    "totalDamage" BIGINT NOT NULL DEFAULT 0,
    "powerGain" BIGINT NOT NULL DEFAULT 0,
    "powerLoss" BIGINT NOT NULL DEFAULT 0,
    "participation" INTEGER NOT NULL DEFAULT 0,
    "rank" INTEGER,
    "rewards" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "points" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DesertStormParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DesertStormDaily" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "participantId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "teamA" INTEGER NOT NULL DEFAULT 0,
    "teamB" INTEGER NOT NULL DEFAULT 0,
    "kills" INTEGER NOT NULL DEFAULT 0,
    "deaths" INTEGER NOT NULL DEFAULT 0,
    "damage" BIGINT NOT NULL DEFAULT 0,
    "participated" BOOLEAN NOT NULL DEFAULT false,
    "events" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DesertStormDaily_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DesertStormEvent_status_idx" ON "DesertStormEvent"("status");

-- CreateIndex
CREATE INDEX "DesertStormEvent_startDate_idx" ON "DesertStormEvent"("startDate");

-- CreateIndex
CREATE INDEX "DesertStormEvent_endDate_idx" ON "DesertStormEvent"("endDate");

-- CreateIndex
CREATE INDEX "DesertStormParticipant_eventId_team_idx" ON "DesertStormParticipant"("eventId", "team");

-- CreateIndex
CREATE INDEX "DesertStormParticipant_totalKills_idx" ON "DesertStormParticipant"("totalKills");

-- CreateIndex
CREATE INDEX "DesertStormParticipant_points_idx" ON "DesertStormParticipant"("points");

-- CreateIndex
CREATE UNIQUE INDEX "DesertStormParticipant_eventId_memberId_key" ON "DesertStormParticipant"("eventId", "memberId");

-- CreateIndex
CREATE INDEX "DesertStormDaily_eventId_date_idx" ON "DesertStormDaily"("eventId", "date");

-- CreateIndex
CREATE INDEX "DesertStormDaily_participantId_date_idx" ON "DesertStormDaily"("participantId", "date");

-- CreateIndex
CREATE INDEX "DesertStormDaily_date_idx" ON "DesertStormDaily"("date");

-- AddForeignKey
ALTER TABLE "DesertStormParticipant" ADD CONSTRAINT "DesertStormParticipant_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "DesertStormEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesertStormParticipant" ADD CONSTRAINT "DesertStormParticipant_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesertStormDaily" ADD CONSTRAINT "DesertStormDaily_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "DesertStormEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesertStormDaily" ADD CONSTRAINT "DesertStormDaily_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "DesertStormParticipant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
