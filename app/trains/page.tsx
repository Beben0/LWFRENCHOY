import { GraphicalTrainSchedule } from "@/components/trains/graphical-train-schedule";
import { Translate } from "@/components/ui/translate";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

interface Member {
  id: string;
  pseudo: string;
  level: number;
  specialty: string | null;
  allianceRole: string;
  status: "ACTIVE" | "INACTIVE";
}

export default async function TrainsPage() {
  const session = await auth();
  const { hasPermissionAsync } = await import("@/lib/permissions");
  const canView = await hasPermissionAsync(session, "view_trains");
  if (!canView) {
    redirect("/auth/signin");
  }

  // Charger les membres côté serveur
  const res = await fetch(
    `${
      process.env.NEXTAUTH_URL || "http://localhost:3000"
    }/api/members?status=ACTIVE&limit=1000`,
    { cache: "no-store" }
  );
  const data = res.ok ? await res.json() : { members: [] };
  const members: Member[] = data.members || [];

  const isEditor = !!(
    session && (await hasPermissionAsync(session, "edit_train_slot"))
  );

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
      <GraphicalTrainSchedule
        trainSlots={[]}
        members={members}
        currentUserId={session?.user?.id}
        isAdmin={isEditor}
      />
    </div>
  );
}
