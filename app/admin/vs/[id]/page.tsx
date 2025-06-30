"use client";

import VSManager from "@/components/admin/vs-manager";
import { Button } from "@/components/ui/button";
import { hasPermission } from "@/lib/permissions";
import { ArrowLeft } from "lucide-react";
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
  console.log("DEBUG - Params reçus:", params);
  const vsWeekId = params.id as string;
  console.log("DEBUG - VS Week ID:", vsWeekId);

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
    <div className="container mx-auto p-4">
      <div className="mb-4">
        <Link
          href="/admin/vs"
          className="text-blue-500 hover:text-blue-400 flex items-center gap-2"
        >
          <ArrowLeft size={16} />
          Retour à la liste
        </Link>
      </div>
      <VSManager vsWeekId={vsWeekId} />
    </div>
  );
}
