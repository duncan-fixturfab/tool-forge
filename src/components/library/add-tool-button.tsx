"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Wrench, Loader2, Check, ChevronDown } from "lucide-react";
import { Tool, ToolType } from "@/types/database";
import { toast } from "sonner";

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

interface AddToolButtonProps {
  libraryId: string;
  existingToolIds?: string[];
  onToolAdded?: () => void;
  variant?: "default" | "link";
  showIcon?: boolean;
}

export function AddToolButton({
  libraryId,
  existingToolIds = [],
  onToolAdded,
  variant = "default",
  showIcon = true,
}: AddToolButtonProps) {
  const router = useRouter();
  const supabase = createClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [tools, setTools] = useState<Tool[]>([]);

  // Fetch user's tools when dialog opens
  useEffect(() => {
    if (!dialogOpen) return;

    async function fetchTools() {
      setLoading(true);
      const { data } = await supabase
        .from("tools")
        .select("*")
        .order("created_at", { ascending: false });

      if (data) {
        setTools(data);
      }
      setLoading(false);
    }

    fetchTools();
  }, [dialogOpen, supabase]);

  const filteredTools = tools.filter((tool) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      tool.name.toLowerCase().includes(searchLower) ||
      tool.vendor?.toLowerCase().includes(searchLower) ||
      TOOL_TYPE_LABELS[tool.tool_type].toLowerCase().includes(searchLower)
    );
  });

  const availableTools = filteredTools.filter(
    (tool) => !existingToolIds.includes(tool.id)
  );

  const handleAddTool = async (toolId: string) => {
    setAdding(toolId);

    try {
      const response = await fetch(`/api/libraries/${libraryId}/tools`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool_id: toolId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to add tool");
      }

      toast.success("Tool added to library");
      setDialogOpen(false);
      onToolAdded?.();
      router.refresh();
    } catch (error) {
      console.error("Error adding tool:", error);
      toast.error(error instanceof Error ? error.message : "Failed to add tool");
    } finally {
      setAdding(null);
    }
  };

  const handleCreateNew = () => {
    router.push(`/tools/new?libraryId=${libraryId}`);
  };

  if (variant === "link") {
    return (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="link" className="gap-1">
              Add a tool
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center">
            <DropdownMenuItem onClick={() => setDialogOpen(true)}>
              <Wrench className="mr-2 h-4 w-4" />
              Add existing tool
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleCreateNew}>
              <Plus className="mr-2 h-4 w-4" />
              Create new tool
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <ToolPickerDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          loading={loading}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          tools={tools}
          availableTools={availableTools}
          existingToolIds={existingToolIds}
          adding={adding}
          onAddTool={handleAddTool}
          onCreateNew={handleCreateNew}
        />
      </>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            {showIcon && <Plus className="mr-2 h-4 w-4" />}
            Add Tool
            <ChevronDown className="ml-2 h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setDialogOpen(true)}>
            <Wrench className="mr-2 h-4 w-4" />
            Add existing tool
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleCreateNew}>
            <Plus className="mr-2 h-4 w-4" />
            Create new tool
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ToolPickerDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        loading={loading}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        tools={tools}
        availableTools={availableTools}
        existingToolIds={existingToolIds}
        adding={adding}
        onAddTool={handleAddTool}
        onCreateNew={handleCreateNew}
      />
    </>
  );
}

interface ToolPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loading: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  tools: Tool[];
  availableTools: Tool[];
  existingToolIds: string[];
  adding: string | null;
  onAddTool: (toolId: string) => void;
  onCreateNew: () => void;
}

function ToolPickerDialog({
  open,
  onOpenChange,
  loading,
  searchQuery,
  onSearchChange,
  tools,
  availableTools,
  existingToolIds,
  adding,
  onAddTool,
  onCreateNew,
}: ToolPickerDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Existing Tool</DialogTitle>
          <DialogDescription>
            Select a tool from your collection to add to this library
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tools..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : tools.length === 0 ? (
            <div className="text-center py-8">
              <Wrench className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No tools in your collection</p>
              <Button onClick={onCreateNew}>
                <Plus className="mr-2 h-4 w-4" />
                Create your first tool
              </Button>
            </div>
          ) : availableTools.length === 0 ? (
            <div className="text-center py-8">
              <Check className="h-12 w-12 mx-auto text-green-500 mb-4" />
              <p className="text-muted-foreground mb-2">
                {searchQuery
                  ? "No matching tools found"
                  : "All your tools are already in this library"}
              </p>
              <Button onClick={onCreateNew} variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Create a new tool
              </Button>
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {availableTools.map((tool) => {
                const isAdding = adding === tool.id;
                const alreadyAdded = existingToolIds.includes(tool.id);

                return (
                  <div
                    key={tool.id}
                    className={`p-3 border rounded-lg flex items-center justify-between transition-colors ${
                      alreadyAdded
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:border-primary/50 cursor-pointer"
                    }`}
                    onClick={() => !alreadyAdded && !isAdding && onAddTool(tool.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{tool.name}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {tool.vendor || "Unknown vendor"} - Ø
                        {tool.geometry.diameter_mm}mm - {tool.geometry.number_of_flutes}{" "}
                        flute
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-3">
                      <Badge variant="outline" className="whitespace-nowrap">
                        {TOOL_TYPE_LABELS[tool.tool_type]}
                      </Badge>
                      {isAdding && (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      )}
                      {alreadyAdded && (
                        <Check className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
