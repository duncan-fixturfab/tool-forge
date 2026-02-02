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
import { Plus, Layers } from "lucide-react";
import { MaterialCard, CATEGORY_LABELS } from "@/components/materials/material-card";
import { Material, MaterialCategory } from "@/types/database";

const CATEGORY_ORDER: MaterialCategory[] = [
  "aluminum",
  "steel",
  "stainless_steel",
  "titanium",
  "cast_iron",
  "brass",
  "copper",
  "plastic",
  "wood",
  "composite",
];

export default async function MaterialsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: materials, error } = await supabase
    .from("materials")
    .select("*")
    .or(`is_public.eq.true,created_by.eq.${user?.id}`)
    .order("name");

  if (error) {
    console.error("Error fetching materials:", error);
  }

  const materialList = (materials || []) as Material[];

  // Group materials by category
  const groupedMaterials = CATEGORY_ORDER.reduce(
    (acc, category) => {
      acc[category] = materialList.filter((m) => m.category === category);
      return acc;
    },
    {} as Record<MaterialCategory, Material[]>
  );

  // Filter to only categories with materials
  const categoriesWithMaterials = CATEGORY_ORDER.filter(
    (category) => groupedMaterials[category].length > 0
  );

  const isEmpty = materialList.length === 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Materials</h1>
          <p className="text-muted-foreground mt-2">
            Manage your material library for cutting data calculations
          </p>
        </div>
        <Link href="/materials/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Material
          </Button>
        </Link>
      </div>

      {/* Empty State */}
      {isEmpty && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Layers className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No materials yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Add your first material to start building cutting data presets.
            </p>
            <Link href="/materials/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Material
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Materials by Category */}
      {categoriesWithMaterials.map((category) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle>{CATEGORY_LABELS[category]}</CardTitle>
            <CardDescription>
              {groupedMaterials[category].length} material
              {groupedMaterials[category].length !== 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {groupedMaterials[category].map((material) => (
                <MaterialCard
                  key={material.id}
                  material={material}
                  isOwner={material.created_by === user?.id}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
