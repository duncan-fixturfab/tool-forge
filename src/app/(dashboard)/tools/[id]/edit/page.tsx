"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
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
import { ArrowLeft, Loader2 } from "lucide-react";
import { ToolType, ToolGeometry, ShaftSegment, PostProcessSettings } from "@/types/database";
import { ToolEditTabs, ToolEditFormData } from "@/components/tools/edit";

export default function EditToolPage() {
  const router = useRouter();
  const params = useParams();
  const toolId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<ToolEditFormData | null>(null);

  useEffect(() => {
    async function fetchTool() {
      const supabase = createClient();
      const { data: tool, error } = await supabase
        .from("tools")
        .select("*")
        .eq("id", toolId)
        .single();

      if (error || !tool) {
        setError("Tool not found");
        setLoading(false);
        return;
      }

      setFormData({
        // General tab
        name: tool.name,
        description: tool.description || "",
        vendor: tool.vendor || "",
        product_id: tool.product_id || "",
        product_url: tool.product_url || "",
        notes: tool.notes || "",
        // Cutter tab
        tool_type: tool.tool_type as ToolType,
        unit: (tool.unit as "mm" | "inch") || "mm",
        clockwise_rotation: tool.clockwise_rotation ?? true,
        substrate: tool.substrate || "",
        coating: tool.coating || "",
        geometry: tool.geometry as ToolGeometry,
        // Shaft tab
        shaft_segments: (tool.shaft_segments as ShaftSegment[]) || [],
        // Post processor tab
        post_process: (tool.post_process as PostProcessSettings) || {},
      });
      setLoading(false);
    }

    fetchTool();
  }, [toolId]);

  const updateFormData = (updates: Partial<ToolEditFormData>) => {
    if (!formData) return;
    setFormData({ ...formData, ...updates });
  };

  const handleSave = async () => {
    if (!formData || !toolId) return;

    setSaving(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("tools")
        .update({
          name: formData.name,
          description: formData.description || null,
          tool_type: formData.tool_type,
          vendor: formData.vendor || null,
          product_id: formData.product_id || null,
          product_url: formData.product_url || null,
          coating: formData.coating || null,
          substrate: formData.substrate || null,
          notes: formData.notes || null,
          unit: formData.unit,
          clockwise_rotation: formData.clockwise_rotation,
          geometry: formData.geometry,
          shaft_segments: formData.shaft_segments.length > 0 ? formData.shaft_segments : null,
          post_process: Object.keys(formData.post_process).length > 0 ? formData.post_process : null,
        })
        .eq("id", toolId);

      if (error) throw error;

      router.push(`/tools/${toolId}`);
    } catch (err) {
      console.error("Error saving tool:", err);
      setError("Failed to save tool");
      setSaving(false);
    }
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
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Tool Not Found</h1>
        </div>
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (!formData) return null;

  const hasRequiredFields =
    formData.geometry.diameter_mm > 0 &&
    formData.geometry.number_of_flutes > 0 &&
    formData.geometry.overall_length_mm > 0 &&
    formData.geometry.flute_length_mm > 0 &&
    formData.name.trim() !== "";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/tools/${toolId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label htmlFor="tool_name" className="sr-only">
                Tool Name
              </Label>
              <Input
                id="tool_name"
                value={formData.name}
                onChange={(e) => updateFormData({ name: e.target.value })}
                className="text-xl font-bold h-auto py-1 px-2 border-transparent hover:border-input focus:border-input"
                disabled={saving}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Edit Tool</CardTitle>
          <CardDescription>Update the tool specifications below</CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <ToolEditTabs
            formData={formData}
            onChange={updateFormData}
            disabled={saving}
          />
        </CardContent>

        <CardFooter className="flex justify-between">
          <Link href={`/tools/${toolId}`}>
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
    </div>
  );
}
