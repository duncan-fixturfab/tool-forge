import { createClient } from "@/lib/supabase/server";
import { clearTokens } from "@/lib/autodesk/tokens";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    // Verify user is authenticated
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Clear tokens from database
    await clearTokens(user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Autodesk disconnect error:", error);
    const message = error instanceof Error ? error.message : "Failed to disconnect Autodesk";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
