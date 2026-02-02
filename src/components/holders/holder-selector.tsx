"use client";

import { useState, useEffect } from "react";
import { Tool, ToolHolder } from "@/types/database";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle } from "lucide-react";

interface HolderSelectorProps {
  tool: Tool;
  machineId?: string;
  availableHolders?: ToolHolder[];
  value?: string;
  onChange: (holderId: string | undefined, holder?: ToolHolder) => void;
  showIncompatible?: boolean;
  disabled?: boolean;
}

interface CompatibilityResult {
  compatible: ToolHolder[];
  incompatible: ToolHolder[];
  all: ToolHolder[];
  shank_diameter_mm: number;
  default_holder_id?: string;
}

export function HolderSelector({
  tool,
  machineId,
  availableHolders,
  value,
  onChange,
  showIncompatible = true,
  disabled = false,
}: HolderSelectorProps) {
  const [loading, setLoading] = useState(false);
  const [compatibilityData, setCompatibilityData] = useState<CompatibilityResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch compatible holders if not provided
  useEffect(() => {
    if (availableHolders) {
      // Use provided holders and calculate compatibility locally
      const shankDiameter = tool.geometry?.shank_diameter_mm || tool.geometry?.diameter_mm || 0;
      const compatible: ToolHolder[] = [];
      const incompatible: ToolHolder[] = [];

      for (const holder of availableHolders) {
        const meetsMinimum = !holder.collet_min_mm || shankDiameter >= holder.collet_min_mm;
        const meetsMaximum = !holder.collet_max_mm || shankDiameter <= holder.collet_max_mm;

        if (meetsMinimum && meetsMaximum) {
          compatible.push(holder);
        } else {
          incompatible.push(holder);
        }
      }

      setCompatibilityData({
        compatible,
        incompatible,
        all: availableHolders,
        shank_diameter_mm: shankDiameter,
      });
      return;
    }

    // Fetch from API
    async function fetchCompatibleHolders() {
      setLoading(true);
      setError(null);

      try {
        const url = new URL(`/api/tools/${tool.id}/compatible-holders`, window.location.origin);
        if (machineId) {
          url.searchParams.set("machine_id", machineId);
        }

        const response = await fetch(url.toString());
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch holders");
        }

        setCompatibilityData(data);

        // Auto-select default holder if no value set
        if (!value && data.default_holder_id) {
          const defaultHolder = data.all.find((h: ToolHolder) => h.id === data.default_holder_id);
          if (defaultHolder) {
            onChange(defaultHolder.id, defaultHolder);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load holders");
      } finally {
        setLoading(false);
      }
    }

    fetchCompatibleHolders();
  }, [tool.id, machineId, availableHolders, value, onChange, tool.geometry]);

  const handleChange = (holderId: string) => {
    if (holderId === "none") {
      onChange(undefined, undefined);
      return;
    }

    const holder = compatibilityData?.all.find((h) => h.id === holderId);
    onChange(holderId, holder);
  };

  const selectedHolder = compatibilityData?.all.find((h) => h.id === value);
  const isSelectedCompatible = selectedHolder
    ? compatibilityData?.compatible.some((h) => h.id === selectedHolder.id)
    : true;

  if (loading) {
    return (
      <Select disabled>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Loading..." />
        </SelectTrigger>
      </Select>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-red-500 flex items-center gap-1">
        <AlertCircle className="h-4 w-4" />
        {error}
      </div>
    );
  }

  const compatibleHolders = compatibilityData?.compatible || [];
  const incompatibleHolders = compatibilityData?.incompatible || [];

  return (
    <div className="flex items-center gap-2">
      <Select value={value || "none"} onValueChange={handleChange} disabled={disabled}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Select holder..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">No holder</SelectItem>

          {/* Compatible holders */}
          {compatibleHolders.length > 0 && (
            <>
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                Compatible ({compatibleHolders.length})
              </div>
              {compatibleHolders.map((holder) => (
                <SelectItem key={holder.id} value={holder.id}>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    <span>{holder.name}</span>
                    {holder.collet_type && (
                      <Badge variant="outline" className="text-xs ml-1">
                        {holder.collet_type}
                      </Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </>
          )}

          {/* Incompatible holders (if enabled) */}
          {showIncompatible && incompatibleHolders.length > 0 && (
            <>
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-t mt-1">
                Incompatible ({incompatibleHolders.length})
              </div>
              {incompatibleHolders.map((holder) => (
                <SelectItem key={holder.id} value={holder.id}>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-3 w-3 text-amber-500" />
                    <span className="text-muted-foreground">{holder.name}</span>
                  </div>
                </SelectItem>
              ))}
            </>
          )}
        </SelectContent>
      </Select>

      {/* Compatibility warning */}
      {value && !isSelectedCompatible && (
        <Badge variant="outline" className="text-amber-600 border-amber-300">
          <AlertCircle className="h-3 w-3 mr-1" />
          Override
        </Badge>
      )}
    </div>
  );
}
