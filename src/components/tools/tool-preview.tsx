"use client";

import { useState, useEffect } from "react";
import { ExtractedTool, ToolType as ToolTypeEnum } from "@/lib/agents/schemas";
import { generateToolName } from "@/lib/utils";
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
import { AlertCircle, CheckCircle, Wrench } from "lucide-react";

const TOOL_TYPE_LABELS: Record<ToolTypeEnum, string> = {
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

interface ToolPreviewProps {
  tool: ExtractedTool;
  onSave: (tool: ExtractedTool) => void;
  onCancel: () => void;
  saving?: boolean;
}

// Apply default values based on tool type
function applyToolDefaults(tool: ExtractedTool): ExtractedTool {
  const isDrill = tool.type === "drill" || tool.type === "spot_drill";

  return {
    ...tool,
    name: generateToolName(tool.type, tool.geometry),
    geometry: {
      ...tool.geometry,
      // Default tip angle to 118° for drills if not already set
      point_angle_deg: isDrill && !tool.geometry.point_angle_deg
        ? 118
        : tool.geometry.point_angle_deg,
    },
  };
}

export function ToolPreview({
  tool: initialTool,
  onSave,
  onCancel,
  saving = false,
}: ToolPreviewProps) {
  const [tool, setTool] = useState<ExtractedTool>(() => applyToolDefaults(initialTool));

  useEffect(() => {
    setTool(applyToolDefaults(initialTool));
  }, [initialTool]);

  const updateGeometry = (field: string, value: number | undefined) => {
    setTool({
      ...tool,
      geometry: {
        ...tool.geometry,
        [field]: value,
      },
    });
  };

  const confidenceColor =
    tool.confidence >= 0.8
      ? "text-green-600"
      : tool.confidence >= 0.5
        ? "text-yellow-600"
        : "text-red-600";

  const hasRequiredFields =
    tool.geometry.diameter_mm > 0 &&
    tool.geometry.number_of_flutes > 0 &&
    tool.geometry.overall_length_mm > 0 &&
    tool.geometry.flute_length_mm > 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Wrench className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>Tool Preview</CardTitle>
              <CardDescription>
                Review and edit the extracted tool data
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {tool.confidence >= 0.8 ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-yellow-600" />
            )}
            <span className={`text-sm font-medium ${confidenceColor}`}>
              {Math.round(tool.confidence * 100)}% confidence
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Missing fields warning */}
        {tool.missing_fields && tool.missing_fields.length > 0 && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              <strong>Missing fields:</strong> {tool.missing_fields.join(", ")}
            </p>
            <p className="text-xs text-yellow-700 mt-1">
              Please fill in the missing values below.
            </p>
          </div>
        )}

        {/* Basic Info */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Tool Name</Label>
            <Input
              id="name"
              value={tool.name}
              onChange={(e) => setTool({ ...tool, name: e.target.value })}
              disabled={saving}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">Tool Type</Label>
            <Select
              value={tool.type}
              onValueChange={(value) => {
                const newType = value as ToolTypeEnum;
                const isDrill = newType === "drill" || newType === "spot_drill";
                setTool({
                  ...tool,
                  type: newType,
                  geometry: {
                    ...tool.geometry,
                    // Apply default tip angle when changing to drill type
                    point_angle_deg: isDrill && !tool.geometry.point_angle_deg
                      ? 118
                      : tool.geometry.point_angle_deg,
                  },
                });
              }}
              disabled={saving}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TOOL_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="vendor">Vendor</Label>
            <Input
              id="vendor"
              value={tool.vendor || ""}
              onChange={(e) => setTool({ ...tool, vendor: e.target.value })}
              placeholder="e.g., Harvey Tool"
              disabled={saving}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="product_id">Product ID / SKU</Label>
            <Input
              id="product_id"
              value={tool.product_id || ""}
              onChange={(e) => setTool({ ...tool, product_id: e.target.value })}
              placeholder="e.g., 46062-C3"
              disabled={saving}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="product_url">Product Link</Label>
            <Input
              id="product_url"
              type="url"
              value={tool.product_url || ""}
              onChange={(e) => setTool({ ...tool, product_url: e.target.value })}
              placeholder="e.g., https://amazon.com/..., https://mscdirect.com/..."
              disabled={saving}
            />
          </div>
        </div>

        {/* Geometry */}
        <div>
          <h3 className="font-semibold mb-3">Geometry (mm)</h3>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="diameter">
                Diameter *
                {!tool.geometry.diameter_mm && (
                  <Badge variant="destructive" className="ml-2 text-xs">
                    Required
                  </Badge>
                )}
              </Label>
              <Input
                id="diameter"
                type="number"
                step="0.01"
                value={tool.geometry.diameter_mm || ""}
                onChange={(e) =>
                  updateGeometry("diameter_mm", parseFloat(e.target.value) || 0)
                }
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="flutes">
                Flutes *
                {!tool.geometry.number_of_flutes && (
                  <Badge variant="destructive" className="ml-2 text-xs">
                    Required
                  </Badge>
                )}
              </Label>
              <Input
                id="flutes"
                type="number"
                value={tool.geometry.number_of_flutes || ""}
                onChange={(e) =>
                  updateGeometry("number_of_flutes", parseInt(e.target.value) || 0)
                }
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="oal">
                Overall Length *
                {!tool.geometry.overall_length_mm && (
                  <Badge variant="destructive" className="ml-2 text-xs">
                    Required
                  </Badge>
                )}
              </Label>
              <Input
                id="oal"
                type="number"
                step="0.01"
                value={tool.geometry.overall_length_mm || ""}
                onChange={(e) =>
                  updateGeometry(
                    "overall_length_mm",
                    parseFloat(e.target.value) || 0
                  )
                }
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="flute_length">
                Flute Length *
                {!tool.geometry.flute_length_mm && (
                  <Badge variant="destructive" className="ml-2 text-xs">
                    Required
                  </Badge>
                )}
              </Label>
              <Input
                id="flute_length"
                type="number"
                step="0.01"
                value={tool.geometry.flute_length_mm || ""}
                onChange={(e) =>
                  updateGeometry(
                    "flute_length_mm",
                    parseFloat(e.target.value) || 0
                  )
                }
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shank">Shank Diameter</Label>
              <Input
                id="shank"
                type="number"
                step="0.01"
                value={tool.geometry.shank_diameter_mm || ""}
                onChange={(e) =>
                  updateGeometry(
                    "shank_diameter_mm",
                    parseFloat(e.target.value) || undefined
                  )
                }
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="corner_radius">Corner Radius</Label>
              <Input
                id="corner_radius"
                type="number"
                step="0.01"
                value={tool.geometry.corner_radius_mm || ""}
                onChange={(e) =>
                  updateGeometry(
                    "corner_radius_mm",
                    parseFloat(e.target.value) || undefined
                  )
                }
                placeholder="For bull endmills"
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="point_angle">Point Angle (°)</Label>
              <Input
                id="point_angle"
                type="number"
                value={tool.geometry.point_angle_deg || ""}
                onChange={(e) =>
                  updateGeometry(
                    "point_angle_deg",
                    parseFloat(e.target.value) || undefined
                  )
                }
                placeholder="For drills"
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="helix">Helix Angle (°)</Label>
              <Input
                id="helix"
                type="number"
                value={tool.geometry.helix_angle_deg || ""}
                onChange={(e) =>
                  updateGeometry(
                    "helix_angle_deg",
                    parseFloat(e.target.value) || undefined
                  )
                }
                disabled={saving}
              />
            </div>
          </div>
        </div>

        {/* Coating & Material */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="coating">Coating</Label>
            <Input
              id="coating"
              value={tool.coating || ""}
              onChange={(e) => setTool({ ...tool, coating: e.target.value })}
              placeholder="e.g., TiAlN, AlTiN, DLC, Uncoated"
              disabled={saving}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="substrate">Substrate</Label>
            <Input
              id="substrate"
              value={tool.substrate || ""}
              onChange={(e) => setTool({ ...tool, substrate: e.target.value })}
              placeholder="e.g., Carbide, HSS, Cobalt"
              disabled={saving}
            />
          </div>
        </div>

        {/* Notes */}
        {tool.notes && (
          <div className="p-3 bg-gray-50 border rounded-md">
            <p className="text-sm text-gray-700">
              <strong>Extraction notes:</strong> {tool.notes}
            </p>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={() => onSave(tool)} disabled={saving || !hasRequiredFields}>
          {saving ? "Saving..." : "Save Tool"}
        </Button>
      </CardFooter>
    </Card>
  );
}
