-- AlterTable
ALTER TABLE "DesertStormEvent" ADD COLUMN     "enemyAllianceName" TEXT,
ADD COLUMN     "enemyTeamAScore" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "enemyTeamBScore" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "DesertStormParticipant" ADD COLUMN     "isSubstitute" BOOLEAN NOT NULL DEFAULT false;
