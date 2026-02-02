"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { PostProcessSettings } from "@/types/database";

interface PostProcessorTabProps {
  settings: PostProcessSettings;
  onChange: (settings: PostProcessSettings) => void;
  disabled?: boolean;
}

export function PostProcessorTab({
  settings,
  onChange,
  disabled = false,
}: PostProcessorTabProps) {
  const updateField = <K extends keyof PostProcessSettings>(
    field: K,
    value: PostProcessSettings[K]
  ) => {
    onChange({ ...settings, [field]: value });
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="tool_number">Number</Label>
          <Input
            id="tool_number"
            type="number"
            min={1}
            value={settings.turret ?? 1}
            onChange={(e) => updateField("turret", parseInt(e.target.value) || 1)}
            disabled={disabled}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="length_offset">Length offset</Label>
          <Input
            id="length_offset"
            type="number"
            value={settings.length_offset ?? ""}
            onChange={(e) =>
              updateField("length_offset", parseFloat(e.target.value) || undefined)
            }
            disabled={disabled}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="diameter_offset">Diameter offset</Label>
          <Input
            id="diameter_offset"
            type="number"
            value={settings.diameter_offset ?? ""}
            onChange={(e) =>
              updateField("diameter_offset", parseFloat(e.target.value) || undefined)
            }
            disabled={disabled}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="turret">Turret</Label>
          <Input
            id="turret"
            type="number"
            min={0}
            value={settings.turret ?? 0}
            onChange={(e) => updateField("turret", parseInt(e.target.value) || 0)}
            disabled={disabled}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="comment">Comment</Label>
        <Input
          id="comment"
          value={settings.comment ?? ""}
          onChange={(e) => updateField("comment", e.target.value || undefined)}
          placeholder="Optional comment for post-processor output"
          disabled={disabled}
        />
      </div>

      <div className="space-y-3 pt-2">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="manual_tool_change"
            checked={settings.manual_tool_change ?? false}
            onCheckedChange={(checked) =>
              updateField("manual_tool_change", checked === true)
            }
            disabled={disabled}
          />
          <Label htmlFor="manual_tool_change" className="cursor-pointer">
            Manual tool change
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="live_tool"
            checked={settings.live ?? false}
            onCheckedChange={(checked) => updateField("live", checked === true)}
            disabled={disabled}
          />
          <Label htmlFor="live_tool" className="cursor-pointer">
            Live tool
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="break_control"
            checked={settings.break_control ?? false}
            onCheckedChange={(checked) => updateField("break_control", checked === true)}
            disabled={disabled}
          />
          <Label htmlFor="break_control" className="cursor-pointer">
            Break control
          </Label>
        </div>
      </div>
    </div>
  );
}
