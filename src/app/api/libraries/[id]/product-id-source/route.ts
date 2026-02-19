import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface UpdateProductIdSourceBody {
  productIdSource: "product_id" | "internal_reference";
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body: UpdateProductIdSourceBody = await request.json();
    const { productIdSource } = body;

    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate productIdSource value
    if (productIdSource !== "product_id" && productIdSource !== "internal_reference") {
      return NextResponse.json(
        { error: "productIdSource must be 'product_id' or 'internal_reference'" },
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

    // Update product_id_source
    const { error: updateError } = await supabase
      .from("tool_libraries")
      .update({ product_id_source: productIdSource })
      .eq("id", id);

    if (updateError) {
      console.error("Failed to update product_id_source:", updateError);
      return NextResponse.json(
        { error: "Failed to update product ID source" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating product_id_source:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
