-- Add created_by column to materials table for user-created materials
ALTER TABLE materials ADD COLUMN created_by UUID REFERENCES auth.users(id);

-- Add RLS policies for user-created materials

-- Users can view their own materials (even if not public)
CREATE POLICY "Users can view their own materials" ON materials
  FOR SELECT USING (auth.uid() = created_by);

-- Users can create their own materials
CREATE POLICY "Users can create materials" ON materials
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Users can update their own materials
CREATE POLICY "Users can update their own materials" ON materials
  FOR UPDATE USING (auth.uid() = created_by);

-- Users can delete their own materials
CREATE POLICY "Users can delete their own materials" ON materials
  FOR DELETE USING (auth.uid() = created_by);

-- Add index for faster lookups by creator
CREATE INDEX idx_materials_created_by ON materials(created_by);
