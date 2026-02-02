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
import { ArrowLeft, ExternalLink, Pencil } from "lucide-react";
import { ToolType } from "@/types/database";
import { DeleteToolButton } from "@/components/tools/delete-tool-button";

const TOOL_TYPE_LABELS: Record<ToolType, string> = {
  flat_endmill: "Flat End Mill",
  ball_endmill: "Ball End Mill",
  bull_endmill: "Bull End Mill",
  drill: "Drill",
  spot_drill: "Spot Drill",
  chamfer_mill: "Chamfer Mill",
  face_mill: "Face Mill",
  thread_mill: "Thread Mill",
  reamer: "Reamer",
  tap: "Tap",
  engraving_tool: "Engraving Tool",
};

export default async function ToolDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: tool, error } = await supabase
    .from("tools")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !tool) {
    notFound();
  }

  const geometry = tool.geometry;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/tools">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{tool.name}</h1>
            <p className="text-muted-foreground">
              {tool.vendor || "Unknown vendor"} - {tool.product_id || "No SKU"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {tool.product_url && (
            <a href={tool.product_url} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm">
                <ExternalLink className="mr-2 h-4 w-4" />
                Product Page
              </Button>
            </a>
          )}
          <Link href={`/tools/${id}/edit`}>
            <Button size="sm">
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </Link>
        </div>
      </div>

      {/* Tool Info */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Basic Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>Tool Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type</span>
              <Badge>{TOOL_TYPE_LABELS[tool.tool_type as ToolType]}</Badge>
            </div>
            {tool.vendor && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Vendor</span>
                <span className="font-medium">{tool.vendor}</span>
              </div>
            )}
            {tool.product_id && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Product ID</span>
                <span className="font-medium">{tool.product_id}</span>
              </div>
            )}
            {tool.coating && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Coating</span>
                <span className="font-medium">{tool.coating}</span>
              </div>
            )}
            {tool.substrate && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Substrate</span>
                <span className="font-medium">{tool.substrate}</span>
              </div>
            )}
            {tool.extraction_source && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Extracted From</span>
                <span className="font-medium capitalize">
                  {tool.extraction_source}
                </span>
              </div>
            )}
            {tool.extraction_confidence && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Confidence</span>
                <span className="font-medium">
                  {Math.round(tool.extraction_confidence * 100)}%
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Geometry Card */}
        <Card>
          <CardHeader>
            <CardTitle>Geometry</CardTitle>
            <CardDescription>All measurements in millimeters</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Diameter</span>
              <span className="font-medium">{geometry.diameter_mm} mm</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Number of Flutes</span>
              <span className="font-medium">{geometry.number_of_flutes}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Overall Length</span>
              <span className="font-medium">{geometry.overall_length_mm} mm</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Flute Length</span>
              <span className="font-medium">{geometry.flute_length_mm} mm</span>
            </div>
            {geometry.shank_diameter_mm && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shank Diameter</span>
                <span className="font-medium">
                  {geometry.shank_diameter_mm} mm
                </span>
              </div>
            )}
            {geometry.corner_radius_mm !== undefined && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Corner Radius</span>
                <span className="font-medium">
                  {geometry.corner_radius_mm} mm
                </span>
              </div>
            )}
            {geometry.point_angle_deg && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Point Angle</span>
                <span className="font-medium">{geometry.point_angle_deg}°</span>
              </div>
            )}
            {geometry.helix_angle_deg && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Helix Angle</span>
                <span className="font-medium">{geometry.helix_angle_deg}°</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Notes */}
      {tool.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{tool.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <DeleteToolButton toolId={tool.id} toolName={tool.name} />
        </CardContent>
      </Card>
    </div>
  );
}
