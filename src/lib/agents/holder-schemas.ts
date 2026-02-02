import { z } from "zod";

export const HolderTaperTypeSchema = z.enum([
  "ISO20",
  "ISO25",
  "ISO30",
  "ISO40",
  "ISO50",
  "CAT40",
  "CAT50",
  "BT30",
  "BT40",
  "BT50",
  "HSK-A40",
  "HSK-A63",
  "HSK-A100",
  "HSK-E25",
  "HSK-E32",
  "HSK-E40",
  "HSK-F63",
  "ER11",
  "ER16",
  "ER20",
  "ER25",
  "ER32",
  "TTS",
  "R8",
  "MT2",
  "MT3",
  "other",
]);

export const ToolHolderSegmentSchema = z.object({
  height: z.number().positive().describe("Segment height in millimeters"),
  lower_diameter: z.number().positive().describe("Diameter at bottom of segment (spindle end) in millimeters"),
  upper_diameter: z.number().positive().describe("Diameter at top of segment (tool end) in millimeters"),
});

export const ExtractedToolHolderSchema = z.object({
  name: z.string().describe("Holder name or description (e.g., 'ISO20 ER16 Collet Chuck')"),
  description: z.string().optional().describe("Detailed description of the holder"),
  taper_type: HolderTaperTypeSchema.describe("Spindle taper interface type"),
  collet_type: z.string().optional().describe("Collet type if applicable (e.g., 'ER16', 'ER20', 'ER32')"),
  collet_min_mm: z.number().positive().optional().describe("Minimum shank diameter the holder accepts in millimeters"),
  collet_max_mm: z.number().positive().optional().describe("Maximum shank diameter the holder accepts in millimeters"),
  gauge_length_mm: z.number().positive().describe("Total gauge length from spindle face to collet reference in millimeters"),
  segments: z.array(ToolHolderSegmentSchema).min(1).describe("Holder geometry segments from spindle face toward tool"),
  vendor: z.string().optional().describe("Holder manufacturer/vendor name"),
  product_id: z.string().optional().describe("Vendor product ID or SKU"),
  product_url: z.string().url().optional().describe("Product page URL"),
  confidence: z.number().min(0).max(1).describe("Extraction confidence score (0-1)"),
  missing_fields: z.array(z.string()).optional().describe("Fields that could not be extracted"),
  notes: z.string().optional().describe("Additional extraction notes or warnings"),
});

export const HolderExtractionResultSchema = z.object({
  success: z.boolean(),
  holder: ExtractedToolHolderSchema.optional(),
  error: z.string().optional(),
  source_type: z.enum(["url", "pdf", "text"]),
  raw_content: z.string().optional().describe("Original content that was parsed"),
});

export type HolderTaperType = z.infer<typeof HolderTaperTypeSchema>;
export type ToolHolderSegment = z.infer<typeof ToolHolderSegmentSchema>;
export type ExtractedToolHolder = z.infer<typeof ExtractedToolHolderSchema>;
export type HolderExtractionResult = z.infer<typeof HolderExtractionResultSchema>;
