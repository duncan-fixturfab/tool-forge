"use client";

import { useState, useEffect } from "react";
import { ExtractedToolHolder, HolderTaperType } from "@/lib/agents/holder-schemas";
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
import { AlertCircle, CheckCircle, Plus, Trash2, Grip } from "lucide-react";

const TAPER_TYPE_LABELS: Record<HolderTaperType, string> = {
  ISO20: "ISO20",
  ISO25: "ISO25",
  ISO30: "ISO30",
  ISO40: "ISO40",
  ISO50: "ISO50",
  CAT40: "CAT40",
  CAT50: "CAT50",
  BT30: "BT30",
  BT40: "BT40",
  BT50: "BT50",
  "HSK-A40": "HSK-A40",
  "HSK-A63": "HSK-A63",
  "HSK-A100": "HSK-A100",
  "HSK-E25": "HSK-E25",
  "HSK-E32": "HSK-E32",
  "HSK-E40": "HSK-E40",
  "HSK-F63": "HSK-F63",
  ER11: "ER11 (Direct)",
  ER16: "ER16 (Direct)",
  ER20: "ER20 (Direct)",
  ER25: "ER25 (Direct)",
  ER32: "ER32 (Direct)",
  TTS: "TTS (Tormach)",
  R8: "R8 (Bridgeport)",
  MT2: "MT2 (Morse Taper)",
  MT3: "MT3 (Morse Taper)",
  other: "Other",
};

interface HolderPreviewProps {
  holder: ExtractedToolHolder;
  onSave: (holder: ExtractedToolHolder) => void;
  onCancel: () => void;
  saving?: boolean;
}

export function HolderPreview({
  holder: initialHolder,
  onSave,
  onCancel,
  saving = false,
}: HolderPreviewProps) {
  const [holder, setHolder] = useState<ExtractedToolHolder>(initialHolder);

  useEffect(() => {
    setHolder(initialHolder);
  }, [initialHolder]);

  const updateSegment = (index: number, field: string, value: number) => {
    const newSegments = [...holder.segments];
    newSegments[index] = { ...newSegments[index], [field]: value };
    setHolder({ ...holder, segments: newSegments });
  };

  const addSegment = () => {
    const lastSegment = holder.segments[holder.segments.length - 1];
    setHolder({
      ...holder,
      segments: [
        ...holder.segments,
        {
          height: 10,
          lower_diameter: lastSegment?.upper_diameter || 30,
          upper_diameter: lastSegment?.upper_diameter || 30,
        },
      ],
    });
  };

  const removeSegment = (index: number) => {
    if (holder.segments.length <= 1) return;
    const newSegments = holder.segments.filter((_, i) => i !== index);
    setHolder({ ...holder, segments: newSegments });
  };

  const confidenceColor =
    holder.confidence >= 0.8
      ? "text-green-600"
      : holder.confidence >= 0.5
        ? "text-yellow-600"
        : "text-red-600";

  const hasRequiredFields =
    holder.name.trim().length > 0 &&
    holder.gauge_length_mm > 0 &&
    holder.segments.length > 0 &&
    holder.segments.every(
      (s) => s.height > 0 && s.lower_diameter > 0 && s.upper_diameter > 0
    );

  // Calculate total gauge length from segments
  const calculatedGaugeLength = holder.segments.reduce(
    (sum, s) => sum + s.height,
    0
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Grip className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>Holder Preview</CardTitle>
              <CardDescription>
                Review and edit the extracted holder data
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {holder.confidence >= 0.8 ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-yellow-600" />
            )}
            <span className={`text-sm font-medium ${confidenceColor}`}>
              {Math.round(holder.confidence * 100)}% confidence
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Missing fields warning */}
        {holder.missing_fields && holder.missing_fields.length > 0 && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              <strong>Missing fields:</strong> {holder.missing_fields.join(", ")}
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
              Holder Name *
              {!holder.name.trim() && (
                <Badge variant="destructive" className="ml-2 text-xs">
                  Required
                </Badge>
              )}
            </Label>
            <Input
              id="name"
              value={holder.name}
              onChange={(e) => setHolder({ ...holder, name: e.target.value })}
              placeholder="e.g., ISO20 ER16 Collet Chuck"
              disabled={saving}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="taper_type">Taper Type *</Label>
            <Select
              value={holder.taper_type}
              onValueChange={(value) =>
                setHolder({ ...holder, taper_type: value as HolderTaperType })
              }
              disabled={saving}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TAPER_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="collet_type">Collet Type</Label>
            <Input
              id="collet_type"
              value={holder.collet_type || ""}
              onChange={(e) =>
                setHolder({ ...holder, collet_type: e.target.value })
              }
              placeholder="e.g., ER16, ER20, ER32"
              disabled={saving}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gauge_length">
              Gauge Length (mm) *
              {!holder.gauge_length_mm && (
                <Badge variant="destructive" className="ml-2 text-xs">
                  Required
                </Badge>
              )}
            </Label>
            <Input
              id="gauge_length"
              type="number"
              step="0.1"
              value={holder.gauge_length_mm || ""}
              onChange={(e) =>
                setHolder({
                  ...holder,
                  gauge_length_mm: parseFloat(e.target.value) || 0,
                })
              }
              disabled={saving}
            />
            {calculatedGaugeLength !== holder.gauge_length_mm && (
              <p className="text-xs text-muted-foreground">
                Segments total: {calculatedGaugeLength.toFixed(1)}mm
              </p>
            )}
          </div>
        </div>

        {/* Collet Capacity */}
        <div>
          <h3 className="font-semibold mb-3">Collet Capacity (mm)</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="collet_min">Minimum Shank Diameter</Label>
              <Input
                id="collet_min"
                type="number"
                step="0.1"
                value={holder.collet_min_mm || ""}
                onChange={(e) =>
                  setHolder({
                    ...holder,
                    collet_min_mm: parseFloat(e.target.value) || undefined,
                  })
                }
                placeholder="e.g., 1"
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="collet_max">Maximum Shank Diameter</Label>
              <Input
                id="collet_max"
                type="number"
                step="0.1"
                value={holder.collet_max_mm || ""}
                onChange={(e) =>
                  setHolder({
                    ...holder,
                    collet_max_mm: parseFloat(e.target.value) || undefined,
                  })
                }
                placeholder="e.g., 10"
                disabled={saving}
              />
            </div>
          </div>
        </div>

        {/* Segments */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">
              Holder Segments *{" "}
              <span className="font-normal text-sm text-muted-foreground">
                (from spindle face toward tool)
              </span>
            </h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addSegment}
              disabled={saving}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Segment
            </Button>
          </div>
          <div className="space-y-3">
            {holder.segments.map((segment, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
              >
                <span className="text-sm font-medium text-muted-foreground w-8">
                  #{index + 1}
                </span>
                <div className="flex-1 grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Height (mm)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={segment.height || ""}
                      onChange={(e) =>
                        updateSegment(
                          index,
                          "height",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      disabled={saving}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Lower Dia. (mm)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={segment.lower_diameter || ""}
                      onChange={(e) =>
                        updateSegment(
                          index,
                          "lower_diameter",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      disabled={saving}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Upper Dia. (mm)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={segment.upper_diameter || ""}
                      onChange={(e) =>
                        updateSegment(
                          index,
                          "upper_diameter",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      disabled={saving}
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeSegment(index)}
                  disabled={saving || holder.segments.length <= 1}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Vendor Info */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="vendor">Vendor</Label>
            <Input
              id="vendor"
              value={holder.vendor || ""}
              onChange={(e) => setHolder({ ...holder, vendor: e.target.value })}
              placeholder="e.g., Tormach"
              disabled={saving}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="product_id">Product ID / SKU</Label>
            <Input
              id="product_id"
              value={holder.product_id || ""}
              onChange={(e) =>
                setHolder({ ...holder, product_id: e.target.value })
              }
              placeholder="e.g., 50891"
              disabled={saving}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="product_url">Product Link</Label>
            <Input
              id="product_url"
              type="url"
              value={holder.product_url || ""}
              onChange={(e) =>
                setHolder({ ...holder, product_url: e.target.value })
              }
              placeholder="e.g., https://tormach.com/..."
              disabled={saving}
            />
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <textarea
            id="description"
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={holder.description || ""}
            onChange={(e) =>
              setHolder({ ...holder, description: e.target.value })
            }
            placeholder="Additional details about this holder..."
            disabled={saving}
          />
        </div>

        {/* Notes */}
        {holder.notes && (
          <div className="p-3 bg-gray-50 border rounded-md">
            <p className="text-sm text-gray-700">
              <strong>Extraction notes:</strong> {holder.notes}
            </p>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button
          onClick={() => onSave(holder)}
          disabled={saving || !hasRequiredFields}
        >
          {saving ? "Saving..." : "Save Holder"}
        </Button>
      </CardFooter>
    </Card>
  );
}
