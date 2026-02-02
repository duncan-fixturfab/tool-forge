import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { ToolType, PostProcessSettings } from "@/types/database";
import { ExportCard } from "@/components/library/export-card";
import { LibraryToolsList } from "@/components/library/library-tools-list";
import { MaterialsCard } from "@/components/library/materials-card";
import { AddToolButton } from "@/components/library/add-tool-button";

export default async function LibraryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: library, error } = await supabase
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
    .single();

  if (error || !library) {
    notFound();
  }

  // Transform library_tools for the LibraryToolsList component
  const libraryTools = (library.library_tools || [])
    .filter((lt: { tools: unknown }) => lt.tools)
    .map(
      (lt: {
        id: string;
        tool_number: number;
        tool_holder_id?: string | null;
        post_process?: PostProcessSettings;
        tools: {
          id: string;
          name: string;
          vendor?: string;
          tool_type: ToolType;
          geometry: { diameter_mm: number; number_of_flutes: number; shank_diameter_mm?: number };
        };
      }) => ({
        id: lt.id,
        tool_number: lt.tool_number,
        tool_holder_id: lt.tool_holder_id,
        post_process: lt.post_process,
        tools: lt.tools,
      })
    );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{library.name}</h1>
            {library.description && (
              <p className="text-muted-foreground">{library.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant={library.status === "complete" ? "default" : "secondary"}
          >
            {library.status}
          </Badge>
        </div>
      </div>

      {/* Machine Info */}
      {library.machines && (
        <Card>
          <CardHeader>
            <CardTitle>Machine</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">
                  {library.machines.manufacturer} {library.machines.model}
                </p>
                <p className="text-sm text-muted-foreground">
                  {library.machines.max_rpm.toLocaleString()} RPM max
                  {library.machines.spindle_power_kw &&
                    ` / ${library.machines.spindle_power_kw}kW`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tools List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Tools ({libraryTools.length})</CardTitle>
              <CardDescription>Tools included in this library</CardDescription>
            </div>
<AddToolButton
              libraryId={id}
              existingToolIds={libraryTools.map((lt: { tools: { id: string } }) => lt.tools.id)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <LibraryToolsList libraryId={id} libraryTools={libraryTools} machineId={library.machine_id} />
        </CardContent>
      </Card>

      {/* Materials */}
      <MaterialsCard
        libraryId={id}
        defaultMaterialIds={library.default_material_ids || []}
      />

      {/* Export & Sync */}
      <ExportCard
        libraryId={id}
        libraryName={library.name}
        exportCount={library.export_count || 0}
        lastExportedAt={library.last_exported_at}
        defaultMaterialIds={library.default_material_ids || []}
      />

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Delete Library</p>
              <p className="text-sm text-muted-foreground">
                Permanently delete this library and all its data
              </p>
            </div>
            <Button variant="destructive">Delete Library</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
