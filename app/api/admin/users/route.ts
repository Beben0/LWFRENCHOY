import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const userSchema = z.object({
  email: z.string().email(),
  pseudo: z.string().optional(),
  password: z.string().min(6),
  role: z.enum(["ADMIN", "GUEST"]),
  allianceRole: z.string().optional(),
});

const userUpdateSchema = z.object({
  email: z.string().email().optional(),
  pseudo: z.string().optional(),
  password: z.string().min(6).optional(),
  role: z.enum(["ADMIN", "GUEST"]).optional(),
  allianceRole: z.string().optional(),
});

// GET - List all users
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        pseudo: true,
        role: true,
        allianceRole: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create new user
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = userSchema.parse(body);

    // Vérifier si l'email existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Un utilisateur avec cet email existe déjà" },
        { status: 400 }
      );
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        pseudo: data.pseudo,
        password: hashedPassword,
        role: data.role,
        allianceRole: data.allianceRole,
      },
      select: {
        id: true,
        email: true,
        pseudo: true,
        role: true,
        allianceRole: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
