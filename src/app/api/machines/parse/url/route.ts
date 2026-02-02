import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseMachineFromUrl } from "@/lib/agents/machine-parser-agent";
import { z } from "zod";

const RequestSchema = z.object({
  url: z.string().url(),
  machine_name: z.string().optional(),
});

export async function POST(request: NextRequest) {
  console.log("[machines/parse/url] POST request received");

  try {
    // Verify authentication
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.log("[machines/parse/url] Unauthorized - no user");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse and validate request
    const body = await request.json();
    console.log("[machines/parse/url] Request body:", { url: body.url, machine_name: body.machine_name });

    const parsed = RequestSchema.safeParse(body);

    if (!parsed.success) {
      console.log("[machines/parse/url] Request validation failed:", parsed.error.issues);
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.issues },
        { status: 400 }
      );
    }

    // Parse machine from URL
    console.log("[machines/parse/url] Calling parseMachineFromUrl...");
    const result = await parseMachineFromUrl(parsed.data.url, parsed.data.machine_name);

    console.log("[machines/parse/url] Result:", {
      success: result.success,
      error: result.error,
      machine: result.machine ? {
        name: result.machine.name,
        manufacturer: result.machine.manufacturer,
        model: result.machine.model,
        max_rpm: result.machine.max_rpm,
        confidence: result.machine.confidence,
      } : null,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[machines/parse/url] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
