import { auth } from "@/lib/auth";
import { hasPermissionAsync } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const eventSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  detailedDescription: z.string().optional(),
  type: z.enum([
    "ALLIANCE_WAR",
    "BOSS_FIGHT",
    "SERVER_WAR",
    "SEASONAL",
    "GUERRE_ALLIANCE",
    "EVENT_SPECIAL",
    "MAINTENANCE",
    "FORMATION",
    "REUNION",
    "AUTRE",
  ]),
  tags: z.array(z.string()).default([]),
  startDate: z.string().transform((val) => new Date(val)),
  endDate: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val ? new Date(val) : null)),
  isRecurring: z.boolean().default(false),
  recurringDays: z
    .array(z.union([z.string(), z.number()]))
    .transform((arr) =>
      arr.map((day) => (typeof day === "number" ? day.toString() : day))
    )
    .default([]),
  recurringEndDate: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val ? new Date(val) : null)),
});

// GET - List events
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const upcoming = searchParams.get("upcoming") === "true";
  const past = searchParams.get("past") === "true";
  const recurring = searchParams.get("recurring") === "true";

  try {
    const session = await auth();

    // Vérifier la permission view_events (inclut les GUEST si configuré)
    const canViewEvents = await hasPermissionAsync(session, "view_events");
    if (!canViewEvents) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let whereClause: any = {};

    if (upcoming) {
      whereClause = {
        startDate: {
          gte: new Date(),
        },
        isRecurring: {
          not: true, // Exclure les événements récurrents des prochains
        },
      };
    } else if (past) {
      whereClause = {
        startDate: {
          lt: new Date(),
        },
        isRecurring: {
          not: true, // Exclure les événements récurrents du passé
        },
      };
    } else if (recurring) {
      whereClause = {
        isRecurring: true,
      };
    }

    const events = await prisma.event.findMany({
      where: whereClause,
      orderBy: {
        startDate: upcoming || recurring ? "asc" : "desc",
      },
    });

    return NextResponse.json(events);
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create new event
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    // Vérifier la permission create_event (normalement ADMIN seulement)
    const canCreateEvents = await hasPermissionAsync(session, "create_event");
    if (!canCreateEvents) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = eventSchema.parse(body);

    const event = await prisma.event.create({
      data,
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error("Error creating event:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
