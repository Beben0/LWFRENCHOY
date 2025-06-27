"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Activity,
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  Download,
  FileText,
  RefreshCw,
  Train,
  TrendingDown,
  TrendingUp,
  Upload,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";

interface LogEntry {
  id: string;
  type: string;
  format: string;
  logType: "export" | "import";
  status: string;
  recordCount?: number;
  processedCount?: number;
  successCount?: number;
  errorCount?: number;
  skippedCount?: number;
  fileSize: string;
  originalName?: string;
  filename?: string;
  userEmail: string;
  duration: number;
  errorMessage?: string;
  errorDetails?: any;
  createdAt: string;
  completedAt?: string;
}

interface LogStats {
  totalExports: number;
  totalImports: number;
  recentExports: number;
  recentImports: number;
  failedExports: number;
  failedImports: number;
}

export default function ImportExportLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [stats, setStats] = useState<LogStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "export" | "import">("all");

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/admin/export-logs?type=${filter}&limit=20`
      );
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs);
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des logs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filter]);

  const getStatusBadge = (status: string, logType: "export" | "import") => {
    const variants: Record<string, any> = {
      COMPLETED: {
        className: "bg-green-100 text-green-800 border-green-200",
        icon: CheckCircle,
      },
      FAILED: {
        className: "bg-red-100 text-red-800 border-red-200",
        icon: AlertCircle,
      },
      IN_PROGRESS: {
        className: "bg-blue-100 text-blue-800 border-blue-200",
        icon: Clock,
      },
      PENDING: {
        className: "bg-gray-100 text-gray-800 border-gray-200",
        icon: Clock,
      },
    };

    const config = variants[status] || variants.PENDING;
    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${config.className}`}
      >
        <Icon className="w-3 h-3" />
        {status}
      </span>
    );
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, any> = {
      Membres: Users,
      Trains: Train,
      Événements: Calendar,
      Utilisateurs: Users,
      Complet: FileText,
    };
    return icons[type] || FileText;
  };

  const formatFileSize = (bytes: string) => {
    const size = parseInt(bytes);
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
    return `${Math.round(size / (1024 * 1024))} MB`;
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${Math.round(ms / 1000)}s`;
    return `${Math.round(ms / 60000)}min`;
  };

  const getSuccessRate = (log: LogEntry) => {
    if (log.logType === "export") return 100;
    if (!log.processedCount) return 0;
    return Math.round(((log.successCount || 0) / log.processedCount) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Statistiques */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Exports totaux</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {stats.totalExports}
                  </p>
                </div>
                <Download className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Imports totaux</p>
                  <p className="text-2xl font-bold text-green-600">
                    {stats.totalImports}
                  </p>
                </div>
                <Upload className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">24h récentes</p>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold text-blue-600">
                      {stats.recentExports}
                    </span>
                    <TrendingDown className="w-4 h-4 text-blue-600" />
                    <span className="text-lg font-semibold text-green-600">
                      {stats.recentImports}
                    </span>
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  </div>
                </div>
                <Activity className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Échecs</p>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold text-red-600">
                      {stats.failedExports}
                    </span>
                    <span className="text-gray-400">/</span>
                    <span className="text-lg font-semibold text-red-600">
                      {stats.failedImports}
                    </span>
                  </div>
                </div>
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtres */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Historique des opérations
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant={filter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("all")}
              >
                Tout
              </Button>
              <Button
                variant={filter === "export" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("export")}
              >
                Exports
              </Button>
              <Button
                variant={filter === "import" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("import")}
              >
                Imports
              </Button>
              <Button variant="outline" size="sm" onClick={fetchLogs}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Actualiser
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin" />
              <span className="ml-2">Chargement...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {logs.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  Aucune opération trouvée
                </p>
              ) : (
                logs.map((log) => {
                  const TypeIcon = getTypeIcon(log.type);
                  const successRate = getSuccessRate(log);

                  return (
                    <div
                      key={log.id}
                      className="border rounded-lg p-4 hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="flex items-center gap-2">
                            {log.logType === "export" ? (
                              <Download className="w-4 h-4 text-blue-700" />
                            ) : (
                              <Upload className="w-4 h-4 text-green-700" />
                            )}
                            <TypeIcon className="w-4 h-4 text-gray-700" />
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {log.logType === "export" ? "Export" : "Import"}{" "}
                                {log.type}
                              </span>
                              {getStatusBadge(log.status, log.logType)}
                            </div>
                            <div className="text-sm text-gray-700 space-y-1">
                              <div className="flex items-center gap-4">
                                <span>Par: {log.userEmail}</span>
                                <span>Format: {log.format.toUpperCase()}</span>
                                <span>
                                  Taille: {formatFileSize(log.fileSize)}
                                </span>
                                <span>
                                  Durée: {formatDuration(log.duration)}
                                </span>
                              </div>
                              {log.logType === "import" &&
                                log.processedCount !== undefined && (
                                  <div className="flex items-center gap-4">
                                    <span>Traités: {log.processedCount}</span>
                                    <span className="text-green-600">
                                      Succès: {log.successCount || 0}
                                    </span>
                                    {log.errorCount ? (
                                      <span className="text-red-600">
                                        Erreurs: {log.errorCount}
                                      </span>
                                    ) : null}
                                    <span
                                      className={`font-medium ${
                                        successRate >= 90
                                          ? "text-green-600"
                                          : successRate >= 70
                                          ? "text-yellow-600"
                                          : "text-red-600"
                                      }`}
                                    >
                                      Taux: {successRate}%
                                    </span>
                                  </div>
                                )}
                              {log.logType === "export" && (
                                <div>
                                  <span>
                                    Enregistrements: {log.recordCount || 0}
                                  </span>
                                </div>
                              )}
                            </div>
                            {log.errorMessage && (
                              <div className="text-sm text-red-600 bg-red-50 p-2 rounded mt-2">
                                <strong>Erreur:</strong> {log.errorMessage}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right text-sm text-gray-600">
                          <div className="font-medium">
                            {new Date(log.createdAt).toLocaleString("fr-FR")}
                          </div>
                          {log.completedAt &&
                            log.completedAt !== log.createdAt && (
                              <div className="text-xs text-gray-500">
                                Terminé:{" "}
                                {new Date(log.completedAt).toLocaleString(
                                  "fr-FR"
                                )}
                              </div>
                            )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
