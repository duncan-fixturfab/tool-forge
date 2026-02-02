"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Loader2 } from "lucide-react";
import { MaterialCategory } from "@/types/database";

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

interface MaterialFormData {
  name: string;
  category: MaterialCategory;
  description: string;
  hardness_hrc_min: number | undefined;
  hardness_hrc_max: number | undefined;
  hardness_brinell: number | undefined;
  surface_speed_min_m_min: number | undefined;
  surface_speed_max_m_min: number | undefined;
  chip_load_factor: number;
  common_grades: string;
  is_public: boolean;
}

export default function EditMaterialPage() {
  const router = useRouter();
  const params = useParams();
  const materialId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<MaterialFormData | null>(null);

  useEffect(() => {
    async function fetchMaterial() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { data: material, error } = await supabase
        .from("materials")
        .select("*")
        .eq("id", materialId)
        .single();

      if (error || !material) {
        setError("Material not found");
        setLoading(false);
        return;
      }

      // Check ownership
      if (material.created_by !== user?.id) {
        router.push(`/materials/${materialId}`);
        return;
      }

      setFormData({
        name: material.name,
        category: material.category as MaterialCategory,
        description: material.description || "",
        hardness_hrc_min: material.hardness_hrc_min ?? undefined,
        hardness_hrc_max: material.hardness_hrc_max ?? undefined,
        hardness_brinell: material.hardness_brinell ?? undefined,
        surface_speed_min_m_min: material.surface_speed_min_m_min ?? undefined,
        surface_speed_max_m_min: material.surface_speed_max_m_min ?? undefined,
        chip_load_factor: material.chip_load_factor,
        common_grades: material.common_grades?.join(", ") || "",
        is_public: material.is_public,
      });
      setLoading(false);
    }

    fetchMaterial();
  }, [materialId, router]);

  const handleSave = async () => {
    if (!formData) return;

    setSaving(true);
    setError(null);

    try {
      const supabase = createClient();

      // Parse common grades from comma-separated string
      const gradesArray = formData.common_grades
        .split(",")
        .map((g) => g.trim())
        .filter((g) => g.length > 0);

      const { error } = await supabase
        .from("materials")
        .update({
          name: formData.name,
          category: formData.category,
          description: formData.description || null,
          hardness_hrc_min: formData.hardness_hrc_min ?? null,
          hardness_hrc_max: formData.hardness_hrc_max ?? null,
          hardness_brinell: formData.hardness_brinell ?? null,
          surface_speed_min_m_min: formData.surface_speed_min_m_min ?? null,
          surface_speed_max_m_min: formData.surface_speed_max_m_min ?? null,
          chip_load_factor: formData.chip_load_factor,
          common_grades: gradesArray.length > 0 ? gradesArray : null,
          is_public: formData.is_public,
        })
        .eq("id", materialId);

      if (error) throw error;

      router.push(`/materials/${materialId}`);
    } catch (err) {
      console.error("Error saving material:", err);
      setError("Failed to save material");
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error && !formData) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/materials">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Material Not Found</h1>
        </div>
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (!formData) return null;

  const hasRequiredFields =
    formData.name.trim() !== "" && formData.chip_load_factor > 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/materials/${materialId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Edit Material</h1>
          <p className="text-muted-foreground">{formData.name}</p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Material Information</CardTitle>
          <CardDescription>Update the material details below</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Basic Info */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Material Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  setFormData({ ...formData, category: value as MaterialCategory })
                }
                disabled={saving}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Material description..."
                rows={2}
                disabled={saving}
              />
            </div>
          </div>

          {/* Hardness */}
          <div>
            <h3 className="font-semibold mb-3">Hardness</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="hrc_min">HRC Min</Label>
                <Input
                  id="hrc_min"
                  type="number"
                  step="1"
                  value={formData.hardness_hrc_min ?? ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      hardness_hrc_min: e.target.value
                        ? parseFloat(e.target.value)
                        : undefined,
                    })
                  }
                  placeholder="e.g., 28"
                  disabled={saving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hrc_max">HRC Max</Label>
                <Input
                  id="hrc_max"
                  type="number"
                  step="1"
                  value={formData.hardness_hrc_max ?? ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      hardness_hrc_max: e.target.value
                        ? parseFloat(e.target.value)
                        : undefined,
                    })
                  }
                  placeholder="e.g., 32"
                  disabled={saving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="brinell">Brinell (HB)</Label>
                <Input
                  id="brinell"
                  type="number"
                  step="1"
                  value={formData.hardness_brinell ?? ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      hardness_brinell: e.target.value
                        ? parseFloat(e.target.value)
                        : undefined,
                    })
                  }
                  placeholder="e.g., 200"
                  disabled={saving}
                />
              </div>
            </div>
          </div>

          {/* Cutting Parameters */}
          <div>
            <h3 className="font-semibold mb-3">Cutting Parameters</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="speed_min">Surface Speed Min (m/min)</Label>
                <Input
                  id="speed_min"
                  type="number"
                  step="1"
                  value={formData.surface_speed_min_m_min ?? ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      surface_speed_min_m_min: e.target.value
                        ? parseFloat(e.target.value)
                        : undefined,
                    })
                  }
                  placeholder="e.g., 200"
                  disabled={saving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="speed_max">Surface Speed Max (m/min)</Label>
                <Input
                  id="speed_max"
                  type="number"
                  step="1"
                  value={formData.surface_speed_max_m_min ?? ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      surface_speed_max_m_min: e.target.value
                        ? parseFloat(e.target.value)
                        : undefined,
                    })
                  }
                  placeholder="e.g., 400"
                  disabled={saving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="chip_load">Chip Load Factor *</Label>
                <Input
                  id="chip_load"
                  type="number"
                  step="0.1"
                  value={formData.chip_load_factor}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      chip_load_factor: parseFloat(e.target.value) || 1,
                    })
                  }
                  disabled={saving}
                />
                <p className="text-xs text-muted-foreground">
                  1.0 = aluminum baseline
                </p>
              </div>
            </div>
          </div>

          {/* Common Grades */}
          <div className="space-y-2">
            <Label htmlFor="grades">Common Grades / Trade Names</Label>
            <Input
              id="grades"
              value={formData.common_grades}
              onChange={(e) =>
                setFormData({ ...formData, common_grades: e.target.value })
              }
              placeholder="e.g., 6061, 7075, 2024 (comma-separated)"
              disabled={saving}
            />
            <p className="text-xs text-muted-foreground">
              Enter grades separated by commas
            </p>
          </div>

          {/* Visibility */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_public"
              checked={formData.is_public}
              onChange={(e) =>
                setFormData({ ...formData, is_public: e.target.checked })
              }
              disabled={saving}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <Label htmlFor="is_public" className="cursor-pointer">
              Make this material public (visible to all users)
            </Label>
          </div>
        </CardContent>

        <CardFooter className="flex justify-between">
          <Link href={`/materials/${materialId}`}>
            <Button variant="outline" disabled={saving}>
              Cancel
            </Button>
          </Link>
          <Button onClick={handleSave} disabled={saving || !hasRequiredFields}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
