import { MembersSearchSimple } from "@/components/members/members-search-simple";
import { auth } from "@/lib/auth";
import { mockData } from "@/lib/mock-data";
import { redirect } from "next/navigation";

async function getMembers() {
  // Try to use Prisma if available, fallback to mock data
  try {
    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();

    const members = await prisma.member.findMany({
      orderBy: { power: "desc" },
    });

    await prisma.$disconnect();
    return members;
  } catch (error) {
    console.log("Prisma not available, using mock data");
    return mockData.members;
  }
}

export default async function MembersSimplePage() {
  const session = await auth();

  const { hasPermissionAsync } = await import("@/lib/permissions");
  const canView = await hasPermissionAsync(session, "view_members");
  if (!canView) redirect("/auth/signin");

  const members = await getMembers();

  return <MembersSearchSimple members={members as any} />;
}
