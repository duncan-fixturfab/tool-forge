"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, AlertCircle, CheckCircle2, Plus } from "lucide-react";
import { ExtractedMachine } from "@/lib/agents/machine-schemas";
import { Machine } from "@/types/database";
import { MachineHolderManager } from "./machine-holder-manager";

type Step = "input" | "extracting" | "validate" | "success";
type SourceType = "url" | "text";

interface MachineCreatorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMachineCreated?: (machine: Machine) => void;
}

interface ValidationField {
  key: keyof ExtractedMachine;
  label: string;
  type: "text" | "number";
  required?: boolean;
  suffix?: string;
}

const VALIDATION_FIELDS: ValidationField[] = [
  { key: "manufacturer", label: "Manufacturer", type: "text", required: true },
  { key: "model", label: "Model", type: "text", required: true },
  { key: "max_rpm", label: "Max RPM", type: "number", required: true },
  { key: "min_rpm", label: "Min RPM", type: "number" },
  { key: "spindle_power_kw", label: "Spindle Power", type: "number", suffix: "kW" },
  { key: "travel_x_mm", label: "X Travel", type: "number", suffix: "mm" },
  { key: "travel_y_mm", label: "Y Travel", type: "number", suffix: "mm" },
  { key: "travel_z_mm", label: "Z Travel", type: "number", suffix: "mm" },
  { key: "max_feed_xy_mm_min", label: "Max XY Feed", type: "number", suffix: "mm/min" },
  { key: "max_feed_z_mm_min", label: "Max Z Feed", type: "number", suffix: "mm/min" },
  { key: "tool_holder_type", label: "Tool Holder", type: "text" },
];

export function MachineCreator({
  open,
  onOpenChange,
  onMachineCreated,
}: MachineCreatorProps) {
  const [step, setStep] = useState<Step>("input");
  const [sourceType, setSourceType] = useState<SourceType>("url");
  const [sourceInput, setSourceInput] = useState("");
  const [machineName, setMachineName] = useState("");
  const [extractedData, setExtractedData] = useState<ExtractedMachine | null>(null);
  const [editedData, setEditedData] = useState<Partial<ExtractedMachine>>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [createdMachine, setCreatedMachine] = useState<Machine | null>(null);
  const [showHolderManager, setShowHolderManager] = useState(false);

  const resetForm = () => {
    setStep("input");
    setSourceType("url");
    setSourceInput("");
    setMachineName("");
    setExtractedData(null);
    setEditedData({});
    setError(null);
    setSaving(false);
    setCreatedMachine(null);
    setShowHolderManager(false);
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(resetForm, 200);
  };

  const handleExtract = async () => {
    setStep("extracting");
    setError(null);

    try {
      const endpoint =
        sourceType === "url" ? "/api/machines/parse/url" : "/api/machines/parse/text";

      const body =
        sourceType === "url"
          ? { url: sourceInput, machine_name: machineName || undefined }
          : { text: sourceInput, machine_name: machineName || undefined };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to parse machine");
      }

      if (!result.success || !result.machine) {
        throw new Error(result.error || "Failed to extract machine data");
      }

      setExtractedData(result.machine);
      setEditedData(result.machine);
      setStep("validate");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setStep("input");
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      const machineData = {
        name: editedData.name || `${editedData.manufacturer} ${editedData.model}`,
        manufacturer: editedData.manufacturer,
        model: editedData.model,
        description: editedData.description,
        max_rpm: editedData.max_rpm,
        min_rpm: editedData.min_rpm || 0,
        spindle_power_kw: editedData.spindle_power_kw,
        travel_x_mm: editedData.travel_x_mm,
        travel_y_mm: editedData.travel_y_mm,
        travel_z_mm: editedData.travel_z_mm,
        max_feed_xy_mm_min: editedData.max_feed_xy_mm_min,
        max_feed_z_mm_min: editedData.max_feed_z_mm_min,
        tool_holder_type: editedData.tool_holder_type,
        max_tool_diameter_mm: editedData.max_tool_diameter_mm,
        is_public: true,
      };

      const response = await fetch("/api/machines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(machineData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to save machine");
      }

      setCreatedMachine(result.machine);
      setStep("success");

      if (onMachineCreated) {
        onMachineCreated(result.machine);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save machine");
    } finally {
      setSaving(false);
    }
  };

  const updateField = (key: keyof ExtractedMachine, value: string | number | undefined) => {
    setEditedData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        {step === "input" && (
          <>
            <DialogHeader>
              <DialogTitle>Add New Machine</DialogTitle>
              <DialogDescription>
                Provide a URL or paste specifications, and we&apos;ll extract the
                machine parameters automatically.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="machineName">Machine Name (optional)</Label>
                <Input
                  id="machineName"
                  placeholder="e.g., Haas VF-2"
                  value={machineName}
                  onChange={(e) => setMachineName(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Helps improve extraction accuracy
                </p>
              </div>

              <Tabs value={sourceType} onValueChange={(v) => setSourceType(v as SourceType)}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="url">URL</TabsTrigger>
                  <TabsTrigger value="text">Text/Specs</TabsTrigger>
                </TabsList>

                <TabsContent value="url" className="space-y-2">
                  <Label htmlFor="urlInput">Product Page URL</Label>
                  <Input
                    id="urlInput"
                    type="url"
                    placeholder="https://www.haascnc.com/machines/vf-2.html"
                    value={sourceInput}
                    onChange={(e) => setSourceInput(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Link to the manufacturer&apos;s product page or spec sheet
                  </p>
                </TabsContent>

                <TabsContent value="text" className="space-y-2">
                  <Label htmlFor="textInput">Machine Specifications</Label>
                  <textarea
                    id="textInput"
                    className="flex min-h-[150px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Paste machine specifications here...

Example:
Haas VF-2
Max Spindle Speed: 8,100 RPM
Spindle Power: 22.4 kW
Travels (X/Y/Z): 762 x 406 x 508 mm
Tool Holder: CAT40"
                    value={sourceInput}
                    onChange={(e) => setSourceInput(e.target.value)}
                  />
                </TabsContent>
              </Tabs>

              {error && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleExtract}
                disabled={!sourceInput.trim()}
              >
                Research Machine
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "extracting" && (
          <div className="py-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <DialogTitle className="mb-2">Researching Machine</DialogTitle>
            <DialogDescription>
              Extracting specifications from the provided source...
            </DialogDescription>
          </div>
        )}

        {step === "validate" && extractedData && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                Validate Extracted Parameters
                <Badge variant={extractedData.confidence >= 0.8 ? "default" : "secondary"}>
                  {Math.round(extractedData.confidence * 100)}% confidence
                </Badge>
              </DialogTitle>
              <DialogDescription>
                Review and edit the extracted data before saving.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Machine Name</Label>
                <Input
                  id="name"
                  value={editedData.name || ""}
                  onChange={(e) => updateField("name", e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {VALIDATION_FIELDS.map((field) => (
                  <div key={field.key} className="space-y-1">
                    <Label htmlFor={field.key} className="text-sm">
                      {field.label}
                      {field.required && <span className="text-destructive">*</span>}
                      {field.suffix && (
                        <span className="text-muted-foreground ml-1">({field.suffix})</span>
                      )}
                    </Label>
                    <Input
                      id={field.key}
                      type={field.type}
                      value={
                        editedData[field.key] !== undefined
                          ? String(editedData[field.key])
                          : ""
                      }
                      onChange={(e) => {
                        const value =
                          field.type === "number"
                            ? e.target.value
                              ? parseFloat(e.target.value)
                              : undefined
                            : e.target.value || undefined;
                        updateField(field.key, value);
                      }}
                      className="h-9"
                    />
                  </div>
                ))}
              </div>

              {extractedData.missing_fields && extractedData.missing_fields.length > 0 && (
                <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                  <span className="font-medium">Could not extract: </span>
                  {extractedData.missing_fields.join(", ")}
                </div>
              )}

              {extractedData.notes && (
                <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                  <span className="font-medium">Notes: </span>
                  {extractedData.notes}
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setStep("input")}>
                Back
              </Button>
              <Button
                onClick={handleSave}
                disabled={
                  saving ||
                  !editedData.manufacturer ||
                  !editedData.model ||
                  !editedData.max_rpm
                }
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Machine"
                )}
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "success" && createdMachine && (
          <>
            {!showHolderManager ? (
              <>
                <div className="py-8 text-center">
                  <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <DialogTitle className="mb-2">Machine Added</DialogTitle>
                  <DialogDescription>
                    <span className="font-medium text-foreground">
                      {createdMachine.manufacturer} {createdMachine.model}
                    </span>{" "}
                    has been added to the database and is now available for selection.
                  </DialogDescription>
                </div>
                <DialogFooter className="flex gap-2 sm:justify-between">
                  <Button
                    variant="outline"
                    onClick={() => setShowHolderManager(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Tool Holders
                  </Button>
                  <Button onClick={handleClose}>Done</Button>
                </DialogFooter>
              </>
            ) : (
              <>
                <DialogHeader>
                  <DialogTitle>Add Tool Holders</DialogTitle>
                  <DialogDescription>
                    Associate tool holders with {createdMachine.manufacturer}{" "}
                    {createdMachine.model}
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <MachineHolderManager machineId={createdMachine.id} />
                </div>
                <DialogFooter>
                  <Button onClick={handleClose}>Done</Button>
                </DialogFooter>
              </>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
