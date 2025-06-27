import { MembersWithCrud } from "@/components/members/members-with-crud";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function MembersCrudPage() {
  const session = await auth();

  if (!session) {
    redirect("/auth/signin");
  }

  return <MembersWithCrud />;
}
