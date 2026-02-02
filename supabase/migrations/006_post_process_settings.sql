-- Migration: Add post_process column to library_tools
-- This allows storing per-tool post-process settings for Fusion 360 export

ALTER TABLE library_tools
ADD COLUMN post_process JSONB DEFAULT '{}';

COMMENT ON COLUMN library_tools.post_process IS
'Post-process settings for Fusion 360 export: {
  "break_control": boolean,
  "comment": string,
  "diameter_offset": number,
  "length_offset": number,
  "live": boolean,
  "manual_tool_change": boolean,
  "turret": number
}';
