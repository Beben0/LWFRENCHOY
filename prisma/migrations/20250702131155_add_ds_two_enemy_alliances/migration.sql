/*
  Warnings:

  - You are about to drop the column `enemyAllianceName` on the `DesertStormEvent` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "DesertStormEvent" DROP COLUMN "enemyAllianceName",
ADD COLUMN     "enemyTeamAAllianceName" TEXT,
ADD COLUMN     "enemyTeamBAllianceName" TEXT;
