"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, Settings2 } from "lucide-react";
import { PostProcessSettings } from "@/types/database";

interface PostProcessFormProps {
  toolNumber: number;
  postProcess?: PostProcessSettings;
  onToolNumberChange: (value: number) => void;
  onPostProcessChange: (settings: PostProcessSettings) => void;
  disabled?: boolean;
}

export function PostProcessForm({
  toolNumber,
  postProcess = {},
  onToolNumberChange,
  onPostProcessChange,
  disabled = false,
}: PostProcessFormProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Computed default values (match tool number if not set)
  const diameterOffset = postProcess.diameter_offset ?? toolNumber;
  const lengthOffset = postProcess.length_offset ?? toolNumber;

  const handleFieldChange = (
    field: keyof PostProcessSettings,
    value: boolean | string | number
  ) => {
    onPostProcessChange({
      ...postProcess,
      [field]: value,
    });
  };

  return (
    <div className="space-y-3">
      {/* Primary: Tool Number */}
      <div className="flex items-center gap-3">
        <Label htmlFor="tool-number" className="w-20 text-sm">
          Tool #
        </Label>
        <Input
          id="tool-number"
          type="number"
          min={1}
          value={toolNumber}
          onChange={(e) => onToolNumberChange(parseInt(e.target.value) || 1)}
          className="w-24"
          disabled={disabled}
        />
      </div>

      {/* Advanced Settings (Collapsible) */}
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground -ml-2"
          >
            {isOpen ? (
              <ChevronDown className="mr-2 h-4 w-4" />
            ) : (
              <ChevronRight className="mr-2 h-4 w-4" />
            )}
            <Settings2 className="mr-2 h-4 w-4" />
            Advanced Settings
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent className="mt-3 space-y-4 pl-4 border-l-2 border-muted">
          {/* Offsets */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="diameter-offset" className="text-sm">
                Diameter Offset
              </Label>
              <Input
                id="diameter-offset"
                type="number"
                value={diameterOffset}
                onChange={(e) =>
                  handleFieldChange(
                    "diameter_offset",
                    parseInt(e.target.value) || 0
                  )
                }
                disabled={disabled}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="length-offset" className="text-sm">
                Length Offset
              </Label>
              <Input
                id="length-offset"
                type="number"
                value={lengthOffset}
                onChange={(e) =>
                  handleFieldChange(
                    "length_offset",
                    parseInt(e.target.value) || 0
                  )
                }
                disabled={disabled}
              />
            </div>
          </div>

          {/* Turret */}
          <div className="space-y-2">
            <Label htmlFor="turret" className="text-sm">
              Turret
            </Label>
            <Input
              id="turret"
              type="number"
              min={0}
              value={postProcess.turret ?? 0}
              onChange={(e) =>
                handleFieldChange("turret", parseInt(e.target.value) || 0)
              }
              className="w-24"
              disabled={disabled}
            />
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <Label htmlFor="comment" className="text-sm">
              Comment
            </Label>
            <Input
              id="comment"
              type="text"
              placeholder="Optional tool comment"
              value={postProcess.comment ?? ""}
              onChange={(e) => handleFieldChange("comment", e.target.value)}
              disabled={disabled}
            />
          </div>

          {/* Boolean Options */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="live"
                checked={postProcess.live ?? false}
                onCheckedChange={(checked) =>
                  handleFieldChange("live", checked === true)
                }
                disabled={disabled}
              />
              <Label htmlFor="live" className="cursor-pointer text-sm">
                Live tooling (for lathes)
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="break-control"
                checked={postProcess.break_control ?? false}
                onCheckedChange={(checked) =>
                  handleFieldChange("break_control", checked === true)
                }
                disabled={disabled}
              />
              <Label htmlFor="break-control" className="cursor-pointer text-sm">
                Break control
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="manual-tool-change"
                checked={postProcess.manual_tool_change ?? false}
                onCheckedChange={(checked) =>
                  handleFieldChange("manual_tool_change", checked === true)
                }
                disabled={disabled}
              />
              <Label
                htmlFor="manual-tool-change"
                className="cursor-pointer text-sm"
              >
                Manual tool change
              </Label>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
