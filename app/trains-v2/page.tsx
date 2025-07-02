"use client";

import { FutureTrainSchedule } from "@/components/trains/future-train-schedule";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Translate } from "@/components/ui/translate";
import {
  Activity,
  AlertCircle,
  BarChart3,
  CheckCircle,
  Clock,
  Database,
  History,
  RefreshCw,
  Settings,
  Train,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface SchedulerStatus {
  isRunning: boolean;
  nextMaintenanceRun: string;
  nextStatusUpdate: string;
  lastRun?: string;
  config: {
    maintenanceInterval: number;
    statusUpdateInterval: number;
  };
}

interface TrainStats {
  total: number;
  byStatus: Record<string, number>;
  conductorAssignments: number;
  nextDeparture?: {
    date: string;
    conductor?: string;
    timeUntil: string;
  };
}

interface LogEntry {
  timestamp: string;
  level: "info" | "warning" | "error" | "success";
  message: string;
  action?: string;
}

export default function TrainSchedulerPage() {
  const [schedulerStatus, setSchedulerStatus] =
    useState<SchedulerStatus | null>(null);
  const [trainStats, setTrainStats] = useState<TrainStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [lastRefresh, setLastRefresh] = useState<string>(
    new Date().toISOString()
  );
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const addLog = (
    level: LogEntry["level"],
    message: string,
    action?: string
  ) => {
    const newLog: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      action,
    };
    setLogs((prev) => [newLog, ...prev].slice(0, 50)); // Garder seulement les 50 derniers logs
  };

  const loadSchedulerStatus = async () => {
    try {
      const response = await fetch("/api/admin/train-scheduler");
      if (response.ok) {
        const data = await response.json();
        setSchedulerStatus(data.scheduler);

        if (data.scheduler.isRunning) {
          addLog("success", "Scheduler actif", "status_check");
        } else {
          addLog("warning", "Scheduler inactif", "status_check");
        }
      } else {
        addLog("error", "Erreur lors du chargement du statut du scheduler");
      }
    } catch (error) {
      addLog("error", `Erreur de connexion: ${error}`);
      console.error("Erreur lors du chargement du statut:", error);
    }
  };

  const loadTrainStats = async () => {
    try {
      const response = await fetch("/api/trains-v2?daysAhead=7");
      if (response.ok) {
        const data = await response.json();

        const stats: TrainStats = {
          total: data.trains.length,
          byStatus: {},
          conductorAssignments: 0,
        };

        data.trains.forEach((train: any) => {
          stats.byStatus[train.status] =
            (stats.byStatus[train.status] || 0) + 1;
          if (train.conductor) {
            stats.conductorAssignments++;
          }
        });

        // Trouver le prochain départ
        const upcoming = data.trains
          .filter((t: any) => !t.metadata.isPast)
          .sort((a: any, b: any) => a.date.localeCompare(b.date))[0];

        if (upcoming) {
          stats.nextDeparture = {
            date: upcoming.date,
            conductor: upcoming.conductor?.pseudo,
            timeUntil:
              upcoming.metadata.timeUntilDeparture > 0
                ? `${Math.round(
                    upcoming.metadata.timeUntilDeparture / (1000 * 60 * 60)
                  )}h`
                : "Bientôt",
          };
        }

        setTrainStats(stats);
        addLog(
          "info",
          `${stats.total} trains chargés, ${stats.conductorAssignments} avec conducteur`
        );
      } else {
        addLog("error", "Erreur lors du chargement des statistiques trains");
      }
    } catch (error) {
      addLog("error", `Erreur de chargement: ${error}`);
      console.error("Erreur lors du chargement des stats:", error);
    }
  };

  const handleSchedulerAction = async (action: string) => {
    setActionLoading(true);
    addLog("info", `Démarrage de l'action: ${action}`, action);

    try {
      const response = await fetch("/api/admin/train-scheduler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (response.ok) {
        const result = await response.json();
        addLog("success", result.message || `Action ${action} réussie`, action);

        await loadSchedulerStatus();
        await loadTrainStats();
      } else {
        const error = await response.json();
        addLog(
          "error",
          error.error || `Erreur lors de l'action ${action}`,
          action
        );
      }
    } catch (error) {
      addLog(
        "error",
        `Erreur réseau lors de l'action ${action}: ${error}`,
        action
      );
      console.error(`Erreur lors de l'action ${action}:`, error);
    } finally {
      setActionLoading(false);
    }
  };

  const refreshData = async () => {
    setLoading(true);
    addLog("info", "Actualisation des données...");

    await Promise.all([loadSchedulerStatus(), loadTrainStats()]);
    setLastRefresh(new Date().toISOString());
    setLoading(false);

    addLog("success", "Données actualisées");
  };

  useEffect(() => {
    if (mounted) {
      refreshData();

      // Auto-refresh toutes les 30 secondes
      const interval = setInterval(refreshData, 30000);
      return () => clearInterval(interval);
    }
  }, [mounted]);

  const formatTime = (dateString: string | undefined) => {
    if (!dateString || !mounted) return "N/A";

    // Gérer les dates PostgreSQL (sans T) et les dates ISO (avec T)
    let date, datePart, timePart;

    if (dateString.includes("T")) {
      // Format ISO standard
      date = dateString.split("T");
      datePart = date[0].split("-");
      timePart = date[1] ? date[1].split(":") : ["00", "00"];
    } else {
      // Format PostgreSQL (espace au lieu de T)
      date = dateString.split(" ");
      datePart = date[0].split("-");
      timePart = date[1] ? date[1].split(":") : ["00", "00"];
    }

    return `${datePart[2]}/${datePart[1]} ${timePart[0]}:${timePart[1]}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SCHEDULED":
        return "bg-blue-500/20 text-blue-300";
      case "BOARDING":
        return "bg-orange-500/20 text-orange-300";
      case "DEPARTED":
        return "bg-green-500/20 text-green-300";
      case "COMPLETED":
        return "bg-gray-500/20 text-gray-300";
      case "CANCELLED":
        return "bg-red-500/20 text-red-300";
      default:
        return "bg-gray-500/20 text-gray-300";
    }
  };

  const getLogIcon = (level: LogEntry["level"]) => {
    switch (level) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case "warning":
        return <AlertCircle className="w-4 h-4 text-yellow-400" />;
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      default:
        return <Clock className="w-4 h-4 text-blue-400" />;
    }
  };

  const getLogColor = (level: LogEntry["level"]) => {
    switch (level) {
      case "success":
        return "text-green-300 bg-green-500/10 border-green-500/20";
      case "warning":
        return "text-yellow-300 bg-yellow-500/10 border-yellow-500/20";
      case "error":
        return "text-red-300 bg-red-500/10 border-red-500/20";
      default:
        return "text-blue-300 bg-blue-500/10 border-blue-500/20";
    }
  };

  if (!mounted) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Card>
          <CardContent className="p-6 text-center">
            <Train className="w-8 h-8 animate-spin mx-auto mb-2" />
            <p>Chargement du scheduler...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header avec actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <Translate>Scheduler Automatique</Translate>
          </h1>
          <p className="text-muted-foreground mt-1">
            <Translate>
              Système de génération et gestion automatique des trains
            </Translate>
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={refreshData}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <Translate>Actualiser</Translate>
          </Button>
          <Link href="/trains">
            <Button variant="secondary" className="flex items-center gap-2">
              <Train className="w-4 h-4" />
              <Translate>Voir les trains</Translate>
            </Button>
          </Link>
        </div>
      </div>

      {/* Statut du scheduler */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card
          className={`${
            schedulerStatus?.isRunning
              ? "border-green-500/30 bg-green-500/5"
              : "border-red-500/30 bg-red-500/5"
          }`}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              <Translate>Statut du Scheduler</Translate>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    schedulerStatus?.isRunning ? "default" : "destructive"
                  }
                  className="flex items-center gap-1"
                >
                  <div
                    className={`w-2 h-2 rounded-full ${
                      schedulerStatus?.isRunning
                        ? "bg-green-400 animate-pulse"
                        : "bg-red-400"
                    }`}
                  />
                  {schedulerStatus?.isRunning ? (
                    <Translate>ACTIF</Translate>
                  ) : (
                    <Translate>INACTIF</Translate>
                  )}
                </Badge>
              </div>

              {schedulerStatus && (
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">
                      <Translate>Prochaine maintenance:</Translate>
                    </span>
                    <div className="font-mono">
                      {formatTime(schedulerStatus.nextMaintenanceRun)}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">
                      <Translate>Prochaine MàJ statuts:</Translate>
                    </span>
                    <div className="font-mono">
                      {formatTime(schedulerStatus.nextStatusUpdate)}
                    </div>
                  </div>
                  {schedulerStatus.lastRun && (
                    <div>
                      <span className="text-muted-foreground">
                        <Translate>Dernière exécution:</Translate>
                      </span>
                      <div className="font-mono">
                        {formatTime(schedulerStatus.lastRun)}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                {schedulerStatus?.isRunning ? (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleSchedulerAction("stop")}
                    disabled={actionLoading}
                  >
                    <Translate>Arrêter</Translate>
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => handleSchedulerAction("start")}
                    disabled={actionLoading}
                  >
                    <Translate>Démarrer</Translate>
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions manuelles */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              <Translate>Actions Manuelles</Translate>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button
                variant="outline"
                onClick={() => handleSchedulerAction("maintenance_now")}
                disabled={actionLoading}
                className="w-full justify-start"
              >
                <Database className="w-4 h-4 mr-2" />
                <Translate>Maintenance Immédiate</Translate>
              </Button>
              <Button
                variant="outline"
                onClick={() => handleSchedulerAction("status_update_now")}
                disabled={actionLoading}
                className="w-full justify-start"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                <Translate>MàJ Statuts Immédiate</Translate>
              </Button>
              <div className="text-xs text-muted-foreground mt-2">
                <Translate>
                  Les actions manuelles s'exécutent en arrière-plan.
                </Translate>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistiques */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              <Translate>Statistiques</Translate>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {trainStats ? (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    <Translate>Total trains:</Translate>
                  </span>
                  <span className="font-bold">{trainStats.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    <Translate>Avec conducteur:</Translate>
                  </span>
                  <span className="font-bold">
                    {trainStats.conductorAssignments}/{trainStats.total}
                  </span>
                </div>

                {Object.entries(trainStats.byStatus).map(([status, count]) => (
                  <div key={status} className="flex justify-between">
                    <Badge variant="outline" className={getStatusColor(status)}>
                      <Translate>{status}</Translate>
                    </Badge>
                    <span className="font-bold">{count}</span>
                  </div>
                ))}

                {trainStats.nextDeparture && (
                  <div className="pt-2 border-t">
                    <div className="text-xs text-muted-foreground">
                      <Translate>Prochain départ:</Translate>
                    </div>
                    <div className="font-bold">
                      {trainStats.nextDeparture.timeUntil}
                    </div>
                    {trainStats.nextDeparture.conductor && (
                      <div className="text-sm text-muted-foreground">
                        <Translate>Conducteur:</Translate>{" "}
                        {trainStats.nextDeparture.conductor}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-muted-foreground">
                Chargement...
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Logs en temps réel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            <Translate>Logs en Temps Réel</Translate>
            <Badge variant="outline" className="ml-auto">
              {logs.length} <Translate>entrées</Translate>
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <div className="text-center text-muted-foreground py-4">
                <Translate>Aucun log pour le moment...</Translate>
              </div>
            ) : (
              logs.map((log, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-3 p-3 rounded-lg border ${getLogColor(
                    log.level
                  )}`}
                >
                  {getLogIcon(log.level)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs opacity-70">
                        {formatTime(log.timestamp)}
                      </span>
                      {log.action && (
                        <Badge variant="outline" className="text-xs">
                          {log.action}
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm">
                      <Translate from="auto">{log.message}</Translate>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Interface des trains */}
      <FutureTrainSchedule members={[]} />
    </div>
  );
}
