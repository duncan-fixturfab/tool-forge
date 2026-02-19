import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseToolFromText } from "@/lib/agents/tool-parser-agent";
import { z } from "zod";

const RequestSchema = z.object({
  text: z.string().min(10).max(50000),
  product_url: z.string().url().optional(),
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
    const parsed = RequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.issues },
        { status: 400 }
      );
    }

    // Parse tool from text
    const result = await parseToolFromText(
      parsed.data.text,
      parsed.data.product_url
    );

    // Use provided product_url as fallback if AI didn't extract one
    if (
      result.success &&
      result.tool &&
      !result.tool.product_url &&
      parsed.data.product_url
    ) {
      result.tool.product_url = parsed.data.product_url;
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error parsing tool from text:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
