import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const SegmentSchema = z.object({
  height: z.number().positive(),
  lower_diameter: z.number().positive(),
  upper_diameter: z.number().positive(),
});

const UpdateHolderSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  taper_type: z.string().min(1).optional(),
  collet_type: z.string().optional().nullable(),
  collet_min_mm: z.number().positive().optional().nullable(),
  collet_max_mm: z.number().positive().optional().nullable(),
  gauge_length_mm: z.number().positive().optional(),
  segments: z.array(SegmentSchema).min(1).optional(),
  vendor: z.string().optional().nullable(),
  product_id: z.string().optional().nullable(),
  product_url: z.string().url().optional().nullable().or(z.literal("")),
  is_public: z.boolean().optional(),
  notes: z.string().optional().nullable(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: holder, error } = await supabase
      .from("tool_holders")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Holder not found" }, { status: 404 });
      }
      console.error("Error fetching holder:", error);
      return NextResponse.json(
        { error: "Failed to fetch holder" },
        { status: 500 }
      );
    }

    return NextResponse.json({ holder });
  } catch (error) {
    console.error("Error in GET /api/holders/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check ownership
    const { data: existing } = await supabase
      .from("tool_holders")
      .select("user_id")
      .eq("id", id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: "Holder not found" }, { status: 404 });
    }

    if (existing.user_id !== user.id) {
      return NextResponse.json(
        { error: "Not authorized to update this holder" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = UpdateHolderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.issues },
        { status: 400 }
      );
    }

    // Clean up empty product_url
    const updateData = {
      ...parsed.data,
      product_url: parsed.data.product_url || null,
    };

    const { data: holder, error } = await supabase
      .from("tool_holders")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating holder:", error);
      return NextResponse.json(
        { error: "Failed to update holder", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, holder });
  } catch (error) {
    console.error("Error in PUT /api/holders/[id]:", error);
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
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check ownership
    const { data: existing } = await supabase
      .from("tool_holders")
      .select("user_id")
      .eq("id", id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: "Holder not found" }, { status: 404 });
    }

    if (existing.user_id !== user.id) {
      return NextResponse.json(
        { error: "Not authorized to delete this holder" },
        { status: 403 }
      );
    }

    const { error } = await supabase
      .from("tool_holders")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting holder:", error);
      return NextResponse.json(
        { error: "Failed to delete holder", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/holders/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
