// Autodesk Token Management Utilities
// ==============================

import { createClient } from "@/lib/supabase/server";
import { refreshAccessToken } from "./client";
import { AutodeskConnection, AutodeskTokens, AutodeskUserProfile } from "@/types/autodesk";

// Buffer time before token expiry to trigger refresh (5 minutes)
const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000;

// ==============================
// TOKEN STORAGE
// ==============================

export async function storeTokens(
  userId: string,
  tokens: AutodeskTokens,
  profile: AutodeskUserProfile
): Promise<void> {
  const supabase = await createClient();

  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

  // Handle both OIDC standard format and legacy format
  const autodeskUserId = profile.sub || profile.userId;
  const autodeskEmail = profile.email || profile.emailId;
  const autodeskName = profile.name ||
    `${profile.given_name || profile.firstName || ""} ${profile.family_name || profile.lastName || ""}`.trim() ||
    profile.userName ||
    "Unknown";

  if (!autodeskUserId) {
    throw new Error("Failed to get Autodesk user ID from profile");
  }

  const { error } = await supabase.from("autodesk_connections").upsert(
    {
      user_id: userId,
      autodesk_user_id: autodeskUserId,
      autodesk_email: autodeskEmail,
      autodesk_name: autodeskName,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expires_at: expiresAt.toISOString(),
      connected_at: new Date().toISOString(),
    },
    {
      onConflict: "user_id",
    }
  );

  if (error) {
    throw new Error(`Failed to store Autodesk tokens: ${error.message}`);
  }
}

export async function updateTokens(
  userId: string,
  tokens: AutodeskTokens
): Promise<void> {
  const supabase = await createClient();

  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

  const { error } = await supabase
    .from("autodesk_connections")
    .update({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expires_at: expiresAt.toISOString(),
    })
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Failed to update Autodesk tokens: ${error.message}`);
  }
}

export async function clearTokens(userId: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("autodesk_connections")
    .delete()
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Failed to clear Autodesk tokens: ${error.message}`);
  }
}

// ==============================
// CONNECTION RETRIEVAL
// ==============================

export async function getConnection(userId: string): Promise<AutodeskConnection | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("autodesk_connections")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // No connection found
      return null;
    }
    throw new Error(`Failed to get Autodesk connection: ${error.message}`);
  }

  return data as AutodeskConnection;
}

export function isTokenExpired(connection: AutodeskConnection): boolean {
  const expiresAt = new Date(connection.token_expires_at);
  return expiresAt.getTime() - TOKEN_REFRESH_BUFFER_MS < Date.now();
}

// ==============================
// VALID ACCESS TOKEN
// ==============================

export async function getValidAccessToken(userId: string): Promise<string> {
  const connection = await getConnection(userId);

  if (!connection) {
    throw new Error("No Autodesk connection found. Please connect your Autodesk account.");
  }

  // Check if token is expired or about to expire
  if (isTokenExpired(connection)) {
    // Refresh the token
    try {
      const newTokens = await refreshAccessToken(connection.refresh_token);
      await updateTokens(userId, newTokens);
      return newTokens.access_token;
    } catch {
      // If refresh fails, the user needs to reconnect
      await clearTokens(userId);
      throw new Error("Autodesk session expired. Please reconnect your Autodesk account.");
    }
  }

  return connection.access_token;
}

// ==============================
// DEFAULT DESTINATION
// ==============================

export async function updateDefaultDestination(
  userId: string,
  destination: {
    hubId: string;
    hubName: string;
    projectId: string;
    projectName: string;
    folderId: string;
    folderPath: string;
  }
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("autodesk_connections")
    .update({
      default_hub_id: destination.hubId,
      default_hub_name: destination.hubName,
      default_project_id: destination.projectId,
      default_project_name: destination.projectName,
      default_folder_id: destination.folderId,
      default_folder_path: destination.folderPath,
    })
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Failed to update default destination: ${error.message}`);
  }
}

export async function updateLastSyncAt(userId: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("autodesk_connections")
    .update({
      last_sync_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  if (error) {
    // Non-critical, just log
    console.error("Failed to update last sync time:", error);
  }
}

// ==============================
// SYNC HISTORY
// ==============================

export async function recordSyncAttempt(
  userId: string,
  libraryId: string,
  libraryName: string,
  destination: {
    hubId: string;
    hubName?: string;
    projectId: string;
    projectName?: string;
    folderId: string;
    folderPath?: string;
  }
): Promise<string> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("autodesk_sync_history")
    .insert({
      user_id: userId,
      library_id: libraryId,
      library_name: libraryName,
      hub_id: destination.hubId,
      hub_name: destination.hubName,
      project_id: destination.projectId,
      project_name: destination.projectName,
      folder_id: destination.folderId,
      folder_path: destination.folderPath,
      status: "pending",
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(`Failed to record sync attempt: ${error.message}`);
  }

  return data.id;
}

export async function updateSyncStatus(
  syncId: string,
  status: "uploading" | "success" | "failed",
  details?: {
    itemId?: string;
    versionNumber?: number;
    errorMessage?: string;
    fileSizeBytes?: number;
  }
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("autodesk_sync_history")
    .update({
      status,
      item_id: details?.itemId,
      version_number: details?.versionNumber,
      error_message: details?.errorMessage,
      file_size_bytes: details?.fileSizeBytes,
    })
    .eq("id", syncId);

  if (error) {
    console.error("Failed to update sync status:", error);
  }
}

export async function getRecentSyncHistory(
  userId: string,
  libraryId?: string,
  limit: number = 10
): Promise<Array<{
  id: string;
  library_id: string | null;
  library_name: string;
  hub_name: string | null;
  project_name: string | null;
  status: string;
  error_message: string | null;
  created_at: string;
}>> {
  const supabase = await createClient();

  let query = supabase
    .from("autodesk_sync_history")
    .select(
      "id, library_id, library_name, hub_name, project_name, status, error_message, created_at"
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (libraryId) {
    query = query.eq("library_id", libraryId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to get sync history: ${error.message}`);
  }

  return data || [];
}
