import { GraphicalTrainSchedule } from "@/components/trains/graphical-train-schedule";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getTrainData() {
  try {
    const [trainSlots, members] = await Promise.all([
      prisma.trainSlot.findMany({
        include: {
          conductor: {
            select: {
              id: true,
              pseudo: true,
              level: true,
              specialty: true,
              allianceRole: true,
              status: true,
            },
          },
          passengers: {
            include: {
              passenger: {
                select: {
                  id: true,
                  pseudo: true,
                  level: true,
                  specialty: true,
                  allianceRole: true,
                  status: true,
                },
              },
            },
          },
        },
        orderBy: { day: "asc" },
      }),
      prisma.member.findMany({
        select: {
          id: true,
          pseudo: true,
          level: true,
          specialty: true,
          allianceRole: true,
          status: true,
        },
        orderBy: { pseudo: "asc" },
      }),
    ]);

    return { trainSlots, members };
  } catch (error) {
    console.error("Error fetching train data:", error);
    return { trainSlots: [], members: [] };
  }
}

export default async function TrainsPage() {
  const session = await auth();
  const { trainSlots, members } = await getTrainData();

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

      {/* Vue graphique */}
      <GraphicalTrainSchedule
        trainSlots={trainSlots}
        members={members}
        currentUserId={session?.user?.id}
        isAdmin={session?.user?.role === "ADMIN"}
      />
    </div>
  );
}
