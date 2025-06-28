"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Bell } from "lucide-react";
import { useEffect, useState } from "react";

interface SchedulerStatus {
  isRunning: boolean;
  nextRun?: string;
  lastRun?: string;
}

export function AlertSchedulerStatus() {
  const [schedulerStatus, setSchedulerStatus] =
    useState<SchedulerStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const loadStatus = async () => {
      try {
        const response = await fetch("/api/admin/alerts/scheduler");
        if (response.ok) {
          const data = await response.json();
          setSchedulerStatus({
            isRunning: data.isRunning,
            nextRun: data.nextRun,
            lastRun: data.lastRun,
          });
        }
      } catch (error) {
        console.error("Erreur chargement statut alert scheduler:", error);
      } finally {
        setLoading(false);
      }
    };

    loadStatus();
    // Refresh toutes les 30 secondes
    const interval = setInterval(loadStatus, 30000);
    return () => clearInterval(interval);
  }, [mounted]);

  if (!mounted || loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-400">...</p>
              <p className="text-xs text-muted-foreground">Alert Scheduler</p>
            </div>
            <Bell className="h-8 w-8 text-muted-foreground animate-pulse" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={`${
        schedulerStatus?.isRunning
          ? "border-green-500/30 bg-green-500/5"
          : "border-red-500/30 bg-red-500/5"
      }`}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div
                className={`w-3 h-3 rounded-full ${
                  schedulerStatus?.isRunning
                    ? "bg-green-400 animate-pulse"
                    : "bg-red-400"
                }`}
              />
              <p className="text-2xl font-bold">
                {schedulerStatus?.isRunning ? "ACTIF" : "INACTIF"}
              </p>
            </div>
            <p className="text-xs text-muted-foreground">Alert Scheduler</p>
          </div>
          <Bell
            className={`h-8 w-8 ${
              schedulerStatus?.isRunning ? "text-green-400" : "text-red-400"
            }`}
          />
        </div>
        {schedulerStatus?.nextRun && mounted && (
          <div className="mt-2 text-xs text-muted-foreground">
            Prochaine vérification:{" "}
            {new Date(schedulerStatus.nextRun).toLocaleTimeString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
