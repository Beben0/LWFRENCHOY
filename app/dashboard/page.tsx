"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Translate } from "@/components/ui/translate";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  BookOpen,
  Calendar,
  Clock,
  Crown,
  Database,
  Download,
  Shield,
  Sword,
  Target,
  Train,
  Users,
  Zap,
} from "lucide-react";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { Children, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { useGuestPermissions } from "@/lib/hooks/use-guest-permissions";
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
  const guestPermissions = useGuestPermissions();
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Helper util
  const can = (p: Permission) =>
    session ? hasPermission(session, p) : guestPermissions.has(p as any);

  // ────────────────────────────────────────────────────────────────────────────
  // Guard: user must at least have view_dashboard perm to access page
  useEffect(() => {
    if (status === "loading") return;
    if (!can("view_dashboard")) redirect("/auth/signin");
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
            <Shield className="w-8 h-8 text-lastwar-orange" />{" "}
            <Translate>Dashboard</Translate>
          </h1>
          <p className="text-muted-foreground">
            <Translate>Bienvenue sur votre centre de contrôle</Translate>
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
            <AlertTriangle className="w-5 h-5 text-yellow-500" />{" "}
            <Translate>Alertes Système</Translate>
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
                        <Translate>{alert.title}</Translate>
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        <Translate>{alert.message}</Translate>
                      </p>
                    </div>
                    {alert.action && (
                      <Link href={alert.action}>
                        <Button size="sm" variant="outline">
                          <Translate>Corriger</Translate>
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
            label={<Translate>Membres actifs</Translate>}
            value={stats.activeMembers}
          />
        )}
        {can("view_events") && (
          <StatCard
            icon={Calendar}
            label={<Translate>Événements à venir</Translate>}
            value={stats.upcomingEvents}
            sub={<Translate>Prochain: </Translate>}
            subValue={nextEventDate}
          />
        )}
        {can("view_vs") && (
          <StatCard
            icon={Sword}
            label={<Translate>Guerre en cours</Translate>}
            value={
              stats.currentVS ? (
                stats.currentVS.enemyName
              ) : (
                <Translate>Aucun</Translate>
              )
            }
          />
        )}
        {alerts.length > 0 && (
          <StatCard
            icon={Bell}
            label={<Translate>Alertes</Translate>}
            value={stats.unreadAlerts}
          />
        )}
        {can("view_trains") && (
          <StatCard
            icon={Train}
            label={<Translate>Couverture trains</Translate>}
            value={`${stats.coveragePercent}%`}
          />
        )}
        {can("view_stats") && (
          <StatCard
            icon={Zap}
            label={<Translate>Puissance totale</Translate>}
            value={formatPower(stats.totalPower)}
          />
        )}
        {can("view_members") && (
          <StatCard
            icon={AlertTriangle}
            label={<Translate>Inactifs</Translate>}
            value={stats.inactiveMembers}
            color="text-yellow-400"
          />
        )}
      </div>

      {/* ---- 1. Événements & Trains ---- */}
      {(can("view_events") || can("view_trains")) && (
        <Section title={<Translate>Événements & Trains</Translate>}>
          {can("edit_event") && (
            <Tile
              permission="edit_event"
              href="/events-crud"
              icon={Calendar}
              label={<Translate>Planifier</Translate>}
            />
          )}
          {can("view_events") && (
            <Tile
              permission="view_events"
              href="/events"
              icon={Clock}
              label={<Translate>À venir</Translate>}
            />
          )}
          {can("view_trains") && (
            <Tile
              permission="view_trains"
              href="/trains"
              icon={Train}
              label={<Translate>Gestion trains</Translate>}
            />
          )}
          {can("view_trains") && (
            <Tile
              permission="view_trains"
              href="/trains-v2"
              icon={Zap}
              label={<Translate>Scheduler auto</Translate>}
            />
          )}
        </Section>
      )}

      {/* ---- 2. Guerre VS ---- */}
      {can("view_vs") && (
        <Section title={<Translate>VS (Guerre d'alliance)</Translate>}>
          <Tile
            permission="view_vs"
            href="/vs"
            icon={Sword}
            label={<Translate>Vue générale</Translate>}
          />
          {can("edit_vs") && (
            <Tile
              permission="edit_vs_week"
              href="/admin/vs"
              icon={Database}
              label={<Translate>Gestion VS</Translate>}
            />
          )}
          {can("edit_vs") && (
            <Tile
              permission="edit_vs"
              href="/admin/vs/quick-entry"
              icon={Zap}
              label={<Translate>Saisie rapide</Translate>}
            />
          )}
          {can("view_vs") && (
            <Tile
              permission="view_vs"
              href="/admin/vs/history"
              icon={Activity}
              label={<Translate>Historique</Translate>}
            />
          )}
        </Section>
      )}

      {/* ---- 2.5. Desert Storm ---- */}
      {can("view_desert_storm") && (
        <Section title={<Translate>Desert Storm</Translate>}>
          <Tile
            permission="view_desert_storm"
            href="/desert-storm"
            icon={Target}
            label={<Translate>Événements</Translate>}
          />
          {can("create_desert_storm") && (
            <Tile
              permission="create_desert_storm"
              href="/admin/desert-storm"
              icon={Crown}
              label={<Translate>Administration</Translate>}
            />
          )}
        </Section>
      )}

      {/* ---- 3. Membres ---- */}
      {can("view_members") && (
        <Section title={<Translate>Membres</Translate>}>
          <Tile
            permission="view_members"
            href="/members-crud"
            icon={Users}
            label={<Translate>Liste</Translate>}
          />
          <Tile
            permission="view_members"
            href="/members-crud?filter=inactive"
            icon={AlertTriangle}
            label={<Translate>Inactifs</Translate>}
          />
          {can("view_stats") && (
            <Tile
              permission="view_stats"
              href="/stats"
              icon={BarChart3}
              label={<Translate>Stats</Translate>}
            />
          )}
        </Section>
      )}
      {/* ---- 6. Aide ---- */}
      {can("view_help") && (
        <Section title={<Translate>Aide & Docs</Translate>}>
          {can("edit_help_article") && (
            <Tile
              permission="edit_help_article"
              href="/help/admin"
              icon={BookOpen}
              label={<Translate>Articles</Translate>}
            />
          )}
          <Tile
            permission="view_help"
            href="/help"
            icon={BookOpen}
            label={<Translate>Centre d'aide</Translate>}
          />
        </Section>
      )}

      {/* ---- 4. Outils & Scheduler ---- */}
      {(can("manage_alerts") || can("view_trains")) && (
        <Section title={<Translate>Outils & Scheduler</Translate>}>
          {can("manage_alerts") && <AlertSchedulerStatus />}
          {can("manage_alerts") && <TrainSchedulerStatus />}
          {can("view_dashboard") && (
            <Tile
              permission="view_dashboard"
              href="/admin/officers/hive-simulator"
              icon={Database}
              label={<Translate>Hive Simulator</Translate>}
            />
          )}
        </Section>
      )}

      {/* ---- 5. Administration ---- */}
      {(can("manage_users") || can("manage_permissions")) && (
        <Section title={<Translate>Administration</Translate>}>
          {can("manage_users") && (
            <Tile
              permission="manage_users"
              href="/admin/users"
              icon={Users}
              label={<Translate>Utilisateurs</Translate>}
            />
          )}
          {can("manage_users") && (
            <Tile
              permission="manage_users"
              href="/admin/invites"
              icon={Users}
              label={<Translate>Invitations</Translate>}
            />
          )}
          {can("manage_permissions") && (
            <Tile
              permission="manage_permissions"
              href="/admin/roles"
              icon={Shield}
              label={<Translate>Rôles & Perms</Translate>}
            />
          )}
          {can("manage_permissions") && (
            <Tile
              permission="manage_permissions"
              href="/admin/reference-data"
              icon={Database}
              label={<Translate>Données Ref.</Translate>}
            />
          )}
          {can("manage_permissions") && (
            <Tile
              permission="manage_permissions"
              href="/test-permissions"
              icon={Shield}
              label={<Translate>Test Permissions</Translate>}
            />
          )}
          {can("manage_alerts") && (
            <Tile
              permission="manage_alerts"
              href="/admin/alerts"
              icon={Bell}
              label={<Translate>Alertes</Translate>}
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
              label={<Translate>Sauvegarde</Translate>}
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
  label: ReactNode;
  value: any;
  color?: string;
  sub?: ReactNode;
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
  title: ReactNode;
  children: ReactNode;
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
  label: ReactNode;
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
