import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatPower, getTimeAgo } from "@/lib/utils";
import {
  AlertTriangle,
  BarChart3,
  Crown,
  Shield,
  Target,
  TrendingUp,
  User,
  Users,
  Zap,
} from "lucide-react";
import { redirect } from "next/navigation";

async function getStatsData() {
  const [
    topByPower,
    topByKills,
    topByLevel,
    inactiveMembers,
    specialtyStats,
    roleStats,
    powerEvolution,
  ] = await Promise.all([
    prisma.member.findMany({
      where: { status: "ACTIVE" },
      orderBy: { power: "desc" },
      take: 10,
      select: {
        id: true,
        pseudo: true,
        power: true,
        level: true,
        allianceRole: true,
        specialty: true,
      },
    }),
    prisma.member.findMany({
      where: { status: "ACTIVE" },
      orderBy: { kills: "desc" },
      take: 10,
      select: {
        id: true,
        pseudo: true,
        kills: true,
        level: true,
        allianceRole: true,
        specialty: true,
      },
    }),
    prisma.member.findMany({
      where: { status: "ACTIVE" },
      orderBy: { level: "desc" },
      take: 10,
      select: {
        id: true,
        pseudo: true,
        level: true,
        power: true,
        allianceRole: true,
      },
    }),
    prisma.member.findMany({
      where: {
        lastActive: {
          lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
      orderBy: { lastActive: "desc" },
      select: {
        id: true,
        pseudo: true,
        lastActive: true,
        allianceRole: true,
        level: true,
      },
    }),
    prisma.member.groupBy({
      by: ["specialty"],
      _count: true,
      _avg: {
        power: true,
        kills: true,
        level: true,
      },
      where: { status: "ACTIVE" },
    }),
    prisma.member.groupBy({
      by: ["allianceRole"],
      _count: true,
      _avg: {
        power: true,
        level: true,
      },
      where: { status: "ACTIVE" },
    }),
    prisma.allianceStats.findMany({
      orderBy: { createdAt: "desc" },
      take: 7,
    }),
  ]);

  // Calculs de statistiques globales
  const totalStats = await prisma.member.aggregate({
    _count: true,
    _sum: { power: true, kills: true },
    _avg: { level: true, power: true },
    where: { status: "ACTIVE" },
  });

  return {
    topByPower,
    topByKills,
    topByLevel,
    inactiveMembers,
    specialtyStats,
    roleStats,
    powerEvolution: powerEvolution.reverse(),
    totalStats,
  };
}

const getRoleIcon = (role: string) => {
  switch (role) {
    case "R5":
      return <Crown className="w-4 h-4 text-yellow-500" />;
    case "R4":
      return <Shield className="w-4 h-4 text-blue-500" />;
    default:
      return <User className="w-4 h-4 text-muted-foreground" />;
  }
};

const getSpecialtyColor = (specialty: string | null) => {
  switch (specialty) {
    case "Sniper":
      return "text-red-400";
    case "Tank":
      return "text-blue-400";
    case "Farmer":
      return "text-green-400";
    case "Defense":
      return "text-purple-400";
    case "Support":
      return "text-cyan-400";
    case "Scout":
      return "text-orange-400";
    default:
      return "text-muted-foreground";
  }
};

export default async function StatsPage() {
  const session = await auth();

  if (!session) {
    redirect("/auth/signin");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const stats = await getStatsData();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <BarChart3 className="w-8 h-8 text-lastwar-orange" />
          Statistiques d'Alliance
        </h1>
        <p className="text-muted-foreground">
          Analyses de performance et classements des membres
        </p>
      </div>

      {/* Global Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats.totalStats._count}</p>
                <p className="text-sm text-muted-foreground">Membres actifs</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Zap className="w-8 h-8 text-lastwar-orange" />
              <div>
                <p className="text-2xl font-bold power-display">
                  {formatPower(stats.totalStats._sum.power || 0n)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Puissance totale
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Target className="w-8 h-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold">
                  {(stats.totalStats._sum.kills || 0).toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Kills totaux</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">
                  {Math.round(stats.totalStats._avg.level || 0)}
                </p>
                <p className="text-sm text-muted-foreground">Niveau moyen</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Power */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-lastwar-orange" />
              Top Puissance
            </CardTitle>
            <CardDescription>Membres les plus puissants</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.topByPower.map((member, index) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-lastwar-orange text-black text-xs font-bold">
                      {index + 1}
                    </div>
                    {getRoleIcon(member.allianceRole)}
                    <div>
                      <p className="font-medium">{member.pseudo}</p>
                      <p className="text-xs text-muted-foreground">
                        Lvl {member.level} • {member.specialty || "Non définie"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold power-display">
                      {formatPower(member.power)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Kills */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-red-500" />
              Top Kills
            </CardTitle>
            <CardDescription>Meilleurs combattants PvP</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.topByKills.map((member, index) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-red-500 text-white text-xs font-bold">
                      {index + 1}
                    </div>
                    {getRoleIcon(member.allianceRole)}
                    <div>
                      <p className="font-medium">{member.pseudo}</p>
                      <p className="text-xs text-muted-foreground">
                        Lvl {member.level} • {member.specialty || "Non définie"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-red-400">
                      {member.kills.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Level */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              Top Niveau
            </CardTitle>
            <CardDescription>Membres les plus avancés</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.topByLevel.map((member, index) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-bold">
                      {index + 1}
                    </div>
                    {getRoleIcon(member.allianceRole)}
                    <div>
                      <p className="font-medium">{member.pseudo}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatPower(member.power)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-blue-400">{member.level}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Specialty Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Répartition par Spécialité</CardTitle>
            <CardDescription>
              Distribution des rôles dans l'alliance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.specialtyStats.map((stat) => (
                <div key={stat.specialty || "undefined"} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span
                      className={`font-medium ${getSpecialtyColor(
                        stat.specialty
                      )}`}
                    >
                      {stat.specialty || "Non définie"}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {stat._count} membres
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-lastwar-red to-lastwar-orange h-2 rounded-full"
                      style={{
                        width: `${
                          (stat._count / stats.totalStats._count) * 100
                        }%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>
                      Puissance moy: {formatPower(stat._avg.power || 0)}
                    </span>
                    <span>Kills moy: {Math.round(stat._avg.kills || 0)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Inactive Members Alert */}
        {stats.inactiveMembers.length > 0 && (
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                Membres Inactifs
              </CardTitle>
              <CardDescription>
                Membres inactifs depuis plus de 7 jours
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.inactiveMembers.slice(0, 8).map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      {getRoleIcon(member.allianceRole)}
                      <div>
                        <p className="font-medium">{member.pseudo}</p>
                        <p className="text-xs text-muted-foreground">
                          Lvl {member.level}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-destructive">
                        {getTimeAgo(member.lastActive)}
                      </p>
                    </div>
                  </div>
                ))}
                {stats.inactiveMembers.length > 8 && (
                  <p className="text-sm text-muted-foreground text-center">
                    ... et {stats.inactiveMembers.length - 8} autres
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
