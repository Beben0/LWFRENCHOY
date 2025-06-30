"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Sword,
  Train,
  Users,
  Zap,
} from "lucide-react";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Children, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { hasPermission, type Permission } from "@/lib/permissions";

// Lazy-loaded status components (admin tools)
const AlertSchedulerStatus = dynamic(
  () =>
    import("@/components/admin/alert-scheduler-status").then(
      (mod) => mod.AlertSchedulerStatus
    ),
  { ssr: false }
);

const TrainSchedulerStatus = dynamic(
  () =>
    import("@/components/admin/train-scheduler-status").then(
      (mod) => mod.TrainSchedulerStatus
    ),
  { ssr: false }
);

interface StatsResponse {
  activeMembers: number;
  upcomingEvents: number;
  unreadAlerts: number;
  currentVS: { enemyName: string } | null;
  coveragePercent: number;
  totalPower: number;
  inactiveMembers: number;
}

export default function UnifiedDashboard() {
  const { data: session, status } = useSession();
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Helper util
  const can = (p: Permission) => hasPermission(session, p);

  // ────────────────────────────────────────────────────────────────────────────
  // Guard: user must at least have view_dashboard perm to access page
  useEffect(() => {
    if (status === "loading") return;
    if (!session || !can("view_dashboard")) redirect("/auth/signin");
  }, [status, session]);

  // ────────────────────────────────────────────────────────────────────────────
  // Stats fetch (only once)
  useEffect(() => {
    if (status === "loading") return;
    (async () => {
      try {
        setLoading(true);

        const [membersRes, eventsRes, vsRes, statsRes] = await Promise.all([
          fetch("/api/members?status=ACTIVE&limit=1"),
          fetch("/api/events"),
          fetch("/api/vs"),
          fetch("/api/admin/stats"),
        ]);

        const membersData = await membersRes.json();
        const eventsData = await eventsRes.json();
        const vsData = await vsRes.json();
        const statsData = statsRes.ok ? await statsRes.json() : null;

        const currentVS = vsData.find((w: any) => w.status === "ACTIVE");

        // Build alerts like before
        const localAlerts: any[] = [];
        if (statsData) {
          if (statsData.inactiveMembers > 5) {
            localAlerts.push({
              type: "warning",
              title: "Membres inactifs",
              message: `${statsData.inactiveMembers} membres inactifs`,
              action: "/members?filter=inactive",
            });
          }
          if (statsData.coveragePercent < 80) {
            localAlerts.push({
              type: "error",
              title: "Couverture trains basse",
              message: `${statsData.coveragePercent}% couverte`,
              action: "/trains",
            });
          }
          if (statsData.upcomingEvents === 0) {
            localAlerts.push({
              type: "info",
              title: "Aucun évènement planifié",
              message: "Planifier la prochaine guerre",
              action: "/events-crud",
            });
          }
        }

        setAlerts(localAlerts);
        setStats({
          activeMembers: membersData.pagination?.total ?? 0,
          upcomingEvents:
            eventsData.events?.filter((e: any) => new Date(e.date) > new Date())
              .length ?? 0,
          unreadAlerts: localAlerts.length,
          currentVS: currentVS
            ? { enemyName: currentVS.enemyName || "Inconnu" }
            : null,
          coveragePercent: statsData?.coveragePercent ?? 0,
          totalPower: statsData?.totalPower ?? 0,
          inactiveMembers: statsData?.inactiveMembers ?? 0,
        });
      } catch (err) {
        console.error("Dashboard stats error:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [status]);

  if (status === "loading" || loading || !stats) {
    return (
      <div className="container mx-auto p-6 flex items-center gap-2">
        <Shield className="w-5 h-5 animate-spin" /> Chargement…
      </div>
    );
  }

  const nextEventDate =
    stats.upcomingEvents > 0
      ? new Date(eventsNext(stats)).toLocaleDateString()
      : "—";

  const member = (session?.user as any)?.member;
  const displayName = member?.pseudo || session?.user?.email || "Utilisateur";
  const adminRole = (session?.user?.role as string) || "";
  const allianceRole = member?.allianceRole || "";

  // ────────────────────────────────────────────────────────────────────────────
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold lastwar-gradient bg-clip-text text-transparent flex items-center gap-2">
            <Shield className="w-8 h-8 text-lastwar-orange" /> Dashboard
          </h1>
          <p className="text-muted-foreground">
            Bienvenue sur votre centre de contrôle
            {displayName && (
              <span className="ml-1 font-semibold text-foreground">
                {displayName}
              </span>
            )}
            {(adminRole || allianceRole) && (
              <span className="ml-2 text-xs text-muted-foreground">
                [{adminRole && <span>{adminRole}</span>}
                {adminRole && allianceRole && <span> • </span>}
                {allianceRole && <span>{allianceRole}</span>}]
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Alertes système - style admin */}
      {alerts.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500" /> Alertes
            Système
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
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {alert.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {alert.message}
                      </p>
                    </div>
                    {alert.action && (
                      <Link href={alert.action}>
                        <Button size="sm" variant="outline">
                          Corriger
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Quick stats (each card gated) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {can("view_members") && (
          <StatCard
            icon={Users}
            label="Membres actifs"
            value={stats.activeMembers}
          />
        )}
        {can("view_events") && (
          <StatCard
            icon={Calendar}
            label="Événements à venir"
            value={stats.upcomingEvents}
            sub="Prochain: "
            subValue={nextEventDate}
          />
        )}
        {can("view_vs") && (
          <StatCard
            icon={Sword}
            label="VS en cours"
            value={stats.currentVS ? stats.currentVS.enemyName : "Aucun"}
          />
        )}
        {alerts.length > 0 && (
          <StatCard icon={Bell} label="Alertes" value={stats.unreadAlerts} />
        )}
        {can("view_trains") && (
          <StatCard
            icon={Train}
            label="Couverture trains"
            value={`${stats.coveragePercent}%`}
          />
        )}
        {can("view_stats") && (
          <StatCard
            icon={Zap}
            label="Puissance totale"
            value={formatPower(stats.totalPower)}
          />
        )}
        {can("view_members") && (
          <StatCard
            icon={AlertTriangle}
            label="Inactifs"
            value={stats.inactiveMembers}
            color="text-yellow-400"
          />
        )}
      </div>

      {/* ---- 1. Événements & Trains ---- */}
      {(can("view_events") || can("view_trains")) && (
        <Section title="Événements & Trains">
          {can("edit_event") && (
            <Tile
              permission="edit_event"
              href="/events-crud"
              icon={Calendar}
              label="Planifier"
            />
          )}
          {can("view_events") && (
            <Tile
              permission="view_events"
              href="/events"
              icon={Clock}
              label="À venir"
            />
          )}
          {can("view_trains") && (
            <Tile
              permission="view_trains"
              href="/trains"
              icon={Train}
              label="Gestion trains"
            />
          )}
          {can("view_trains") && (
            <Tile
              permission="view_trains"
              href="/trains-v2"
              icon={Zap}
              label="Scheduler auto"
            />
          )}
        </Section>
      )}

      {/* ---- 2. Guerre VS ---- */}
      {can("view_vs") && (
        <Section title="VS (Guerre d'alliance)">
          <Tile
            permission="view_vs"
            href="/vs"
            icon={Sword}
            label="Vue générale"
          />
          {can("edit_vs") && (
            <Tile
              permission="edit_vs_week"
              href="/admin/vs"
              icon={Database}
              label="Gestion VS"
            />
          )}
          {can("edit_vs") && (
            <Tile
              permission="edit_vs"
              href="/admin/vs/quick-entry"
              icon={Zap}
              label="Saisie rapide"
            />
          )}
          {can("view_vs") && (
            <Tile
              permission="view_vs"
              href="/admin/vs/history"
              icon={Activity}
              label="Historique"
            />
          )}
        </Section>
      )}

      {/* ---- 3. Membres ---- */}
      {can("view_members") && (
        <Section title="Membres">
          <Tile
            permission="view_members"
            href="/members-crud"
            icon={Users}
            label="Liste"
          />
          <Tile
            permission="view_members"
            href="/members-crud?filter=inactive"
            icon={AlertTriangle}
            label="Inactifs"
          />
          {can("view_stats") && (
            <Tile
              permission="view_stats"
              href="/stats"
              icon={BarChart3}
              label="Stats"
            />
          )}
        </Section>
      )}
      {/* ---- 6. Aide ---- */}
      {can("view_help") && (
        <Section title="Aide & Docs">
          {can("edit_help_article") && (
            <Tile
              permission="edit_help_article"
              href="/help/admin"
              icon={BookOpen}
              label="Articles"
            />
          )}
          <Tile
            permission="view_help"
            href="/help"
            icon={BookOpen}
            label="Centre d'aide"
          />
        </Section>
      )}

      {/* ---- 4. Outils & Scheduler ---- */}
      {(can("manage_alerts") || can("view_trains")) && (
        <Section title="Outils & Scheduler">
          {can("manage_alerts") && <AlertSchedulerStatus />}
          {can("manage_alerts") && <TrainSchedulerStatus />}
          {can("view_dashboard") && (
            <Tile
              permission="view_dashboard"
              href="/admin/officers/hive-simulator"
              icon={Database}
              label="Hive Simulator"
            />
          )}
        </Section>
      )}

      {/* ---- 5. Administration ---- */}
      {(can("manage_users") || can("manage_permissions")) && (
        <Section title="Administration">
          {can("manage_users") && (
            <Tile
              permission="manage_users"
              href="/admin/users"
              icon={Users}
              label="Utilisateurs"
            />
          )}
          {can("manage_users") && (
            <Tile
              permission="manage_users"
              href="/admin/invites"
              icon={Users}
              label="Invitations"
            />
          )}
          {can("manage_permissions") && (
            <Tile
              permission="manage_permissions"
              href="/admin/roles"
              icon={Shield}
              label="Rôles & Perms"
            />
          )}
          {can("manage_permissions") && (
            <Tile
              permission="manage_permissions"
              href="/admin/reference-data"
              icon={Database}
              label="Données Ref."
            />
          )}
          {can("manage_alerts") && (
            <Tile
              permission="manage_alerts"
              href="/admin/alerts"
              icon={Bell}
              label="Alertes"
            />
          )}
          {(can("export_data") || can("import_data")) && (
            <Tile
              permission={
                can("export_data")
                  ? ("export_data" as any)
                  : ("import_data" as any)
              }
              href="/admin/import-export"
              icon={Download}
              label="Sauvegarde"
            />
          )}
        </Section>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Helper components
interface StatCardProps {
  icon: any;
  label: string;
  value: any;
  color?: string;
  sub?: string;
  subValue?: any;
}

function StatCard({
  icon: Icon,
  label,
  value,
  color = "text-blue-500",
  sub,
  subValue,
}: StatCardProps) {
  return (
    <Card>
      <CardHeader className="pb-1">
        <CardTitle className="text-xs text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Icon className={`w-5 h-5 ${color}`} />
          <span className="text-xl font-bold">{value}</span>
        </div>
        {sub && (
          <span className="text-[10px] text-muted-foreground">
            {sub} {subValue}
          </span>
        )}
      </CardContent>
    </Card>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const visibleChildren = Children.toArray(children).filter(Boolean);
  if (visibleChildren.length === 0) return null;

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {visibleChildren}
      </div>
    </div>
  );
}

function Tile({
  permission,
  href,
  icon: Icon,
  label,
}: {
  permission: Permission;
  href: string;
  icon: any;
  label: string;
}) {
  const { data: session } = useSession();

  // Si l'utilisateur n'a pas la permission, ne pas afficher le lien
  if (!hasPermission(session, permission)) return null;

  return (
    <Link href={href}>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="flex flex-col items-center justify-center p-6 gap-2">
          <Icon className="w-6 h-6 text-lastwar-orange" />
          <span className="text-sm font-medium text-center">{label}</span>
        </CardContent>
      </Card>
    </Link>
  );
}

function formatPower(p: number | bigint) {
  const n = typeof p === "bigint" ? Number(p) : p;
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toLocaleString();
}

function eventsNext(stats: any) {
  // placeholder: we don't have event dates here; return now
  return Date.now();
}
