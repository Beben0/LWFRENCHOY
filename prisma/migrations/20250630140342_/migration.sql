-- AlterTable
ALTER TABLE "Member" ADD COLUMN     "hivePlacementId" TEXT;

-- AddForeignKey
ALTER TABLE "Member" ADD CONSTRAINT "Member_hivePlacementId_fkey" FOREIGN KEY ("hivePlacementId") REFERENCES "HivePlacement"("id") ON DELETE SET NULL ON UPDATE CASCADE;
