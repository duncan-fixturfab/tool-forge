import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const SegmentSchema = z.object({
  height: z.number().positive(),
  lower_diameter: z.number().positive(),
  upper_diameter: z.number().positive(),
});

const CreateHolderSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  taper_type: z.string().min(1, "Taper type is required"),
  collet_type: z.string().optional(),
  collet_min_mm: z.number().positive().optional(),
  collet_max_mm: z.number().positive().optional(),
  gauge_length_mm: z.number().positive("Gauge length must be positive"),
  segments: z.array(SegmentSchema).min(1, "At least one segment is required"),
  vendor: z.string().optional(),
  product_id: z.string().optional(),
  product_url: z.string().url().optional().or(z.literal("")),
  extraction_source: z.string().optional(),
  extraction_confidence: z.number().min(0).max(1).optional(),
  raw_extraction_data: z.any().optional(),
  is_public: z.boolean().optional().default(false),
  notes: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = CreateHolderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.issues },
        { status: 400 }
      );
    }

    // Clean up empty product_url
    const holderData = {
      ...parsed.data,
      product_url: parsed.data.product_url || null,
      user_id: user.id,
    };

    const { data: holder, error } = await supabase
      .from("tool_holders")
      .insert(holderData)
      .select()
      .single();

    if (error) {
      console.error("Error creating holder:", error);
      return NextResponse.json(
        { error: "Failed to create holder", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, holder });
  } catch (error) {
    console.error("Error in POST /api/holders:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const searchParams = request.nextUrl.searchParams;
    const machineId = searchParams.get("machine_id");
    const includePublic = searchParams.get("include_public") !== "false";

    // Build query for user's own holders
    let query = supabase.from("tool_holders").select("*");

    if (user) {
      if (includePublic) {
        // User's own holders + public holders + system holders
        query = query.or(`user_id.eq.${user.id},is_public.eq.true,user_id.is.null`);
      } else {
        // Only user's own holders
        query = query.eq("user_id", user.id);
      }
    } else {
      // Not logged in - only public and system holders
      query = query.or("is_public.eq.true,user_id.is.null");
    }

    // If filtering by machine, get associated holder IDs first
    if (machineId) {
      const { data: machineHolders } = await supabase
        .from("machine_tool_holders")
        .select("tool_holder_id")
        .eq("machine_id", machineId);

      if (machineHolders && machineHolders.length > 0) {
        const holderIds = machineHolders.map((mh) => mh.tool_holder_id);
        query = query.in("id", holderIds);
      } else {
        // No holders associated with this machine
        return NextResponse.json({ holders: [] });
      }
    }

    const { data: holders, error } = await query.order("name", { ascending: true });

    if (error) {
      console.error("Error fetching holders:", error);
      return NextResponse.json(
        { error: "Failed to fetch holders" },
        { status: 500 }
      );
    }

    return NextResponse.json({ holders });
  } catch (error) {
    console.error("Error in GET /api/holders:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
