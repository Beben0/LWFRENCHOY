-- CreateTable
CREATE TABLE "VSParticipantDay" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "weekId" TEXT NOT NULL,
    "dayNumber" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "kills" INTEGER NOT NULL DEFAULT 0,
    "deaths" INTEGER NOT NULL DEFAULT 0,
    "powerGain" BIGINT NOT NULL DEFAULT 0,
    "powerLoss" BIGINT NOT NULL DEFAULT 0,
    "attacks" INTEGER NOT NULL DEFAULT 0,
    "defenses" INTEGER NOT NULL DEFAULT 0,
    "participated" BOOLEAN NOT NULL DEFAULT false,
    "mvpPoints" INTEGER NOT NULL DEFAULT 0,
    "events" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VSParticipantDay_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VSParticipantDay_weekId_dayNumber_idx" ON "VSParticipantDay"("weekId", "dayNumber");

-- CreateIndex
CREATE INDEX "VSParticipantDay_date_idx" ON "VSParticipantDay"("date");

-- CreateIndex
CREATE INDEX "VSParticipantDay_kills_idx" ON "VSParticipantDay"("kills");

-- CreateIndex
CREATE INDEX "VSParticipantDay_participated_idx" ON "VSParticipantDay"("participated");

-- CreateIndex
CREATE UNIQUE INDEX "VSParticipantDay_participantId_dayNumber_key" ON "VSParticipantDay"("participantId", "dayNumber");

-- AddForeignKey
ALTER TABLE "VSParticipantDay" ADD CONSTRAINT "VSParticipantDay_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "VSParticipant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VSParticipantDay" ADD CONSTRAINT "VSParticipantDay_weekId_fkey" FOREIGN KEY ("weekId") REFERENCES "VSWeek"("id") ON DELETE CASCADE ON UPDATE CASCADE;
