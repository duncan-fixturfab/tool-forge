import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { ExtractedMaterialSchema, MaterialExtractionResult } from "./material-schemas";

const client = new Anthropic();

// User-friendly field labels for error messages
const FIELD_LABELS: Record<string, string> = {
  name: "Material name",
  category: "Material category",
  chip_load_factor: "Chip load factor",
  confidence: "Confidence score",
  description: "Description",
  hardness_hrc_min: "Minimum HRC hardness",
  hardness_hrc_max: "Maximum HRC hardness",
  hardness_brinell: "Brinell hardness",
  surface_speed_min_m_min: "Minimum surface speed",
  surface_speed_max_m_min: "Maximum surface speed",
  common_grades: "Common grades",
  missing_fields: "Missing fields",
  notes: "Notes",
};

// Valid category options for helpful error messages
const VALID_CATEGORIES = [
  "aluminum",
  "steel",
  "stainless_steel",
  "titanium",
  "brass",
  "copper",
  "plastic",
  "wood",
  "composite",
  "cast_iron",
];

// Domains that require JavaScript rendering (SPAs, dynamic content)
const JS_HEAVY_DOMAINS = ["mcmaster.com", "grainger.com", "mscdirect.com"];

/**
 * Check if a URL requires JavaScript rendering to get content
 */
function requiresJsRendering(url: string): boolean {
  try {
    const hostname = new URL(url).hostname;
    return JS_HEAVY_DOMAINS.some((domain) => hostname.includes(domain));
  } catch {
    return false;
  }
}

/**
 * Fetch URL content using Jina Reader for JavaScript-rendered pages
 * Jina Reader renders JS and returns clean markdown optimized for LLMs
 */
async function fetchWithJinaReader(url: string): Promise<string> {
  const jinaUrl = `https://r.jina.ai/${url}`;
  const response = await fetch(jinaUrl, {
    headers: {
      Accept: "text/markdown",
    },
  });

  if (!response.ok) {
    throw new Error(`Jina Reader failed: ${response.status} ${response.statusText}`);
  }

  return response.text();
}

/**
 * Fetch URL content with simple HTTP request and clean HTML to text
 * Used for static HTML sites that don't require JavaScript rendering
 */
async function fetchAndCleanHtml(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();

  // Basic HTML to text conversion (removing scripts, styles, etc.)
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Format Zod validation errors into user-friendly messages
 */
function formatValidationErrors(issues: z.ZodIssue[]): string {
  const fieldErrors = issues.map((issue) => {
    const fieldName = issue.path.join(".");
    const label = FIELD_LABELS[fieldName] || fieldName;

    // Customize message based on error type
    if (issue.code === "invalid_value" && fieldName === "category") {
      return `- ${label}: Invalid value. Must be one of: ${VALID_CATEGORIES.join(", ")}`;
    }
    if (issue.code === "invalid_type") {
      const expected = "expected" in issue ? issue.expected : "unknown";
      const received = "received" in issue ? issue.received : "unknown";
      if (received === "null" || received === "undefined") {
        return `- ${label}: Required value was not found in the source`;
      }
      return `- ${label}: Expected ${expected}, but got ${received}`;
    }

    return `- ${label}: ${issue.message}`;
  });

  return (
    "Could not extract all required material properties:\n" +
    fieldErrors.join("\n") +
    "\n\nTry using the Text tab to manually enter material specifications, or use a different source URL."
  );
}

const SYSTEM_PROMPT = `You are a CNC machining material specification specialist. Your job is to extract material properties and recommended cutting parameters from product pages, datasheets, and material specifications.

When extracting material information, focus on:
- Material name and common designations/grades
- Material category (aluminum, steel, stainless_steel, titanium, brass, copper, plastic, wood, composite, cast_iron)
- Hardness values (Rockwell C for hardened materials, Brinell for softer materials)
- Recommended cutting speeds for CNC machining with carbide tools

Material categories:
- aluminum: All aluminum alloys (6061, 7075, 2024, cast aluminum, etc.)
- steel: Carbon steels, alloy steels, tool steels (1018, 4140, 4340, D2, etc.)
- stainless_steel: All stainless steel grades (304, 316, 17-4 PH, etc.)
- titanium: Titanium and titanium alloys (Grade 2, Ti-6Al-4V, etc.)
- brass: Brass alloys (360 brass, C360, free-cutting brass, etc.)
- copper: Copper and copper alloys (C110, ETP copper, etc.)
- plastic: All plastics (Delrin/POM, HDPE, acrylic/PMMA, polycarbonate, nylon, PEEK, UHMW, ABS, etc.)
- wood: Natural wood, MDF, plywood, hardboard
- composite: Carbon fiber (CFRP), fiberglass (GFRP), G10/FR4, Garolite
- cast_iron: Gray iron, ductile iron, malleable iron

Chip load factor guidelines (relative to aluminum = 1.0):
- Soft plastics (HDPE, UHMW): 1.5-1.8
- Medium plastics (Delrin, nylon, polycarbonate): 1.3-1.5
- Acrylic: 1.2-1.4 (careful of melting)
- Aluminum: 1.0-1.2
- Brass: 1.2-1.4
- Copper: 1.0-1.2
- Wood: 1.4-1.8
- Carbon steel: 0.8-1.0
- Alloy steel: 0.7-0.9
- Stainless steel: 0.6-0.8
- Tool steel: 0.5-0.7
- Titanium: 0.4-0.6
- Composites: 0.5-0.8

Surface speed guidelines for carbide tools (m/min):
- Plastics: 100-500 (lower for heat-sensitive materials like acrylic, polycarbonate)
- Aluminum: 150-500
- Brass: 100-300
- Copper: 80-250
- Wood: 200-800
- Carbon steel: 60-150
- Alloy steel: 45-120
- Stainless steel: 30-100
- Tool steel: 20-60
- Titanium: 30-80
- Composites: 50-180

IMPORTANT:
- Identify the correct category based on material composition
- If hardness values are given in other scales, convert or note them
- Provide surface speed recommendations based on the material type
- Report confidence as 0-1 based on how complete the data is
- List any fields you couldn't determine in missing_fields
- For plastics, note any thermal sensitivity or special machining considerations`;

// Tool definition for structured output
const extractMaterialTool: Anthropic.Tool = {
  name: "extract_material",
  description: "Extract material properties and CNC machining parameters from the provided content",
  input_schema: {
    type: "object" as const,
    properties: {
      name: {
        type: "string",
        description: "Material name (e.g., 'Polycarbonate', '6061-T6 Aluminum', '304 Stainless Steel')",
      },
      category: {
        type: "string",
        enum: [
          "aluminum",
          "steel",
          "stainless_steel",
          "titanium",
          "brass",
          "copper",
          "plastic",
          "wood",
          "composite",
          "cast_iron",
        ],
        description: "Material category for classification",
      },
      description: {
        type: "string",
        description: "Brief description of the material and its properties",
      },
      hardness_hrc_min: {
        type: "number",
        description: "Minimum Rockwell C hardness (for hardened materials)",
      },
      hardness_hrc_max: {
        type: "number",
        description: "Maximum Rockwell C hardness",
      },
      hardness_brinell: {
        type: "number",
        description: "Brinell hardness number (HB)",
      },
      surface_speed_min_m_min: {
        type: "number",
        description: "Minimum recommended cutting speed in m/min for carbide tools",
      },
      surface_speed_max_m_min: {
        type: "number",
        description: "Maximum recommended cutting speed in m/min for carbide tools",
      },
      chip_load_factor: {
        type: "number",
        description: "Chip load multiplier relative to aluminum baseline (1.0 = same as aluminum)",
      },
      common_grades: {
        type: "array",
        items: { type: "string" },
        description: "Common grades, alloys, or trade names for this material",
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
        description: "Additional notes or warnings about machining this material",
      },
    },
    required: ["name", "category", "chip_load_factor", "confidence"],
  },
};

export async function parseMaterialFromContent(
  content: string,
  sourceType: "url" | "pdf" | "text",
  sourceUrl?: string
): Promise<MaterialExtractionResult> {
  try {
    const userPrompt = `Extract the material specifications and CNC machining parameters from the following content.
${sourceUrl ? `Source URL: ${sourceUrl}` : ""}
${sourceType === "pdf" ? "This content was extracted from a PDF document." : ""}

Content:
---
${content}
---

Use the extract_material function to provide the extracted material information.`;

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      tools: [extractMaterialTool],
      tool_choice: { type: "tool", name: "extract_material" },
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
    const validated = ExtractedMaterialSchema.safeParse(toolUse.input);

    if (!validated.success) {
      return {
        success: false,
        error: formatValidationErrors(validated.error.issues),
        source_type: sourceType,
        raw_content: content.substring(0, 1000),
      };
    }

    return {
      success: true,
      material: validated.data,
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

export async function parseMaterialFromUrl(url: string): Promise<MaterialExtractionResult> {
  try {
    let content: string;

    if (requiresJsRendering(url)) {
      // Use Jina Reader for JS-heavy sites (McMaster, Grainger, etc.)
      content = await fetchWithJinaReader(url);
    } else {
      // Use simple fetch for static HTML sites
      content = await fetchAndCleanHtml(url);
    }

    // Limit content size for LLM
    const trimmedContent = content.substring(0, 15000);

    return parseMaterialFromContent(trimmedContent, "url", url);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch URL",
      source_type: "url",
    };
  }
}

export async function parseMaterialFromText(text: string): Promise<MaterialExtractionResult> {
  return parseMaterialFromContent(text, "text");
}

export async function parseMaterialFromPdfContent(
  pdfText: string
): Promise<MaterialExtractionResult> {
  return parseMaterialFromContent(pdfText, "pdf");
}
