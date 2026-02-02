"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MaterialInputPanel } from "@/components/materials/material-input-panel";
import { MaterialPreview } from "@/components/materials/material-preview";
import { ExtractedMaterial, MaterialCategory } from "@/lib/agents/material-schemas";

const VALID_CATEGORIES: MaterialCategory[] = [
  "aluminum",
  "steel",
  "stainless_steel",
  "titanium",
  "brass",
  "copper",
  "plastic",
  "wood",
  "composite",
  "cast_iron",
];

export default function NewMaterialPage() {
  const router = useRouter();
  const [extractedMaterial, setExtractedMaterial] = useState<ExtractedMaterial | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleMaterialExtracted = (material: ExtractedMaterial, sourceType: string) => {
    setExtractedMaterial(material);
    setError(null);
  };

  // Helper to ensure numeric values are properly typed
  const toNumber = (val: unknown): number | undefined => {
    if (val === null || val === undefined || val === "") return undefined;
    const num = Number(val);
    return isNaN(num) ? undefined : num;
  };

  const handleSave = async (material: ExtractedMaterial) => {
    setSaving(true);
    setError(null);

    // Validate category before sending
    if (!material.category || !VALID_CATEGORIES.includes(material.category)) {
      const categoryValue = material.category || "(empty)";
      setError("Please select a valid category. Current value: " + categoryValue);
      setSaving(false);
      return;
    }

    try {
      const response = await fetch("/api/materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: material.name,
          category: material.category,
          description: material.description,
          hardness_hrc_min: toNumber(material.hardness_hrc_min),
          hardness_hrc_max: toNumber(material.hardness_hrc_max),
          hardness_brinell: toNumber(material.hardness_brinell),
          surface_speed_min_m_min: toNumber(material.surface_speed_min_m_min),
          surface_speed_max_m_min: toNumber(material.surface_speed_max_m_min),
          chip_load_factor: toNumber(material.chip_load_factor) ?? 1.0,
          common_grades: material.common_grades,
          is_public: (material as unknown as { is_public?: boolean }).is_public ?? false,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Parse validation errors into a readable message
        if (data.details && Array.isArray(data.details)) {
          interface ValidationIssue {
            path?: string[];
            message?: string;
          }
          const errorMessages = data.details.map((issue: ValidationIssue) => {
            const field = issue.path?.join(".") || "unknown";
            const msg = issue.message || "Unknown error";
            return field + ": " + msg;
          });
          throw new Error("Validation error:\n" + errorMessages.join("\n"));
        }
        throw new Error(data.error || "Failed to save material");
      }

      // Navigate to materials list or the new material's page
      router.push("/materials");
    } catch (err) {
      console.error("Error saving material:", err);
      setError(err instanceof Error ? err.message : "Failed to save material");
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setExtractedMaterial(null);
    setError(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Add New Material</h1>
        <p className="text-muted-foreground mt-2">
          Extract material properties from vendor information or datasheets
        </p>
      </div>

      {error && (
        <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-md whitespace-pre-wrap">
          {error}
        </div>
      )}

      {extractedMaterial ? (
        <MaterialPreview
          material={extractedMaterial}
          onSave={handleSave}
          onCancel={handleCancel}
          saving={saving}
        />
      ) : (
        <MaterialInputPanel onMaterialExtracted={handleMaterialExtracted} />
      )}
    </div>
  );
}
