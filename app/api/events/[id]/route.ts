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
  recurringDays: z.array(z.string()).default([]),
  recurringEndDate: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val ? new Date(val) : null)),
});

// GET - Get single event
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    const canViewEvents = await hasPermissionAsync(session, "view_events");
    if (!canViewEvents) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const event = await prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json(event);
  } catch (error) {
    console.error("Error fetching event:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update event
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    const canEditEvents = await hasPermissionAsync(session, "edit_event");
    if (!canEditEvents) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = eventSchema.parse(body);

    const { id } = await params;
    const event = await prisma.event.update({
      where: { id },
      data,
    });

    return NextResponse.json(event);
  } catch (error) {
    console.error("Error updating event:", error);
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

// DELETE - Delete event
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    const canDeleteEvents = await hasPermissionAsync(session, "delete_event");
    if (!canDeleteEvents) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await prisma.event.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting event:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
