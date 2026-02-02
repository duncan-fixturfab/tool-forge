-- Tool Holder Management Schema
-- ==============================

-- ==============================
-- TOOL HOLDER TAPER TYPE ENUM
-- ==============================
CREATE TYPE holder_taper_type AS ENUM (
  'ISO20',
  'ISO25',
  'ISO30',
  'ISO40',
  'ISO50',
  'CAT40',
  'CAT50',
  'BT30',
  'BT40',
  'BT50',
  'HSK-A40',
  'HSK-A63',
  'HSK-A100',
  'HSK-E25',
  'HSK-E32',
  'HSK-E40',
  'HSK-F63',
  'ER11',
  'ER16',
  'ER20',
  'ER25',
  'ER32',
  'TTS',
  'R8',
  'MT2',
  'MT3',
  'other'
);

-- ==============================
-- TOOL HOLDERS TABLE
-- ==============================
CREATE TABLE tool_holders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Identification
  name TEXT NOT NULL,
  description TEXT,

  -- Holder classification
  taper_type holder_taper_type NOT NULL,
  collet_type TEXT,

  -- Collet capacity (mm) - what shank sizes this holder accepts
  collet_min_mm DECIMAL(6,2),
  collet_max_mm DECIMAL(6,2),

  -- Geometry
  gauge_length_mm DECIMAL(8,2) NOT NULL,
  segments JSONB NOT NULL,
  -- Segment structure: [
  --   { "height": 19, "lower_diameter": 28, "upper_diameter": 28 },
  --   { "height": 8.5, "lower_diameter": 24, "upper_diameter": 24 },
  --   ...
  -- ]

  -- Vendor info
  vendor TEXT,
  product_id TEXT,
  product_url TEXT,

  -- Extraction metadata
  extraction_source TEXT,
  extraction_confidence DECIMAL(3,2),
  raw_extraction_data JSONB,

  -- Settings
  is_public BOOLEAN DEFAULT false,

  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================
-- MACHINE-HOLDER JUNCTION TABLE
-- ==============================
CREATE TABLE machine_tool_holders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  machine_id UUID REFERENCES machines(id) ON DELETE CASCADE NOT NULL,
  tool_holder_id UUID REFERENCES tool_holders(id) ON DELETE CASCADE NOT NULL,

  -- Metadata
  is_default BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(machine_id, tool_holder_id)
);

-- ==============================
-- UPDATE LIBRARY_TOOLS TABLE
-- ==============================
ALTER TABLE library_tools
  ADD COLUMN tool_holder_id UUID REFERENCES tool_holders(id) ON DELETE SET NULL,
  ADD COLUMN holder_override BOOLEAN DEFAULT false;

-- ==============================
-- INDEXES
-- ==============================
CREATE INDEX idx_tool_holders_user_id ON tool_holders(user_id);
CREATE INDEX idx_tool_holders_taper_type ON tool_holders(taper_type);
CREATE INDEX idx_tool_holders_collet_type ON tool_holders(collet_type);
CREATE INDEX idx_tool_holders_public ON tool_holders(is_public) WHERE is_public = true;
CREATE INDEX idx_machine_tool_holders_machine_id ON machine_tool_holders(machine_id);
CREATE INDEX idx_machine_tool_holders_holder_id ON machine_tool_holders(tool_holder_id);
CREATE INDEX idx_library_tools_holder_id ON library_tools(tool_holder_id);

-- ==============================
-- ROW LEVEL SECURITY
-- ==============================
ALTER TABLE tool_holders ENABLE ROW LEVEL SECURITY;
ALTER TABLE machine_tool_holders ENABLE ROW LEVEL SECURITY;

-- Tool holders: Users can view their own holders
CREATE POLICY "Users can view their own holders" ON tool_holders
  FOR SELECT USING (auth.uid() = user_id);

-- Tool holders: Public holders are viewable by everyone
CREATE POLICY "Public holders are viewable by everyone" ON tool_holders
  FOR SELECT USING (is_public = true);

-- Tool holders: System holders (no user_id) are viewable by everyone
CREATE POLICY "System holders are viewable by everyone" ON tool_holders
  FOR SELECT USING (user_id IS NULL);

-- Tool holders: Users can create their own holders
CREATE POLICY "Users can create their own holders" ON tool_holders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Tool holders: Users can update their own holders
CREATE POLICY "Users can update their own holders" ON tool_holders
  FOR UPDATE USING (auth.uid() = user_id);

-- Tool holders: Users can delete their own holders
CREATE POLICY "Users can delete their own holders" ON tool_holders
  FOR DELETE USING (auth.uid() = user_id);

-- Machine-holder junction: Users can view associations for visible machines
CREATE POLICY "Users can view machine holders for visible machines" ON machine_tool_holders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM machines m
      WHERE m.id = machine_id
      AND (m.is_public = true OR m.created_by = auth.uid())
    )
  );

-- Machine-holder junction: Users can manage associations for their machines
CREATE POLICY "Users can manage machine holders for their machines" ON machine_tool_holders
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM machines m
      WHERE m.id = machine_id
      AND m.created_by = auth.uid()
    )
  );

-- ==============================
-- UPDATED_AT TRIGGER
-- ==============================
CREATE TRIGGER update_tool_holders_updated_at
  BEFORE UPDATE ON tool_holders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
