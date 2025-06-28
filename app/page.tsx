"use client";

import { getRedirectUrl } from "@/lib/redirect-utils";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    const redirectUrl = getRedirectUrl(session);
    router.replace(redirectUrl);
  }, [session, status, router]);

  // Page vide - redirection directe
  return null;
}
