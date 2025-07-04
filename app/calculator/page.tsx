"use client";

import { Calculator } from "@/components/calculator/calculator";
import { hasPermission } from "@/lib/permissions";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function CalculatorPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const canUseCalculator = hasPermission(session, "use_calculator");

  useEffect(() => {
    if (!canUseCalculator) {
      router.push("/");
      return;
    }
  }, [canUseCalculator, router]);

  if (!canUseCalculator) {
    return null;
  }

  return <Calculator />;
}
