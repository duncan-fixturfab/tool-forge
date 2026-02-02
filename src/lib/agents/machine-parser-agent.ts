import Anthropic from "@anthropic-ai/sdk";
import { ExtractedMachineSchema, MachineExtractionResult } from "./machine-schemas";

const client = new Anthropic();

const SYSTEM_PROMPT = `You are a CNC machine specification extraction specialist. Your job is to extract precise machine specifications from product pages, datasheets, brochures, and descriptions.

When extracting machine specifications, focus on these key parameters:

SPINDLE SPECIFICATIONS:
- Maximum RPM: The top spindle speed (critical for calculating surface speed)
- Minimum RPM: The lowest spindle speed (often 0 or near 0)
- Spindle Power: Motor power in kW (convert HP to kW: 1 HP = 0.746 kW)

WORK ENVELOPE (TRAVEL):
- X-axis travel: Left-right movement in mm
- Y-axis travel: Front-back movement in mm
- Z-axis travel: Up-down movement in mm
- Convert inches to mm: 1 inch = 25.4 mm

FEED RATES:
- Maximum XY feed rate: Rapid traverse speed for X/Y axes in mm/min
- Maximum Z feed rate: Rapid traverse speed for Z axis in mm/min
- Convert in/min to mm/min: multiply by 25.4

TOOL HOLDER:
- Tool holder type: Common types include:
  - ER collets: ER11, ER16, ER20, ER25, ER32, ER40
  - CAT tapers: CAT30, CAT40, CAT50
  - BT tapers: BT30, BT40, BT50
  - HSK: HSK-A63, HSK-E40, etc.
  - R8: Common in Bridgeport-style mills
- Maximum tool diameter: Largest tool that can fit

MACHINE IDENTIFICATION:
- Manufacturer: The company that makes the machine (e.g., Haas, Tormach, DMG MORI, Carbide 3D)
- Model: The specific model designation (e.g., VF-2, PCNC 1100, Shapeoko 4 XXL)
- Name: Full descriptive name combining manufacturer and model

IMPORTANT:
- Convert all measurements to metric (mm for dimensions, kW for power, mm/min for feeds)
- If a dimension is in inches, convert to mm (multiply by 25.4)
- If power is in HP, convert to kW (multiply by 0.746)
- Report confidence as 0-1 based on how complete and clear the data is
- List any fields you couldn't find in missing_fields
- If you have to estimate or infer a value, note it and lower confidence
- Return the data as valid JSON matching the expected schema`;

export async function parseMachineFromContent(
  content: string,
  sourceType: "url" | "pdf" | "text",
  machineName?: string,
  sourceUrl?: string
): Promise<MachineExtractionResult> {
  console.log("[machine-parser] Starting extraction:", { sourceType, machineName, contentLength: content.length });

  try {
    const userPrompt = `Extract the CNC machine specifications from the following content.
${machineName ? `Machine name hint: ${machineName}` : ""}
${sourceUrl ? `Source URL: ${sourceUrl}` : ""}
${sourceType === "pdf" ? "This content was extracted from a PDF document." : ""}

Content:
---
${content}
---

Extract the machine specifications and return them in the following JSON format:
{
  "name": "string - full machine name",
  "manufacturer": "string - machine manufacturer",
  "model": "string - model number/name",
  "description": "string (optional) - brief description",
  "max_rpm": number - maximum spindle RPM,
  "min_rpm": number (optional) - minimum spindle RPM,
  "spindle_power_kw": number (optional) - spindle power in kW,
  "travel_x_mm": number (optional) - X travel in mm,
  "travel_y_mm": number (optional) - Y travel in mm,
  "travel_z_mm": number (optional) - Z travel in mm,
  "max_feed_xy_mm_min": number (optional) - max XY feed in mm/min,
  "max_feed_z_mm_min": number (optional) - max Z feed in mm/min,
  "tool_holder_type": "string (optional) - tool holder type",
  "max_tool_diameter_mm": number (optional) - max tool diameter in mm,
  "confidence": number 0-1 - extraction confidence,
  "missing_fields": ["string"] (optional) - fields not found,
  "notes": "string (optional) - any warnings or notes"
}`;

    console.log("[machine-parser] Calling Claude API...");
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: userPrompt,
        },
      ],
    });
    console.log("[machine-parser] Claude API response received, stop_reason:", response.stop_reason);

    // Extract the text content from the response
    const textContent = response.content.find((block) => block.type === "text");
    if (!textContent || textContent.type !== "text") {
      return {
        success: false,
        error: "No text response from AI",
        source_type: sourceType,
      };
    }

    // Parse the JSON from the response
    let jsonStr = textContent.text;

    // Try to extract JSON from markdown code blocks
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    // Parse and validate with Zod
    const parsed = JSON.parse(jsonStr);
    console.log("[machine-parser] Raw parsed JSON:", JSON.stringify(parsed, null, 2));

    const validated = ExtractedMachineSchema.safeParse(parsed);

    if (!validated.success) {
      console.log("[machine-parser] Validation failed:", validated.error.issues);
      return {
        success: false,
        error: `Validation error: ${JSON.stringify(validated.error.issues)}`,
        source_type: sourceType,
        raw_content: content.substring(0, 1000),
      };
    }

    console.log("[machine-parser] Validation successful:", validated.data.name);
    return {
      success: true,
      machine: validated.data,
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

export async function parseMachineFromUrl(
  url: string,
  machineName?: string
): Promise<MachineExtractionResult> {
  console.log("[machine-parser] Fetching URL:", url);

  try {
    // Fetch the URL content
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    console.log("[machine-parser] Fetch response:", { status: response.status, ok: response.ok });

    if (!response.ok) {
      return {
        success: false,
        error: `Failed to fetch URL: ${response.status} ${response.statusText}`,
        source_type: "url",
      };
    }

    const html = await response.text();
    console.log("[machine-parser] Fetched HTML length:", html.length);

    // Basic HTML to text conversion (removing scripts, styles, etc.)
    const cleanedContent = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .substring(0, 15000); // Limit content size

    return parseMachineFromContent(cleanedContent, "url", machineName, url);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch URL",
      source_type: "url",
    };
  }
}

export async function parseMachineFromText(
  text: string,
  machineName?: string
): Promise<MachineExtractionResult> {
  return parseMachineFromContent(text, "text", machineName);
}

export async function parseMachineFromPdfContent(
  pdfText: string,
  machineName?: string
): Promise<MachineExtractionResult> {
  return parseMachineFromContent(pdfText, "pdf", machineName);
}
