"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Tool, Machine, Material, ToolHolder } from "@/types/database";
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
import { MachineSelector } from "@/components/machines/machine-selector";
import { MachineCard } from "@/components/machines/machine-card";
import { MaterialSelector } from "@/components/materials/material-selector";
import { HolderSelector } from "@/components/holders/holder-selector";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Download,
  Loader2,
  Wrench,
  AlertCircle,
} from "lucide-react";

type WizardStep = "name" | "machine" | "tools" | "materials" | "review";

export function LibraryBuilder() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState<WizardStep>("name");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [libraryName, setLibraryName] = useState("");
  const [libraryDescription, setLibraryDescription] = useState("");
  const [selectedMachineId, setSelectedMachineId] = useState<string | undefined>();
  const [selectedMachine, setSelectedMachine] = useState<Machine | undefined>();
  const [selectedToolIds, setSelectedToolIds] = useState<string[]>([]);
  const [selectedMaterialIds, setSelectedMaterialIds] = useState<string[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<Material[]>([]);

  // Tool holder assignments: tool_id -> holder_id
  const [toolHolderAssignments, setToolHolderAssignments] = useState<Record<string, string>>({});
  const [machineHolders, setMachineHolders] = useState<ToolHolder[]>([]);

  // Data from DB
  const [userTools, setUserTools] = useState<Tool[]>([]);

  // Fetch user's tools
  useEffect(() => {
    async function fetchTools() {
      setLoading(true);
      const { data } = await supabase
        .from("tools")
        .select("*")
        .order("created_at", { ascending: false });

      if (data) {
        setUserTools(data);
      }
      setLoading(false);
    }

    fetchTools();
  }, [supabase]);

  // Fetch machine holders when machine is selected
  useEffect(() => {
    async function fetchMachineHolders() {
      if (!selectedMachineId) {
        setMachineHolders([]);
        return;
      }

      try {
        const response = await fetch(`/api/machines/${selectedMachineId}/holders`);
        const data = await response.json();
        if (response.ok && data.holders) {
          setMachineHolders(data.holders);
        }
      } catch (error) {
        console.error("Error fetching machine holders:", error);
        setMachineHolders([]);
      }
    }

    fetchMachineHolders();
  }, [selectedMachineId]);

  const steps: WizardStep[] = ["name", "machine", "tools", "materials", "review"];
  const currentStepIndex = steps.indexOf(step);

  const canProceed = () => {
    switch (step) {
      case "name":
        return libraryName.trim().length > 0;
      case "machine":
        return selectedMachineId !== undefined;
      case "tools":
        return selectedToolIds.length > 0;
      case "materials":
        return selectedMaterialIds.length > 0;
      default:
        return true;
    }
  };

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setStep(steps[nextIndex]);
    }
  };

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setStep(steps[prevIndex]);
    }
  };

  const handleSaveAndExport = async () => {
    setSaving(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Not authenticated");

      // Create the library
      const { data: library, error: libraryError } = await supabase
        .from("tool_libraries")
        .insert({
          user_id: user.id,
          name: libraryName,
          description: libraryDescription,
          machine_id: selectedMachineId,
          status: "complete",
        })
        .select()
        .single();

      if (libraryError) throw libraryError;

      // Add tools to library with holder assignments
      const libraryTools = selectedToolIds.map((toolId, index) => ({
        library_id: library.id,
        tool_id: toolId,
        tool_number: index + 1,
        tool_holder_id: toolHolderAssignments[toolId] || null,
        cutting_data: {}, // Will be calculated on export
      }));

      const { error: toolsError } = await supabase
        .from("library_tools")
        .insert(libraryTools);

      if (toolsError) throw toolsError;

      // Redirect to download page
      router.push(
        `/libraries/${library.id}/download?materials=${selectedMaterialIds.join(",")}`
      );
    } catch (error) {
      console.error("Error creating library:", error);
      setSaving(false);
    }
  };

  const selectedTools = userTools.filter((t) => selectedToolIds.includes(t.id));

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-between">
        {steps.map((s, index) => (
          <div key={s} className="flex items-center">
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                index < currentStepIndex
                  ? "bg-primary border-primary text-primary-foreground"
                  : index === currentStepIndex
                    ? "border-primary text-primary"
                    : "border-gray-300 text-gray-400"
              }`}
            >
              {index < currentStepIndex ? (
                <Check className="h-4 w-4" />
              ) : (
                <span className="text-sm font-medium">{index + 1}</span>
              )}
            </div>
            {index < steps.length - 1 && (
              <div
                className={`w-12 h-0.5 mx-2 ${
                  index < currentStepIndex ? "bg-primary" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <Card>
        {/* Step 1: Library Name */}
        {step === "name" && (
          <>
            <CardHeader>
              <CardTitle>Name Your Library</CardTitle>
              <CardDescription>
                Give your tool library a descriptive name
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Library Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Aluminum Roughing Tools"
                  value={libraryName}
                  onChange={(e) => setLibraryName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Input
                  id="description"
                  placeholder="Tools optimized for roughing aluminum 6061"
                  value={libraryDescription}
                  onChange={(e) => setLibraryDescription(e.target.value)}
                />
              </div>
            </CardContent>
          </>
        )}

        {/* Step 2: Select Machine */}
        {step === "machine" && (
          <>
            <CardHeader>
              <CardTitle>Select Your Machine</CardTitle>
              <CardDescription>
                Choose the CNC machine this library is for. Feeds and speeds
                will be optimized for your machine&apos;s capabilities.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <MachineSelector
                value={selectedMachineId}
                onChange={(id, machine) => {
                  setSelectedMachineId(id);
                  setSelectedMachine(machine);
                }}
              />

              {selectedMachine && (
                <div className="mt-4">
                  <MachineCard machine={selectedMachine} />
                </div>
              )}
            </CardContent>
          </>
        )}

        {/* Step 3: Select Tools & Assign Holders */}
        {step === "tools" && (
          <>
            <CardHeader>
              <CardTitle>Select Tools & Assign Holders</CardTitle>
              <CardDescription>
                Choose tools and assign a holder for each. Compatible holders are highlighted.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : userTools.length === 0 ? (
                <div className="text-center py-8">
                  <Wrench className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No tools found</p>
                  <Button
                    variant="link"
                    onClick={() => router.push("/tools/new")}
                  >
                    Add your first tool
                  </Button>
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {userTools.map((tool) => {
                    const isSelected = selectedToolIds.includes(tool.id);
                    const hasHolder = !!toolHolderAssignments[tool.id];

                    return (
                      <div
                        key={tool.id}
                        className={`p-3 border rounded-lg transition-colors ${
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div
                            className="flex items-center space-x-3 cursor-pointer flex-1"
                            onClick={() => {
                              if (isSelected) {
                                setSelectedToolIds(
                                  selectedToolIds.filter((id) => id !== tool.id)
                                );
                                // Clear holder assignment when deselecting
                                const newAssignments = { ...toolHolderAssignments };
                                delete newAssignments[tool.id];
                                setToolHolderAssignments(newAssignments);
                              } else {
                                setSelectedToolIds([...selectedToolIds, tool.id]);
                              }
                            }}
                          >
                            <div
                              className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${
                                isSelected
                                  ? "border-primary bg-primary"
                                  : "border-gray-300"
                              }`}
                            >
                              {isSelected && (
                                <Check className="h-3 w-3 text-white" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium">{tool.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {tool.vendor || "Unknown vendor"} -{" "}
                                {tool.tool_type.replace(/_/g, " ")} - Ø
                                {tool.geometry.diameter_mm}mm
                                {tool.geometry.shank_diameter_mm && tool.geometry.shank_diameter_mm !== tool.geometry.diameter_mm && (
                                  <span> (shank: {tool.geometry.shank_diameter_mm}mm)</span>
                                )}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Badge variant="outline">
                              {tool.geometry.number_of_flutes} flute
                            </Badge>

                            {/* Holder selector - only show when tool is selected */}
                            {isSelected && (
                              <HolderSelector
                                tool={tool}
                                machineId={selectedMachineId}
                                availableHolders={machineHolders.length > 0 ? machineHolders : undefined}
                                value={toolHolderAssignments[tool.id]}
                                onChange={(holderId) => {
                                  if (holderId) {
                                    setToolHolderAssignments({
                                      ...toolHolderAssignments,
                                      [tool.id]: holderId,
                                    });
                                  } else {
                                    const newAssignments = { ...toolHolderAssignments };
                                    delete newAssignments[tool.id];
                                    setToolHolderAssignments(newAssignments);
                                  }
                                }}
                              />
                            )}
                          </div>
                        </div>

                        {/* Warning if selected but no holder */}
                        {isSelected && !hasHolder && (
                          <div className="flex items-center gap-1 mt-2 text-sm text-amber-600">
                            <AlertCircle className="h-3 w-3" />
                            No holder assigned
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {selectedToolIds.length > 0 && (
                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {selectedToolIds.length} tool
                    {selectedToolIds.length > 1 ? "s" : ""} selected
                  </span>
                  {Object.keys(toolHolderAssignments).length < selectedToolIds.length && (
                    <span className="text-amber-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {selectedToolIds.length - Object.keys(toolHolderAssignments).length} without holders
                    </span>
                  )}
                </div>
              )}
            </CardContent>
          </>
        )}

        {/* Step 4: Select Materials */}
        {step === "materials" && (
          <>
            <CardHeader>
              <CardTitle>Select Materials</CardTitle>
              <CardDescription>
                Choose the materials you&apos;ll be cutting. Cutting presets
                will be generated for each material.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <MaterialSelector
                value={selectedMaterialIds}
                onChange={(ids, materials) => {
                  setSelectedMaterialIds(ids);
                  setSelectedMaterials(materials);
                }}
              />
            </CardContent>
          </>
        )}

        {/* Step 5: Review */}
        {step === "review" && (
          <>
            <CardHeader>
              <CardTitle>Review & Export</CardTitle>
              <CardDescription>
                Review your library settings before exporting
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-muted-foreground">Library Name</Label>
                <p className="font-medium">{libraryName}</p>
                {libraryDescription && (
                  <p className="text-sm text-muted-foreground">
                    {libraryDescription}
                  </p>
                )}
              </div>

              <div>
                <Label className="text-muted-foreground">Machine</Label>
                <p className="font-medium">
                  {selectedMachine?.manufacturer} {selectedMachine?.model}
                </p>
                <p className="text-sm text-muted-foreground">
                  {selectedMachine?.max_rpm.toLocaleString()} RPM max
                </p>
              </div>

              <div>
                <Label className="text-muted-foreground">Tools ({selectedTools.length})</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {selectedTools.map((tool) => (
                    <Badge key={tool.id} variant="secondary">
                      {tool.name}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground">
                  Materials ({selectedMaterials.length})
                </Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {selectedMaterials.map((material) => (
                    <Badge key={material.id} variant="outline">
                      {material.name}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </>
        )}

        {/* Footer with navigation */}
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStepIndex === 0 || saving}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          {step === "review" ? (
            <Button onClick={handleSaveAndExport} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Create & Export
                </>
              )}
            </Button>
          ) : (
            <Button onClick={handleNext} disabled={!canProceed()}>
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
