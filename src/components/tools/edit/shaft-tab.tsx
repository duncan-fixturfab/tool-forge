"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Package } from "lucide-react";
import { ShaftSegment } from "@/types/database";

interface ShaftTabProps {
  segments: ShaftSegment[];
  onChange: (segments: ShaftSegment[]) => void;
  disabled?: boolean;
}

export function ShaftTab({ segments, onChange, disabled = false }: ShaftTabProps) {
  const addSegment = () => {
    const newSegment: ShaftSegment = {
      height_mm: 10,
      upper_diameter_mm: 6,
      lower_diameter_mm: 6,
    };
    onChange([...segments, newSegment]);
  };

  const updateSegment = (index: number, field: keyof ShaftSegment, value: number) => {
    const updated = [...segments];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const removeSegment = (index: number) => {
    onChange(segments.filter((_, i) => i !== index));
  };

  if (segments.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addSegment}
            disabled={disabled}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>

        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Package className="h-16 w-16 mb-4 opacity-30" />
          <p className="text-lg">No data</p>
          <p className="text-sm">Add shaft segments to define the tool profile</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addSegment}
          disabled={disabled}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add
        </Button>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">
                Index
              </th>
              <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">
                Height
              </th>
              <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">
                Upper diameter
              </th>
              <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">
                Lower diameter
              </th>
              <th className="px-4 py-2 w-12"></th>
            </tr>
          </thead>
          <tbody>
            {segments.map((segment, index) => (
              <tr key={index} className="border-t">
                <td className="px-4 py-2 text-sm">{index + 1}</td>
                <td className="px-4 py-2">
                  <div className="relative">
                    <Input
                      type="number"
                      step="0.001"
                      value={segment.height_mm || ""}
                      onChange={(e) =>
                        updateSegment(index, "height_mm", parseFloat(e.target.value) || 0)
                      }
                      className="h-8 pr-10"
                      disabled={disabled}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      mm
                    </span>
                  </div>
                </td>
                <td className="px-4 py-2">
                  <div className="relative">
                    <Input
                      type="number"
                      step="0.001"
                      value={segment.upper_diameter_mm || ""}
                      onChange={(e) =>
                        updateSegment(
                          index,
                          "upper_diameter_mm",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="h-8 pr-10"
                      disabled={disabled}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      mm
                    </span>
                  </div>
                </td>
                <td className="px-4 py-2">
                  <div className="relative">
                    <Input
                      type="number"
                      step="0.001"
                      value={segment.lower_diameter_mm || ""}
                      onChange={(e) =>
                        updateSegment(
                          index,
                          "lower_diameter_mm",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="h-8 pr-10"
                      disabled={disabled}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      mm
                    </span>
                  </div>
                </td>
                <td className="px-4 py-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSegment(index)}
                    disabled={disabled}
                    className="h-8 w-8 p-0"
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
