import { auth } from "@/lib/auth";
import { hasPermissionAsync } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const memberSchema = z.object({
  pseudo: z.string().min(1),
  level: z.number().min(1).max(99),
  power: z.string().transform((val) => BigInt(val)),
  kills: z.number().min(0),
  specialty: z.string().optional(),
  allianceRole: z.string(),
  status: z.enum(["ACTIVE", "INACTIVE"]),
  tags: z.array(z.string()).default([]),
  notes: z.string().optional(),
});

// Fonction pour convertir BigInt en string
function serializeMember(member: any) {
  return {
    ...member,
    power: member.power.toString(),
  };
}

// GET - Get member by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const canView = await hasPermissionAsync(session, "view_members");
    if (!canView) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const member = await prisma.member.findUnique({
      where: { id },
    });

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    const serializedMember = serializeMember(member);
    return NextResponse.json(serializedMember);
  } catch (error) {
    console.error("Error fetching member:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update member
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const canEdit = await hasPermissionAsync(session, "edit_member");
    if (!canEdit) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const data = memberSchema.parse(body);

    const member = await prisma.member.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });

    const serializedMember = serializeMember(member);
    return NextResponse.json(serializedMember);
  } catch (error) {
    console.error("Error updating member:", error);
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

// DELETE - Delete member
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const canDelete = await hasPermissionAsync(session, "delete_member");
    if (!canDelete) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await prisma.member.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting member:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
