-- Add default materials to tool libraries
-- ==============================
-- Allows saving default material selections for export

ALTER TABLE tool_libraries
ADD COLUMN default_material_ids UUID[] DEFAULT '{}';

-- Add a comment to document the column
COMMENT ON COLUMN tool_libraries.default_material_ids IS 'Default material IDs to use when exporting the library';
