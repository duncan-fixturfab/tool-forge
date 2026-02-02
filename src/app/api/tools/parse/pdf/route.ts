import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "File must be a PDF" },
        { status: 400 }
      );
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large (max 10MB)" },
        { status: 400 }
      );
    }

    // Read file content and convert to base64
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString("base64");

    // For PDF parsing, we'll use Claude's vision capability
    // by sending the PDF as a document
    const Anthropic = (await import("@anthropic-ai/sdk")).default;
    const client = new Anthropic();

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "document",
              source: {
                type: "base64",
                media_type: "application/pdf",
                data: base64,
              },
            },
            {
              type: "text",
              text: `Extract the CNC tool geometry from this PDF document. Look for tool specifications including:
- Diameter (D, DC)
- Number of flutes (z, NOF)
- Overall length (OAL)
- Flute/cutting length (LOC, LCF)
- Shank diameter
- Corner radius (for endmills)
- Point angle (for drills)
- Helix angle
- Tool coating
- Tool material/substrate

Identify the tool type:
- flat_endmill: Square end, no corner radius
- ball_endmill: Hemispherical end (radius = diameter/2)
- bull_endmill: Flat end with corner radius
- drill: Pointed end for drilling
- spot_drill: Short drill for starting holes
- chamfer_mill: Angled cutter
- face_mill: Large diameter face cutter
- thread_mill: For thread milling
- reamer: Precision finishing tool
- tap: For cutting threads
- engraving_tool: Fine point engraver

IMPORTANT: Convert all measurements to millimeters (1 inch = 25.4 mm).

Return the extracted data as JSON in this format:
{
  "name": "Tool name/description",
  "type": "tool_type",
  "vendor": "manufacturer name",
  "product_id": "SKU or part number",
  "geometry": {
    "diameter_mm": number,
    "number_of_flutes": number,
    "overall_length_mm": number,
    "flute_length_mm": number,
    "shank_diameter_mm": number (optional),
    "corner_radius_mm": number (optional),
    "point_angle_deg": number (optional),
    "helix_angle_deg": number (optional)
  },
  "coating": "coating type",
  "substrate": "tool material",
  "confidence": 0.0-1.0,
  "missing_fields": ["list", "of", "missing", "fields"],
  "notes": "any additional notes"
}`,
            },
          ],
        },
      ],
    });

    // Extract text content
    const textContent = response.content.find((block) => block.type === "text");
    if (!textContent || textContent.type !== "text") {
      return NextResponse.json({
        success: false,
        error: "No response from AI",
        source_type: "pdf",
      });
    }

    // Parse JSON from response
    let jsonStr = textContent.text;
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    try {
      const parsed = JSON.parse(jsonStr);
      return NextResponse.json({
        success: true,
        tool: parsed,
        source_type: "pdf",
      });
    } catch {
      return NextResponse.json({
        success: false,
        error: "Failed to parse AI response as JSON",
        source_type: "pdf",
        raw_content: jsonStr.substring(0, 1000),
      });
    }
  } catch (error) {
    console.error("Error parsing tool from PDF:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
