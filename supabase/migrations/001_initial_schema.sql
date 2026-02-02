-- Tool Forge Database Schema
-- ==============================
-- ENUMS
-- ==============================

CREATE TYPE tool_type AS ENUM (
  'flat_endmill',
  'ball_endmill',
  'bull_endmill',
  'drill',
  'spot_drill',
  'chamfer_mill',
  'face_mill',
  'thread_mill',
  'reamer',
  'tap',
  'engraving_tool'
);

CREATE TYPE material_category AS ENUM (
  'aluminum',
  'steel',
  'stainless_steel',
  'titanium',
  'brass',
  'copper',
  'plastic',
  'wood',
  'composite',
  'cast_iron'
);

CREATE TYPE library_status AS ENUM (
  'draft',
  'complete',
  'archived'
);

-- ==============================
-- MACHINES TABLE
-- ==============================

CREATE TABLE machines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  manufacturer TEXT NOT NULL,
  model TEXT NOT NULL,
  description TEXT,

  -- Spindle specifications
  max_rpm INTEGER NOT NULL,
  min_rpm INTEGER DEFAULT 0,
  spindle_power_kw DECIMAL(6,2),

  -- Work envelope (mm)
  travel_x_mm DECIMAL(8,2),
  travel_y_mm DECIMAL(8,2),
  travel_z_mm DECIMAL(8,2),

  -- Feed limits (mm/min)
  max_feed_xy_mm_min DECIMAL(10,2),
  max_feed_z_mm_min DECIMAL(10,2),

  -- Tool holder info
  tool_holder_type TEXT, -- e.g., 'ER20', 'CAT40', 'BT30'
  max_tool_diameter_mm DECIMAL(6,2),

  -- Metadata
  is_public BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================
-- MATERIALS TABLE
-- ==============================

CREATE TABLE materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category material_category NOT NULL,
  description TEXT,

  -- Material properties
  hardness_hrc_min DECIMAL(5,2),
  hardness_hrc_max DECIMAL(5,2),
  hardness_brinell INTEGER,

  -- Default cutting parameters (can be overridden per machine)
  surface_speed_min_m_min DECIMAL(8,2), -- Minimum cutting speed (m/min)
  surface_speed_max_m_min DECIMAL(8,2), -- Maximum cutting speed (m/min)
  chip_load_factor DECIMAL(4,3) DEFAULT 1.0, -- Multiplier for base chip load

  -- Common alloys/grades
  common_grades TEXT[],

  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================
-- MACHINE-MATERIAL PRESETS TABLE
-- ==============================

CREATE TABLE machine_material_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  machine_id UUID REFERENCES machines(id) ON DELETE CASCADE,
  material_id UUID REFERENCES materials(id) ON DELETE CASCADE,

  -- Cutting parameters
  surface_speed_m_min DECIMAL(8,2) NOT NULL, -- Vc - cutting speed
  chip_load_mm DECIMAL(6,4) NOT NULL, -- fz - feed per tooth (mm)
  axial_depth_factor DECIMAL(4,3) DEFAULT 1.0, -- Multiplier for tool diameter
  radial_depth_factor DECIMAL(4,3) DEFAULT 0.5, -- Multiplier for tool diameter
  plunge_rate_factor DECIMAL(4,3) DEFAULT 0.5, -- Multiplier for feed rate

  -- Optional overrides
  max_rpm_override INTEGER,
  coolant_type TEXT, -- 'flood', 'mist', 'air', 'none'

  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(machine_id, material_id)
);

-- ==============================
-- TOOLS TABLE
-- ==============================

CREATE TABLE tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Tool identification
  name TEXT NOT NULL,
  tool_type tool_type NOT NULL,
  vendor TEXT,
  product_id TEXT,
  product_url TEXT,

  -- Geometry (stored as JSONB for flexibility)
  geometry JSONB NOT NULL,
  -- Expected fields:
  -- {
  --   diameter_mm: number,
  --   number_of_flutes: number,
  --   overall_length_mm: number,
  --   flute_length_mm: number,
  --   shank_diameter_mm?: number,
  --   corner_radius_mm?: number,     // for bull/endmills
  --   point_angle_deg?: number,      // for drills
  --   helix_angle_deg?: number,
  --   neck_diameter_mm?: number,
  --   neck_length_mm?: number,
  -- }

  -- Extraction metadata
  extraction_source TEXT, -- 'url', 'pdf', 'text', 'manual'
  extraction_confidence DECIMAL(3,2), -- 0.00 to 1.00
  raw_extraction_data JSONB, -- Store original AI extraction

  -- Tool coating/material
  coating TEXT, -- 'TiAlN', 'TiN', 'AlTiN', 'DLC', 'uncoated'
  substrate TEXT, -- 'carbide', 'hss', 'cobalt'

  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================
-- TOOL LIBRARIES TABLE
-- ==============================

CREATE TABLE tool_libraries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  machine_id UUID REFERENCES machines(id) ON DELETE SET NULL,

  name TEXT NOT NULL,
  description TEXT,
  status library_status DEFAULT 'draft',

  -- Export metadata
  last_exported_at TIMESTAMPTZ,
  export_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================
-- LIBRARY TOOLS JUNCTION TABLE
-- ==============================

CREATE TABLE library_tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  library_id UUID REFERENCES tool_libraries(id) ON DELETE CASCADE NOT NULL,
  tool_id UUID REFERENCES tools(id) ON DELETE CASCADE NOT NULL,

  -- Tool position in library
  tool_number INTEGER NOT NULL,

  -- Cutting data overrides (per material, stored as JSONB)
  cutting_data JSONB,
  -- Expected structure:
  -- {
  --   "material_id": {
  --     rpm: number,
  --     feed_mm_min: number,
  --     plunge_feed_mm_min: number,
  --     axial_depth_mm: number,
  --     radial_depth_mm: number,
  --     coolant: string
  --   }
  -- }

  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(library_id, tool_number)
);

-- ==============================
-- INDEXES
-- ==============================

CREATE INDEX idx_machines_public ON machines(is_public) WHERE is_public = true;
CREATE INDEX idx_machines_created_by ON machines(created_by);
CREATE INDEX idx_materials_category ON materials(category);
CREATE INDEX idx_tools_user_id ON tools(user_id);
CREATE INDEX idx_tools_type ON tools(tool_type);
CREATE INDEX idx_tool_libraries_user_id ON tool_libraries(user_id);
CREATE INDEX idx_library_tools_library_id ON library_tools(library_id);

-- ==============================
-- ROW LEVEL SECURITY
-- ==============================

ALTER TABLE machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE machine_material_presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE tool_libraries ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_tools ENABLE ROW LEVEL SECURITY;

-- Machines: Public machines visible to all, private only to creator
CREATE POLICY "Public machines are viewable by everyone" ON machines
  FOR SELECT USING (is_public = true);

CREATE POLICY "Users can view their own machines" ON machines
  FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Users can create machines" ON machines
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own machines" ON machines
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own machines" ON machines
  FOR DELETE USING (auth.uid() = created_by);

-- Materials: All public materials visible to everyone
CREATE POLICY "Public materials are viewable by everyone" ON materials
  FOR SELECT USING (is_public = true);

-- Machine-material presets: Visible if machine is visible
CREATE POLICY "Presets visible with machine" ON machine_material_presets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM machines m
      WHERE m.id = machine_id
      AND (m.is_public = true OR m.created_by = auth.uid())
    )
  );

CREATE POLICY "Users can manage presets for their machines" ON machine_material_presets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM machines m
      WHERE m.id = machine_id
      AND m.created_by = auth.uid()
    )
  );

-- Tools: Users can only see/manage their own tools
CREATE POLICY "Users can view their own tools" ON tools
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tools" ON tools
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tools" ON tools
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tools" ON tools
  FOR DELETE USING (auth.uid() = user_id);

-- Tool libraries: Users can only see/manage their own libraries
CREATE POLICY "Users can view their own libraries" ON tool_libraries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own libraries" ON tool_libraries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own libraries" ON tool_libraries
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own libraries" ON tool_libraries
  FOR DELETE USING (auth.uid() = user_id);

-- Library tools: Visible if library is visible
CREATE POLICY "Users can view their library tools" ON library_tools
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tool_libraries tl
      WHERE tl.id = library_id
      AND tl.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their library tools" ON library_tools
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM tool_libraries tl
      WHERE tl.id = library_id
      AND tl.user_id = auth.uid()
    )
  );

-- ==============================
-- UPDATED_AT TRIGGERS
-- ==============================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_machines_updated_at
  BEFORE UPDATE ON machines
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_machine_material_presets_updated_at
  BEFORE UPDATE ON machine_material_presets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tools_updated_at
  BEFORE UPDATE ON tools
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tool_libraries_updated_at
  BEFORE UPDATE ON tool_libraries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
