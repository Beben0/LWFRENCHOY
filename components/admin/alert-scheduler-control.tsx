"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { AlertTriangle, Clock, Play, Settings, Square } from "lucide-react";
import { useEffect, useState } from "react";

interface SchedulerStatus {
  isRunning: boolean;
  lastRun: string | null;
  intervalMinutes: number;
  nextRun: string | null;
}

export function AlertSchedulerControl() {
  const [status, setStatus] = useState<SchedulerStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [intervalMinutes, setIntervalMinutes] = useState(2);

  useEffect(() => {
    fetchStatus();
    // Actualiser le statut toutes les 30 secondes
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await fetch("/api/admin/alerts/scheduler");
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
        setIntervalMinutes(data.intervalMinutes);
      }
    } catch (error) {
      console.error("Error fetching scheduler status:", error);
    }
  };

  const controlScheduler = async (action: string, interval?: number) => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/alerts/scheduler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          intervalMinutes: interval || intervalMinutes,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setStatus(result.status);
        console.log(result.message);
      } else {
        console.error("Error controlling scheduler");
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const runManualCheck = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/alerts/check", {
        method: "POST",
      });

      if (response.ok) {
        console.log("Manual alert check completed");
        fetchStatus(); // Actualiser le statut
      } else {
        console.error("Error running manual check");
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!status) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-400">Chargement du statut...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Clock className="w-5 h-5" />
          Surveillance Automatique des Alertes
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Statut actuel */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge
              variant={status.isRunning ? "default" : "secondary"}
              className={
                status.isRunning
                  ? "bg-green-600 text-white"
                  : "bg-gray-600 text-gray-300"
              }
            >
              {status.isRunning ? "En cours" : "Arrêté"}
            </Badge>
            <span className="text-gray-300">
              Vérification toutes les {status.intervalMinutes} minutes
            </span>
          </div>
        </div>

        {/* Informations de timing */}
        {status.lastRun && (
          <div className="space-y-2 text-sm text-gray-400">
            <div className="flex justify-between">
              <span>Dernière vérification:</span>
              <span>{formatDate(new Date(status.lastRun))}</span>
            </div>
            {status.nextRun && status.isRunning && (
              <div className="flex justify-between">
                <span>Prochaine vérification:</span>
                <span>{formatDate(new Date(status.nextRun))}</span>
              </div>
            )}
          </div>
        )}

        {/* Configuration de l'intervalle */}
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-300 min-w-fit">
            Intervalle (minutes):
          </label>
          <input
            type="number"
            min="1"
            max="60"
            value={intervalMinutes}
            onChange={(e) => setIntervalMinutes(Number(e.target.value))}
            className="w-20 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => controlScheduler("configure", intervalMinutes)}
            disabled={loading}
            className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
          >
            <Settings className="w-4 h-4 mr-1" />
            Appliquer
          </Button>
        </div>

        {/* Contrôles */}
        <div className="flex gap-3">
          <Button
            variant={status.isRunning ? "secondary" : "default"}
            onClick={() =>
              controlScheduler(status.isRunning ? "stop" : "start")
            }
            disabled={loading}
            className={
              status.isRunning
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-green-600 hover:bg-green-700 text-white"
            }
          >
            {status.isRunning ? (
              <>
                <Square className="w-4 h-4 mr-2" />
                Arrêter
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Démarrer
              </>
            )}
          </Button>

          <Button
            variant="outline"
            onClick={() => controlScheduler("restart")}
            disabled={loading}
            className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
          >
            <Clock className="w-4 h-4 mr-2" />
            Redémarrer
          </Button>

          <Button
            variant="outline"
            onClick={runManualCheck}
            disabled={loading}
            className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
          >
            <AlertTriangle className="w-4 h-4 mr-2" />
            Vérification manuelle
          </Button>
        </div>

        {/* Avertissement si arrêté */}
        {!status.isRunning && (
          <div className="p-3 bg-yellow-900/50 border border-yellow-700 rounded-lg">
            <div className="flex items-center gap-2 text-yellow-400">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm">
                La surveillance automatique est arrêtée. Les alertes ne seront
                pas déclenchées automatiquement.
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
