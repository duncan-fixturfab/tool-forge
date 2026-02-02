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
import { ArrowLeft, Pencil } from "lucide-react";
import { MaterialCategory } from "@/types/database";
import { DeleteMaterialButton } from "@/components/materials/delete-material-button";

const CATEGORY_LABELS: Record<MaterialCategory, string> = {
  aluminum: "Aluminum",
  steel: "Steel",
  stainless_steel: "Stainless Steel",
  titanium: "Titanium",
  brass: "Brass",
  copper: "Copper",
  plastic: "Plastic",
  wood: "Wood",
  composite: "Composite",
  cast_iron: "Cast Iron",
};

export default async function MaterialDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: material, error } = await supabase
    .from("materials")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !material) {
    notFound();
  }

  const isOwner = material.created_by === user?.id;
  const hasHardness =
    material.hardness_hrc_min != null || material.hardness_brinell != null;
  const hasCuttingParams =
    material.surface_speed_min_m_min != null ||
    material.surface_speed_max_m_min != null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/materials">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{material.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge>{CATEGORY_LABELS[material.category as MaterialCategory]}</Badge>
              {material.is_public ? (
                <Badge variant="outline">Public</Badge>
              ) : (
                <Badge variant="secondary">Private</Badge>
              )}
            </div>
          </div>
        </div>
        {isOwner && (
          <Link href={`/materials/${id}/edit`}>
            <Button size="sm">
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </Link>
        )}
      </div>

      {/* Two-column grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Properties Card */}
        <Card>
          <CardHeader>
            <CardTitle>Material Properties</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Category</span>
              <span className="font-medium">
                {CATEGORY_LABELS[material.category as MaterialCategory]}
              </span>
            </div>
            {material.description && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Description</span>
                <span className="font-medium text-right max-w-[60%]">
                  {material.description}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Chip Load Factor</span>
              <span className="font-medium">{material.chip_load_factor}</span>
            </div>
          </CardContent>
        </Card>

        {/* Hardness Card */}
        <Card>
          <CardHeader>
            <CardTitle>Hardness</CardTitle>
            <CardDescription>Material hardness specifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!hasHardness ? (
              <p className="text-muted-foreground text-sm">
                No hardness data available
              </p>
            ) : (
              <>
                {material.hardness_hrc_min != null &&
                  material.hardness_hrc_max != null && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Rockwell C (HRC)</span>
                      <span className="font-medium">
                        {material.hardness_hrc_min} - {material.hardness_hrc_max}
                      </span>
                    </div>
                  )}
                {material.hardness_brinell != null && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Brinell (HB)</span>
                    <span className="font-medium">{material.hardness_brinell}</span>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cutting Parameters Card */}
      <Card>
        <CardHeader>
          <CardTitle>Cutting Parameters</CardTitle>
          <CardDescription>
            Recommended cutting data for this material
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!hasCuttingParams ? (
            <p className="text-muted-foreground text-sm">
              No cutting parameter data available
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {material.surface_speed_min_m_min != null &&
                material.surface_speed_max_m_min != null && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Surface Speed</span>
                    <span className="font-medium">
                      {material.surface_speed_min_m_min} -{" "}
                      {material.surface_speed_max_m_min} m/min
                    </span>
                  </div>
                )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Common Grades Card */}
      {material.common_grades && material.common_grades.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Common Grades / Trade Names</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {material.common_grades.map((grade: string) => (
                <Badge key={grade} variant="outline">
                  {grade}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions Card - only for owner */}
      {isOwner && (
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-4">
            <Link href={`/materials/${id}/edit`}>
              <Button>Edit Material</Button>
            </Link>
            <DeleteMaterialButton materialId={id} materialName={material.name} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
