import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseMaterialFromPdfContent } from "@/lib/agents/material-parser-agent";
import { z } from "zod";

const RequestSchema = z.object({
  pdf_text: z.string().min(10),
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

    // Parse material from PDF content
    const result = await parseMaterialFromPdfContent(parsed.data.pdf_text);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error parsing material from PDF:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
