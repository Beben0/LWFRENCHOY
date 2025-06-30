import { getUserPermissionsAsync } from "@/lib/permissions";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { session } = await request.json();

    if (!session?.user) {
      return NextResponse.json({ permissions: [] });
    }

    const permissions = await getUserPermissionsAsync(session);
    return NextResponse.json({ permissions });
  } catch (error) {
    console.error("Error fetching permissions:", error);
    return NextResponse.json({ permissions: [] });
  }
}
