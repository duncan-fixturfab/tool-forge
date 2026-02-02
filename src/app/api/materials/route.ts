import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const MaterialCategorySchema = z.enum([
  "aluminum",
  "steel",
  "stainless_steel",
  "titanium",
  "brass",
  "copper",
  "plastic",
  "wood",
  "composite",
  "cast_iron",
]);

// Helper to coerce string to number (handles form inputs)
const coerceNumber = () =>
  z.preprocess((val) => {
    if (val === "" || val === null || val === undefined) return undefined;
    const num = Number(val);
    return isNaN(num) ? undefined : num;
  }, z.number().optional());

const coercePositiveNumber = () =>
  z.preprocess((val) => {
    if (val === "" || val === null || val === undefined) return undefined;
    const num = Number(val);
    return isNaN(num) ? undefined : num;
  }, z.number().positive().optional());

const CreateMaterialSchema = z.object({
  name: z.string().min(1, "Name is required"),
  category: MaterialCategorySchema,
  description: z.string().optional(),
  hardness_hrc_min: coerceNumber(),
  hardness_hrc_max: coerceNumber(),
  hardness_brinell: z.preprocess((val) => {
    if (val === "" || val === null || val === undefined) return undefined;
    const num = Number(val);
    return isNaN(num) ? undefined : Math.round(num);
  }, z.number().int().optional()),
  surface_speed_min_m_min: coercePositiveNumber(),
  surface_speed_max_m_min: coercePositiveNumber(),
  chip_load_factor: z.preprocess((val) => {
    if (val === "" || val === null || val === undefined) return 1.0;
    const num = Number(val);
    return isNaN(num) ? 1.0 : num;
  }, z.number().positive().default(1.0)),
  common_grades: z.array(z.string()).optional(),
  is_public: z.boolean().optional().default(false),
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
    const parsed = CreateMaterialSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.issues },
        { status: 400 }
      );
    }

    // Insert material into database
    const { data: material, error } = await supabase
      .from("materials")
      .insert({
        ...parsed.data,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating material:", error);
      return NextResponse.json(
        { error: "Failed to create material", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, material });
  } catch (error) {
    console.error("Error in POST /api/materials:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Get public materials and user's own materials
    let query = supabase.from("materials").select("*");

    if (user) {
      // If logged in, get public OR user's own materials
      query = query.or(`is_public.eq.true,created_by.eq.${user.id}`);
    } else {
      // If not logged in, only get public materials
      query = query.eq("is_public", true);
    }

    const { data: materials, error } = await query.order("name", {
      ascending: true,
    });

    if (error) {
      console.error("Error fetching materials:", error);
      return NextResponse.json(
        { error: "Failed to fetch materials" },
        { status: 500 }
      );
    }

    return NextResponse.json({ materials });
  } catch (error) {
    console.error("Error in GET /api/materials:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
