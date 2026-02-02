import { createClient } from "@/lib/supabase/server";
import { getValidAccessToken } from "@/lib/autodesk/tokens";
import { listHubs } from "@/lib/autodesk/client";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Verify user is authenticated
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get valid access token (auto-refreshes if needed)
    const accessToken = await getValidAccessToken(user.id);

    // Fetch hubs from Autodesk
    const hubs = await listHubs(accessToken);

    // Transform for response
    const transformedHubs = hubs.map((hub) => ({
      id: hub.id,
      name: hub.attributes.name,
      type: hub.attributes.extension.type,
      region: hub.attributes.region,
    }));

    return NextResponse.json({ hubs: transformedHubs });
  } catch (error) {
    console.error("List hubs error:", error);
    const message = error instanceof Error ? error.message : "Failed to list hubs";

    // Handle specific error cases
    if (message.includes("No Autodesk connection") || message.includes("session expired")) {
      return NextResponse.json({ error: message, needsReconnect: true }, { status: 401 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
