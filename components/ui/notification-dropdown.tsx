"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { hasPermission } from "@/lib/permissions";
import { Bell, Check, CheckCheck, X } from "lucide-react";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

interface Alert {
  id: string;
  title: string;
  message: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  isRead: boolean;
  createdAt: string;
  rule: {
    name: string;
  };
}

export function NotificationDropdown() {
  const { data: session } = useSession();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Vérifier permission
  const canManageAlerts = hasPermission(session, "manage_alerts");

  const fetchAlerts = async () => {
    if (!canManageAlerts) return;

    try {
      const response = await fetch("/api/admin/alerts/unread");
      if (response.ok) {
        const data = await response.json();
        setAlerts(data.alerts || []);
        setUnreadCount(
          data.alerts?.filter((a: Alert) => !a.isRead).length || 0
        );
      }
    } catch (error) {
      console.error("Error fetching alerts:", error);
    }
  };

  useEffect(() => {
    if (canManageAlerts) {
      fetchAlerts();
      // Refresh toutes les 30 secondes
      const interval = setInterval(fetchAlerts, 30000);
      return () => clearInterval(interval);
    }
  }, [canManageAlerts]);

  const markAsRead = async (alertId: string) => {
    try {
      const response = await fetch("/api/admin/alerts/unread", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alertIds: [alertId] }),
      });

      if (response.ok) {
        setAlerts((prev) =>
          prev.map((alert) =>
            alert.id === alertId ? { ...alert, isRead: true } : alert
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Error marking alert as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      setLoading(true);
      const unreadIds = alerts.filter((a) => !a.isRead).map((a) => a.id);

      const response = await fetch("/api/admin/alerts/unread", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alertIds: unreadIds }),
      });

      if (response.ok) {
        setAlerts((prev) => prev.map((alert) => ({ ...alert, isRead: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Error marking all as read:", error);
    } finally {
      setLoading(false);
    }
  };

  const clearAlert = async (alertId: string) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== alertId));
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return "🔴";
      case "HIGH":
        return "🟠";
      case "MEDIUM":
        return "🟡";
      case "LOW":
        return "🟢";
      default:
        return "ℹ️";
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return "bg-red-500";
      case "HIGH":
        return "bg-orange-500";
      case "MEDIUM":
        return "bg-yellow-500";
      case "LOW":
        return "bg-green-500";
      default:
        return "bg-blue-500";
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `${diffMins}min`;
    if (diffHours < 24) return `${diffHours}h`;
    return `${diffDays}j`;
  };

  if (!canManageAlerts) {
    return null;
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge
            className={`absolute -top-1 -right-1 h-5 w-5 p-0 text-xs ${getSeverityColor(
              "HIGH"
            )} text-white`}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-2 w-96 max-h-96 overflow-hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
            {/* Header */}
            <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="font-semibold text-sm">
                Notifications ({unreadCount} non lues)
              </h3>
              <div className="flex items-center space-x-1">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    disabled={loading}
                    className="text-xs h-6 px-2"
                  >
                    <CheckCheck className="h-3 w-3 mr-1" />
                    Tout lire
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-80 overflow-y-auto">
              {alerts.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  Aucune notification
                </div>
              ) : (
                alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-3 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                      !alert.isRead ? "bg-blue-50 dark:bg-blue-900/20" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-sm">
                            {getSeverityIcon(alert.severity)}
                          </span>
                          <span className="font-medium text-sm truncate">
                            {alert.title}
                          </span>
                          {!alert.isRead && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                          )}
                        </div>

                        <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-1">
                          {alert.message}
                        </p>

                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            {formatTime(alert.createdAt)}
                          </span>
                          <span className="text-xs text-gray-500 truncate max-w-24">
                            {alert.rule.name}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1 ml-2">
                        {!alert.isRead && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsRead(alert.id)}
                            className="h-6 w-6 p-0 opacity-70 hover:opacity-100"
                            title="Marquer comme lu"
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => clearAlert(alert.id)}
                          className="h-6 w-6 p-0 opacity-70 hover:opacity-100"
                          title="Supprimer"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {alerts.length > 0 && (
              <div className="p-2 border-t border-gray-200 dark:border-gray-700">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsOpen(false);
                    window.location.href = "/admin/alerts";
                  }}
                  className="w-full text-xs"
                >
                  Voir toutes les alertes
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
