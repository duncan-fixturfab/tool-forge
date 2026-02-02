import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseHolderFromUrl } from "@/lib/agents/holder-parser-agent";
import { z } from "zod";

const RequestSchema = z.object({
  url: z.string().url(),
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
    const parsed = RequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const result = await parseHolderFromUrl(parsed.data.url);

    // Use source URL as product_url fallback if not extracted
    if (result.success && result.holder && !result.holder.product_url) {
      result.holder.product_url = parsed.data.url;
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error parsing holder from URL:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
