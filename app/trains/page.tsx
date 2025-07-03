"use client";

import { GraphicalTrainSchedule } from "@/components/trains/graphical-train-schedule";
import { Translate } from "@/components/ui/translate";
import { useGuestPermissions } from "@/lib/hooks/use-guest-permissions";
import type { Permission } from "@/lib/permissions";
import { hasPermission } from "@/lib/permissions";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
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
  const { data: session, status } = useSession();
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  const candidateRoutes: { path: string; perm: Permission }[] = [
    { path: "/dashboard", perm: "view_dashboard" },
    { path: "/members", perm: "view_members" },
    { path: "/vs", perm: "view_vs" },
    { path: "/desert-storm", perm: "view_desert_storm" },
    { path: "/events", perm: "view_events" },
    { path: "/help", perm: "view_help" },
    { path: "/stats", perm: "view_stats" },
  ];

  const redirectToFirstAllowed = () => {
    for (const { path, perm } of candidateRoutes) {
      const allowed = session
        ? hasPermission(session, perm)
        : guestPermissions.has(perm as any);
      if (allowed) {
        router.replace(path);
        return;
      }
    }
    // Fallback: home
    router.replace("/");
  };

  const guestPermissions = useGuestPermissions(!session);

  useEffect(() => {
    const loadMembers = async () => {
      try {
        const response = await fetch("/api/members?status=ACTIVE&limit=1000");
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

  // Redirect logic
  if (status !== "loading" && !hasPermission(session, "view_trains")) {
    if (typeof window !== "undefined") {
      redirectToFirstAllowed();
    }
    return null;
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2" />
          <span>
            <Translate>Chargement…</Translate>
          </span>
        </div>
      </div>
    );
  }

  const isEditor = hasPermission(session, "edit_train_slot");

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">
            <Translate>Planification des Trains</Translate>
          </h1>
          <p className="text-muted-foreground">
            {session ? (
              <Translate>Bienvenue à bord !</Translate>
            ) : (
              <Translate>
                Consultez les horaires des trains d'alliance
              </Translate>
            )}
          </p>
        </div>
      </div>

      {/* Interface graphique en liste comme dans le screenshot */}
      <GraphicalTrainSchedule
        trainSlots={[]} // Maintenu pour compatibilité mais non utilisé
        members={members}
        currentUserId={session?.user?.id}
        isAdmin={isEditor}
      />
    </div>
  );
}
