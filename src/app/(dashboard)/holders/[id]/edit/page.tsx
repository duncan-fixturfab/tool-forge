"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { HolderPreview } from "@/components/holders/holder-preview";
import { ExtractedToolHolder } from "@/lib/agents/holder-schemas";
import { createClient } from "@/lib/supabase/client";
import { ToolHolder } from "@/types/database";
import { Loader2 } from "lucide-react";

export default function EditHolderPage() {
  const router = useRouter();
  const params = useParams();
  const holderId = params.id as string;
  const [holder, setHolder] = useState<ToolHolder | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchHolder() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("tool_holders")
        .select("*")
        .eq("id", holderId)
        .single();

      if (error) {
        setError("Failed to load holder");
        setLoading(false);
        return;
      }

      // Check ownership
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (data.user_id !== user?.id) {
        setError("You don't have permission to edit this holder");
        setLoading(false);
        return;
      }

      setHolder(data);
      setLoading(false);
    }

    fetchHolder();
  }, [holderId]);

  const handleSave = async (updatedHolder: ExtractedToolHolder) => {
    setSaving(true);

    try {
      const supabase = createClient();

      const { error } = await supabase
        .from("tool_holders")
        .update({
          name: updatedHolder.name,
          description: updatedHolder.description,
          taper_type: updatedHolder.taper_type,
          collet_type: updatedHolder.collet_type,
          collet_min_mm: updatedHolder.collet_min_mm,
          collet_max_mm: updatedHolder.collet_max_mm,
          gauge_length_mm: updatedHolder.gauge_length_mm,
          segments: updatedHolder.segments,
          vendor: updatedHolder.vendor,
          product_id: updatedHolder.product_id,
          product_url: updatedHolder.product_url,
        })
        .eq("id", holderId);

      if (error) throw error;

      router.push(`/holders/${holderId}`);
    } catch (err) {
      console.error("Error updating holder:", err);
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.push(`/holders/${holderId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !holder) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600">{error || "Holder not found"}</p>
        </div>
      </div>
    );
  }

  // Convert ToolHolder to ExtractedToolHolder format for the preview component
  const holderForPreview: ExtractedToolHolder = {
    name: holder.name,
    description: holder.description,
    taper_type: holder.taper_type,
    collet_type: holder.collet_type,
    collet_min_mm: holder.collet_min_mm,
    collet_max_mm: holder.collet_max_mm,
    gauge_length_mm: holder.gauge_length_mm,
    segments: holder.segments,
    vendor: holder.vendor,
    product_id: holder.product_id,
    product_url: holder.product_url,
    confidence: holder.extraction_confidence || 1,
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Tool Holder</h1>
        <p className="text-muted-foreground mt-2">
          Update holder geometry and specifications
        </p>
      </div>

      <HolderPreview
        holder={holderForPreview}
        onSave={handleSave}
        onCancel={handleCancel}
        saving={saving}
      />
    </div>
  );
}
