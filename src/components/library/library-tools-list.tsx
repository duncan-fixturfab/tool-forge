"use client";

import { Fragment, useState, useCallback, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Loader2, List, Table2, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { PostProcessForm } from "./post-process-form";
import { HolderSelector } from "@/components/holders/holder-selector";
import { AddToolButton } from "./add-tool-button";
import { ToolType, PostProcessSettings, Tool } from "@/types/database";
import { TOOL_CATEGORIES, ToolCategory } from "@/lib/tool-categories";
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

function getCategoryForToolNumber(toolNumber: number): ToolCategory | null {
  for (const cat of Object.values(TOOL_CATEGORIES)) {
    if (toolNumber >= cat.min && toolNumber <= cat.max) return cat;
  }
  return null;
}

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

type SortColumn =
  | "tool_number"
  | "name"
  | "type"
  | "vendor"
  | "diameter"
  | "flutes"
  | "shank";
type SortDirection = "asc" | "desc";

function SortableTableHead({
  column,
  sortColumn,
  sortDirection,
  onSort,
  className,
  children,
}: {
  column: SortColumn;
  sortColumn: SortColumn | null;
  sortDirection: SortDirection;
  onSort: (column: SortColumn) => void;
  className?: string;
  children: React.ReactNode;
}) {
  const isActive = sortColumn === column;
  const Icon = isActive
    ? sortDirection === "asc"
      ? ArrowUp
      : ArrowDown
    : ArrowUpDown;

  return (
    <TableHead
      className={`cursor-pointer select-none hover:bg-muted/50 ${className ?? ""}`}
      onClick={() => onSort(column)}
    >
      <span className="inline-flex items-center gap-1">
        {children}
        <Icon
          className={`h-3 w-3 ${isActive ? "text-foreground" : "text-muted-foreground/50"}`}
        />
      </span>
    </TableHead>
  );
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
  const [sortColumn, setSortColumn] = useState<SortColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  // Sync local state when props change (e.g., after router.refresh())
  useEffect(() => {
    setLibraryTools(initialLibraryTools);
  }, [initialLibraryTools]);

  const handleRemove = useCallback((id: string) => {
    setLibraryTools((prev) => prev.filter((lt) => lt.id !== id));
  }, []);

  const handleSort = useCallback((column: SortColumn) => {
    setSortColumn((prev) => {
      if (prev === column) {
        setSortDirection((dir) => (dir === "asc" ? "desc" : "asc"));
        return column;
      }
      setSortDirection("asc");
      return column;
    });
  }, []);

  const sortedTools = useMemo(() => {
    if (!sortColumn) return libraryTools;
    return [...libraryTools].sort((a, b) => {
      let aVal: string | number | null | undefined;
      let bVal: string | number | null | undefined;
      switch (sortColumn) {
        case "tool_number":
          aVal = a.tool_number;
          bVal = b.tool_number;
          break;
        case "name":
          aVal = a.tools.name;
          bVal = b.tools.name;
          break;
        case "type":
          aVal = TOOL_TYPE_LABELS[a.tools.tool_type];
          bVal = TOOL_TYPE_LABELS[b.tools.tool_type];
          break;
        case "vendor":
          aVal = a.tools.vendor ?? "";
          bVal = b.tools.vendor ?? "";
          break;
        case "diameter":
          aVal = a.tools.geometry.diameter_mm;
          bVal = b.tools.geometry.diameter_mm;
          break;
        case "flutes":
          aVal = a.tools.geometry.number_of_flutes;
          bVal = b.tools.geometry.number_of_flutes;
          break;
        case "shank":
          aVal = a.tools.geometry.shank_diameter_mm ?? -1;
          bVal = b.tools.geometry.shank_diameter_mm ?? -1;
          break;
      }
      if (aVal == null) aVal = "";
      if (bVal == null) bVal = "";
      const cmp =
        typeof aVal === "number" && typeof bVal === "number"
          ? aVal - bVal
          : String(aVal).localeCompare(String(bVal));
      return sortDirection === "asc" ? cmp : -cmp;
    });
  }, [libraryTools, sortColumn, sortDirection]);

  // Group tools by category (sorted by tool_number ascending) for list view
  // and default table view (no active sort column)
  const categoryGroups = useMemo(() => {
    const sorted = [...libraryTools].sort((a, b) => a.tool_number - b.tool_number);
    const groups = new Map<string, { category: ToolCategory | null; tools: LibraryToolData[] }>();

    for (const tool of sorted) {
      const category = getCategoryForToolNumber(tool.tool_number);
      const key = category?.key ?? "__other__";
      if (!groups.has(key)) {
        groups.set(key, { category, tools: [] });
      }
      groups.get(key)!.tools.push(tool);
    }

    return [...groups.values()];
  }, [libraryTools]);

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
        <div className="space-y-6">
          {categoryGroups.map(({ category, tools: groupTools }) => (
            <div key={category?.key ?? "__other__"}>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-sm font-semibold text-foreground">
                  {category?.name ?? "Other"}
                </span>
                {category && (
                  <span className="text-xs font-mono text-muted-foreground">
                    T{category.min}–T{category.max}
                  </span>
                )}
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">
                  {groupTools.length} {groupTools.length === 1 ? "tool" : "tools"}
                </span>
              </div>
              <div className="space-y-3">
                {groupTools.map((libraryTool) => (
                  <LibraryToolRow
                    key={libraryTool.id}
                    libraryTool={libraryTool}
                    machineId={machineId}
                    onRemove={() => handleRemove(libraryTool.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <SortableTableHead
                column="tool_number"
                sortColumn={sortColumn}
                sortDirection={sortDirection}
                onSort={handleSort}
                className="w-16"
              >
                #
              </SortableTableHead>
              <SortableTableHead
                column="name"
                sortColumn={sortColumn}
                sortDirection={sortDirection}
                onSort={handleSort}
              >
                Name
              </SortableTableHead>
              <SortableTableHead
                column="type"
                sortColumn={sortColumn}
                sortDirection={sortDirection}
                onSort={handleSort}
              >
                Type
              </SortableTableHead>
              <SortableTableHead
                column="vendor"
                sortColumn={sortColumn}
                sortDirection={sortDirection}
                onSort={handleSort}
              >
                Vendor
              </SortableTableHead>
              <SortableTableHead
                column="diameter"
                sortColumn={sortColumn}
                sortDirection={sortDirection}
                onSort={handleSort}
                className="text-right"
              >
                Diameter
              </SortableTableHead>
              <SortableTableHead
                column="flutes"
                sortColumn={sortColumn}
                sortDirection={sortDirection}
                onSort={handleSort}
                className="text-right"
              >
                Flutes
              </SortableTableHead>
              {hasShankDiameter && (
                <SortableTableHead
                  column="shank"
                  sortColumn={sortColumn}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                  className="text-right"
                >
                  Shank
                </SortableTableHead>
              )}
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortColumn === null ? (
              categoryGroups.map(({ category, tools: groupTools }) => (
                <Fragment key={category?.key ?? "__other__"}>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableCell
                      colSpan={hasShankDiameter ? 8 : 7}
                      className="py-2 px-4"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                          {category?.name ?? "Other"}
                        </span>
                        {category && (
                          <span className="text-xs font-mono text-muted-foreground">
                            T{category.min}–T{category.max}
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground ml-auto">
                          {groupTools.length}{" "}
                          {groupTools.length === 1 ? "tool" : "tools"}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                  {groupTools.map((libraryTool) => (
                    <LibraryToolTableRow
                      key={libraryTool.id}
                      libraryTool={libraryTool}
                      showShankDiameter={hasShankDiameter}
                      onRemove={() => handleRemove(libraryTool.id)}
                    />
                  ))}
                </Fragment>
              ))
            ) : (
              sortedTools.map((libraryTool) => (
                <LibraryToolTableRow
                  key={libraryTool.id}
                  libraryTool={libraryTool}
                  showShankDiameter={hasShankDiameter}
                  onRemove={() => handleRemove(libraryTool.id)}
                />
              ))
            )}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
