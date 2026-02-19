"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Loader2, List, Table2 } from "lucide-react";
import { PostProcessForm } from "./post-process-form";
import { HolderSelector } from "@/components/holders/holder-selector";
import { AddToolButton } from "./add-tool-button";
import { ToolType, PostProcessSettings, Tool } from "@/types/database";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const TOOL_TYPE_LABELS: Record<ToolType, string> = {
  flat_endmill: "Flat End Mill",
  ball_endmill: "Ball End Mill",
  bull_endmill: "Bull End Mill",
  drill: "Drill",
  spot_drill: "Spot Drill",
  chamfer_mill: "Chamfer Mill",
  face_mill: "Face Mill",
  thread_mill: "Thread Mill",
  reamer: "Reamer",
  tap: "Tap",
  engraving_tool: "Engraving Tool",
};

interface LibraryToolData {
  id: string;
  tool_number: number;
  tool_holder_id?: string | null;
  post_process?: PostProcessSettings;
  tools: {
    id: string;
    name: string;
    vendor?: string;
    tool_type: ToolType;
    geometry: { diameter_mm: number; number_of_flutes: number; shank_diameter_mm?: number };
  };
}

interface LibraryToolsListProps {
  libraryId: string;
  libraryTools: LibraryToolData[];
  machineId?: string;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

function LibraryToolRow({
  libraryTool,
  machineId,
  onRemove,
}: {
  libraryTool: LibraryToolData;
  machineId?: string;
  onRemove: () => void;
}) {
  const [toolNumber, setToolNumber] = useState(libraryTool.tool_number);
  const [holderId, setHolderId] = useState<string | undefined>(
    libraryTool.tool_holder_id || undefined
  );
  const [postProcess, setPostProcess] = useState<PostProcessSettings>(
    libraryTool.post_process || {}
  );
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [pendingUpdate, setPendingUpdate] = useState<{
    tool_number?: number;
    tool_holder_id?: string | null;
    post_process?: PostProcessSettings;
  } | null>(null);

  const handleDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      await fetch(`/api/library-tools/${libraryTool.id}`, {
        method: "DELETE",
      });
      onRemove();
    } catch (error) {
      console.error("Failed to delete library tool:", error);
      setDeleting(false);
    }
  };

  const debouncedUpdate = useDebounce(pendingUpdate, 500);
  const isFirstRender = useRef(true);

  // Handle debounced save
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (debouncedUpdate === null) return;

    const saveChanges = async () => {
      setSaving(true);
      try {
        await fetch(`/api/library-tools/${libraryTool.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(debouncedUpdate),
        });
      } catch (error) {
        console.error("Failed to save library tool:", error);
      } finally {
        setSaving(false);
        setPendingUpdate(null);
      }
    };

    saveChanges();
  }, [debouncedUpdate, libraryTool.id]);

  const handleToolNumberChange = useCallback((value: number) => {
    setToolNumber(value);
    setPendingUpdate((prev) => ({
      ...prev,
      tool_number: value,
    }));
  }, []);

  const handlePostProcessChange = useCallback(
    (settings: PostProcessSettings) => {
      setPostProcess(settings);
      setPendingUpdate((prev) => ({
        ...prev,
        post_process: settings,
      }));
    },
    []
  );

  const handleHolderChange = useCallback((newHolderId: string | undefined) => {
    setHolderId(newHolderId);
    setPendingUpdate((prev) => ({
      ...prev,
      tool_holder_id: newHolderId ?? null,
    }));
  }, []);

  const tool = libraryTool.tools;

  return (
    <div className="p-4 border rounded-lg space-y-4">
      {/* Tool Info Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-sm font-mono text-muted-foreground w-12">
            T{toolNumber}
          </span>
          <div>
            <Link
              href={`/tools/${tool.id}`}
              className="font-medium hover:underline"
            >
              {tool.name}
            </Link>
            <p className="text-sm text-muted-foreground">
              {tool.vendor || "Unknown"} - Ø{tool.geometry.diameter_mm}mm -{" "}
              {tool.geometry.number_of_flutes} flute
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {saving && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
          <Badge variant="outline">{TOOL_TYPE_LABELS[tool.tool_type]}</Badge>
          <Button
            variant="ghost"
            size="icon"
            className="text-red-500 hover:text-red-600 hover:bg-red-50"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Holder Selection */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground w-16">Holder:</span>
        <HolderSelector
          tool={tool as Tool}
          machineId={machineId}
          value={holderId}
          onChange={handleHolderChange}
          disabled={saving}
        />
      </div>

      {/* Post-Process Settings */}
      <PostProcessForm
        toolNumber={toolNumber}
        postProcess={postProcess}
        onToolNumberChange={handleToolNumberChange}
        onPostProcessChange={handlePostProcessChange}
        disabled={saving}
      />
    </div>
  );
}

function LibraryToolTableRow({
  libraryTool,
  showShankDiameter,
  onRemove,
}: {
  libraryTool: LibraryToolData;
  showShankDiameter: boolean;
  onRemove: () => void;
}) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      await fetch(`/api/library-tools/${libraryTool.id}`, {
        method: "DELETE",
      });
      onRemove();
    } catch (error) {
      console.error("Failed to delete library tool:", error);
      setDeleting(false);
    }
  };

  const tool = libraryTool.tools;

  return (
    <TableRow>
      <TableCell className="font-mono text-muted-foreground">
        T{libraryTool.tool_number}
      </TableCell>
      <TableCell>
        <Link href={`/tools/${tool.id}`} className="font-medium hover:underline">
          {tool.name}
        </Link>
      </TableCell>
      <TableCell>
        <Badge variant="outline">{TOOL_TYPE_LABELS[tool.tool_type]}</Badge>
      </TableCell>
      <TableCell className="text-muted-foreground">
        {tool.vendor || "—"}
      </TableCell>
      <TableCell className="text-right">
        Ø{tool.geometry.diameter_mm}mm
      </TableCell>
      <TableCell className="text-right">
        {tool.geometry.number_of_flutes}
      </TableCell>
      {showShankDiameter && (
        <TableCell className="text-right">
          {tool.geometry.shank_diameter_mm != null
            ? `Ø${tool.geometry.shank_diameter_mm}mm`
            : "—"}
        </TableCell>
      )}
      <TableCell className="text-right">
        <Button
          variant="ghost"
          size="icon"
          className="text-red-500 hover:text-red-600 hover:bg-red-50"
          onClick={handleDelete}
          disabled={deleting}
        >
          {deleting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
        </Button>
      </TableCell>
    </TableRow>
  );
}

export function LibraryToolsList({
  libraryId,
  libraryTools: initialLibraryTools,
  machineId,
}: LibraryToolsListProps) {
  const [libraryTools, setLibraryTools] = useState(initialLibraryTools);
  const [view, setView] = useState<"list" | "table">("list");

  // Sync local state when props change (e.g., after router.refresh())
  useEffect(() => {
    setLibraryTools(initialLibraryTools);
  }, [initialLibraryTools]);

  const handleRemove = useCallback((id: string) => {
    setLibraryTools((prev) => prev.filter((lt) => lt.id !== id));
  }, []);

  if (libraryTools.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No tools in this library</p>
        <AddToolButton libraryId={libraryId} variant="link" showIcon={false} />
      </div>
    );
  }

  // Check if any tool has a shank diameter to conditionally show that column
  const hasShankDiameter = libraryTools.some(
    (lt) => lt.tools.geometry.shank_diameter_mm != null
  );

  return (
    <div className="space-y-3">
      {/* View Toggle */}
      <div className="flex justify-end gap-1">
        <Button
          variant={view === "list" ? "secondary" : "ghost"}
          size="icon"
          onClick={() => setView("list")}
          aria-label="List view"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          variant={view === "table" ? "secondary" : "ghost"}
          size="icon"
          onClick={() => setView("table")}
          aria-label="Table view"
        >
          <Table2 className="h-4 w-4" />
        </Button>
      </div>

      {view === "list" ? (
        <div className="space-y-3">
          {libraryTools.map((libraryTool) => (
            <LibraryToolRow
              key={libraryTool.id}
              libraryTool={libraryTool}
              machineId={machineId}
              onRemove={() => handleRemove(libraryTool.id)}
            />
          ))}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">#</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead className="text-right">Diameter</TableHead>
              <TableHead className="text-right">Flutes</TableHead>
              {hasShankDiameter && (
                <TableHead className="text-right">Shank</TableHead>
              )}
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {libraryTools.map((libraryTool) => (
              <LibraryToolTableRow
                key={libraryTool.id}
                libraryTool={libraryTool}
                showShankDiameter={hasShankDiameter}
                onRemove={() => handleRemove(libraryTool.id)}
              />
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
