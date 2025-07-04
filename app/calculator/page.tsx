import { Calculator } from "@/components/calculator/calculator";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function CalculatorPage() {
  const session = await auth();

  const { hasPermissionAsync } = await import("@/lib/permissions");
  const canView = await hasPermissionAsync(session, "view_calculator");
  if (!canView) {
    redirect("/auth/signin");
  }

  return <Calculator />;
}
