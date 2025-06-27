"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

export function AlertSchedulerInit() {
  const { data: session } = useSession();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Initialiser le scheduler seulement pour les admins
    if (session?.user && !initialized) {
      initializeScheduler();
      setInitialized(true);
    }
  }, [session, initialized]);

  const initializeScheduler = async () => {
    try {
      // Vérifier le statut actuel du scheduler
      const statusResponse = await fetch("/api/admin/alerts/scheduler");

      if (statusResponse.ok) {
        const status = await statusResponse.json();

        // Si le scheduler n'est pas en cours d'exécution, le démarrer
        if (!status.isRunning) {
          console.log("🚨 Initializing alert scheduler...");

          const startResponse = await fetch("/api/admin/alerts/scheduler", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "start",
              intervalMinutes: 2, // Vérifier toutes les 2 minutes
            }),
          });

          if (startResponse.ok) {
            const result = await startResponse.json();
            console.log("✅ Alert scheduler started:", result.status);
          }
        } else {
          console.log("✅ Alert scheduler already running");
        }
      }
    } catch (error) {
      // Ignorer les erreurs silencieusement pour ne pas perturber l'UX
      console.warn("Could not initialize alert scheduler:", error);
    }
  };

  // Ce composant ne rend rien visuellement
  return null;
}
