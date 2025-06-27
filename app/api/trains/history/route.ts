import { auth } from "@/lib/auth";
import { getGlobalTrainHistory } from "@/lib/train-history";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "100");

    const history = await getGlobalTrainHistory(limit);

    return NextResponse.json(history);
  } catch (error) {
    console.error("Error fetching train history:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
