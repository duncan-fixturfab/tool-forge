import { z } from "zod";

// Helper to handle null values from AI responses (converts null to undefined)
const optionalNonNegativeNumber = () => z.number().nonnegative().nullable().optional().transform(val => val ?? undefined);
const optionalPositiveNumber = () => z.number().positive().nullable().optional().transform(val => val ?? undefined);
const optionalString = () => z.string().nullable().optional().transform(val => val ?? undefined);

export const ExtractedMachineSchema = z.object({
  name: z.string().describe("Full machine name (e.g., 'Haas VF-2')"),
  manufacturer: z.string().describe("Machine manufacturer (e.g., 'Haas', 'Tormach', 'Carbide 3D')"),
  model: z.string().describe("Model number or name (e.g., 'VF-2', '770M', 'Shapeoko 4')"),
  description: optionalString().describe("Brief machine description"),

  // Spindle specifications
  max_rpm: z.number().int().positive().describe("Maximum spindle speed in RPM"),
  min_rpm: optionalNonNegativeNumber().describe("Minimum spindle speed in RPM (default 0)"),
  spindle_power_kw: optionalPositiveNumber().describe("Spindle motor power in kilowatts"),

  // Work envelope (travel in mm)
  travel_x_mm: optionalPositiveNumber().describe("X-axis travel in millimeters"),
  travel_y_mm: optionalPositiveNumber().describe("Y-axis travel in millimeters"),
  travel_z_mm: optionalPositiveNumber().describe("Z-axis travel in millimeters"),

  // Feed rate limits (mm/min)
  max_feed_xy_mm_min: optionalPositiveNumber().describe("Maximum feed rate for X/Y axes in mm/min"),
  max_feed_z_mm_min: optionalPositiveNumber().describe("Maximum feed rate for Z axis in mm/min"),

  // Tool holder
  tool_holder_type: optionalString().describe("Tool holder type (e.g., 'ER20', 'CAT40', 'BT30', 'ER11')"),
  max_tool_diameter_mm: optionalPositiveNumber().describe("Maximum tool diameter in millimeters"),

  // Extraction metadata
  confidence: z.number().min(0).max(1).describe("Confidence score for extraction accuracy (0-1)"),
  missing_fields: z.array(z.string()).nullable().optional().transform(val => val ?? undefined).describe("List of fields that could not be extracted"),
  notes: optionalString().describe("Additional notes or warnings about the extraction"),
});

export const MachineExtractionResultSchema = z.object({
  success: z.boolean(),
  machine: ExtractedMachineSchema.optional(),
  error: z.string().optional(),
  source_type: z.enum(["url", "pdf", "text"]),
  raw_content: z.string().optional().describe("Original content that was parsed"),
});

export type ExtractedMachine = z.infer<typeof ExtractedMachineSchema>;
export type MachineExtractionResult = z.infer<typeof MachineExtractionResultSchema>;
