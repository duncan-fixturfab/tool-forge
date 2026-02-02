import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PostProcessSettings } from "@/types/database";

export const dynamic = "force-dynamic";

interface UpdateLibraryToolBody {
  tool_number?: number;
  tool_holder_id?: string | null;
  post_process?: PostProcessSettings;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body: UpdateLibraryToolBody = await request.json();
    const { tool_number, tool_holder_id, post_process } = body;

    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Build update object with only provided fields
    const updates: Record<string, unknown> = {};
    if (tool_number !== undefined) updates.tool_number = tool_number;
    if (tool_holder_id !== undefined) updates.tool_holder_id = tool_holder_id;
    if (post_process !== undefined) updates.post_process = post_process;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    // Verify user owns the library through the library_tools -> tool_libraries relationship
    const { data: libraryTool, error: fetchError } = await supabase
      .from("library_tools")
      .select(
        `
        id,
        tool_libraries!inner (
          user_id
        )
      `
      )
      .eq("id", id)
      .single();

    if (fetchError || !libraryTool) {
      return NextResponse.json(
        { error: "Library tool not found" },
        { status: 404 }
      );
    }

    // Check ownership
    const toolLibrary = libraryTool.tool_libraries as unknown as {
      user_id: string;
    };
    if (toolLibrary.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Perform update
    const { data, error: updateError } = await supabase
      .from("library_tools")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("Failed to update library tool:", updateError);
      return NextResponse.json(
        { error: "Failed to update library tool" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error updating library tool:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // Verify user owns the library through the library_tools -> tool_libraries relationship
    const { data: libraryTool, error: fetchError } = await supabase
      .from("library_tools")
      .select(
        `
        id,
        tool_libraries!inner (
          user_id
        )
      `
      )
      .eq("id", id)
      .single();

    if (fetchError || !libraryTool) {
      return NextResponse.json(
        { error: "Library tool not found" },
        { status: 404 }
      );
    }

    // Check ownership
    const toolLibrary = libraryTool.tool_libraries as unknown as {
      user_id: string;
    };
    if (toolLibrary.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Perform delete
    const { error: deleteError } = await supabase
      .from("library_tools")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("Failed to delete library tool:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete library tool" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting library tool:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
