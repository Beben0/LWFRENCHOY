import { MembersWithCrud } from "@/components/members/members-with-crud";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function MembersCrudPage() {
  const session = await auth();

  const { hasPermissionAsync } = await import("@/lib/permissions");
  const canView = await hasPermissionAsync(session, "view_members");
  if (!canView) {
    redirect("/auth/signin");
  }

  return <MembersWithCrud />;
}
