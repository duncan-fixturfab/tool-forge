export type ToolType =
  | "flat_endmill"
  | "ball_endmill"
  | "bull_endmill"
  | "drill"
  | "spot_drill"
  | "chamfer_mill"
  | "face_mill"
  | "thread_mill"
  | "reamer"
  | "tap"
  | "engraving_tool";

export type MaterialCategory =
  | "aluminum"
  | "steel"
  | "stainless_steel"
  | "titanium"
  | "brass"
  | "copper"
  | "plastic"
  | "wood"
  | "composite"
  | "cast_iron";

export type LibraryStatus = "draft" | "complete" | "archived";

export interface ToolGeometry {
  diameter_mm: number;
  number_of_flutes: number;
  overall_length_mm: number;
  flute_length_mm: number;
  shank_diameter_mm?: number;
  corner_radius_mm?: number;
  point_angle_deg?: number;
  helix_angle_deg?: number;
  neck_diameter_mm?: number;
  neck_length_mm?: number;
  // Extended Fusion 360 fields
  shoulder_length_mm?: number;
  body_length_mm?: number;
  length_below_holder_mm?: number;
  tip_length_mm?: number;
}

export interface ShaftSegment {
  height_mm: number;
  upper_diameter_mm: number;
  lower_diameter_mm: number;
}

export interface CuttingDataPreset {
  // Core fields
  rpm: number;
  feed_mm_min: number;
  plunge_feed_mm_min: number;
  axial_depth_mm: number;
  radial_depth_mm: number;
  coolant: string;
  // Speed settings
  surface_speed_m_min?: number;
  ramp_spindle_speed?: number;
  // Feedrates (endmills)
  feed_per_tooth_mm?: number;
  lead_in_feed_mm_min?: number;
  lead_out_feed_mm_min?: number;
  transition_feed_mm_min?: number;
  ramp_feed_mm_min?: number;
  ramp_angle_deg?: number;
  // Vertical feedrates (drills)
  retract_feed_mm_min?: number;
  plunge_feed_per_rev_mm?: number;
  retract_feed_per_rev_mm?: number;
  use_feed_per_revolution?: boolean;
  // Material targeting
  material_category?: string;
  preset_name?: string;
}

export interface PostProcessSettings {
  break_control?: boolean;
  comment?: string;
  diameter_offset?: number;
  length_offset?: number;
  live?: boolean;
  manual_tool_change?: boolean;
  turret?: number;
}

export interface Machine {
  id: string;
  name: string;
  manufacturer: string;
  model: string;
  description?: string;
  max_rpm: number;
  min_rpm: number;
  spindle_power_kw?: number;
  travel_x_mm?: number;
  travel_y_mm?: number;
  travel_z_mm?: number;
  max_feed_xy_mm_min?: number;
  max_feed_z_mm_min?: number;
  tool_holder_type?: string;
  max_tool_diameter_mm?: number;
  is_public: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Material {
  id: string;
  name: string;
  category: MaterialCategory;
  description?: string;
  hardness_hrc_min?: number;
  hardness_hrc_max?: number;
  hardness_brinell?: number;
  surface_speed_min_m_min?: number;
  surface_speed_max_m_min?: number;
  chip_load_factor: number;
  common_grades?: string[];
  is_public: boolean;
  created_by?: string;
  created_at: string;
}

export interface MachineMaterialPreset {
  id: string;
  machine_id: string;
  material_id: string;
  surface_speed_m_min: number;
  chip_load_mm: number;
  axial_depth_factor: number;
  radial_depth_factor: number;
  plunge_rate_factor: number;
  max_rpm_override?: number;
  coolant_type?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Tool {
  id: string;
  user_id: string;
  name: string;
  tool_type: ToolType;
  vendor?: string;
  product_id?: string;
  product_url?: string;
  geometry: ToolGeometry;
  extraction_source?: string;
  extraction_confidence?: number;
  raw_extraction_data?: unknown;
  coating?: string;
  substrate?: string;
  notes?: string;
  // Extended Fusion 360 fields
  description?: string;
  shaft_segments?: ShaftSegment[];
  unit?: "mm" | "inch";
  clockwise_rotation?: boolean;
  default_holder_id?: string;
  cutting_presets?: Record<string, CuttingDataPreset>;
  post_process?: PostProcessSettings;
  created_at: string;
  updated_at: string;
}

export interface ToolLibrary {
  id: string;
  user_id: string;
  machine_id?: string;
  name: string;
  description?: string;
  status: LibraryStatus;
  last_exported_at?: string;
  export_count: number;
  default_material_ids?: string[];
  created_at: string;
  updated_at: string;
}

export interface LibraryTool {
  id: string;
  library_id: string;
  tool_id: string;
  tool_number: number;
  tool_holder_id?: string;
  holder_override?: boolean;
  post_process?: PostProcessSettings;
  cutting_data?: Record<string, CuttingDataPreset>;
  notes?: string;
  created_at: string;
}

// Extended types with relationships
export interface ToolWithLibrary extends Tool {
  library_tool?: LibraryTool;
}

export interface LibraryWithTools extends ToolLibrary {
  machine?: Machine;
  library_tools?: (LibraryTool & { tool: Tool })[];
}

export interface MachineWithPresets extends Machine {
  presets?: (MachineMaterialPreset & { material: Material })[];
}

// ==============================
// Tool Holder Types
// ==============================

export type HolderTaperType =
  | "ISO20"
  | "ISO25"
  | "ISO30"
  | "ISO40"
  | "ISO50"
  | "CAT40"
  | "CAT50"
  | "BT30"
  | "BT40"
  | "BT50"
  | "HSK-A40"
  | "HSK-A63"
  | "HSK-A100"
  | "HSK-E25"
  | "HSK-E32"
  | "HSK-E40"
  | "HSK-F63"
  | "ER11"
  | "ER16"
  | "ER20"
  | "ER25"
  | "ER32"
  | "TTS"
  | "R8"
  | "MT2"
  | "MT3"
  | "other";

export interface ToolHolderSegment {
  height: number;
  lower_diameter: number;
  upper_diameter: number;
}

export interface ToolHolder {
  id: string;
  user_id: string | null;
  name: string;
  description?: string;
  taper_type: HolderTaperType;
  collet_type?: string;
  collet_min_mm?: number;
  collet_max_mm?: number;
  gauge_length_mm: number;
  segments: ToolHolderSegment[];
  vendor?: string;
  product_id?: string;
  product_url?: string;
  extraction_source?: string;
  extraction_confidence?: number;
  raw_extraction_data?: unknown;
  is_public: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface MachineToolHolder {
  id: string;
  machine_id: string;
  tool_holder_id: string;
  is_default: boolean;
  notes?: string;
  created_at: string;
}

// Extended types with relationships
export interface ToolHolderWithMachines extends ToolHolder {
  machines?: Machine[];
}

export interface MachineWithHolders extends Machine {
  tool_holders?: ToolHolder[];
}

export interface LibraryToolWithHolder extends LibraryTool {
  tool: Tool;
  tool_holder?: ToolHolder;
}
