"use client";

import { useState, useEffect } from "react";
import { ExtractedMaterial, MaterialCategory } from "@/lib/agents/material-schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, Layers } from "lucide-react";

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

interface MaterialPreviewProps {
  material: ExtractedMaterial;
  onSave: (material: ExtractedMaterial) => void;
  onCancel: () => void;
  saving?: boolean;
}

export function MaterialPreview({
  material: initialMaterial,
  onSave,
  onCancel,
  saving = false,
}: MaterialPreviewProps) {
  const [material, setMaterial] = useState<ExtractedMaterial>(initialMaterial);
  const [gradesInput, setGradesInput] = useState<string>(
    initialMaterial.common_grades?.join(", ") || ""
  );
  const [isPublic, setIsPublic] = useState(false);

  useEffect(() => {
    setMaterial(initialMaterial);
    setGradesInput(initialMaterial.common_grades?.join(", ") || "");
  }, [initialMaterial]);

  const updateGrades = (value: string) => {
    setGradesInput(value);
    const grades = value
      .split(",")
      .map((g) => g.trim())
      .filter((g) => g.length > 0);
    setMaterial({
      ...material,
      common_grades: grades.length > 0 ? grades : undefined,
    });
  };

  const confidenceColor =
    material.confidence >= 0.8
      ? "text-green-600"
      : material.confidence >= 0.5
        ? "text-yellow-600"
        : "text-red-600";

  const hasRequiredFields =
    material.name.length > 0 &&
    material.category &&
    material.chip_load_factor > 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Layers className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>Material Preview</CardTitle>
              <CardDescription>
                Review and edit the extracted material data
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {material.confidence >= 0.8 ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-yellow-600" />
            )}
            <span className={`text-sm font-medium ${confidenceColor}`}>
              {Math.round(material.confidence * 100)}% confidence
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Missing fields warning */}
        {material.missing_fields && material.missing_fields.length > 0 && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              <strong>Missing fields:</strong> {material.missing_fields.join(", ")}
            </p>
            <p className="text-xs text-yellow-700 mt-1">
              Please fill in the missing values below.
            </p>
          </div>
        )}

        {/* Basic Info */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">
              Material Name *
              {!material.name && (
                <Badge variant="destructive" className="ml-2 text-xs">
                  Required
                </Badge>
              )}
            </Label>
            <Input
              id="name"
              value={material.name}
              onChange={(e) => setMaterial({ ...material, name: e.target.value })}
              placeholder="e.g., Polycarbonate"
              disabled={saving}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">
              Category *
              {!material.category && (
                <Badge variant="destructive" className="ml-2 text-xs">
                  Required
                </Badge>
              )}
            </Label>
            <Select
              value={material.category}
              onValueChange={(value) =>
                setMaterial({ ...material, category: value as MaterialCategory })
              }
              disabled={saving}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
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
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <textarea
            id="description"
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={material.description || ""}
            onChange={(e) =>
              setMaterial({ ...material, description: e.target.value || undefined })
            }
            placeholder="Brief description of the material properties"
            disabled={saving}
          />
        </div>

        {/* Hardness */}
        <div>
          <h3 className="font-semibold mb-3">Hardness</h3>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="hardness_hrc_min">HRC Min</Label>
              <Input
                id="hardness_hrc_min"
                type="number"
                step="0.1"
                value={material.hardness_hrc_min ?? ""}
                onChange={(e) =>
                  setMaterial({
                    ...material,
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
              <Label htmlFor="hardness_hrc_max">HRC Max</Label>
              <Input
                id="hardness_hrc_max"
                type="number"
                step="0.1"
                value={material.hardness_hrc_max ?? ""}
                onChange={(e) =>
                  setMaterial({
                    ...material,
                    hardness_hrc_max: e.target.value
                      ? parseFloat(e.target.value)
                      : undefined,
                  })
                }
                placeholder="e.g., 36"
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hardness_brinell">Brinell (HB)</Label>
              <Input
                id="hardness_brinell"
                type="number"
                value={material.hardness_brinell ?? ""}
                onChange={(e) =>
                  setMaterial({
                    ...material,
                    hardness_brinell: e.target.value
                      ? parseFloat(e.target.value)
                      : undefined,
                  })
                }
                placeholder="e.g., 150"
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
              <Label htmlFor="surface_speed_min">Surface Speed Min (m/min)</Label>
              <Input
                id="surface_speed_min"
                type="number"
                step="1"
                value={material.surface_speed_min_m_min ?? ""}
                onChange={(e) =>
                  setMaterial({
                    ...material,
                    surface_speed_min_m_min: e.target.value
                      ? parseFloat(e.target.value)
                      : undefined,
                  })
                }
                placeholder="e.g., 100"
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="surface_speed_max">Surface Speed Max (m/min)</Label>
              <Input
                id="surface_speed_max"
                type="number"
                step="1"
                value={material.surface_speed_max_m_min ?? ""}
                onChange={(e) =>
                  setMaterial({
                    ...material,
                    surface_speed_max_m_min: e.target.value
                      ? parseFloat(e.target.value)
                      : undefined,
                  })
                }
                placeholder="e.g., 300"
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="chip_load_factor">
                Chip Load Factor *
                {!material.chip_load_factor && (
                  <Badge variant="destructive" className="ml-2 text-xs">
                    Required
                  </Badge>
                )}
              </Label>
              <Input
                id="chip_load_factor"
                type="number"
                step="0.1"
                value={material.chip_load_factor || ""}
                onChange={(e) =>
                  setMaterial({
                    ...material,
                    chip_load_factor: parseFloat(e.target.value) || 1.0,
                  })
                }
                placeholder="1.0 = aluminum baseline"
                disabled={saving}
              />
              <p className="text-xs text-muted-foreground">
                1.0 = aluminum, &lt;1.0 = harder, &gt;1.0 = softer
              </p>
            </div>
          </div>
        </div>

        {/* Common Grades */}
        <div className="space-y-2">
          <Label htmlFor="common_grades">Common Grades / Trade Names</Label>
          <Input
            id="common_grades"
            value={gradesInput}
            onChange={(e) => updateGrades(e.target.value)}
            placeholder="e.g., Lexan, Makrolon, Calibre (comma separated)"
            disabled={saving}
          />
          <p className="text-xs text-muted-foreground">
            Enter common grades or trade names, separated by commas
          </p>
        </div>

        {/* Visibility */}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="is_public"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            disabled={saving}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <Label htmlFor="is_public" className="cursor-pointer">
            Make this material public (visible to all users)
          </Label>
        </div>

        {/* Notes */}
        {material.notes && (
          <div className="p-3 bg-gray-50 border rounded-md">
            <p className="text-sm text-gray-700">
              <strong>Extraction notes:</strong> {material.notes}
            </p>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button
          onClick={() => onSave({ ...material, is_public: isPublic } as ExtractedMaterial)}
          disabled={saving || !hasRequiredFields}
        >
          {saving ? "Saving..." : "Save Material"}
        </Button>
      </CardFooter>
    </Card>
  );
}
