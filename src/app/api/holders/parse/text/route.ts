import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseHolderFromText } from "@/lib/agents/holder-parser-agent";
import { z } from "zod";

const RequestSchema = z.object({
  text: z.string().min(10, "Text must be at least 10 characters"),
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

    const result = await parseHolderFromText(parsed.data.text);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error parsing holder from text:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
