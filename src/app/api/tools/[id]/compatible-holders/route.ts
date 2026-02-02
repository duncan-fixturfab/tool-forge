import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ToolHolder } from "@/types/database";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: toolId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const machineId = request.nextUrl.searchParams.get("machine_id");

    // Get the tool's geometry to determine shank diameter
    const { data: tool, error: toolError } = await supabase
      .from("tools")
      .select("geometry")
      .eq("id", toolId)
      .single();

    if (toolError || !tool) {
      return NextResponse.json({ error: "Tool not found" }, { status: 404 });
    }

    // Determine shank diameter (use shank_diameter_mm if available, otherwise cutting diameter)
    const shankDiameter = tool.geometry?.shank_diameter_mm || tool.geometry?.diameter_mm;

    if (!shankDiameter) {
      return NextResponse.json(
        { error: "Tool geometry does not have diameter information" },
        { status: 400 }
      );
    }

    // Build query for holders
    let holdersQuery = supabase.from("tool_holders").select("*");

    // Filter by user access (own holders, public, or system)
    if (user) {
      holdersQuery = holdersQuery.or(`user_id.eq.${user.id},is_public.eq.true,user_id.is.null`);
    } else {
      holdersQuery = holdersQuery.or("is_public.eq.true,user_id.is.null");
    }

    // If machine_id provided, filter to only machine-associated holders
    if (machineId) {
      const { data: machineHolders } = await supabase
        .from("machine_tool_holders")
        .select("tool_holder_id, is_default")
        .eq("machine_id", machineId);

      if (machineHolders && machineHolders.length > 0) {
        const holderIds = machineHolders.map((mh) => mh.tool_holder_id);
        holdersQuery = holdersQuery.in("id", holderIds);
      } else {
        // No holders associated with this machine
        return NextResponse.json({
          compatible: [],
          incompatible: [],
          all: [],
          shank_diameter_mm: shankDiameter,
        });
      }
    }

    const { data: allHolders, error: holdersError } = await holdersQuery.order("name");

    if (holdersError) {
      console.error("Error fetching holders:", holdersError);
      return NextResponse.json(
        { error: "Failed to fetch holders" },
        { status: 500 }
      );
    }

    // Classify holders by compatibility
    const compatible: ToolHolder[] = [];
    const incompatible: ToolHolder[] = [];

    for (const holder of allHolders || []) {
      const meetsMinimum = !holder.collet_min_mm || shankDiameter >= holder.collet_min_mm;
      const meetsMaximum = !holder.collet_max_mm || shankDiameter <= holder.collet_max_mm;

      if (meetsMinimum && meetsMaximum) {
        compatible.push(holder);
      } else {
        incompatible.push(holder);
      }
    }

    // Get default holder for machine if specified
    let defaultHolderId: string | null = null;
    if (machineId) {
      const { data: defaultAssoc } = await supabase
        .from("machine_tool_holders")
        .select("tool_holder_id")
        .eq("machine_id", machineId)
        .eq("is_default", true)
        .single();

      defaultHolderId = defaultAssoc?.tool_holder_id || null;
    }

    return NextResponse.json({
      compatible,
      incompatible,
      all: allHolders || [],
      shank_diameter_mm: shankDiameter,
      default_holder_id: defaultHolderId,
    });
  } catch (error) {
    console.error("Error in GET /api/tools/[id]/compatible-holders:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
