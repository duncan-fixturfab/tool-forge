import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const CreateMachineSchema = z.object({
  name: z.string().min(1, "Name is required"),
  manufacturer: z.string().min(1, "Manufacturer is required"),
  model: z.string().min(1, "Model is required"),
  description: z.string().optional(),
  max_rpm: z.number().int().positive("Max RPM must be positive"),
  min_rpm: z.number().int().nonnegative().optional().default(0),
  spindle_power_kw: z.number().positive().optional(),
  travel_x_mm: z.number().positive().optional(),
  travel_y_mm: z.number().positive().optional(),
  travel_z_mm: z.number().positive().optional(),
  max_feed_xy_mm_min: z.number().positive().optional(),
  max_feed_z_mm_min: z.number().positive().optional(),
  tool_holder_type: z.string().optional(),
  max_tool_diameter_mm: z.number().positive().optional(),
  is_public: z.boolean().optional().default(true),
});

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse and validate request
    const body = await request.json();
    const parsed = CreateMachineSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.issues },
        { status: 400 }
      );
    }

    // Insert machine into database
    const { data: machine, error } = await supabase
      .from("machines")
      .insert({
        ...parsed.data,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating machine:", error);
      return NextResponse.json(
        { error: "Failed to create machine", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, machine });
  } catch (error) {
    console.error("Error in POST /api/machines:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const supabase = await createClient();

    // Get all public machines
    const { data: machines, error } = await supabase
      .from("machines")
      .select("*")
      .eq("is_public", true)
      .order("manufacturer", { ascending: true });

    if (error) {
      console.error("Error fetching machines:", error);
      return NextResponse.json(
        { error: "Failed to fetch machines" },
        { status: 500 }
      );
    }

    return NextResponse.json({ machines });
  } catch (error) {
    console.error("Error in GET /api/machines:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
