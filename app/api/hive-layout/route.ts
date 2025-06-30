import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  // @ts-ignore
  const data = await prisma.hivePlacement.findMany();
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  try {
    const { placements } = await req.json();
    if (!Array.isArray(placements)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    for (const p of placements) {
      if (p.id === "MARSHAL") {
        // Maréchal : tentative d'update puis fallback create (évite le problème de validation Prisma)
        try {
          // @ts-ignore
          await prisma.hivePlacement.update({
            where: { id: "MARSHAL" },
            data: { x: p.x, y: p.y },
          });
        } catch {
          // @ts-ignore
          await prisma.hivePlacement.create({
            data: { id: "MARSHAL", x: p.x, y: p.y },
          });
        }
      } else {
        // Membres classiques
        // @ts-ignore
        await prisma.hivePlacement.upsert({
          where: { memberId: p.id },
          update: { x: p.x, y: p.y },
          create: { memberId: p.id, x: p.x, y: p.y },
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
