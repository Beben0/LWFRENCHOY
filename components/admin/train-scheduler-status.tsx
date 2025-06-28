"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Train } from "lucide-react";
import { useEffect, useState } from "react";

interface TrainSchedulerStatus {
  isRunning: boolean;
  nextStatusCheck?: string;
  nextDailyMaintenance?: string;
  lastStatusUpdate?: string;
  lastDailyMaintenance?: string;
}

export function TrainSchedulerStatus() {
  const [schedulerStatus, setSchedulerStatus] =
    useState<TrainSchedulerStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const loadStatus = async () => {
      try {
        const response = await fetch("/api/admin/train-scheduler");
        if (response.ok) {
          const data = await response.json();
          setSchedulerStatus({
            isRunning: data.scheduler.isRunning,
            nextStatusCheck: data.scheduler.nextStatusCheck,
            nextDailyMaintenance: data.scheduler.nextDailyMaintenance,
            lastStatusUpdate: data.scheduler.lastStatusUpdate,
            lastDailyMaintenance: data.scheduler.lastDailyMaintenance,
          });
        }
      } catch (error) {
        console.error("Erreur chargement statut train scheduler:", error);
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
              <p className="text-xs text-muted-foreground">Train Scheduler</p>
            </div>
            <Train className="h-8 w-8 text-muted-foreground animate-pulse" />
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
            <p className="text-xs text-muted-foreground">Train Scheduler</p>
          </div>
          <Train
            className={`h-8 w-8 ${
              schedulerStatus?.isRunning ? "text-green-400" : "text-red-400"
            }`}
          />
        </div>
        {schedulerStatus?.nextStatusCheck && mounted && (
          <div className="mt-2 text-xs text-muted-foreground">
            Prochaine MàJ:{" "}
            {new Date(schedulerStatus.nextStatusCheck).toLocaleTimeString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
