"use client";

import { GraphicalTrainSchedule } from "@/components/trains/graphical-train-schedule";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

interface Member {
  id: string;
  pseudo: string;
  level: number;
  specialty: string | null;
  allianceRole: string;
  status: "ACTIVE" | "INACTIVE";
}

export default function TrainsPage() {
  const { data: session } = useSession();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMembers = async () => {
      try {
        const response = await fetch("/api/members");
        if (response.ok) {
          const data = await response.json();
          setMembers(data.members || []);
        }
      } catch (error) {
        console.error("Error fetching members:", error);
      } finally {
        setLoading(false);
      }
    };

    loadMembers();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2" />
          <span>Chargement...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Planification des Trains</h1>
          <p className="text-muted-foreground">
            {session
              ? "Bienvenue à bord !"
              : "Consultez les horaires des trains d'alliance"}
          </p>
        </div>
      </div>

      {/* Interface graphique en liste comme dans le screenshot */}
      <GraphicalTrainSchedule
        trainSlots={[]} // Maintenu pour compatibilité mais non utilisé
        members={members}
        currentUserId={session?.user?.id}
        isAdmin={session?.user?.role === "ADMIN"}
      />
    </div>
  );
}
