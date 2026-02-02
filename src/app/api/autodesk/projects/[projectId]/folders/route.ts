import { createClient } from "@/lib/supabase/server";
import { getValidAccessToken } from "@/lib/autodesk/tokens";
import { listFolderContents } from "@/lib/autodesk/client";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get("folderId");

    // Verify user is authenticated
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!projectId || !folderId) {
      return NextResponse.json(
        { error: "Project ID and Folder ID are required" },
        { status: 400 }
      );
    }

    // Get valid access token (auto-refreshes if needed)
    const accessToken = await getValidAccessToken(user.id);

    // Fetch folder contents from Autodesk
    const contents = await listFolderContents(accessToken, projectId, folderId);

    // Transform for response, separating folders and items
    const folders = contents
      .filter((item) => item.type === "folders")
      .map((folder) => ({
        id: folder.id,
        name: folder.attributes.displayName || folder.attributes.name,
        type: "folders" as const,
      }));

    const items = contents
      .filter((item) => item.type === "items")
      .map((item) => ({
        id: item.id,
        name: item.attributes.displayName,
        type: "items" as const,
      }));

    return NextResponse.json({ folders, items });
  } catch (error) {
    console.error("List folder contents error:", error);
    const message = error instanceof Error ? error.message : "Failed to list folder contents";

    if (message.includes("No Autodesk connection") || message.includes("session expired")) {
      return NextResponse.json({ error: message, needsReconnect: true }, { status: 401 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
