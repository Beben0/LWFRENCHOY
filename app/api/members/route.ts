import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const memberSchema = z.object({
  pseudo: z.string().min(1),
  level: z.number().min(1).max(99),
  power: z.string().transform((val) => BigInt(val)),
  kills: z.number().min(0),
  specialty: z.string().optional(),
  allianceRole: z.enum(["R5", "R4", "MEMBER"]),
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

// GET - List members with filters
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const search = url.searchParams.get("search");
    const specialty = url.searchParams.get("specialty");
    const status = url.searchParams.get("status");
    const role = url.searchParams.get("role");
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "20");

    const where: any = {};

    if (search) {
      where.pseudo = { contains: search, mode: "insensitive" };
    }
    if (specialty) where.specialty = specialty;
    if (status) where.status = status;
    if (role) where.allianceRole = role;

    const [members, total] = await Promise.all([
      prisma.member.findMany({
        where,
        orderBy: { power: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.member.count({ where }),
    ]);

    // Convertir les BigInt en string
    const serializedMembers = members.map(serializeMember);

    return NextResponse.json({
      members: serializedMembers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching members:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create new member
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = memberSchema.parse(body);

    const member = await prisma.member.create({
      data: {
        ...data,
        lastActive: new Date(),
      },
    });

    // Convertir le BigInt en string avant de retourner
    const serializedMember = serializeMember(member);

    return NextResponse.json(serializedMember, { status: 201 });
  } catch (error) {
    console.error("Error creating member:", error);
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
