import { VSPageContent } from "@/components/vs/vs-page-content";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function VSPage() {
  const session = await auth();

  if (!session) {
    redirect("/auth/signin");
  }

  return (
    <div className="container mx-auto p-6">
      <VSPageContent />
    </div>
  );
}
