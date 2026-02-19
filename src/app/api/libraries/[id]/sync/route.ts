import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  generateFusion360Library,
  generateToolsFile,
  validateLibrary,
} from "@/lib/fusion360/generator";
import { MachineMaterialPreset, Material, Tool, PostProcessSettings } from "@/types/database";
import { getValidAccessToken, recordSyncAttempt, updateSyncStatus, updateLastSyncAt, updateDefaultDestination } from "@/lib/autodesk/tokens";
import { uploadToolsFile, findExistingToolsFile } from "@/lib/autodesk/client";

export const dynamic = "force-dynamic";

interface SyncRequestBody {
  hubId: string;
  hubName?: string;
  projectId: string;
  projectName?: string;
  folderId: string;
  folderPath?: string;
  saveAsDefault?: boolean;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let syncId: string | null = null;

  try {
    const { id } = await params;
    const body: SyncRequestBody = await request.json();
    const { hubId, hubName, projectId, projectName, folderId, folderPath, saveAsDefault } = body;

    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate required fields
    if (!hubId || !projectId || !folderId) {
      return NextResponse.json(
        { error: "Missing required fields: hubId, projectId, folderId" },
        { status: 400 }
      );
    }

    // Fetch library with tools
    const { data: library, error: libraryError } = await supabase
      .from("tool_libraries")
      .select(
        `
        *,
        machines (*),
        library_tools (
          *,
          tools (*)
        )
      `
      )
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (libraryError || !library) {
      return NextResponse.json({ error: "Library not found" }, { status: 404 });
    }

    if (!library.machines) {
      return NextResponse.json(
        { error: "Library has no machine assigned" },
        { status: 400 }
      );
    }

    // Record sync attempt
    syncId = await recordSyncAttempt(user.id, id, library.name, {
      hubId,
      hubName,
      projectId,
      projectName,
      folderId,
      folderPath,
    });

    // Get valid Autodesk access token
    let accessToken: string;
    try {
      accessToken = await getValidAccessToken(user.id);
    } catch (error) {
      await updateSyncStatus(syncId, "failed", {
        errorMessage: error instanceof Error ? error.message : "Failed to get Autodesk access token",
      });
      return NextResponse.json(
        { error: "Autodesk connection required", needsReconnect: true },
        { status: 401 }
      );
    }

    // Update status to uploading
    await updateSyncStatus(syncId, "uploading");

    // Get material IDs from library's default_material_ids
    const materialIds: string[] = library.default_material_ids || [];

    // Fetch materials and presets only if there are material IDs
    let materials: Material[] = [];
    const presetMap = new Map<string, MachineMaterialPreset>();

    if (materialIds.length > 0) {
      // Fetch materials
      const { data: fetchedMaterials } = await supabase
        .from("materials")
        .select("*")
        .in("id", materialIds);

      materials = fetchedMaterials || [];

      // Fetch machine-material presets
      const { data: presets } = await supabase
        .from("machine_material_presets")
        .select("*")
        .eq("machine_id", library.machine_id)
        .in("material_id", materialIds);

      if (presets) {
        for (const preset of presets) {
          presetMap.set(preset.material_id, preset);
        }
      }
    }

    // Extract tools with their library_tool settings
    const toolsWithSettings = (library.library_tools || [])
      .filter(
        (lt: { tools: unknown }) => lt.tools
      )
      .map(
        (lt: {
          tool_number: number;
          post_process?: PostProcessSettings;
          tools: Tool;
        }) => ({
          tool: lt.tools,
          toolNumber: lt.tool_number,
          postProcess: lt.post_process,
        })
      );

    if (toolsWithSettings.length === 0) {
      await updateSyncStatus(syncId, "failed", { errorMessage: "Library has no tools" });
      return NextResponse.json({ error: "Library has no tools" }, { status: 400 });
    }

    // Generate Fusion360 library
    const fusion360Library = generateFusion360Library({
      libraryName: library.name,
      tools: toolsWithSettings,
      machine: library.machines,
      materials,
      presets: presetMap,
      productIdSource: (library.product_id_source as "product_id" | "internal_reference") ?? "product_id",
    });

    // Validate library
    const validation = validateLibrary(fusion360Library);
    if (!validation.valid) {
      await updateSyncStatus(syncId, "failed", {
        errorMessage: `Validation failed: ${validation.errors.join(", ")}`,
      });
      return NextResponse.json(
        { error: "Library validation failed", details: validation.errors },
        { status: 400 }
      );
    }

    // Generate .tools file
    const toolsBlob = await generateToolsFile(fusion360Library, library.name);
    const fileName = `${library.name.replace(/[^a-zA-Z0-9-_]/g, "_")}.tools`;

    // Check if file already exists in the folder
    const existingItem = await findExistingToolsFile(
      accessToken,
      projectId,
      folderId,
      fileName
    );

    // Upload to Autodesk
    const uploadResult = await uploadToolsFile(
      accessToken,
      projectId,
      folderId,
      fileName,
      toolsBlob,
      existingItem?.id
    );

    // Update sync status to success
    await updateSyncStatus(syncId, "success", {
      itemId: uploadResult.itemId,
      versionNumber: uploadResult.versionNumber,
      fileSizeBytes: toolsBlob.size,
    });

    // Update last sync time
    await updateLastSyncAt(user.id);

    // Save as default destination if requested
    if (saveAsDefault) {
      await updateDefaultDestination(user.id, {
        hubId,
        hubName: hubName || "",
        projectId,
        projectName: projectName || "",
        folderId,
        folderPath: folderPath || "",
      });
    }

    // Update library export stats
    await supabase
      .from("tool_libraries")
      .update({
        last_exported_at: new Date().toISOString(),
        export_count: (library.export_count || 0) + 1,
      })
      .eq("id", id);

    return NextResponse.json({
      success: true,
      itemId: uploadResult.itemId,
      versionNumber: uploadResult.versionNumber,
      isNewItem: uploadResult.isNewItem,
      fileName,
    });
  } catch (error) {
    console.error("Sync error:", error);

    if (syncId) {
      await updateSyncStatus(syncId, "failed", {
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      });
    }

    const message = error instanceof Error ? error.message : "Failed to sync library";

    if (message.includes("No Autodesk connection") || message.includes("session expired")) {
      return NextResponse.json({ error: message, needsReconnect: true }, { status: 401 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
