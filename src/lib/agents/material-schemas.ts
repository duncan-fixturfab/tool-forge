import { z } from "zod";

// Helper to handle null values from AI responses (converts null to undefined)
const optionalNumber = () =>
  z
    .number()
    .nullable()
    .optional()
    .transform((val) => val ?? undefined);
const optionalPositiveNumber = () =>
  z
    .number()
    .positive()
    .nullable()
    .optional()
    .transform((val) => val ?? undefined);
const optionalString = () =>
  z
    .string()
    .nullable()
    .optional()
    .transform((val) => val ?? undefined);

export const MaterialCategorySchema = z.enum([
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
]);

export const ExtractedMaterialSchema = z.object({
  name: z.string().describe("Material name (e.g., 'Polycarbonate', '6061-T6 Aluminum', '304 Stainless Steel')"),
  category: MaterialCategorySchema.describe("Material category for classification"),
  description: optionalString().describe("Brief description of the material and its properties"),

  // Hardness properties
  hardness_hrc_min: optionalNumber().describe("Minimum Rockwell C hardness (for hardened materials)"),
  hardness_hrc_max: optionalNumber().describe("Maximum Rockwell C hardness"),
  hardness_brinell: optionalNumber().describe("Brinell hardness number (HB)"),

  // Cutting parameters
  surface_speed_min_m_min: optionalPositiveNumber().describe("Minimum recommended cutting speed in m/min for carbide tools"),
  surface_speed_max_m_min: optionalPositiveNumber().describe("Maximum recommended cutting speed in m/min for carbide tools"),
  chip_load_factor: z
    .number()
    .positive()
    .describe("Chip load multiplier relative to aluminum baseline (1.0 = same as aluminum, <1.0 = harder material, >1.0 = softer material)"),

  // Common grades/alloys
  common_grades: z
    .array(z.string())
    .nullable()
    .optional()
    .transform((val) => val ?? undefined)
    .describe("Common grades, alloys, or trade names for this material"),

  // Extraction metadata
  confidence: z.number().min(0).max(1).describe("Confidence score for extraction accuracy (0-1)"),
  missing_fields: z
    .array(z.string())
    .nullable()
    .optional()
    .transform((val) => val ?? undefined)
    .describe("List of fields that could not be extracted"),
  notes: optionalString().describe("Additional notes or warnings about the extraction"),
});

export const MaterialExtractionResultSchema = z.object({
  success: z.boolean(),
  material: ExtractedMaterialSchema.optional(),
  error: z.string().optional(),
  source_type: z.enum(["url", "pdf", "text"]),
  raw_content: z.string().optional().describe("Original content that was parsed"),
});

export type MaterialCategory = z.infer<typeof MaterialCategorySchema>;
export type ExtractedMaterial = z.infer<typeof ExtractedMaterialSchema>;
export type MaterialExtractionResult = z.infer<typeof MaterialExtractionResultSchema>;
