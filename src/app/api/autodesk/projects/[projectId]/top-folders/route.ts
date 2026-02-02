import { createClient } from "@/lib/supabase/server";
import { getValidAccessToken } from "@/lib/autodesk/tokens";
import { getTopFolders } from "@/lib/autodesk/client";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const { searchParams } = new URL(request.url);
    const hubId = searchParams.get("hubId");

    // Verify user is authenticated
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!projectId || !hubId) {
      return NextResponse.json(
        { error: "Project ID and Hub ID are required" },
        { status: 400 }
      );
    }

    // Get valid access token (auto-refreshes if needed)
    const accessToken = await getValidAccessToken(user.id);

    // Fetch top folders from Autodesk
    const folders = await getTopFolders(accessToken, hubId, projectId);

    // Transform for response
    const transformedFolders = folders.map((folder) => ({
      id: folder.id,
      name: folder.attributes.displayName || folder.attributes.name,
      type: "folders",
    }));

    return NextResponse.json({ folders: transformedFolders });
  } catch (error) {
    console.error("List top folders error:", error);
    const message = error instanceof Error ? error.message : "Failed to list folders";

    if (message.includes("No Autodesk connection") || message.includes("session expired")) {
      return NextResponse.json({ error: message, needsReconnect: true }, { status: 401 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
