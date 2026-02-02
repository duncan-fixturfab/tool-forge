import { createClient } from "@/lib/supabase/server";
import { getConnection, isTokenExpired } from "@/lib/autodesk/tokens";
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

    // Get connection
    const connection = await getConnection(user.id);

    if (!connection) {
      return NextResponse.json({ connected: false });
    }

    // Check if token is expired (without attempting refresh)
    const expired = isTokenExpired(connection);

    return NextResponse.json({
      connected: true,
      expired,
      autodesk_email: connection.autodesk_email,
      autodesk_name: connection.autodesk_name,
      connected_at: connection.connected_at,
      last_sync_at: connection.last_sync_at,
      default_hub_id: connection.default_hub_id,
      default_hub_name: connection.default_hub_name,
      default_project_id: connection.default_project_id,
      default_project_name: connection.default_project_name,
      default_folder_id: connection.default_folder_id,
      default_folder_path: connection.default_folder_path,
    });
  } catch (error) {
    console.error("Get Autodesk connection error:", error);
    const message = error instanceof Error ? error.message : "Failed to get Autodesk connection";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
