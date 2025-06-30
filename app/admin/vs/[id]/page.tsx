"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { hasPermission } from "@/lib/permissions";
import { ArrowLeft, Users } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { redirect, useParams } from "next/navigation";
import { useEffect, useState } from "react";

interface VSParticipantDay {
  dayNumber: number;
  mvpPoints: number;
}

interface VSParticipant {
  memberId: string;
  member: {
    pseudo: string;
  };
  dailyResults: VSParticipantDay[];
}

interface VSWeekDetails {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  enemyName: string;
  allianceScore: number;
  enemyScore: number;
  participants: VSParticipant[];
}

export default function VSWeekDetailPage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const vsWeekId = params.id as string;

  const [weekDetails, setWeekDetails] = useState<VSWeekDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (status === "loading") return;
    if (!session || !hasPermission(session, "view_vs")) {
      redirect("/auth/signin");
      return;
    }
    loadWeekDetails();
  }, [session, status, vsWeekId]);

  const loadWeekDetails = async () => {
    setLoading(true);
    try {
      console.log("DEBUG Client - Début appel API");
      const res = await fetch(`/api/vs/${vsWeekId}`);
      console.log("DEBUG Client - Réponse reçue, status:", res.status);

      if (!res.ok) {
        const errorData = await res
          .json()
          .catch((e) => ({ error: "Impossible de lire l'erreur" }));
        console.error("DEBUG Client - Erreur API détaillée:", errorData);
        throw new Error(
          `Erreur API: ${res.status} - ${
            errorData.details || errorData.error || "Pas de détails"
          }`
        );
      }

      console.log("DEBUG Client - Lecture du corps de la réponse...");
      const data = await res.json();
      console.log("DEBUG Client - Données reçues:", data);

      setWeekDetails(data);
    } catch (e) {
      console.error("DEBUG Client - Erreur complète:", e);
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  };

  const getDayLabel = (day: number): string => {
    const days = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
    return days[day - 1];
  };

  if (loading) {
    return <div className="text-center p-8">Chargement...</div>;
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-red-500 mb-4">Une erreur est survenue :</p>
        <pre className="bg-gray-100 p-4 rounded text-sm mb-4 whitespace-pre-wrap">
          {error.message}
        </pre>
        <Link href="/admin/vs">
          <Button variant="outline">Retour au dashboard VS</Button>
        </Link>
      </div>
    );
  }

  if (!weekDetails) {
    return (
      <div className="text-center p-8">
        <p>Impossible de charger les détails de ce VS.</p>
        <Link href="/admin/vs">
          <Button variant="outline">Retour au dashboard VS</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <Link
        href="/admin/vs/history"
        className="text-blue-400 flex items-center gap-1 hover:underline"
      >
        <ArrowLeft className="w-4 h-4" /> Retour à l'historique
      </Link>

      {session && hasPermission(session, "edit_vs") && (
        <div className="flex justify-end">
          <Link href="/admin/vs/quick-entry">
            <Button className="bg-green-600 hover:bg-green-700" size="sm">
              Saisie rapide des points
            </Button>
          </Link>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{weekDetails.title}</CardTitle>
          <p className="text-gray-400">
            VS contre {weekDetails.enemyName} du{" "}
            {new Date(weekDetails.startDate).toLocaleDateString("fr-FR")} au{" "}
            {new Date(weekDetails.endDate).toLocaleDateString("fr-FR")}
          </p>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-400">Score Alliance</p>
            <p className="text-2xl font-bold text-green-400">
              {(weekDetails.allianceScore ?? 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-400">Score Ennemi</p>
            <p className="text-2xl font-bold text-red-400">
              {(weekDetails.enemyScore ?? 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-400">Participants</p>
            <p className="text-2xl font-bold">
              {weekDetails.participants?.length ?? 0}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Détails par membre
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left p-2 font-semibold">Membre</th>
                  {[...Array(6).keys()].map((i) => (
                    <th key={i} className="text-center p-2 font-semibold">
                      {getDayLabel(i + 1)}
                    </th>
                  ))}
                  <th className="text-center p-2 font-semibold text-yellow-400">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {weekDetails.participants?.map((p) => {
                  const totalPoints = p.dailyResults.reduce(
                    (sum, day) => sum + day.mvpPoints,
                    0
                  );
                  return (
                    <tr
                      key={p.memberId}
                      className="border-b border-gray-800 hover:bg-gray-800/30"
                    >
                      <td className="p-2 font-medium">{p.member.pseudo}</td>
                      {[...Array(6).keys()].map((i) => {
                        const dayData = p.dailyResults.find(
                          (d) => d.dayNumber === i + 1
                        );
                        return (
                          <td key={i} className="text-center p-2">
                            {dayData?.mvpPoints || 0}
                          </td>
                        );
                      })}
                      <td className="text-center p-2 text-yellow-400 font-bold">
                        {totalPoints.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
