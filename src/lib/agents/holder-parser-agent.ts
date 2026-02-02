import Anthropic from "@anthropic-ai/sdk";
import { ExtractedToolHolderSchema, HolderExtractionResult } from "./holder-schemas";

const client = new Anthropic();

const SYSTEM_PROMPT = `You are a CNC tool holder geometry extraction specialist. Your job is to extract precise tool holder specifications from product pages, datasheets, and descriptions.

TOOL HOLDER TYPES:
- Taper types define the spindle interface: ISO20/25/30/40/50, CAT40/50, BT30/40/50, HSK variants
- Collet types define what tools can be held: ER11/16/20/25/32, TG, etc.
- Some machines (routers) use direct collet systems like ER20 (no separate taper)

KEY MEASUREMENTS:
- Gauge Length: Total length from spindle face to collet nut face (where tool stickout is measured from)
- Segments: The holder profile from spindle face toward tool. Each segment has:
  - Height: Length of that segment in mm
  - Lower diameter: Diameter at the spindle end of the segment in mm
  - Upper diameter: Diameter at the tool end of the segment in mm
  (Segments define the holder's external profile for collision detection in CAM software)

COLLET CAPACITY (typical ranges):
- ER11: 0.5-7mm shank diameter
- ER16: 1-10mm shank diameter
- ER20: 1-13mm shank diameter
- ER25: 1-16mm shank diameter
- ER32: 2-20mm shank diameter
- ER40: 3-26mm shank diameter

COMMON HOLDER PATTERNS:
- "ISO20 ER16" = ISO20 taper with ER16 collet chuck
- "CAT40 ER32" = CAT40 taper with ER32 collet chuck
- "BT30 ER25" = BT30 taper with ER25 collet chuck
- Shrink fit holders typically accept a single specific tool diameter
- Hydraulic chucks have specific bore sizes

SEGMENT EXTRACTION TIPS:
- Start from the spindle face (widest part, the taper flange)
- Work toward the collet nut (where the tool goes in)
- Typical holder has 2-4 segments
- If exact segment dimensions aren't given, estimate from overall shape and common profiles
- The first segment is usually the taper body (largest diameter)
- Middle segments are often the neck/reduced section
- Final segment is often the collet nut housing

IMPORTANT:
- Convert all measurements to millimeters (1 inch = 25.4 mm)
- If a dimension is ambiguous, make your best estimate and note it
- Report confidence as 0-1 based on how complete and clear the data is
- List any fields you couldn't find in missing_fields
- Product URL: When a source URL is provided, use that URL as the product_url`;

// Tool definition for structured output
const extractHolderTool: Anthropic.Tool = {
  name: "extract_holder",
  description: "Extract CNC tool holder geometry and specifications from the provided content",
  input_schema: {
    type: "object" as const,
    properties: {
      name: {
        type: "string",
        description: "Holder name or description (e.g., 'ISO20 ER16 Collet Chuck')",
      },
      description: {
        type: "string",
        description: "Detailed description of the holder",
      },
      taper_type: {
        type: "string",
        enum: [
          "ISO20", "ISO25", "ISO30", "ISO40", "ISO50",
          "CAT40", "CAT50",
          "BT30", "BT40", "BT50",
          "HSK-A40", "HSK-A63", "HSK-A100",
          "HSK-E25", "HSK-E32", "HSK-E40", "HSK-F63",
          "ER11", "ER16", "ER20", "ER25", "ER32",
          "TTS", "R8", "MT2", "MT3",
          "other",
        ],
        description: "Spindle taper interface type",
      },
      collet_type: {
        type: "string",
        description: "Collet type if applicable (e.g., 'ER16', 'ER20', 'ER32')",
      },
      collet_min_mm: {
        type: "number",
        description: "Minimum shank diameter the holder accepts in millimeters",
      },
      collet_max_mm: {
        type: "number",
        description: "Maximum shank diameter the holder accepts in millimeters",
      },
      gauge_length_mm: {
        type: "number",
        description: "Total gauge length from spindle face to collet reference in millimeters",
      },
      segments: {
        type: "array",
        items: {
          type: "object",
          properties: {
            height: {
              type: "number",
              description: "Segment height in millimeters",
            },
            lower_diameter: {
              type: "number",
              description: "Diameter at bottom of segment (spindle end) in millimeters",
            },
            upper_diameter: {
              type: "number",
              description: "Diameter at top of segment (tool end) in millimeters",
            },
          },
          required: ["height", "lower_diameter", "upper_diameter"],
        },
        description: "Holder geometry segments from spindle face toward tool",
      },
      vendor: {
        type: "string",
        description: "Holder manufacturer/vendor name",
      },
      product_id: {
        type: "string",
        description: "Vendor product ID or SKU",
      },
      product_url: {
        type: "string",
        description: "Product page URL",
      },
      confidence: {
        type: "number",
        description: "Extraction confidence score (0-1)",
      },
      missing_fields: {
        type: "array",
        items: { type: "string" },
        description: "Fields that could not be extracted",
      },
      notes: {
        type: "string",
        description: "Additional extraction notes or warnings",
      },
    },
    required: ["name", "taper_type", "gauge_length_mm", "segments", "confidence"],
  },
};

export async function parseHolderFromContent(
  content: string,
  sourceType: "url" | "pdf" | "text",
  sourceUrl?: string
): Promise<HolderExtractionResult> {
  try {
    const userPrompt = `Extract the CNC tool holder geometry from the following content.
${sourceUrl ? `Source URL: ${sourceUrl}` : ""}
${sourceType === "pdf" ? "This content was extracted from a PDF document." : ""}

Content:
---
${content}
---

Use the extract_holder function to provide the extracted holder information.`;

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      tools: [extractHolderTool],
      tool_choice: { type: "tool", name: "extract_holder" },
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
    const validated = ExtractedToolHolderSchema.safeParse(toolUse.input);

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
      holder: validated.data,
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

export async function parseHolderFromUrl(url: string): Promise<HolderExtractionResult> {
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

    return parseHolderFromContent(cleanedContent, "url", url);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch URL",
      source_type: "url",
    };
  }
}

export async function parseHolderFromText(text: string): Promise<HolderExtractionResult> {
  return parseHolderFromContent(text, "text");
}

export async function parseHolderFromPdfContent(
  pdfText: string
): Promise<HolderExtractionResult> {
  return parseHolderFromContent(pdfText, "pdf");
}
