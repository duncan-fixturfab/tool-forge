"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToolType, ToolGeometry } from "@/types/database";
import { ToolEditFormData } from "./tool-edit-tabs";

const TOOL_TYPE_LABELS: Record<ToolType, string> = {
  flat_endmill: "Flat end mill",
  ball_endmill: "Ball end mill",
  bull_endmill: "Bull end mill",
  drill: "Drill",
  spot_drill: "Spot drill",
  chamfer_mill: "Chamfer mill",
  face_mill: "Face mill",
  thread_mill: "Thread mill",
  reamer: "Reamer",
  tap: "Tap",
  engraving_tool: "Engraving tool",
};

const MATERIAL_OPTIONS = [
  { value: "hss", label: "HSS" },
  { value: "carbide", label: "Carbide" },
  { value: "cobalt", label: "Cobalt" },
  { value: "ceramic", label: "Ceramic" },
  { value: "diamond", label: "Diamond" },
];

interface CutterTabProps {
  tool_type: ToolType;
  unit: "mm" | "inch";
  clockwise_rotation: boolean;
  substrate: string;
  coating: string;
  geometry: ToolGeometry;
  onChange: (data: Partial<ToolEditFormData>) => void;
  disabled?: boolean;
}

// Helper to determine which fields to show based on tool type
function getToolTypeConfig(toolType: ToolType) {
  const isDrill = toolType === "drill" || toolType === "spot_drill";
  const isEndmill =
    toolType === "flat_endmill" ||
    toolType === "ball_endmill" ||
    toolType === "bull_endmill";
  const isChamfer = toolType === "chamfer_mill";
  const isBullEndmill = toolType === "bull_endmill";

  return {
    showPointAngle: isDrill || isChamfer,
    showHelixAngle: isEndmill,
    showCornerRadius: isBullEndmill,
    showTipLength: isChamfer,
  };
}

export function CutterTab({
  tool_type,
  unit,
  clockwise_rotation,
  substrate,
  coating,
  geometry,
  onChange,
  disabled = false,
}: CutterTabProps) {
  const config = getToolTypeConfig(tool_type);

  const updateGeometry = (field: keyof ToolGeometry, value: number | undefined) => {
    onChange({
      geometry: {
        ...geometry,
        [field]: value,
      },
    });
  };

  const unitLabel = unit === "mm" ? "mm" : "in";

  return (
    <div className="space-y-6">
      {/* Tool Settings */}
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="tool_type">Type</Label>
            <Select
              value={tool_type}
              onValueChange={(value) => onChange({ tool_type: value as ToolType })}
              disabled={disabled}
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
            <Label htmlFor="unit">Unit</Label>
            <Select
              value={unit}
              onValueChange={(value) => onChange({ unit: value as "mm" | "inch" })}
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mm">Millimeters</SelectItem>
                <SelectItem value="inch">Inches</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="clockwise_rotation"
            checked={clockwise_rotation}
            onCheckedChange={(checked) =>
              onChange({ clockwise_rotation: checked === true })
            }
            disabled={disabled}
          />
          <Label htmlFor="clockwise_rotation" className="cursor-pointer">
            Clockwise spindle rotation
          </Label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="number_of_flutes">Number of flutes</Label>
            <Input
              id="number_of_flutes"
              type="number"
              min={1}
              value={geometry.number_of_flutes || ""}
              onChange={(e) =>
                updateGeometry("number_of_flutes", parseInt(e.target.value) || undefined)
              }
              disabled={disabled}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="substrate">Material</Label>
            <Select
              value={substrate.toLowerCase()}
              onValueChange={(value) => onChange({ substrate: value })}
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select material" />
              </SelectTrigger>
              <SelectContent>
                {MATERIAL_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="coating">Coating</Label>
          <Input
            id="coating"
            value={coating}
            onChange={(e) => onChange({ coating: e.target.value })}
            placeholder="e.g., TiAlN, AlTiN, DLC, Uncoated"
            disabled={disabled}
          />
        </div>
      </div>

      {/* Geometry Section */}
      <div className="space-y-4">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
          Geometry
        </h3>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="diameter">Diameter</Label>
            <div className="relative">
              <Input
                id="diameter"
                type="number"
                step="0.001"
                value={geometry.diameter_mm || ""}
                onChange={(e) =>
                  updateGeometry("diameter_mm", parseFloat(e.target.value) || undefined)
                }
                disabled={disabled}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                {unitLabel}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="shank_diameter">Shaft diameter</Label>
            <div className="relative">
              <Input
                id="shank_diameter"
                type="number"
                step="0.001"
                value={geometry.shank_diameter_mm || ""}
                onChange={(e) =>
                  updateGeometry("shank_diameter_mm", parseFloat(e.target.value) || undefined)
                }
                disabled={disabled}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                {unitLabel}
              </span>
            </div>
          </div>

          {/* Conditional: Point/Tip angle for drills and chamfer mills */}
          {config.showPointAngle && (
            <div className="space-y-2">
              <Label htmlFor="point_angle">Tip angle</Label>
              <div className="relative">
                <Input
                  id="point_angle"
                  type="number"
                  step="0.1"
                  value={geometry.point_angle_deg || ""}
                  onChange={(e) =>
                    updateGeometry("point_angle_deg", parseFloat(e.target.value) || undefined)
                  }
                  disabled={disabled}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  degrees
                </span>
              </div>
            </div>
          )}

          {/* Conditional: Helix angle for endmills */}
          {config.showHelixAngle && (
            <div className="space-y-2">
              <Label htmlFor="helix_angle">Helix angle</Label>
              <div className="relative">
                <Input
                  id="helix_angle"
                  type="number"
                  step="0.1"
                  value={geometry.helix_angle_deg || ""}
                  onChange={(e) =>
                    updateGeometry("helix_angle_deg", parseFloat(e.target.value) || undefined)
                  }
                  disabled={disabled}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  degrees
                </span>
              </div>
            </div>
          )}

          {/* Conditional: Corner radius for bull endmills */}
          {config.showCornerRadius && (
            <div className="space-y-2">
              <Label htmlFor="corner_radius">Corner radius</Label>
              <div className="relative">
                <Input
                  id="corner_radius"
                  type="number"
                  step="0.001"
                  value={geometry.corner_radius_mm || ""}
                  onChange={(e) =>
                    updateGeometry("corner_radius_mm", parseFloat(e.target.value) || undefined)
                  }
                  disabled={disabled}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  {unitLabel}
                </span>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="overall_length">Overall length</Label>
            <div className="relative">
              <Input
                id="overall_length"
                type="number"
                step="0.001"
                value={geometry.overall_length_mm || ""}
                onChange={(e) =>
                  updateGeometry("overall_length_mm", parseFloat(e.target.value) || undefined)
                }
                disabled={disabled}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                {unitLabel}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="length_below_holder">Length below holder</Label>
            <div className="relative">
              <Input
                id="length_below_holder"
                type="number"
                step="0.001"
                value={geometry.length_below_holder_mm || ""}
                onChange={(e) =>
                  updateGeometry(
                    "length_below_holder_mm",
                    parseFloat(e.target.value) || undefined
                  )
                }
                disabled={disabled}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                {unitLabel}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="shoulder_length">Shoulder length</Label>
            <div className="relative">
              <Input
                id="shoulder_length"
                type="number"
                step="0.001"
                value={geometry.shoulder_length_mm || ""}
                onChange={(e) =>
                  updateGeometry("shoulder_length_mm", parseFloat(e.target.value) || undefined)
                }
                disabled={disabled}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                {unitLabel}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="flute_length">Flute length</Label>
            <div className="relative">
              <Input
                id="flute_length"
                type="number"
                step="0.001"
                value={geometry.flute_length_mm || ""}
                onChange={(e) =>
                  updateGeometry("flute_length_mm", parseFloat(e.target.value) || undefined)
                }
                disabled={disabled}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                {unitLabel}
              </span>
            </div>
          </div>

          {/* Conditional: Tip length for chamfer mills */}
          {config.showTipLength && (
            <div className="space-y-2">
              <Label htmlFor="tip_length">Tip length</Label>
              <div className="relative">
                <Input
                  id="tip_length"
                  type="number"
                  step="0.001"
                  value={geometry.tip_length_mm || ""}
                  onChange={(e) =>
                    updateGeometry("tip_length_mm", parseFloat(e.target.value) || undefined)
                  }
                  disabled={disabled}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  {unitLabel}
                </span>
              </div>
            </div>
          )}

          {/* Neck geometry (optional) */}
          <div className="space-y-2">
            <Label htmlFor="neck_diameter">Neck diameter</Label>
            <div className="relative">
              <Input
                id="neck_diameter"
                type="number"
                step="0.001"
                value={geometry.neck_diameter_mm || ""}
                onChange={(e) =>
                  updateGeometry("neck_diameter_mm", parseFloat(e.target.value) || undefined)
                }
                disabled={disabled}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                {unitLabel}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="neck_length">Neck length</Label>
            <div className="relative">
              <Input
                id="neck_length"
                type="number"
                step="0.001"
                value={geometry.neck_length_mm || ""}
                onChange={(e) =>
                  updateGeometry("neck_length_mm", parseFloat(e.target.value) || undefined)
                }
                disabled={disabled}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                {unitLabel}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tool Assembly Section */}
      <div className="space-y-4">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
          Tool Assembly
        </h3>

        <div className="space-y-2">
          <Label htmlFor="body_length">Gauge length</Label>
          <div className="relative">
            <Input
              id="body_length"
              type="number"
              step="0.001"
              value={geometry.body_length_mm || ""}
              onChange={(e) =>
                updateGeometry("body_length_mm", parseFloat(e.target.value) || undefined)
              }
              disabled={disabled}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              {unitLabel}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
