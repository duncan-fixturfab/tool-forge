"use client";

import { useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MaterialSelector } from "@/components/materials/material-selector";
import { Loader2 } from "lucide-react";

interface MaterialsCardProps {
  libraryId: string;
  defaultMaterialIds: string[];
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function MaterialsCard({
  libraryId,
  defaultMaterialIds,
}: MaterialsCardProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>(defaultMaterialIds);
  const [saving, setSaving] = useState(false);
  const [pendingUpdate, setPendingUpdate] = useState<string[] | null>(null);
  const isFirstRender = useRef(true);

  const debouncedMaterials = useDebounce(pendingUpdate, 500);

  // Handle debounced save
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (debouncedMaterials === null) return;

    const saveChanges = async () => {
      setSaving(true);
      try {
        await fetch(`/api/libraries/${libraryId}/default-materials`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ materialIds: debouncedMaterials }),
        });
      } catch (error) {
        console.error("Failed to save materials:", error);
      } finally {
        setSaving(false);
        setPendingUpdate(null);
      }
    };

    saveChanges();
  }, [debouncedMaterials, libraryId]);

  const handleChange = (ids: string[]) => {
    setSelectedIds(ids);
    setPendingUpdate(ids);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Materials
              {saving && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </CardTitle>
            <CardDescription>
              Select materials for preset generation during export
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <MaterialSelector
          value={selectedIds}
          onChange={(ids) => handleChange(ids)}
        />
        {selectedIds.length === 0 && (
          <p className="text-sm text-muted-foreground mt-3">
            No materials selected. Select materials to generate cutting presets
            during export.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
