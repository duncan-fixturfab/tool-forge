"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { HolderInputPanel } from "@/components/holders/holder-input-panel";
import { HolderPreview } from "@/components/holders/holder-preview";
import { ExtractedToolHolder } from "@/lib/agents/holder-schemas";
import { createClient } from "@/lib/supabase/client";

export default function NewHolderPage() {
  const router = useRouter();
  const [extractedHolder, setExtractedHolder] = useState<ExtractedToolHolder | null>(null);
  const [sourceType, setSourceType] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleHolderExtracted = (holder: ExtractedToolHolder, source: string) => {
    setExtractedHolder(holder);
    setSourceType(source);
  };

  const handleSave = async (holder: ExtractedToolHolder) => {
    setSaving(true);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Not authenticated");
      }

      const { data, error } = await supabase
        .from("tool_holders")
        .insert({
          user_id: user.id,
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
          extraction_source: sourceType,
          extraction_confidence: holder.confidence,
          raw_extraction_data: holder,
        })
        .select()
        .single();

      if (error) throw error;

      router.push(`/holders/${data.id}`);
    } catch (error) {
      console.error("Error saving holder:", error);
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setExtractedHolder(null);
    setSourceType(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Add New Tool Holder</h1>
        <p className="text-muted-foreground mt-2">
          Extract tool holder geometry from vendor information
        </p>
      </div>

      {extractedHolder ? (
        <HolderPreview
          holder={extractedHolder}
          onSave={handleSave}
          onCancel={handleCancel}
          saving={saving}
        />
      ) : (
        <HolderInputPanel onHolderExtracted={handleHolderExtracted} />
      )}
    </div>
  );
}
