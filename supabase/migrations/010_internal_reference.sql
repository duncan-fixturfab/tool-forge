-- Add internal_reference field to tools table
-- This allows users to store their own internal part numbers / ERP references
ALTER TABLE tools
  ADD COLUMN IF NOT EXISTS internal_reference TEXT;

-- Add product_id_source to tool_libraries table
-- This controls which field is used as the Fusion360 "product-id" on export
-- Values: 'product_id' (default) or 'internal_reference'
ALTER TABLE tool_libraries
  ADD COLUMN IF NOT EXISTS product_id_source TEXT DEFAULT 'product_id'
    CHECK (product_id_source IN ('product_id', 'internal_reference'));
