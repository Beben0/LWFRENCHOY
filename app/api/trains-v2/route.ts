import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { TrainStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

// GET - Récupérer les instances de trains (avec pagination et filtrage)
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (!hasPermission(session, "view_trains")) {
      return NextResponse.json(
        { error: "Permission refusée" },
        { status: 403 }
      );
    }

    const url = new URL(request.url);
    const daysAhead = parseInt(url.searchParams.get("daysAhead") || "7");
    const includeArchived = url.searchParams.get("includeArchived") === "true";
    const status = url.searchParams.get("status") as TrainStatus | null;

    const now = new Date();

    // Normaliser les bornes sur UTC pour éviter les problèmes de fuseau horaire (ex: UTC+2)
    const startDate = new Date(now);
    startDate.setUTCHours(0, 0, 0, 0);

    const endDate = new Date(startDate);
    endDate.setUTCDate(startDate.getUTCDate() + daysAhead);
    endDate.setUTCHours(23, 59, 59, 999);

    // Requête avec filtres - partir d'aujourd'hui
    const where: any = {
      date: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (!includeArchived) {
      where.isArchived = false;
    }

    if (status) {
      where.status = status;
    }

    const trainInstances = await prisma.trainInstance.findMany({
      where,
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
        _count: {
          select: {
            passengers: true,
          },
        },
      },
      orderBy: { date: "asc" },
    });

    // Ajouter des métadonnées utiles
    const enrichedTrains = trainInstances.map((train) => {
      const now = new Date();
      const trainDate = new Date(train.date);
      const [hours, minutes] = train.departureTime.split(":").map(Number);
      const departureDateTime = new Date(trainDate);
      departureDateTime.setUTCHours(hours, minutes, 0, 0);

      const [realHours, realMinutes] = train.realDepartureTime
        .split(":")
        .map(Number);

      const realDepartureDateTime = new Date(trainDate);
      realDepartureDateTime.setUTCHours(realHours, realMinutes, 0, 0);

      // Si l'heure réelle est avant l'heure d'inscription (franchissement de minuit), on avance d'un jour
      if (realDepartureDateTime < departureDateTime) {
        realDepartureDateTime.setDate(realDepartureDateTime.getDate() + 1);
      }

      // Considérer le train passé seulement après le départ réel
      const isPast = realDepartureDateTime < now;

      return {
        ...train,
        metadata: {
          isToday: trainDate.toDateString() === now.toDateString(),
          isPast: isPast,
          canRegister:
            now < departureDateTime && train.status === TrainStatus.SCHEDULED,
          isBoarding: train.status === TrainStatus.BOARDING,
          timeUntilDeparture: departureDateTime.getTime() - now.getTime(),
          timeUntilRealDeparture:
            realDepartureDateTime.getTime() - now.getTime(),
          passengerCount: train._count.passengers,
        },
      };
    });

    return NextResponse.json({
      trains: enrichedTrains,
      metadata: {
        total: enrichedTrains.length,
        daysAhead,
        includeArchived,
        dateRange: {
          from: startDate.toISOString(),
          to: endDate.toISOString(),
        },
      },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des trains:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// POST - Créer une nouvelle instance de train ou assigner un conducteur
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (!hasPermission(session, "edit_train_slot")) {
      return NextResponse.json(
        { error: "Permission refusée" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, trainId, conductorId, date, departureTime } = body;

    if (action === "assign_conductor") {
      // Assigner un conducteur à un train existant
      if (!trainId || !conductorId) {
        return NextResponse.json(
          { error: "ID train et conducteur requis" },
          { status: 400 }
        );
      }

      // Vérifier que le conducteur existe
      const conductor = await prisma.member.findUnique({
        where: { id: conductorId },
      });

      if (!conductor) {
        return NextResponse.json(
          { error: "Conducteur introuvable" },
          { status: 404 }
        );
      }

      // Vérifier que le train existe et n'est pas archivé
      const train = await prisma.trainInstance.findUnique({
        where: { id: trainId },
      });

      if (!train || train.isArchived) {
        return NextResponse.json(
          { error: "Train introuvable ou archivé" },
          { status: 404 }
        );
      }

      // Calculer la nouvelle heure de départ réelle si nécessaire
      let updateData: any = { conductorId };

      if (departureTime && departureTime !== train.departureTime) {
        const [hours, minutes] = departureTime.split(":").map(Number);
        const realHours = (hours + 4) % 24;
        const realDepartureTime = `${realHours
          .toString()
          .padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;

        updateData.departureTime = departureTime;
        updateData.realDepartureTime = realDepartureTime;
        updateData.status = TrainStatus.SCHEDULED; // Reset to SCHEDULED when time is modified
      }

      const updatedTrain = await prisma.trainInstance.update({
        where: { id: trainId },
        data: updateData,
        include: {
          conductor: {
            select: {
              id: true,
              pseudo: true,
              level: true,
              specialty: true,
              allianceRole: true,
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
                },
              },
            },
          },
        },
      });

      // Enregistrer dans l'historique
      await prisma.trainHistory.create({
        data: {
          trainInstanceId: trainId,
          action: "CONDUCTOR_ASSIGNED",
          actorId: session.user.id,
          actorPseudo: session.user.email,
          targetId: conductorId,
          targetPseudo: conductor.pseudo,
          details:
            departureTime !== train.departureTime
              ? `Horaire modifié: ${train.departureTime} → ${departureTime}`
              : undefined,
        },
      });

      return NextResponse.json({
        success: true,
        train: updatedTrain,
        message: `Conducteur ${conductor.pseudo} assigné avec succès`,
      });
    } else if (action === "create_train") {
      // Créer une nouvelle instance de train
      if (!date || !departureTime) {
        return NextResponse.json(
          { error: "Date et heure de départ requises" },
          { status: 400 }
        );
      }

      const trainDate = new Date(date);
      trainDate.setHours(0, 0, 0, 0);

      // Vérifier qu'il n'y a pas déjà un train ce jour-là
      const existingTrain = await prisma.trainInstance.findUnique({
        where: { date: trainDate },
      });

      if (existingTrain) {
        return NextResponse.json(
          { error: "Un train existe déjà pour cette date" },
          { status: 409 }
        );
      }

      // Calculer l'heure de départ réelle
      const [hours, minutes] = departureTime.split(":").map(Number);
      const realHours = (hours + 4) % 24;
      const realDepartureTime = `${realHours
        .toString()
        .padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;

      // Déterminer le jour de la semaine
      const dayOfWeekMap = [
        "dimanche",
        "lundi",
        "mardi",
        "mercredi",
        "jeudi",
        "vendredi",
        "samedi",
      ];
      const dayOfWeek = dayOfWeekMap[trainDate.getDay()];

      const newTrain = await prisma.trainInstance.create({
        data: {
          date: trainDate,
          dayOfWeek,
          departureTime,
          realDepartureTime,
          conductorId: conductorId || null,
          status: TrainStatus.SCHEDULED,
          isArchived: false,
        },
        include: {
          conductor: {
            select: {
              id: true,
              pseudo: true,
              level: true,
              specialty: true,
              allianceRole: true,
            },
          },
        },
      });

      // Enregistrer dans l'historique
      await prisma.trainHistory.create({
        data: {
          trainInstanceId: newTrain.id,
          action: "TRAIN_CREATED",
          actorId: session.user.id,
          actorPseudo: session.user.email,
          details: `Train créé pour le ${dayOfWeek} ${trainDate.toLocaleDateString(
            "fr-FR"
          )} à ${departureTime}`,
        },
      });

      return NextResponse.json({
        success: true,
        train: newTrain,
        message: "Train créé avec succès",
      });
    } else if (action === "modify_time") {
      // Modifier uniquement l'heure de départ d'un train
      if (!trainId || !departureTime) {
        return NextResponse.json(
          { error: "ID train et nouvelle heure requis" },
          { status: 400 }
        );
      }

      // Vérifier que le train existe et n'est pas archivé
      const train = await prisma.trainInstance.findUnique({
        where: { id: trainId },
        include: { conductor: true },
      });

      if (!train || train.isArchived) {
        return NextResponse.json(
          { error: "Train introuvable ou archivé" },
          { status: 404 }
        );
      }

      // Calculer la nouvelle heure de départ réelle
      const [hours, minutes] = departureTime.split(":").map(Number);
      const realHours = (hours + 4) % 24;
      const realDepartureTime = `${realHours
        .toString()
        .padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;

      const updatedTrain = await prisma.trainInstance.update({
        where: { id: trainId },
        data: {
          departureTime,
          realDepartureTime,
          status: TrainStatus.SCHEDULED, // Reset to SCHEDULED when time is modified
        },
        include: {
          conductor: {
            select: {
              id: true,
              pseudo: true,
              level: true,
              specialty: true,
              allianceRole: true,
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
                },
              },
            },
          },
        },
      });

      // Enregistrer dans l'historique
      await prisma.trainHistory.create({
        data: {
          trainInstanceId: trainId,
          action: "TIME_CHANGED",
          actorId: session.user.id,
          actorPseudo: session.user.email,
          details: `Horaire modifié: ${train.departureTime} → ${departureTime} (départ réel: ${realDepartureTime})`,
        },
      });

      return NextResponse.json({
        success: true,
        train: updatedTrain,
        message: `Horaire mis à jour: ${departureTime} (départ réel: ${realDepartureTime})`,
      });
    } else {
      return NextResponse.json(
        { error: "Action non reconnue" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Erreur lors de la création/modification du train:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
