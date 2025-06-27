import { auth } from "@/lib/auth";
import { getConductorRanking } from "@/lib/train-history";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ranking = await getConductorRanking();

    return NextResponse.json(ranking);
  } catch (error) {
    console.error("Error fetching conductor ranking:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
