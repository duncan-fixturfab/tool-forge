import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface UpdateDefaultMaterialsBody {
  materialIds: string[];
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body: UpdateDefaultMaterialsBody = await request.json();
    const { materialIds } = body;

    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate materialIds is an array
    if (!Array.isArray(materialIds)) {
      return NextResponse.json(
        { error: "materialIds must be an array" },
        { status: 400 }
      );
    }

    // Verify user owns the library
    const { data: library, error: libraryError } = await supabase
      .from("tool_libraries")
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (libraryError || !library) {
      return NextResponse.json({ error: "Library not found" }, { status: 404 });
    }

    // Update default materials
    const { error: updateError } = await supabase
      .from("tool_libraries")
      .update({ default_material_ids: materialIds })
      .eq("id", id);

    if (updateError) {
      console.error("Failed to update default materials:", updateError);
      return NextResponse.json(
        { error: "Failed to update default materials" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating default materials:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch library with default materials
    const { data: library, error } = await supabase
      .from("tool_libraries")
      .select("default_material_ids")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error || !library) {
      return NextResponse.json({ error: "Library not found" }, { status: 404 });
    }

    return NextResponse.json({
      materialIds: library.default_material_ids || [],
    });
  } catch (error) {
    console.error("Error fetching default materials:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
