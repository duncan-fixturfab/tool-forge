import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  generateFusion360Library,
  generateToolsFile,
  validateLibrary,
} from "@/lib/fusion360/generator";
import { MachineMaterialPreset, Material, Tool, PostProcessSettings, ToolHolder } from "@/types/database";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch library with tools and holders
    const { data: library, error: libraryError } = await supabase
      .from("tool_libraries")
      .select(
        `
        *,
        machines (*),
        library_tools (
          *,
          tools (*),
          tool_holders (*)
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

    // Extract tools with their library_tool settings and holders
    const toolsWithSettings = (library.library_tools || [])
      .filter(
        (lt: { tools: unknown }) => lt.tools
      )
      .map(
        (lt: {
          tool_number: number;
          post_process?: PostProcessSettings;
          tools: Tool;
          tool_holders?: ToolHolder;
        }) => ({
          tool: lt.tools,
          toolNumber: lt.tool_number,
          postProcess: lt.post_process,
          holder: lt.tool_holders || undefined,
        })
      );

    if (toolsWithSettings.length === 0) {
      return NextResponse.json(
        { error: "Library has no tools" },
        { status: 400 }
      );
    }

    // Generate Fusion360 library
    const fusion360Library = generateFusion360Library({
      libraryName: library.name,
      tools: toolsWithSettings,
      machine: library.machines,
      materials,
      presets: presetMap,
    });

    // Validate library
    const validation = validateLibrary(fusion360Library);
    if (!validation.valid) {
      return NextResponse.json(
        { error: "Library validation failed", details: validation.errors },
        { status: 400 }
      );
    }

    // Generate .tools file
    const toolsFile = await generateToolsFile(fusion360Library, library.name);

    // Update library export stats
    await supabase
      .from("tool_libraries")
      .update({
        last_exported_at: new Date().toISOString(),
        export_count: (library.export_count || 0) + 1,
      })
      .eq("id", id);

    // Return the file
    const headers = new Headers();
    headers.set("Content-Type", "application/zip");
    headers.set(
      "Content-Disposition",
      `attachment; filename="${library.name.replace(/[^a-zA-Z0-9-_]/g, "_")}.tools"`
    );

    return new NextResponse(toolsFile, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("Error generating library:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
