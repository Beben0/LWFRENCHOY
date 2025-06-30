/*
  Warnings:

  - You are about to drop the column `memberPseudo` on the `VSParticipant` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "VSParticipant" DROP COLUMN "memberPseudo",
ADD COLUMN     "totalKills" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalMvp" INTEGER NOT NULL DEFAULT 0;

-- AddForeignKey
ALTER TABLE "VSParticipant" ADD CONSTRAINT "VSParticipant_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
