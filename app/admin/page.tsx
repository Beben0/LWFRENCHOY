"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { hasPermission } from "@/lib/permissions";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  BookOpen,
  Calendar,
  Clock,
  Database,
  Download,
  Shield,
  Train,
  Users,
  Zap,
} from "lucide-react";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";

// Import client-only pour éviter les erreurs d'hydratation
const AlertSchedulerStatus = dynamic(
  () =>
    import("@/components/admin/alert-scheduler-status").then(
      (mod) => mod.AlertSchedulerStatus
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <span>Chargement...</span>
      </div>
    ),
  }
);

const TrainSchedulerStatus = dynamic(
  () =>
    import("@/components/admin/train-scheduler-status").then(
      (mod) => mod.TrainSchedulerStatus
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <span>Chargement...</span>
      </div>
    ),
  }
);

// Fonction pour formater la puissance
function formatPower(power: number | bigint): string {
  const num = typeof power === "bigint" ? Number(power) : power;
  if (num >= 1000000000) {
    return `${(num / 1000000000).toFixed(1)}B`;
  } else if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toLocaleString();
}

interface AdminStats {
  totalMembers: number;
  activeMembers: number;
  totalEvents: number;
  upcomingEvents: number;
  trainSlots: number;
  assignedSlots: number;
  totalPower: number;
  inactiveMembers: number;
  recentActivity: number;
  coveragePercent: number;
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (status === "loading") return;

    if (!session || !hasPermission(session, "view_admin_panel")) {
      redirect("/auth/signin");
      return;
    }

    const loadStats = async () => {
      try {
        const response = await fetch("/api/admin/stats");
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error("Erreur chargement stats admin:", error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [session, status]);

  if (!mounted || status === "loading" || loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Card>
          <CardContent className="p-6 text-center">
            <Shield className="w-8 h-8 animate-spin mx-auto mb-2" />
            <p>Chargement du dashboard...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!session || !hasPermission(session, "view_admin_panel")) {
    redirect("/auth/signin");
    return null;
  }

  if (!stats) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Card>
          <CardContent className="p-6 text-center">
            <p>Erreur lors du chargement des statistiques</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Alertes système
  const alerts = [];

  if (stats.inactiveMembers > 5) {
    alerts.push({
      type: "warning",
      title: "Membres inactifs",
      message: `${stats.inactiveMembers} membres n'ont pas été vus depuis 7 jours`,
      action: "/admin/users?filter=inactive",
    });
  }

  if (stats.coveragePercent < 80) {
    alerts.push({
      type: "error",
      title: "Couverture des trains insuffisante",
      message: `Seulement ${stats.coveragePercent}% des créneaux sont assignés`,
      action: "/trains",
    });
  }

  if (stats.upcomingEvents === 0) {
    alerts.push({
      type: "info",
      title: "Aucun événement planifié",
      message: "Pensez à planifier les prochaines guerres d'alliance",
      action: "/events-crud",
    });
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold lastwar-gradient bg-clip-text text-transparent flex items-center gap-2">
            <Shield className="w-8 h-8 text-lastwar-orange" />
            Frenchoy - Dashboard
          </h1>
          <p className="text-muted-foreground">
            Centre de contrôle de FROY Frenchoy
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/import-export">
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Sauvegarde
            </Button>
          </Link>
        </div>
      </div>

      {/* Alertes système */}
      {alerts.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            Alertes Système
          </h2>
          <div className="grid grid-cols-1 gap-3">
            {alerts.map((alert, index) => (
              <Card
                key={index}
                className={`border-l-4 ${
                  alert.type === "error"
                    ? "border-l-red-500 bg-red-50/10"
                    : alert.type === "warning"
                    ? "border-l-yellow-500 bg-yellow-50/10"
                    : "border-l-blue-500 bg-blue-50/10"
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {alert.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {alert.message}
                      </p>
                    </div>
                    <Link href={alert.action}>
                      <Button size="sm" variant="outline">
                        Corriger
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-lastwar-green">
                  {stats.totalMembers}
                </p>
                <p className="text-xs text-muted-foreground">Total Membres</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              {stats.activeMembers} actifs • {stats.inactiveMembers} inactifs
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-lastwar-orange">
                  {formatPower(stats.totalPower)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Puissance Totale
                </p>
              </div>
              <Zap className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              Force de l'alliance
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-blue-400">
                  {stats.assignedSlots}/{stats.trainSlots}
                </p>
                <p className="text-xs text-muted-foreground">Trains Assignés</p>
              </div>
              <Train className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              {stats.coveragePercent}% de couverture
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-purple-400">
                  {stats.recentActivity}
                </p>
                <p className="text-xs text-muted-foreground">Actifs (24h)</p>
              </div>
              <Activity className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              membres connectés
            </div>
          </CardContent>
        </Card>

        {/* Statut Alert Scheduler */}
        <AlertSchedulerStatus />

        {/* Statut Train Scheduler */}
        <TrainSchedulerStatus />
      </div>

      {/* Actions rapides */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Gestion des Membres */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" />
              Gestion des Membres
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 gap-2">
              <Link href="/members-crud" className="w-full">
                <Button variant="outline" className="w-full justify-start">
                  <Users className="w-4 h-4 mr-2" />
                  Voir tous les membres
                </Button>
              </Link>
              <Link href="/members-crud?filter=inactive" className="w-full">
                <Button variant="outline" className="w-full justify-start">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Membres inactifs ({stats.inactiveMembers})
                </Button>
              </Link>
              <Link href="/stats" className="w-full">
                <Button variant="outline" className="w-full justify-start">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Statistiques détaillées
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Gestion des Événements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-green-500" />
              Événements & Guerre
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 gap-2">
              <Link href="/events-crud" className="w-full">
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="w-4 h-4 mr-2" />
                  Planifier événement
                </Button>
              </Link>
              <Link href="/events" className="w-full">
                <Button variant="outline" className="w-full justify-start">
                  <Clock className="w-4 h-4 mr-2" />
                  Événements à venir ({stats.upcomingEvents})
                </Button>
              </Link>
              <Link href="/trains" className="w-full">
                <Button variant="outline" className="w-full justify-start">
                  <Train className="w-4 h-4 mr-2" />
                  Gestion des trains
                </Button>
              </Link>
              <Link href="/trains-v2" className="w-full">
                <Button variant="outline" className="w-full justify-start">
                  <Zap className="w-4 h-4 mr-2" />
                  Scheduler automatique
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Administration Système */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-500" />
              Administration Système
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 gap-2">
              <Link href="/admin/users" className="w-full">
                <Button variant="outline" className="w-full justify-start">
                  <Users className="w-4 h-4 mr-2" />
                  Comptes utilisateurs
                </Button>
              </Link>
              <Link href="/admin/invites" className="w-full">
                <Button variant="outline" className="w-full justify-start">
                  <Users className="w-4 h-4 mr-2" />
                  Liens d'invitation
                </Button>
              </Link>
              <Link href="/admin/roles" className="w-full">
                <Button variant="outline" className="w-full justify-start">
                  <Shield className="w-4 h-4 mr-2" />
                  Rôles et permissions
                </Button>
              </Link>
              <Link href="/admin/reference-data" className="w-full">
                <Button variant="outline" className="w-full justify-start">
                  <Database className="w-4 h-4 mr-2" />
                  Données de référence
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Aide et Documentation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-amber-500" />
              Aide et Documentation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 gap-2">
              <Link href="/help/admin" className="w-full">
                <Button variant="outline" className="w-full justify-start">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Gestion des articles
                </Button>
              </Link>
              <Link href="/help" className="w-full">
                <Button variant="outline" className="w-full justify-start">
                  <BookOpen className="w-4 h-4 mr-2" />
                  Centre d'aide
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Section Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-500" />
            Système de Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/admin/alerts" className="w-full">
              <Button variant="outline" className="w-full justify-start">
                <Bell className="w-4 h-4 mr-2" />
                Gestion des alertes
              </Button>
            </Link>
            <Link href="/admin/notifications" className="w-full">
              <Button variant="outline" className="w-full justify-start">
                <Bell className="w-4 h-4 mr-2" />
                Configuration Discord
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
