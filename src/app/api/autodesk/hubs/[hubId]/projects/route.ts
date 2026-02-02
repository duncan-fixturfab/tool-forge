import { createClient } from "@/lib/supabase/server";
import { getValidAccessToken } from "@/lib/autodesk/tokens";
import { listProjects } from "@/lib/autodesk/client";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ hubId: string }> }
) {
  try {
    const { hubId } = await params;

    // Verify user is authenticated
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hubId) {
      return NextResponse.json({ error: "Hub ID is required" }, { status: 400 });
    }

    // Get valid access token (auto-refreshes if needed)
    const accessToken = await getValidAccessToken(user.id);

    // Fetch projects from Autodesk
    const projects = await listProjects(accessToken, hubId);

    // Transform for response
    const transformedProjects = projects.map((project) => ({
      id: project.id,
      name: project.attributes.name,
      type: project.attributes.extension.type,
    }));

    return NextResponse.json({ projects: transformedProjects });
  } catch (error) {
    console.error("List projects error:", error);
    const message = error instanceof Error ? error.message : "Failed to list projects";

    if (message.includes("No Autodesk connection") || message.includes("session expired")) {
      return NextResponse.json({ error: message, needsReconnect: true }, { status: 401 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
