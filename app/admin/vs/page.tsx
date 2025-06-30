"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { hasPermission } from "@/lib/permissions";
import { VSWeekStatus } from "@prisma/client";
import { BarChart, Calendar, History, Plus, Users } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";

interface VSWeek {
  id: string;
  startDate: string;
  endDate: string;
  title?: string;
  enemyName?: string;
  status: string;
  result?: string;
  _count: {
    participants: number;
  };
}

export default function VSAdminPage() {
  const { data: session, status } = useSession();
  const [activeWeeks, setActiveWeeks] = useState<VSWeek[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;
    if (!session || !hasPermission(session, "view_vs")) {
      redirect("/auth/signin");
      return;
    }
    loadActiveWeeks();
  }, [session, status]);

  const loadActiveWeeks = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/vs?status=${VSWeekStatus.ACTIVE}`);
      const data = await res.json();
      setActiveWeeks(data);
    } catch (e) {
      setActiveWeeks([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center p-8">Chargement du dashboard VS...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-red-400">⚔️ Gestion VS</h1>
        <Link href="/admin/vs/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nouveau VS
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Colonne de gauche: VS Actifs */}
        <div className="md:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                VS en cours
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activeWeeks.length > 0 ? (
                <div className="space-y-4">
                  {activeWeeks.map((week) => (
                    <div
                      key={week.id}
                      className="border p-4 rounded-lg bg-gray-800/50"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-semibold text-lg">
                            {week.title}
                          </h3>
                          <p className="text-sm text-gray-400">
                            VS {week.enemyName} (du{" "}
                            {new Date(week.startDate).toLocaleDateString(
                              "fr-FR"
                            )}{" "}
                            au{" "}
                            {new Date(week.endDate).toLocaleDateString("fr-FR")}
                            )
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          {week._count.participants} Participants
                        </div>
                      </div>
                      <div className="mt-4 flex gap-2">
                        <Link href={`/admin/vs/${week.id}`}>
                          <Button variant="outline" size="sm">
                            Voir les détails
                          </Button>
                        </Link>
                        <Link href="/admin/vs/quick-entry">
                          <Button variant="default" size="sm">
                            Saisie des points
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <p>Aucun VS en cours.</p>
                  <Link
                    href="/admin/vs/new"
                    className="mt-2 text-blue-400 hover:underline"
                  >
                    Lancer un nouveau VS
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Colonne de droite: Actions rapides */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Actions Rapides</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Link href="/admin/vs/quick-entry">
                <Button variant="outline" className="w-full justify-start">
                  ⚡ Saisie Rapide des Points
                </Button>
              </Link>
              <Link href="/admin/vs/history">
                <Button variant="outline" className="w-full justify-start">
                  <History className="w-4 h-4 mr-2" />
                  Historique complet
                </Button>
              </Link>
              <Link href="/vs">
                <Button variant="outline" className="w-full justify-start">
                  <BarChart className="w-4 h-4 mr-2" />
                  Voir les classements publics
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
