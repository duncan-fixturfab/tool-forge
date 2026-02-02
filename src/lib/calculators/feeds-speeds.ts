import { ToolGeometry, ToolType, Machine, Material, MachineMaterialPreset } from "@/types/database";

export interface CuttingParameters {
  rpm: number;
  feed_mm_min: number;
  plunge_feed_mm_min: number;
  axial_depth_mm: number;
  radial_depth_mm: number;
  surface_speed_m_min: number;
  chip_load_mm: number;
}

export interface CalculationInput {
  toolGeometry: ToolGeometry;
  toolType: ToolType;
  machine: Machine;
  material: Material;
  preset?: MachineMaterialPreset;
}

// Default chip loads by tool diameter (mm) for carbide in aluminum
// These are conservative starting points
const DEFAULT_CHIP_LOADS: Record<string, number> = {
  "0-3": 0.025,      // < 3mm diameter
  "3-6": 0.05,       // 3-6mm diameter
  "6-10": 0.075,     // 6-10mm diameter
  "10-16": 0.1,      // 10-16mm diameter
  "16-25": 0.125,    // 16-25mm diameter
  "25+": 0.15,       // > 25mm diameter
};

// Default surface speeds by material category (m/min) for carbide
const DEFAULT_SURFACE_SPEEDS: Record<string, number> = {
  aluminum: 250,
  brass: 150,
  copper: 100,
  plastic: 200,
  wood: 300,
  steel: 80,
  stainless_steel: 50,
  titanium: 40,
  composite: 100,
  cast_iron: 70,
};

/**
 * Get default chip load based on tool diameter
 */
function getDefaultChipLoad(diameterMm: number): number {
  if (diameterMm < 3) return DEFAULT_CHIP_LOADS["0-3"];
  if (diameterMm < 6) return DEFAULT_CHIP_LOADS["3-6"];
  if (diameterMm < 10) return DEFAULT_CHIP_LOADS["6-10"];
  if (diameterMm < 16) return DEFAULT_CHIP_LOADS["10-16"];
  if (diameterMm < 25) return DEFAULT_CHIP_LOADS["16-25"];
  return DEFAULT_CHIP_LOADS["25+"];
}

/**
 * Calculate RPM from surface speed and tool diameter
 * N = (Vc × 1000) / (π × D)
 * Where:
 *   N = spindle speed (RPM)
 *   Vc = cutting speed (m/min)
 *   D = tool diameter (mm)
 */
export function calculateRpm(surfaceSpeedMMin: number, diameterMm: number): number {
  return Math.round((surfaceSpeedMMin * 1000) / (Math.PI * diameterMm));
}

/**
 * Calculate feed rate from RPM, chip load, and number of flutes
 * F = N × fz × z
 * Where:
 *   F = feed rate (mm/min)
 *   N = spindle speed (RPM)
 *   fz = chip load / feed per tooth (mm)
 *   z = number of flutes
 */
export function calculateFeedRate(rpm: number, chipLoadMm: number, flutes: number): number {
  return Math.round(rpm * chipLoadMm * flutes);
}

/**
 * Calculate surface speed from RPM and diameter
 * Vc = (π × D × N) / 1000
 */
export function calculateSurfaceSpeed(rpm: number, diameterMm: number): number {
  return (Math.PI * diameterMm * rpm) / 1000;
}

/**
 * Clamp RPM to machine limits
 */
function clampRpm(rpm: number, machine: Machine): number {
  return Math.max(machine.min_rpm, Math.min(rpm, machine.max_rpm));
}

/**
 * Clamp feed rate to machine limits
 */
function clampFeedRate(feedRate: number, machine: Machine, isPlunge: boolean = false): number {
  const maxFeed = isPlunge
    ? (machine.max_feed_z_mm_min || machine.max_feed_xy_mm_min || 10000)
    : (machine.max_feed_xy_mm_min || 10000);
  return Math.min(feedRate, maxFeed);
}

/**
 * Calculate cutting parameters for a tool/material/machine combination
 */
export function calculateCuttingParameters(input: CalculationInput): CuttingParameters {
  const { toolGeometry, toolType, machine, material, preset } = input;

  // Get surface speed and chip load from preset or defaults
  let surfaceSpeed: number;
  let chipLoad: number;
  let axialDepthFactor: number;
  let radialDepthFactor: number;
  let plungeRateFactor: number;

  if (preset) {
    surfaceSpeed = preset.surface_speed_m_min;
    chipLoad = preset.chip_load_mm;
    axialDepthFactor = preset.axial_depth_factor;
    radialDepthFactor = preset.radial_depth_factor;
    plungeRateFactor = preset.plunge_rate_factor;
  } else {
    // Use defaults based on material category
    surfaceSpeed =
      material.surface_speed_max_m_min ||
      DEFAULT_SURFACE_SPEEDS[material.category] ||
      100;

    // Adjust surface speed based on material chip load factor
    surfaceSpeed *= material.chip_load_factor;

    chipLoad = getDefaultChipLoad(toolGeometry.diameter_mm) * material.chip_load_factor;
    axialDepthFactor = 1.0;
    radialDepthFactor = 0.5;
    plungeRateFactor = 0.5;
  }

  // Calculate base RPM
  let rpm = calculateRpm(surfaceSpeed, toolGeometry.diameter_mm);

  // Apply machine RPM override if specified in preset
  if (preset?.max_rpm_override) {
    rpm = Math.min(rpm, preset.max_rpm_override);
  }

  // Clamp to machine limits
  rpm = clampRpm(rpm, machine);

  // Recalculate actual surface speed after clamping
  const actualSurfaceSpeed = calculateSurfaceSpeed(rpm, toolGeometry.diameter_mm);

  // Calculate feed rate
  let feedRate = calculateFeedRate(rpm, chipLoad, toolGeometry.number_of_flutes);

  // Clamp feed rate to machine limits
  feedRate = clampFeedRate(feedRate, machine);

  // Calculate plunge rate
  let plungeFeedRate = Math.round(feedRate * plungeRateFactor);
  plungeFeedRate = clampFeedRate(plungeFeedRate, machine, true);

  // Calculate depths of cut
  const axialDepth = Math.round(toolGeometry.diameter_mm * axialDepthFactor * 100) / 100;
  const radialDepth = Math.round(toolGeometry.diameter_mm * radialDepthFactor * 100) / 100;

  // Adjust for tool type specifics
  if (toolType === "drill" || toolType === "spot_drill" || toolType === "tap" || toolType === "reamer") {
    // For drilling operations, the "feed" is actually feed per revolution
    // We need to adjust the axial depth to be the flute length
    return {
      rpm,
      feed_mm_min: plungeFeedRate, // For drills, feed = plunge
      plunge_feed_mm_min: plungeFeedRate,
      axial_depth_mm: toolGeometry.flute_length_mm, // Full depth capability
      radial_depth_mm: toolGeometry.diameter_mm / 2, // Half diameter for peck drilling
      surface_speed_m_min: Math.round(actualSurfaceSpeed * 10) / 10,
      chip_load_mm: chipLoad,
    };
  }

  if (toolType === "ball_endmill") {
    // Ball endmills have reduced effective diameter at shallow cuts
    // Recommend smaller step-over
    return {
      rpm,
      feed_mm_min: feedRate,
      plunge_feed_mm_min: plungeFeedRate,
      axial_depth_mm: axialDepth,
      radial_depth_mm: Math.round(radialDepth * 0.5 * 100) / 100, // Smaller step-over
      surface_speed_m_min: Math.round(actualSurfaceSpeed * 10) / 10,
      chip_load_mm: chipLoad,
    };
  }

  return {
    rpm,
    feed_mm_min: feedRate,
    plunge_feed_mm_min: plungeFeedRate,
    axial_depth_mm: axialDepth,
    radial_depth_mm: radialDepth,
    surface_speed_m_min: Math.round(actualSurfaceSpeed * 10) / 10,
    chip_load_mm: chipLoad,
  };
}

/**
 * Calculate chip thinning adjusted feed rate for adaptive/HSM toolpaths
 * When radial engagement is less than 50% of tool diameter,
 * the actual chip thickness is reduced, so feed can be increased
 */
export function calculateChipThinningFeed(
  baseFeed: number,
  toolDiameter: number,
  radialDepth: number
): number {
  const ae = radialDepth; // Radial depth of cut
  const d = toolDiameter;

  // Chip thinning factor
  // When ae < d/2, effective chip thickness is reduced
  if (ae >= d / 2) {
    return baseFeed; // No chip thinning at 50% or more engagement
  }

  // Chip thinning factor = 1 / sqrt(1 - (1 - 2*ae/d)^2)
  const ratio = 1 - (2 * ae) / d;
  const factor = 1 / Math.sqrt(1 - ratio * ratio);

  // Cap the factor to prevent excessive feeds
  const cappedFactor = Math.min(factor, 2.0);

  return Math.round(baseFeed * cappedFactor);
}

/**
 * Calculate material removal rate (MRR) in cm³/min
 */
export function calculateMrr(
  feedRate: number,
  axialDepth: number,
  radialDepth: number
): number {
  // MRR = ap × ae × Vf (mm³/min)
  // Convert to cm³/min by dividing by 1000
  return (axialDepth * radialDepth * feedRate) / 1000;
}
