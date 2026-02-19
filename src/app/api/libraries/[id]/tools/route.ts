import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getNextToolNumber } from "@/lib/tool-categories";
import { ToolType } from "@/types/database";

export const dynamic = "force-dynamic";

interface AddToolBody {
  tool_id: string;
  tool_number?: number;
  tool_holder_id?: string | null;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: libraryId } = await params;
    const body: AddToolBody = await request.json();
    const { tool_id, tool_number, tool_holder_id } = body;

    if (!tool_id) {
      return NextResponse.json(
        { error: "tool_id is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user owns the library
    const { data: library, error: libraryError } = await supabase
      .from("tool_libraries")
      .select("id, user_id")
      .eq("id", libraryId)
      .single();

    if (libraryError || !library) {
      return NextResponse.json(
        { error: "Library not found" },
        { status: 404 }
      );
    }

    if (library.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Verify the tool exists and belongs to the user
    const { data: tool, error: toolError } = await supabase
      .from("tools")
      .select("id, user_id, tool_type")
      .eq("id", tool_id)
      .single();

    if (toolError || !tool) {
      return NextResponse.json(
        { error: "Tool not found" },
        { status: 404 }
      );
    }

    if (tool.user_id !== user.id) {
      return NextResponse.json(
        { error: "Tool does not belong to user" },
        { status: 403 }
      );
    }

    // Check if tool is already in this library
    const { data: existingTool } = await supabase
      .from("library_tools")
      .select("id")
      .eq("library_id", libraryId)
      .eq("tool_id", tool_id)
      .single();

    if (existingTool) {
      return NextResponse.json(
        { error: "Tool is already in this library" },
        { status: 409 }
      );
    }

    // Calculate the next tool number if not provided
    let assignedToolNumber = tool_number;
    if (!assignedToolNumber) {
      // Fetch all existing tool numbers in this library
      const { data: existingToolNumbers } = await supabase
        .from("library_tools")
        .select("tool_number")
        .eq("library_id", libraryId);

      const usedNumbers = (existingToolNumbers ?? []).map(
        (row: { tool_number: number }) => row.tool_number
      );

      // Assign the next available number within the tool's category range
      assignedToolNumber =
        getNextToolNumber(tool.tool_type as ToolType, usedNumbers) ?? 1;
    }

    // Add the tool to the library
    const { data: libraryTool, error: insertError } = await supabase
      .from("library_tools")
      .insert({
        library_id: libraryId,
        tool_id,
        tool_number: assignedToolNumber,
        tool_holder_id: tool_holder_id || null,
      })
      .select(`
        *,
        tools (*)
      `)
      .single();

    if (insertError) {
      console.error("Failed to add tool to library:", insertError);
      return NextResponse.json(
        { error: "Failed to add tool to library" },
        { status: 500 }
      );
    }

    return NextResponse.json(libraryTool, { status: 201 });
  } catch (error) {
    console.error("Error adding tool to library:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
