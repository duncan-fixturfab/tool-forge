import Anthropic from "@anthropic-ai/sdk";
import { ExtractedToolSchema, ExtractionResult } from "./schemas";

const client = new Anthropic();

const SYSTEM_PROMPT = `You are a CNC tool geometry extraction specialist. Your job is to extract precise tool specifications from product pages, datasheets, and descriptions.

When extracting tool geometry, focus on these key measurements:
- Diameter (D or DC): The cutting diameter of the tool
- Number of Flutes (z or NOF): Count of cutting edges
- Overall Length (OAL): Total tool length
- Flute Length (LOC or LCF): Length of the cutting/fluted section
- Shank Diameter: Diameter of the shank (often same as cutting diameter for smaller tools)
- Corner Radius (R or RE): For bull nose endmills, the corner radius
- Point Angle: For drills, the tip angle (commonly 118° or 135°)
- Helix Angle: The angle of the flute spiral

Tool type identification:
- flat_endmill: Square end, no corner radius, for general milling
- ball_endmill: Hemispherical end (corner radius = diameter/2)
- bull_endmill: Flat end with corner radius (0 < radius < diameter/2)
- drill: Pointed end for drilling holes
- spot_drill: Short, stiff drill for hole starting/chamfering
- chamfer_mill: Angled cutter for chamfers and countersinks
- face_mill: Large diameter cutter for face milling
- thread_mill: Threaded profile for thread milling
- reamer: Precision finishing tool for holes
- tap: Threaded tool for cutting internal threads
- engraving_tool: Fine point tool for engraving

IMPORTANT:
- Convert all measurements to millimeters (1 inch = 25.4 mm)
- If a dimension is ambiguous, make your best estimate and note it
- Report confidence as 0-1 based on how complete and clear the data is
- List any fields you couldn't find in missing_fields
- Common vendor abbreviations: D=diameter, LOC=flute length, OAL=overall length, z=flutes
- Product URL: When a source URL is provided, use that URL as the product_url. Otherwise, look for product page links in the content (e.g., Amazon, MSC Direct, McMaster-Carr, Odoo ERP links).`;

// Tool definition for structured output
const extractToolTool: Anthropic.Tool = {
  name: "extract_tool",
  description: "Extract CNC tool geometry and specifications from the provided content",
  input_schema: {
    type: "object" as const,
    properties: {
      name: {
        type: "string",
        description: "Tool name or product description",
      },
      type: {
        type: "string",
        enum: [
          "flat_endmill",
          "ball_endmill",
          "bull_endmill",
          "drill",
          "spot_drill",
          "chamfer_mill",
          "face_mill",
          "thread_mill",
          "reamer",
          "tap",
          "engraving_tool",
        ],
        description: "Type of cutting tool",
      },
      vendor: {
        type: "string",
        description: "Tool manufacturer/vendor name",
      },
      product_id: {
        type: "string",
        description: "Vendor product ID or SKU",
      },
      product_url: {
        type: "string",
        description: "Product page URL for purchasing the tool",
      },
      geometry: {
        type: "object",
        properties: {
          diameter_mm: {
            type: "number",
            description: "Tool cutting diameter in millimeters",
          },
          number_of_flutes: {
            type: "integer",
            description: "Number of cutting flutes/teeth",
          },
          overall_length_mm: {
            type: "number",
            description: "Total length of tool in millimeters",
          },
          flute_length_mm: {
            type: "number",
            description: "Length of fluted/cutting section in millimeters",
          },
          shank_diameter_mm: {
            type: "number",
            description: "Shank diameter in millimeters",
          },
          corner_radius_mm: {
            type: "number",
            description: "Corner radius for bull endmills in millimeters",
          },
          point_angle_deg: {
            type: "number",
            description: "Point angle for drills in degrees (typically 118 or 135)",
          },
          helix_angle_deg: {
            type: "number",
            description: "Helix angle in degrees",
          },
          neck_diameter_mm: {
            type: "number",
            description: "Neck diameter (reduced shank section) in millimeters",
          },
          neck_length_mm: {
            type: "number",
            description: "Length of neck section in millimeters",
          },
        },
        required: ["diameter_mm", "number_of_flutes", "overall_length_mm", "flute_length_mm"],
        description: "Tool geometry measurements",
      },
      coating: {
        type: "string",
        description: "Tool coating type (e.g., TiAlN, TiN, DLC, uncoated)",
      },
      substrate: {
        type: "string",
        description: "Tool material (e.g., carbide, HSS, cobalt)",
      },
      confidence: {
        type: "number",
        description: "Confidence score for extraction accuracy (0-1)",
      },
      missing_fields: {
        type: "array",
        items: { type: "string" },
        description: "List of fields that could not be extracted",
      },
      notes: {
        type: "string",
        description: "Additional notes or warnings about the extraction",
      },
    },
    required: ["name", "type", "geometry", "confidence"],
  },
};

export async function parseToolFromContent(
  content: string,
  sourceType: "url" | "pdf" | "text",
  sourceUrl?: string
): Promise<ExtractionResult> {
  try {
    const userPrompt = `Extract the CNC tool geometry from the following content.
${sourceUrl ? `Source URL: ${sourceUrl}` : ""}
${sourceType === "pdf" ? "This content was extracted from a PDF document." : ""}

Content:
---
${content}
---

Use the extract_tool function to provide the extracted tool information.`;

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      tools: [extractToolTool],
      tool_choice: { type: "tool", name: "extract_tool" },
      messages: [
        {
          role: "user",
          content: userPrompt,
        },
      ],
    });

    // Extract the tool use content from the response
    const toolUse = response.content.find((block) => block.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") {
      return {
        success: false,
        error: "No tool response from AI",
        source_type: sourceType,
      };
    }

    // Validate the tool input with Zod
    const validated = ExtractedToolSchema.safeParse(toolUse.input);

    if (!validated.success) {
      return {
        success: false,
        error: `Validation error: ${JSON.stringify(validated.error.issues)}`,
        source_type: sourceType,
        raw_content: content.substring(0, 1000),
      };
    }

    return {
      success: true,
      tool: validated.data,
      source_type: sourceType,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      source_type: sourceType,
    };
  }
}

export async function parseToolFromUrl(url: string): Promise<ExtractionResult> {
  try {
    // Fetch the URL content
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    if (!response.ok) {
      return {
        success: false,
        error: `Failed to fetch URL: ${response.status} ${response.statusText}`,
        source_type: "url",
      };
    }

    const html = await response.text();

    // Basic HTML to text conversion (removing scripts, styles, etc.)
    const cleanedContent = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .substring(0, 15000); // Limit content size

    return parseToolFromContent(cleanedContent, "url", url);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch URL",
      source_type: "url",
    };
  }
}

export async function parseToolFromText(
  text: string,
  sourceUrl?: string
): Promise<ExtractionResult> {
  return parseToolFromContent(text, "text", sourceUrl);
}

export async function parseToolFromPdfContent(
  pdfText: string
): Promise<ExtractionResult> {
  return parseToolFromContent(pdfText, "pdf");
}
