import { z } from "zod";

export const ToolTypeSchema = z.enum([
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
]);

export const ToolGeometrySchema = z.object({
  diameter_mm: z.number().positive().describe("Tool cutting diameter in millimeters"),
  number_of_flutes: z.number().int().positive().describe("Number of cutting flutes/teeth"),
  overall_length_mm: z.number().positive().describe("Total length of tool in millimeters"),
  flute_length_mm: z.number().positive().describe("Length of fluted/cutting section in millimeters"),
  shank_diameter_mm: z.number().positive().optional().describe("Shank diameter in millimeters"),
  corner_radius_mm: z.number().nonnegative().optional().describe("Corner radius for bull endmills in millimeters"),
  point_angle_deg: z.number().positive().optional().describe("Point angle for drills in degrees (typically 118 or 135)"),
  helix_angle_deg: z.number().positive().optional().describe("Helix angle in degrees"),
  neck_diameter_mm: z.number().positive().optional().describe("Neck diameter (reduced shank section) in millimeters"),
  neck_length_mm: z.number().positive().optional().describe("Length of neck section in millimeters"),
});

export const ExtractedToolSchema = z.object({
  name: z.string().describe("Tool name or product description"),
  type: ToolTypeSchema.describe("Type of cutting tool"),
  vendor: z.string().optional().describe("Tool manufacturer/vendor name"),
  product_id: z.string().optional().describe("Vendor product ID or SKU"),
  product_url: z.string().url().optional().describe("Product page URL for purchasing the tool"),
  geometry: ToolGeometrySchema.describe("Tool geometry measurements"),
  coating: z.string().optional().describe("Tool coating type (e.g., TiAlN, TiN, DLC, uncoated)"),
  substrate: z.string().optional().describe("Tool material (e.g., carbide, HSS, cobalt)"),
  confidence: z.number().min(0).max(1).describe("Confidence score for extraction accuracy (0-1)"),
  missing_fields: z.array(z.string()).optional().describe("List of fields that could not be extracted"),
  notes: z.string().optional().describe("Additional notes or warnings about the extraction"),
});

export const ExtractionResultSchema = z.object({
  success: z.boolean(),
  tool: ExtractedToolSchema.optional(),
  error: z.string().optional(),
  source_type: z.enum(["url", "pdf", "text"]),
  raw_content: z.string().optional().describe("Original content that was parsed"),
});

export type ToolType = z.infer<typeof ToolTypeSchema>;
export type ToolGeometry = z.infer<typeof ToolGeometrySchema>;
export type ExtractedTool = z.infer<typeof ExtractedToolSchema>;
export type ExtractionResult = z.infer<typeof ExtractionResultSchema>;
