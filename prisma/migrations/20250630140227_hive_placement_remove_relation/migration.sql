-- Drop relation from HivePlacement to Member (we keep memberId nullable unique)
ALTER TABLE "HivePlacement" DROP CONSTRAINT IF EXISTS "HivePlacement_memberId_fkey";
