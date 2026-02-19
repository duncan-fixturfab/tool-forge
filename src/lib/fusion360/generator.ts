import JSZip from "jszip";
import { Tool, ToolGeometry, ToolType, Material, MachineMaterialPreset, Machine, PostProcessSettings, ToolHolder } from "@/types/database";
import { calculateCuttingParameters, CuttingParameters } from "@/lib/calculators/feeds-speeds";

// Fusion360 tool type mappings
const FUSION360_TOOL_TYPES: Record<ToolType, string> = {
  flat_endmill: "flat end mill",
  ball_endmill: "ball end mill",
  bull_endmill: "bull nose end mill",
  drill: "drill",
  spot_drill: "spot drill",
  chamfer_mill: "chamfer mill",
  face_mill: "face mill",
  thread_mill: "thread mill",
  reamer: "reamer",
  tap: "tap right hand",
  engraving_tool: "tapered mill",
};

// Fusion360 geometry field mappings
interface Fusion360Geometry {
  DC: number;           // Diameter
  DCX?: number;         // Diameter at maximum point (for endmills)
  NOF?: number;         // Number of flutes
  LCF?: number;         // Flute length (length of cut)
  OAL?: number;         // Overall length
  SFDM?: number;        // Shank diameter
  RE?: number;          // Corner radius
  SIG?: number;         // Point angle (for drills)
  HA?: number;          // Helix angle
  TA?: number;          // Taper angle
  CSP?: boolean;        // Center cutting capability
  HAND?: boolean;       // Right-hand cutting (true = right hand)
  LB?: number;          // Body length
  assemblyGaugeLength?: number;  // Total assembly length with holder
  "shoulder-length"?: number;    // Shoulder length (hyphenated for Fusion360)
  "shoulder-diameter"?: number;  // Shoulder diameter
  "upper-radius"?: number;       // Upper radius
  flute_length?: number;
  tip_length?: number;
  tip_diameter?: number;
}

interface Fusion360PresetMaterial {
  category: string;
  query: string;
  "use-hardness": boolean;
}

interface Fusion360Preset {
  guid: string;
  material: Fusion360PresetMaterial;
  name: string;
  n: number;                    // Spindle speed (RPM)
  "tool-coolant": string;       // Coolant setting (hyphenated key)
  v_c?: number;                 // Surface speed (m/min)

  // End mill specific fields
  f_n?: number;                 // Feed per revolution
  f_z?: number;                 // Feed per tooth
  n_ramp?: number;              // Ramp spindle speed
  "ramp-angle"?: number;        // Ramp angle in degrees
  stepdown?: number;
  stepover?: number;
  "use-stepdown"?: boolean;
  "use-stepover"?: boolean;
  v_f?: number;                 // Feed rate (mm/min)
  v_f_leadIn?: number;          // Lead-in feed
  v_f_leadOut?: number;         // Lead-out feed
  v_f_plunge?: number;          // Plunge feed rate
  v_f_ramp?: number;            // Ramp feed rate
  v_f_transition?: number;      // Transition feed rate

  // Drill specific fields
  "use-feed-per-revolution"?: boolean;
  v_f_retract?: number;         // Retract feed rate
}

interface Fusion360HolderSegment {
  height: number;
  "lower-diameter": number;
  "upper-diameter": number;
}

interface Fusion360Holder {
  description: string;
  expressions: Record<string, string>;
  gaugeLength: number;
  guid: string;
  "last_modified"?: number;
  "product-id"?: string;
  "product-link"?: string;
  "reference_guid"?: string;
  segments: Fusion360HolderSegment[];
  type: "holder";
  unit: string;
  vendor?: string;
}

interface Fusion360Tool {
  BMC?: string;                 // Body material code
  GRADE?: string;               // Tool grade
  description: string;
  expressions: Record<string, string>;  // Parametric expressions
  geometry: Fusion360Geometry;
  guid: string;
  holder?: Fusion360Holder;     // Tool holder
  last_modified: number;        // Note: underscore, not hyphen
  "post-process": {
    "break-control"?: boolean;
    comment?: string;
    "diameter-offset"?: number;
    "length-offset"?: number;
    live?: boolean;
    "manual-tool-change"?: boolean;  // Note: hyphenated
    number?: number;
    turret?: number;
  };
  "product-id"?: string;
  "product-link"?: string;
  reference_guid: string;       // Copy of guid
  "start-values": {
    presets: Fusion360Preset[];
  };
  type: string;
  unit: string;
  vendor?: string;
}

interface Fusion360Library {
  data: Fusion360Tool[];
  version: number;
}

function generateGuid(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Format a number for Fusion360 expressions.
 * Fusion360 uses (X,Y) notation where comma is decimal separator.
 * Example: 1.7 becomes "(1,7)", 3.175 becomes "(3,175)"
 */
function formatFusion360Number(value: number): string {
  // Convert to string and replace period with comma, wrap in parentheses
  const str = value.toString();
  if (str.includes(".")) {
    return `(${str.replace(".", ",")})`;
  }
  return str;
}

function mapGeometry(
  geometry: ToolGeometry,
  toolType: ToolType,
  holderGaugeLength?: number
): Fusion360Geometry {
  const fusionGeometry: Fusion360Geometry = {
    DC: geometry.diameter_mm,
    CSP: false,  // Center cutting capability - default false
    HAND: true,  // Right-hand cutting - default true
  };

  if (geometry.number_of_flutes) {
    fusionGeometry.NOF = geometry.number_of_flutes;
  }

  if (geometry.flute_length_mm) {
    fusionGeometry.LCF = geometry.flute_length_mm;
  }

  if (geometry.overall_length_mm) {
    fusionGeometry.OAL = geometry.overall_length_mm;
  }

  const shankDiameter = geometry.shank_diameter_mm || geometry.diameter_mm;
  fusionGeometry.SFDM = shankDiameter;

  // Corner radius - always include for endmills (default to 0)
  const isEndmill = !["drill", "spot_drill", "reamer", "tap"].includes(toolType);
  if (isEndmill) {
    fusionGeometry.RE = geometry.corner_radius_mm ?? 0;
    fusionGeometry.DCX = geometry.diameter_mm;  // Diameter at maximum point
    fusionGeometry.TA = 0;  // Taper angle - default 0
    fusionGeometry["upper-radius"] = 0;  // Upper radius - default 0
  } else if (geometry.corner_radius_mm !== undefined) {
    fusionGeometry.RE = geometry.corner_radius_mm;
  }

  if (geometry.point_angle_deg && (toolType === "drill" || toolType === "spot_drill")) {
    fusionGeometry.SIG = geometry.point_angle_deg;
  }

  // Helix angle only applies to endmills, not drills
  if (geometry.helix_angle_deg && isEndmill) {
    fusionGeometry.HA = geometry.helix_angle_deg;
  }

  // Calculate shoulder length - use explicit value if provided, otherwise flute_length + 2mm
  // The +2mm buffer accounts for the transition from flutes to shank when not explicitly specified
  const shoulderLength = geometry.shoulder_length_mm
    ?? (geometry.flute_length_mm ? geometry.flute_length_mm + 2 : undefined);

  if (shoulderLength !== undefined) {
    fusionGeometry["shoulder-length"] = shoulderLength;
    if (isEndmill) {
      fusionGeometry["shoulder-diameter"] = geometry.diameter_mm;
    }
  }

  // Calculate length below holder - use explicit value if provided, otherwise shoulder_length + 2mm
  // The +2mm buffer provides clearance between the holder and the workpiece
  const lengthBelowHolder = geometry.length_below_holder_mm
    ?? (shoulderLength !== undefined ? shoulderLength + 2 : undefined);

  // Body length (LB) - use length below holder if available, otherwise estimate
  const bodyLength = lengthBelowHolder
    ?? (geometry.flute_length_mm
      ? geometry.flute_length_mm * 1.2
      : geometry.overall_length_mm * 0.6);
  fusionGeometry.LB = Math.round(bodyLength * 100) / 100;

  // Assembly gauge length = holder gauge length + tool stickout
  if (holderGaugeLength && geometry.overall_length_mm) {
    // Tool stickout is overall length minus the portion gripped in holder
    // Approximate stickout as body length
    const stickout = fusionGeometry.LB || geometry.overall_length_mm * 0.6;
    fusionGeometry.assemblyGaugeLength = Math.round((holderGaugeLength + stickout) * 100) / 100;
  }

  return fusionGeometry;
}

function mapCoolant(coolantType?: string): string {
  switch (coolantType?.toLowerCase()) {
    case "flood":
      return "flood";
    case "mist":
      return "mist";
    case "air":
      return "air blast";
    case "through":
    case "through_tool":
      return "through tool";
    default:
      return "disabled";
  }
}

interface BuildToolExpressionsInput {
  tool: Tool;
  toolNumber: number;
  holder?: ToolHolder;
}

function buildToolExpressions(input: BuildToolExpressionsInput): Record<string, string> {
  const { tool, toolNumber, holder } = input;
  const expressions: Record<string, string> = {};

  // Holder expressions
  if (holder) {
    expressions.holder_description = `'${holder.name}'`;
    if (holder.product_id) {
      expressions.holder_productId = `'${holder.product_id}'`;
    }
    if (holder.product_url) {
      expressions.holder_productLink = `'${holder.product_url}'`;
    }
    if (holder.vendor) {
      expressions.holder_vendor = `'${holder.vendor}'`;
    }
  }

  // Tool geometry expressions
  const geom = tool.geometry;

  // Body length - estimate as flute_length + some shank
  const bodyLength = geom.flute_length_mm || geom.overall_length_mm * 0.6;
  expressions.tool_bodyLength = `${bodyLength} mm`;

  expressions.tool_description = `'${tool.name}'`;
  expressions.tool_diameter = `${formatFusion360Number(geom.diameter_mm)} mm`;

  if (geom.flute_length_mm) {
    expressions.tool_fluteLength = `${geom.flute_length_mm} mm`;
  }

  if (tool.substrate) {
    expressions.tool_material = `'${tool.substrate}'`;
  }

  expressions.tool_number = `${toolNumber}`;
  expressions.tool_overallLength = `${geom.overall_length_mm} mm`;

  if (tool.product_id) {
    expressions.tool_productId = `'${tool.product_id}'`;
  }

  if (tool.product_url) {
    expressions.tool_productLink = `'${tool.product_url}'`;
  }

  const shankDiameter = geom.shank_diameter_mm || geom.diameter_mm;
  expressions.tool_shaftDiameter = `${shankDiameter} mm`;

  // Shoulder length - use flute length as approximation
  if (geom.flute_length_mm) {
    expressions.tool_shoulderLength = `${geom.flute_length_mm} mm`;
  }

  if (tool.vendor) {
    expressions.tool_vendor = `'${tool.vendor}'`;
  }

  return expressions;
}

function createEndMillPreset(
  material: Material,
  params: CuttingParameters,
  coolant: string,
  numberOfFlutes: number
): Fusion360Preset {
  const mappedCoolant = mapCoolant(coolant);
  const f_n = params.chip_load_mm * numberOfFlutes;

  return {
    f_n,
    f_z: params.chip_load_mm,
    guid: generateGuid(),
    material: {
      category: "all",
      query: "",
      "use-hardness": false,
    },
    n: params.rpm,
    n_ramp: params.rpm,
    name: material.name,
    "ramp-angle": 2,
    stepdown: params.axial_depth_mm,
    stepover: params.radial_depth_mm,
    "tool-coolant": mappedCoolant,
    "use-stepdown": true,
    "use-stepover": true,
    v_c: params.surface_speed_m_min,
    v_f: params.feed_mm_min,
    v_f_leadIn: params.feed_mm_min,
    v_f_leadOut: params.feed_mm_min,
    v_f_plunge: params.plunge_feed_mm_min,
    v_f_ramp: params.feed_mm_min,
    v_f_transition: params.feed_mm_min,
  };
}

function createDrillPreset(
  material: Material,
  params: CuttingParameters,
  coolant: string
): Fusion360Preset {
  const mappedCoolant = mapCoolant(coolant);
  // Retract rate is typically faster than plunge - use 2x plunge or a reasonable default
  const retractRate = Math.round(params.plunge_feed_mm_min * 2);

  return {
    guid: generateGuid(),
    material: {
      category: "all",
      query: "",
      "use-hardness": false,
    },
    n: params.rpm,
    name: material.name,
    "tool-coolant": mappedCoolant,
    "use-feed-per-revolution": false,
    v_c: params.surface_speed_m_min,
    v_f_plunge: params.plunge_feed_mm_min,
    v_f_retract: retractRate,
  };
}

// Helper to determine if tool type is a drill-like tool
function isDrillType(toolType: ToolType): boolean {
  return toolType === "drill" || toolType === "spot_drill" || toolType === "reamer" || toolType === "tap";
}

function createPreset(
  material: Material,
  params: CuttingParameters,
  coolant: string | undefined,
  toolType: ToolType,
  numberOfFlutes: number
): Fusion360Preset {
  const coolantValue = coolant || "disabled";

  if (isDrillType(toolType)) {
    return createDrillPreset(material, params, coolantValue);
  }
  return createEndMillPreset(material, params, coolantValue, numberOfFlutes);
}

export interface ToolWithSettings {
  tool: Tool;
  toolNumber: number;
  postProcess?: PostProcessSettings;
  holder?: ToolHolder;
}

function mapHolder(holder: ToolHolder): Fusion360Holder {
  const holderGuid = generateGuid();

  // Build expressions for holder
  const expressions: Record<string, string> = {
    tool_description: `'${holder.name}'`,
    tool_holderGaugeLength: holder.segments
      .map((_, i) => `segment_${i + 1}_height`)
      .join(" + "),
  };

  if (holder.product_id) {
    expressions.tool_productId = `'${holder.product_id}'`;
  }
  if (holder.product_url) {
    expressions.tool_productLink = `'${holder.product_url}'`;
  }
  if (holder.vendor) {
    expressions.tool_vendor = `'${holder.vendor}'`;
  }

  return {
    description: holder.name,
    expressions,
    gaugeLength: holder.gauge_length_mm,
    guid: holderGuid,
    last_modified: Date.now(),
    "product-id": holder.product_id,
    "product-link": holder.product_url,
    reference_guid: holderGuid,
    segments: holder.segments.map((s) => ({
      height: s.height,
      "lower-diameter": s.lower_diameter,
      "upper-diameter": s.upper_diameter,
    })),
    type: "holder",
    unit: "millimeters",
    vendor: holder.vendor,
  };
}

export interface GenerateLibraryInput {
  libraryName: string;
  tools: ToolWithSettings[];
  machine: Machine;
  materials: Material[];
  presets: Map<string, MachineMaterialPreset>; // key = material_id
  productIdSource?: "product_id" | "internal_reference";
}

export function generateFusion360Tool(
  tool: Tool,
  toolNumber: number,
  postProcess: PostProcessSettings | undefined,
  machine: Machine,
  materials: Material[],
  presets: Map<string, MachineMaterialPreset>,
  holder?: ToolHolder,
  productIdSource: "product_id" | "internal_reference" = "product_id"
): Fusion360Tool {
  const fusionPresets: Fusion360Preset[] = [];

  // Calculate cutting parameters for each material
  const numberOfFlutes = tool.geometry.number_of_flutes || 1;

  for (const material of materials) {
    const preset = presets.get(material.id);
    const params = calculateCuttingParameters({
      toolGeometry: tool.geometry,
      toolType: tool.tool_type,
      machine,
      material,
      preset,
    });

    fusionPresets.push(createPreset(material, params, preset?.coolant_type, tool.tool_type, numberOfFlutes));
  }

  // Generate guid once so we can use it for both guid and reference_guid
  const toolGuid = generateGuid();

  // Get holder gauge length for assembly calculations
  const holderGaugeLength = holder?.gauge_length_mm;

  // Build tool object with properties in exact order that Fusion360 expects
  // Order matters! Reference: BMC, description, expressions, geometry, guid, holder,
  // last_modified, post-process, product-id, product-link, reference_guid, start-values, type, unit, vendor
  const fusionTool: Fusion360Tool = {} as Fusion360Tool;

  // 1. BMC (substrate) - must be first
  if (tool.substrate) {
    fusionTool.BMC = tool.substrate;
  }

  // 2. description
  fusionTool.description = tool.name;

  // 3. expressions
  fusionTool.expressions = buildToolExpressions({ tool, toolNumber, holder });

  // 4. geometry
  fusionTool.geometry = mapGeometry(tool.geometry, tool.tool_type, holderGaugeLength);

  // 5. guid
  fusionTool.guid = toolGuid;

  // 6. holder - must come after guid, before last_modified
  if (holder) {
    fusionTool.holder = mapHolder(holder);
  }

  // 7. last_modified
  fusionTool.last_modified = Date.now();

  // 8. post-process
  fusionTool["post-process"] = {
    "break-control": postProcess?.break_control ?? false,
    comment: postProcess?.comment ?? tool.notes ?? "",
    "diameter-offset": postProcess?.diameter_offset ?? toolNumber,
    "length-offset": postProcess?.length_offset ?? toolNumber,
    live: postProcess?.live ?? true,
    "manual-tool-change": postProcess?.manual_tool_change ?? false,
    number: toolNumber,
    turret: postProcess?.turret ?? 0,
  };

  // 9. product-id — use the field selected by the library's product_id_source setting
  const resolvedProductId =
    productIdSource === "internal_reference"
      ? tool.internal_reference
      : tool.product_id;
  if (resolvedProductId) {
    fusionTool["product-id"] = resolvedProductId;
  }

  // 10. product-link
  if (tool.product_url) {
    fusionTool["product-link"] = tool.product_url;
  }

  // 11. reference_guid
  fusionTool.reference_guid = toolGuid;

  // 12. start-values
  fusionTool["start-values"] = {
    presets: fusionPresets,
  };

  // 13. type
  fusionTool.type = FUSION360_TOOL_TYPES[tool.tool_type];

  // 14. unit
  fusionTool.unit = "millimeters";

  // 15. vendor - must be last
  if (tool.vendor) {
    fusionTool.vendor = tool.vendor;
  }

  return fusionTool;
}

export function generateFusion360Library(input: GenerateLibraryInput): Fusion360Library {
  const library: Fusion360Library = {
    data: [],
    version: 36, // Fusion360 library format version
  };

  for (const { tool, toolNumber, postProcess, holder } of input.tools) {
    const fusionTool = generateFusion360Tool(
      tool,
      toolNumber,
      postProcess,
      input.machine,
      input.materials,
      input.presets,
      holder,
      input.productIdSource ?? "product_id"
    );
    library.data.push(fusionTool);
  }

  return library;
}

export async function generateToolsFile(
  library: Fusion360Library,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  libraryName: string
): Promise<Blob> {
  const zip = new JSZip();

  // The .tools file is a ZIP containing a JSON file with the library data
  const jsonContent = JSON.stringify(library, null, 2);
  zip.file("tools.json", jsonContent);

  // Generate the ZIP file
  const blob = await zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: { level: 9 },
  });

  return blob;
}

export function validateLibrary(library: Fusion360Library): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!library.data || library.data.length === 0) {
    errors.push("Library contains no tools");
  }

  for (let i = 0; i < library.data.length; i++) {
    const tool = library.data[i];

    if (!tool.geometry?.DC || tool.geometry.DC <= 0) {
      errors.push(`Tool ${i + 1}: Invalid or missing diameter`);
    }

    if (!tool.type) {
      errors.push(`Tool ${i + 1}: Missing tool type`);
    }

    if (!tool["start-values"]?.presets || tool["start-values"].presets.length === 0) {
      errors.push(`Tool ${i + 1}: No cutting presets defined`);
    }

    for (const preset of tool["start-values"]?.presets || []) {
      if (!preset.n || preset.n <= 0) {
        errors.push(`Tool ${i + 1}, preset "${preset.name}": Invalid RPM`);
      }
      // End mills use v_f, drills use v_f_plunge
      const hasFeedRate = (preset.v_f && preset.v_f > 0) || (preset.v_f_plunge && preset.v_f_plunge > 0);
      if (!hasFeedRate) {
        errors.push(`Tool ${i + 1}, preset "${preset.name}": Invalid feed rate`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
