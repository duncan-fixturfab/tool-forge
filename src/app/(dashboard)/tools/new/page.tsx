"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ToolInputPanel } from "@/components/tools/tool-input-panel";
import { ToolPreview } from "@/components/tools/tool-preview";
import { ExtractedTool } from "@/lib/agents/schemas";
import { createClient } from "@/lib/supabase/client";

export default function NewToolPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const libraryId = searchParams.get("libraryId");

  const [extractedTool, setExtractedTool] = useState<ExtractedTool | null>(null);
  const [sourceType, setSourceType] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleToolExtracted = (tool: ExtractedTool, source: string) => {
    setExtractedTool(tool);
    setSourceType(source);
  };

  const handleSave = async (tool: ExtractedTool) => {
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
        .from("tools")
        .insert({
          user_id: user.id,
          name: tool.name,
          tool_type: tool.type,
          vendor: tool.vendor,
          product_id: tool.product_id,
          product_url: tool.product_url,
          geometry: tool.geometry,
          coating: tool.coating,
          substrate: tool.substrate,
          extraction_source: sourceType,
          extraction_confidence: tool.confidence,
          raw_extraction_data: tool,
        })
        .select()
        .single();

      if (error) throw error;

      // If we came from a library, add the tool to that library and go back
      if (libraryId) {
        // Get the next tool number for this library
        const { data: maxToolNumber } = await supabase
          .from("library_tools")
          .select("tool_number")
          .eq("library_id", libraryId)
          .order("tool_number", { ascending: false })
          .limit(1)
          .single();

        const nextToolNumber = (maxToolNumber?.tool_number || 0) + 1;

        // Add the tool to the library
        const { error: libraryError } = await supabase
          .from("library_tools")
          .insert({
            library_id: libraryId,
            tool_id: data.id,
            tool_number: nextToolNumber,
          });

        if (libraryError) {
          console.error("Error adding tool to library:", libraryError);
        }

        // Use timestamp to bust Next.js router cache and ensure fresh data
        router.push(`/libraries/${libraryId}?t=${Date.now()}`);
      } else {
        router.push(`/tools/${data.id}`);
      }
    } catch (error) {
      console.error("Error saving tool:", error);
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (extractedTool) {
      // Cancel preview, go back to extraction
      setExtractedTool(null);
      setSourceType(null);
    } else if (libraryId) {
      // Cancel extraction, go back to library
      router.push(`/libraries/${libraryId}`);
    } else {
      // No library context, go to dashboard
      router.push("/dashboard");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Add New Tool</h1>
        <p className="text-muted-foreground mt-2">
          Extract tool geometry from vendor information
        </p>
      </div>

      {extractedTool ? (
        <ToolPreview
          tool={extractedTool}
          onSave={handleSave}
          onCancel={handleCancel}
          saving={saving}
        />
      ) : (
        <ToolInputPanel onToolExtracted={handleToolExtracted} />
      )}
    </div>
  );
}
