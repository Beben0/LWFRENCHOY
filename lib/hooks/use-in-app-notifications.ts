"use client";

import { useToast } from "@/components/ui/toast";
import { useSession } from "next-auth/react";
import { useEffect, useRef } from "react";

interface Alert {
  id: string;
  title: string;
  message: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  createdAt: string;
}

export function useInAppNotifications() {
  const { addToast } = useToast();
  const { data: session } = useSession();
  const lastCheckRef = useRef<Date | null>(null);
  const processedAlertsRef = useRef<Set<string>>(new Set());

  // Vérifier si l'utilisateur est admin
  const isAdmin = session?.user?.role === "ADMIN";

  const checkForNewAlerts = async () => {
    // Ne rien faire si l'utilisateur n'est pas admin
    if (!isAdmin) return;

    try {
      const response = await fetch("/api/admin/alerts/unread");
      if (!response.ok) return;

      const data = await response.json();
      const alerts: Alert[] = data.alerts || [];

      // Filtrer les nouvelles alertes (pas encore traitées)
      const newAlerts = alerts.filter(
        (alert) => !processedAlertsRef.current.has(alert.id)
      );

      // Afficher les nouvelles alertes comme toasts
      newAlerts.forEach((alert) => {
        const toastType = getSeverityToastType(alert.severity);

        addToast({
          title: alert.title,
          description: alert.message,
          type: toastType,
          duration: getSeverityDuration(alert.severity),
        });

        processedAlertsRef.current.add(alert.id);
      });

      // Marquer les nouvelles alertes comme lues
      if (newAlerts.length > 0) {
        const alertIds = newAlerts.map((alert) => alert.id);
        await fetch("/api/admin/alerts/unread", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ alertIds }),
        });
      }

      lastCheckRef.current = new Date();
    } catch (error) {
      console.error("Error checking for new alerts:", error);
    }
  };

  const getSeverityToastType = (severity: string) => {
    switch (severity) {
      case "LOW":
        return "info" as const;
      case "MEDIUM":
        return "warning" as const;
      case "HIGH":
        return "error" as const;
      case "CRITICAL":
        return "error" as const;
      default:
        return "info" as const;
    }
  };

  const getSeverityDuration = (severity: string) => {
    switch (severity) {
      case "LOW":
        return 4000; // 4 secondes
      case "MEDIUM":
        return 6000; // 6 secondes
      case "HIGH":
        return 8000; // 8 secondes
      case "CRITICAL":
        return 10000; // 10 secondes
      default:
        return 5000;
    }
  };

  useEffect(() => {
    // Ne rien faire si l'utilisateur n'est pas admin
    if (!isAdmin) return;

    // Vérifier immédiatement
    checkForNewAlerts();

    // Puis vérifier toutes les 30 secondes
    const interval = setInterval(checkForNewAlerts, 30000);

    return () => clearInterval(interval);
  }, [isAdmin]);

  return {
    checkForNewAlerts,
  };
}
