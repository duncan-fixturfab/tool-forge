-- Migration: Extended tool fields for Fusion 360 parity
-- Adds description, unit preference, clockwise rotation, shaft segments, and post-process settings

-- Add new columns to tools table
ALTER TABLE tools
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS unit TEXT DEFAULT 'mm' CHECK (unit IN ('mm', 'inch')),
  ADD COLUMN IF NOT EXISTS clockwise_rotation BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS shaft_segments JSONB,
  ADD COLUMN IF NOT EXISTS post_process JSONB,
  ADD COLUMN IF NOT EXISTS default_holder_id UUID REFERENCES tool_holders(id) ON DELETE SET NULL;

-- Add comments for documentation
COMMENT ON COLUMN tools.description IS 'Tool description (distinct from name)';
COMMENT ON COLUMN tools.unit IS 'Display unit preference (mm or inch)';
COMMENT ON COLUMN tools.clockwise_rotation IS 'Spindle rotation direction (true = clockwise/CW)';
COMMENT ON COLUMN tools.shaft_segments IS 'Array of shaft segment definitions: [{height_mm, upper_diameter_mm, lower_diameter_mm}]';
COMMENT ON COLUMN tools.post_process IS 'Post-processor settings: {break_control, comment, diameter_offset, length_offset, live, manual_tool_change, turret}';
COMMENT ON COLUMN tools.default_holder_id IS 'Default tool holder for this tool';

-- Create index for holder lookup
CREATE INDEX IF NOT EXISTS idx_tools_default_holder ON tools(default_holder_id) WHERE default_holder_id IS NOT NULL;
