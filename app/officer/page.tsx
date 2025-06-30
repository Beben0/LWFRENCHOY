"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { hasPermission } from "@/lib/permissions";
import {
  Bell,
  BookOpen,
  Calendar,
  Clock,
  Hexagon,
  Shield,
  Sword,
  Train,
  Users,
} from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";

interface DashboardStats {
  activeMembers: number;
  upcomingEvents: number;
  currentVS: {
    title: string;
    enemyName: string;
    status: string;
  } | null;
  unreadAlerts: number;
  coveragePercent: number;
  totalPower: number;
  inactiveMembers: number;
}

export default function OfficerDashboard() {
  const { data: session, status } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;

    // Vérifier si l'utilisateur est R4 ou R5
    const member = (session?.user as any)?.member;
    const allianceRole = member?.allianceRole;

    if (!session || !hasPermission(session, "view_dashboard")) {
      redirect("/");
    }

    // Charger les stats
    loadStats();
  }, [session, status]);

  const loadStats = async () => {
    try {
      setLoading(true);

      // Charger les stats en parallèle
      const [membersRes, eventsRes, vsRes, alertsRes, statsRes] =
        await Promise.all([
          fetch("/api/members?status=ACTIVE&limit=1"),
          fetch("/api/events"),
          fetch("/api/vs"),
          fetch("/api/admin/alerts/unread"),
          fetch("/api/admin/stats"),
        ]);

      const membersData = await membersRes.json();
      const eventsData = await eventsRes.json();
      const vsData = await vsRes.json();
      const alertsData = await alertsRes.json();
      const statsData = statsRes.ok ? await statsRes.json() : null;

      // Trouver le VS en cours
      const currentVS = vsData.find((week: any) => week.status === "ACTIVE");

      // Compute local alerts similar to admin page
      const localAlerts: any[] = [];
      if (statsData) {
        if (statsData.inactiveMembers > 5) {
          localAlerts.push({
            type: "warning",
            title: "Membres inactifs",
            message: `${statsData.inactiveMembers} membres n'ont pas été vus depuis 7 jours`,
            action: "/members?filter=inactive",
          });
        }
        if (statsData.coveragePercent < 80) {
          localAlerts.push({
            type: "error",
            title: "Couverture des trains insuffisante",
            message: `Seulement ${statsData.coveragePercent}% des créneaux sont assignés`,
            action: "/trains",
          });
        }
        if (statsData.upcomingEvents === 0) {
          localAlerts.push({
            type: "info",
            title: "Aucun événement planifié",
            message: "Pensez à planifier les prochaines guerres d'alliance",
            action: "/events-crud",
          });
        }
      }

      setAlerts(localAlerts);

      setStats({
        activeMembers: membersData.pagination?.total || 0,
        upcomingEvents:
          eventsData.events?.filter((e: any) => new Date(e.date) > new Date())
            .length || 0,
        currentVS: currentVS
          ? {
              title: currentVS.title || `Semaine ${currentVS.weekNumber}`,
              enemyName: currentVS.enemyName || "Alliance inconnue",
              status: currentVS.status,
            }
          : null,
        unreadAlerts: localAlerts.length,
        coveragePercent: statsData?.coveragePercent ?? 0,
        totalPower: statsData?.totalPower ?? 0,
        inactiveMembers: statsData?.inactiveMembers ?? 0,
      });
    } catch (error) {
      console.error("Erreur lors du chargement des stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2" />
          <span>Chargement...</span>
        </div>
      </div>
    );
  }

  const member = (session?.user as any)?.member;
  const allianceRole = member?.allianceRole;

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Dashboard Officier</h1>
        <p className="text-muted-foreground">
          Bienvenue, {member?.pseudo || session?.user?.email} ({allianceRole})
        </p>
      </div>

      {/* Alertes systèmes */}
      {alerts.length > 0 && (
        <Card className="mb-6 border-orange-500/50 bg-orange-500/10">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-orange-500">
              <Bell className="w-5 h-5" />
              Alertes système
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm">
              {alerts.slice(0, 3).map((a, index) => (
                <li key={index}>
                  • {a.title}: {a.message}
                </li>
              ))}
            </ul>
            {/* Pas de lien détails pour officier */}
          </CardContent>
        </Card>
      )}

      {/* Stats rapides */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Membres actifs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" />
              <span className="text-2xl font-bold">
                {stats?.activeMembers || 0}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Événements à venir
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-500" />
              <span className="text-2xl font-bold">
                {stats?.upcomingEvents || 0}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Guerre VS en cours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Sword className="w-5 h-5 text-red-500" />
              <span className="text-lg font-semibold">
                {stats?.currentVS ? stats.currentVS.enemyName : "Aucune"}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Alertes système
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-orange-500" />
              <span className="text-2xl font-bold">
                {stats?.unreadAlerts || 0}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Couverture trains
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Train className="w-5 h-5 text-blue-500" />
              <span className="text-2xl font-bold">
                {stats?.coveragePercent || 0}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Puissance alliance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-yellow-500" />
              <span className="text-xl font-bold">
                {stats?.totalPower.toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sections principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Événements & Guerre */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-500" /> Événements &
              Guerre
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/events-crud" className="w-full">
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="w-4 h-4 mr-2" /> Planifier événement
              </Button>
            </Link>
            <Link href="/events" className="w-full">
              <Button variant="outline" className="w-full justify-start">
                <Clock className="w-4 h-4 mr-2" /> Événements à venir
              </Button>
            </Link>
            <Link href="/trains" className="w-full">
              <Button variant="outline" className="w-full justify-start">
                <Train className="w-4 h-4 mr-2" /> Gestion des trains
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Gestion VS */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              ⚔️ <span className="text-red-500">Gestion VS</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/admin/vs" className="w-full">
              <Button variant="outline" className="w-full justify-start">
                ⚔️<span className="ml-2">Gérer les VS</span>
              </Button>
            </Link>
            <Link href="/admin/vs/quick-entry" className="w-full">
              <Button variant="outline" className="w-full justify-start">
                ⚡<span className="ml-2">Saisie rapide points</span>
              </Button>
            </Link>
            <Link href="/vs" className="w-full">
              <Button variant="outline" className="w-full justify-start">
                📊<span className="ml-2">Classements</span>
              </Button>
            </Link>
            <Link href="/admin/vs/history" className="w-full">
              <Button variant="outline" className="w-full justify-start">
                📈<span className="ml-2">Historique complet</span>
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Outils Officiers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🛡️ <span className="text-green-500">Outils Officiers</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/admin/officers/hive-simulator" className="w-full">
              <Button variant="outline" className="w-full justify-start">
                <Hexagon className="w-4 h-4 mr-2" /> Hive Simulator
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Aide & Documentation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-amber-500" /> Aide &
              Documentation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/help" className="w-full">
              <Button variant="outline" className="w-full justify-start">
                <BookOpen className="w-4 h-4 mr-2" /> Centre d'aide
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
