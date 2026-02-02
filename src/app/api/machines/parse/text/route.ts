import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseMachineFromText } from "@/lib/agents/machine-parser-agent";
import { z } from "zod";

const RequestSchema = z.object({
  text: z.string().min(10, "Text must be at least 10 characters"),
  machine_name: z.string().optional(),
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

    // Parse machine from text
    const result = await parseMachineFromText(parsed.data.text, parsed.data.machine_name);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error parsing machine from text:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
