"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function TrainsCrudPage() {
  const router = useRouter();

  useEffect(() => {
    // Rediriger vers la page trains principale qui utilise le nouveau système
    router.replace("/trains");
  }, [router]);

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2" />
        <span>Redirection vers la page trains...</span>
      </div>
    </div>
  );
}
