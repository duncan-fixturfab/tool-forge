"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";
import { MachineHolderManager } from "@/components/machines/machine-holder-manager";

interface MachineFormData {
  name: string;
  manufacturer: string;
  model: string;
  description: string;
  max_rpm: number;
  min_rpm: number;
  spindle_power_kw: number | null;
  travel_x_mm: number | null;
  travel_y_mm: number | null;
  travel_z_mm: number | null;
  max_feed_xy_mm_min: number | null;
  max_feed_z_mm_min: number | null;
  tool_holder_type: string;
  max_tool_diameter_mm: number | null;
}

export default function EditMachinePage() {
  const router = useRouter();
  const params = useParams();
  const machineId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<MachineFormData | null>(null);

  useEffect(() => {
    async function fetchMachine() {
      const supabase = createClient();

      // Check if user owns this machine
      const { data: { user } } = await supabase.auth.getUser();

      const { data: machine, error } = await supabase
        .from("machines")
        .select("*")
        .eq("id", machineId)
        .single();

      if (error || !machine) {
        setError("Machine not found");
        setLoading(false);
        return;
      }

      // Check ownership
      if (machine.created_by !== user?.id) {
        setError("You don't have permission to edit this machine");
        setLoading(false);
        return;
      }

      setFormData({
        name: machine.name,
        manufacturer: machine.manufacturer,
        model: machine.model,
        description: machine.description || "",
        max_rpm: machine.max_rpm,
        min_rpm: machine.min_rpm,
        spindle_power_kw: machine.spindle_power_kw || null,
        travel_x_mm: machine.travel_x_mm || null,
        travel_y_mm: machine.travel_y_mm || null,
        travel_z_mm: machine.travel_z_mm || null,
        max_feed_xy_mm_min: machine.max_feed_xy_mm_min || null,
        max_feed_z_mm_min: machine.max_feed_z_mm_min || null,
        tool_holder_type: machine.tool_holder_type || "",
        max_tool_diameter_mm: machine.max_tool_diameter_mm || null,
      });
      setLoading(false);
    }

    fetchMachine();
  }, [machineId]);

  const handleSave = async () => {
    if (!formData || !machineId) return;

    setSaving(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("machines")
        .update({
          name: formData.name,
          manufacturer: formData.manufacturer,
          model: formData.model,
          description: formData.description || null,
          max_rpm: formData.max_rpm,
          min_rpm: formData.min_rpm,
          spindle_power_kw: formData.spindle_power_kw,
          travel_x_mm: formData.travel_x_mm,
          travel_y_mm: formData.travel_y_mm,
          travel_z_mm: formData.travel_z_mm,
          max_feed_xy_mm_min: formData.max_feed_xy_mm_min,
          max_feed_z_mm_min: formData.max_feed_z_mm_min,
          tool_holder_type: formData.tool_holder_type || null,
          max_tool_diameter_mm: formData.max_tool_diameter_mm,
        })
        .eq("id", machineId);

      if (error) throw error;

      router.push(`/machines/${machineId}`);
    } catch (err) {
      console.error("Error saving machine:", err);
      setError("Failed to save machine");
      setSaving(false);
    }
  };

  const updateNumberField = (
    field: keyof MachineFormData,
    value: string,
    isRequired = false
  ) => {
    if (!formData) return;
    const parsed = parseFloat(value);
    setFormData({
      ...formData,
      [field]: value === "" ? (isRequired ? 0 : null) : parsed,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error && !formData) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/machines">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Error</h1>
        </div>
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (!formData) return null;

  const hasRequiredFields =
    formData.manufacturer.trim() !== "" &&
    formData.model.trim() !== "" &&
    formData.max_rpm > 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/machines/${machineId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Edit Machine</h1>
          <p className="text-muted-foreground">
            {formData.manufacturer} {formData.model}
          </p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Machine Information</CardTitle>
          <CardDescription>Update the machine specifications below</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Basic Info */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="manufacturer">Manufacturer *</Label>
              <Input
                id="manufacturer"
                value={formData.manufacturer}
                onChange={(e) =>
                  setFormData({ ...formData, manufacturer: e.target.value })
                }
                placeholder="e.g., Haas, Tormach"
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="model">Model *</Label>
              <Input
                id="model"
                value={formData.model}
                onChange={(e) =>
                  setFormData({ ...formData, model: e.target.value })
                }
                placeholder="e.g., VF-2, 1100MX"
                disabled={saving}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="name">Display Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Optional custom name"
                disabled={saving}
              />
            </div>
          </div>

          {/* Spindle */}
          <div>
            <h3 className="font-semibold mb-3">Spindle Specifications</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="max_rpm">Max RPM *</Label>
                <Input
                  id="max_rpm"
                  type="number"
                  value={formData.max_rpm || ""}
                  onChange={(e) => updateNumberField("max_rpm", e.target.value, true)}
                  disabled={saving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="min_rpm">Min RPM</Label>
                <Input
                  id="min_rpm"
                  type="number"
                  value={formData.min_rpm || ""}
                  onChange={(e) => updateNumberField("min_rpm", e.target.value, true)}
                  disabled={saving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="spindle_power">Spindle Power (kW)</Label>
                <Input
                  id="spindle_power"
                  type="number"
                  step="0.1"
                  value={formData.spindle_power_kw ?? ""}
                  onChange={(e) => updateNumberField("spindle_power_kw", e.target.value)}
                  disabled={saving}
                />
              </div>
            </div>
          </div>

          {/* Work Envelope */}
          <div>
            <h3 className="font-semibold mb-3">Work Envelope (mm)</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="travel_x">X Travel</Label>
                <Input
                  id="travel_x"
                  type="number"
                  step="0.1"
                  value={formData.travel_x_mm ?? ""}
                  onChange={(e) => updateNumberField("travel_x_mm", e.target.value)}
                  disabled={saving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="travel_y">Y Travel</Label>
                <Input
                  id="travel_y"
                  type="number"
                  step="0.1"
                  value={formData.travel_y_mm ?? ""}
                  onChange={(e) => updateNumberField("travel_y_mm", e.target.value)}
                  disabled={saving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="travel_z">Z Travel</Label>
                <Input
                  id="travel_z"
                  type="number"
                  step="0.1"
                  value={formData.travel_z_mm ?? ""}
                  onChange={(e) => updateNumberField("travel_z_mm", e.target.value)}
                  disabled={saving}
                />
              </div>
            </div>
          </div>

          {/* Feed Rates */}
          <div>
            <h3 className="font-semibold mb-3">Feed Rates (mm/min)</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="max_feed_xy">Max XY Feed</Label>
                <Input
                  id="max_feed_xy"
                  type="number"
                  value={formData.max_feed_xy_mm_min ?? ""}
                  onChange={(e) => updateNumberField("max_feed_xy_mm_min", e.target.value)}
                  disabled={saving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_feed_z">Max Z Feed</Label>
                <Input
                  id="max_feed_z"
                  type="number"
                  value={formData.max_feed_z_mm_min ?? ""}
                  onChange={(e) => updateNumberField("max_feed_z_mm_min", e.target.value)}
                  disabled={saving}
                />
              </div>
            </div>
          </div>

          {/* Tool Holder */}
          <div>
            <h3 className="font-semibold mb-3">Tool Holder</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="tool_holder">Tool Holder Type</Label>
                <Input
                  id="tool_holder"
                  value={formData.tool_holder_type}
                  onChange={(e) =>
                    setFormData({ ...formData, tool_holder_type: e.target.value })
                  }
                  placeholder="e.g., CAT40, BT30, ER20"
                  disabled={saving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_tool_diameter">Max Tool Diameter (mm)</Label>
                <Input
                  id="max_tool_diameter"
                  type="number"
                  step="0.1"
                  value={formData.max_tool_diameter_mm ?? ""}
                  onChange={(e) => updateNumberField("max_tool_diameter_mm", e.target.value)}
                  disabled={saving}
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Additional notes about this machine..."
              rows={3}
              disabled={saving}
            />
          </div>
        </CardContent>

        <CardFooter className="flex justify-between">
          <Link href={`/machines/${machineId}`}>
            <Button variant="outline" disabled={saving}>
              Cancel
            </Button>
          </Link>
          <Button onClick={handleSave} disabled={saving || !hasRequiredFields}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </CardFooter>
      </Card>

      {/* Tool Holders Section */}
      <MachineHolderManager machineId={machineId} disabled={saving} />
    </div>
  );
}
