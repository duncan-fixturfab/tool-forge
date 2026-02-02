import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseToolFromUrl } from "@/lib/agents/tool-parser-agent";
import { z } from "zod";

const RequestSchema = z.object({
  url: z.string().url(),
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

    // Parse tool from URL
    const result = await parseToolFromUrl(parsed.data.url);

    // Use source URL as product_url fallback if not extracted
    if (result.success && result.tool && !result.tool.product_url) {
      result.tool.product_url = parsed.data.url;
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error parsing tool from URL:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
