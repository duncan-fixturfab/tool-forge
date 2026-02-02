import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const AssociateHolderSchema = z.object({
  tool_holder_id: z.string().uuid(),
  is_default: z.boolean().optional().default(false),
  notes: z.string().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: machineId } = await params;
    const supabase = await createClient();

    // Get all holders associated with this machine
    const { data: associations, error } = await supabase
      .from("machine_tool_holders")
      .select(`
        id,
        is_default,
        notes,
        created_at,
        tool_holders (*)
      `)
      .eq("machine_id", machineId);

    if (error) {
      console.error("Error fetching machine holders:", error);
      return NextResponse.json(
        { error: "Failed to fetch machine holders" },
        { status: 500 }
      );
    }

    // Flatten the response
    const holders = associations?.map((a) => ({
      ...a.tool_holders,
      association_id: a.id,
      is_default: a.is_default,
      association_notes: a.notes,
    })) || [];

    return NextResponse.json({ holders });
  } catch (error) {
    console.error("Error in GET /api/machines/[id]/holders:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: machineId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check machine ownership
    const { data: machine } = await supabase
      .from("machines")
      .select("created_by")
      .eq("id", machineId)
      .single();

    if (!machine) {
      return NextResponse.json({ error: "Machine not found" }, { status: 404 });
    }

    if (machine.created_by !== user.id) {
      return NextResponse.json(
        { error: "Not authorized to modify this machine" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = AssociateHolderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.issues },
        { status: 400 }
      );
    }

    // If this is being set as default, unset any existing default
    if (parsed.data.is_default) {
      await supabase
        .from("machine_tool_holders")
        .update({ is_default: false })
        .eq("machine_id", machineId)
        .eq("is_default", true);
    }

    // Create the association
    const { data: association, error } = await supabase
      .from("machine_tool_holders")
      .insert({
        machine_id: machineId,
        tool_holder_id: parsed.data.tool_holder_id,
        is_default: parsed.data.is_default,
        notes: parsed.data.notes,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "Holder is already associated with this machine" },
          { status: 409 }
        );
      }
      console.error("Error associating holder:", error);
      return NextResponse.json(
        { error: "Failed to associate holder", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, association });
  } catch (error) {
    console.error("Error in POST /api/machines/[id]/holders:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

const UpdateAssociationSchema = z.object({
  tool_holder_id: z.string().uuid(),
  is_default: z.boolean().optional(),
  notes: z.string().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: machineId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check machine ownership
    const { data: machine } = await supabase
      .from("machines")
      .select("created_by")
      .eq("id", machineId)
      .single();

    if (!machine) {
      return NextResponse.json({ error: "Machine not found" }, { status: 404 });
    }

    if (machine.created_by !== user.id) {
      return NextResponse.json(
        { error: "Not authorized to modify this machine" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = UpdateAssociationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.issues },
        { status: 400 }
      );
    }

    // If setting as default, unset other defaults first
    if (parsed.data.is_default) {
      await supabase
        .from("machine_tool_holders")
        .update({ is_default: false })
        .eq("machine_id", machineId)
        .eq("is_default", true);
    }

    // Build update object
    const updateData: { is_default?: boolean; notes?: string } = {};
    if (parsed.data.is_default !== undefined) {
      updateData.is_default = parsed.data.is_default;
    }
    if (parsed.data.notes !== undefined) {
      updateData.notes = parsed.data.notes;
    }

    const { error } = await supabase
      .from("machine_tool_holders")
      .update(updateData)
      .eq("machine_id", machineId)
      .eq("tool_holder_id", parsed.data.tool_holder_id);

    if (error) {
      console.error("Error updating holder association:", error);
      return NextResponse.json(
        { error: "Failed to update holder association" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in PATCH /api/machines/[id]/holders:", error);
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
    const { id: machineId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get holder ID from query params
    const holderId = request.nextUrl.searchParams.get("holder_id");
    if (!holderId) {
      return NextResponse.json(
        { error: "holder_id query parameter is required" },
        { status: 400 }
      );
    }

    // Check machine ownership
    const { data: machine } = await supabase
      .from("machines")
      .select("created_by")
      .eq("id", machineId)
      .single();

    if (!machine) {
      return NextResponse.json({ error: "Machine not found" }, { status: 404 });
    }

    if (machine.created_by !== user.id) {
      return NextResponse.json(
        { error: "Not authorized to modify this machine" },
        { status: 403 }
      );
    }

    // Delete the association
    const { error } = await supabase
      .from("machine_tool_holders")
      .delete()
      .eq("machine_id", machineId)
      .eq("tool_holder_id", holderId);

    if (error) {
      console.error("Error removing holder association:", error);
      return NextResponse.json(
        { error: "Failed to remove holder association" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/machines/[id]/holders:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
