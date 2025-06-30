-- CreateTable
CREATE TABLE "HivePlacement" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "x" INTEGER NOT NULL,
    "y" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HivePlacement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HivePlacement_memberId_key" ON "HivePlacement"("memberId");

-- AddForeignKey
ALTER TABLE "HivePlacement" ADD CONSTRAINT "HivePlacement_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
