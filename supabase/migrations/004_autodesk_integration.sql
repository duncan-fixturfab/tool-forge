-- Autodesk APS Integration
-- ==============================
-- Stores OAuth tokens and sync history for Fusion Cloud integration

-- ==============================
-- AUTODESK CONNECTIONS TABLE
-- ==============================

CREATE TABLE autodesk_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,

  -- Autodesk account info
  autodesk_user_id TEXT NOT NULL,
  autodesk_email TEXT,
  autodesk_name TEXT,

  -- OAuth tokens (encrypted at rest via Supabase)
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ NOT NULL,

  -- Default sync destination preferences
  default_hub_id TEXT,
  default_hub_name TEXT,
  default_project_id TEXT,
  default_project_name TEXT,
  default_folder_id TEXT,
  default_folder_path TEXT,

  -- Metadata
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  last_sync_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================
-- AUTODESK SYNC HISTORY TABLE
-- ==============================

CREATE TABLE autodesk_sync_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  library_id UUID REFERENCES tool_libraries(id) ON DELETE SET NULL,

  -- Library snapshot (in case library is deleted)
  library_name TEXT NOT NULL,

  -- Sync destination
  hub_id TEXT NOT NULL,
  hub_name TEXT,
  project_id TEXT NOT NULL,
  project_name TEXT,
  folder_id TEXT NOT NULL,
  folder_path TEXT,

  -- Autodesk item details
  item_id TEXT,
  version_number INTEGER,

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending', -- pending, uploading, success, failed
  error_message TEXT,
  file_size_bytes INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================
-- INDEXES
-- ==============================

CREATE INDEX idx_autodesk_connections_user_id ON autodesk_connections(user_id);
CREATE INDEX idx_autodesk_sync_history_user_id ON autodesk_sync_history(user_id);
CREATE INDEX idx_autodesk_sync_history_library_id ON autodesk_sync_history(library_id);
CREATE INDEX idx_autodesk_sync_history_created_at ON autodesk_sync_history(created_at DESC);

-- ==============================
-- ROW LEVEL SECURITY
-- ==============================

ALTER TABLE autodesk_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE autodesk_sync_history ENABLE ROW LEVEL SECURITY;

-- Autodesk connections: Users can only access their own connection
CREATE POLICY "Users can view their own Autodesk connection" ON autodesk_connections
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own Autodesk connection" ON autodesk_connections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own Autodesk connection" ON autodesk_connections
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own Autodesk connection" ON autodesk_connections
  FOR DELETE USING (auth.uid() = user_id);

-- Sync history: Users can only access their own sync history
CREATE POLICY "Users can view their own sync history" ON autodesk_sync_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sync history" ON autodesk_sync_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sync history" ON autodesk_sync_history
  FOR UPDATE USING (auth.uid() = user_id);

-- ==============================
-- UPDATED_AT TRIGGER
-- ==============================

CREATE TRIGGER update_autodesk_connections_updated_at
  BEFORE UPDATE ON autodesk_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
