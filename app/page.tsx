"use client";

import { getRedirectUrl } from "@/lib/redirect-utils";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return; // Attendre que la session soit chargée

    const redirectUrl = getRedirectUrl(session);
    router.replace(redirectUrl);
  }, [session, status, router]);

  // Afficher un loader pendant la redirection
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-900 via-black to-red-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
        <p className="mt-4 text-white text-lg">Redirection en cours...</p>
      </div>
    </div>
  );
}
