"use client";

import { useState, useEffect, useCallback } from "react";
import { ToolHolder } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Plus,
  Star,
  Trash2,
  Loader2,
  ChevronsUpDown,
  Check,
  Grip,
} from "lucide-react";

interface MachineHolderAssociation extends ToolHolder {
  association_id: string;
  is_default: boolean;
  association_notes?: string;
}

interface MachineHolderManagerProps {
  machineId: string;
  disabled?: boolean;
}

export function MachineHolderManager({
  machineId,
  disabled = false,
}: MachineHolderManagerProps) {
  const [associations, setAssociations] = useState<MachineHolderAssociation[]>(
    []
  );
  const [availableHolders, setAvailableHolders] = useState<ToolHolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectorOpen, setSelectorOpen] = useState(false);

  // Add dialog state
  const [selectedHolderId, setSelectedHolderId] = useState<string>("");
  const [isDefault, setIsDefault] = useState(false);
  const [adding, setAdding] = useState(false);

  // Operation states
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [togglingDefaultId, setTogglingDefaultId] = useState<string | null>(
    null
  );

  // Fetch associated holders
  const fetchAssociations = useCallback(async () => {
    try {
      const response = await fetch(`/api/machines/${machineId}/holders`);
      const data = await response.json();
      if (response.ok && data.holders) {
        setAssociations(data.holders);
      }
    } catch (error) {
      console.error("Error fetching machine holders:", error);
    }
  }, [machineId]);

  // Fetch all available holders
  const fetchAvailableHolders = useCallback(async () => {
    try {
      const response = await fetch("/api/holders?include_public=true");
      const data = await response.json();
      if (response.ok && data.holders) {
        setAvailableHolders(data.holders);
      }
    } catch (error) {
      console.error("Error fetching available holders:", error);
    }
  }, []);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      await Promise.all([fetchAssociations(), fetchAvailableHolders()]);
      setLoading(false);
    }
    loadData();
  }, [fetchAssociations, fetchAvailableHolders]);

  // Get holders not yet associated
  const unassociatedHolders = availableHolders.filter(
    (h) => !associations.some((a) => a.id === h.id)
  );

  // Group by taper type
  const holdersByTaper = unassociatedHolders.reduce(
    (acc, holder) => {
      const taper = holder.taper_type || "other";
      if (!acc[taper]) acc[taper] = [];
      acc[taper].push(holder);
      return acc;
    },
    {} as Record<string, ToolHolder[]>
  );

  const handleAddHolder = async () => {
    if (!selectedHolderId) return;

    setAdding(true);
    try {
      const response = await fetch(`/api/machines/${machineId}/holders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool_holder_id: selectedHolderId,
          is_default: isDefault,
        }),
      });

      if (response.ok) {
        await fetchAssociations();
        setAddDialogOpen(false);
        setSelectedHolderId("");
        setIsDefault(false);
      } else {
        const data = await response.json();
        console.error("Error adding holder:", data.error);
      }
    } catch (error) {
      console.error("Error adding holder:", error);
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveHolder = async (holderId: string) => {
    setRemovingId(holderId);
    try {
      const response = await fetch(
        `/api/machines/${machineId}/holders?holder_id=${holderId}`,
        { method: "DELETE" }
      );

      if (response.ok) {
        setAssociations((prev) => prev.filter((a) => a.id !== holderId));
      }
    } catch (error) {
      console.error("Error removing holder:", error);
    } finally {
      setRemovingId(null);
    }
  };

  const handleToggleDefault = async (holderId: string, currentDefault: boolean) => {
    setTogglingDefaultId(holderId);
    try {
      const response = await fetch(`/api/machines/${machineId}/holders`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool_holder_id: holderId,
          is_default: !currentDefault,
        }),
      });

      if (response.ok) {
        // Update local state
        setAssociations((prev) =>
          prev.map((a) => ({
            ...a,
            is_default: a.id === holderId ? !currentDefault : currentDefault ? a.is_default : false,
          }))
        );
      }
    } catch (error) {
      console.error("Error toggling default:", error);
    } finally {
      setTogglingDefaultId(null);
    }
  };

  const selectedHolder = availableHolders.find((h) => h.id === selectedHolderId);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tool Holders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Tool Holders</CardTitle>
            <CardDescription>
              Holders associated with this machine
            </CardDescription>
          </div>
          <Button
            size="sm"
            onClick={() => setAddDialogOpen(true)}
            disabled={disabled || unassociatedHolders.length === 0}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Holder
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {associations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Grip className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No holders associated</p>
            <p className="text-sm">
              Add holders to use when building tool libraries
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {associations.map((holder) => (
              <div
                key={holder.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() =>
                      handleToggleDefault(holder.id, holder.is_default)
                    }
                    disabled={disabled || togglingDefaultId === holder.id}
                    className="text-muted-foreground hover:text-yellow-500 transition-colors disabled:opacity-50"
                    title={
                      holder.is_default ? "Default holder" : "Set as default"
                    }
                  >
                    {togglingDefaultId === holder.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Star
                        className={`h-4 w-4 ${
                          holder.is_default
                            ? "fill-yellow-500 text-yellow-500"
                            : ""
                        }`}
                      />
                    )}
                  </button>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{holder.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {holder.taper_type}
                      </Badge>
                      {holder.collet_type && (
                        <Badge variant="outline" className="text-xs">
                          {holder.collet_type}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Gauge: {holder.gauge_length_mm}mm
                      {holder.collet_min_mm &&
                        holder.collet_max_mm &&
                        ` | Collet: ${holder.collet_min_mm}-${holder.collet_max_mm}mm`}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveHolder(holder.id)}
                  disabled={disabled || removingId === holder.id}
                  className="text-muted-foreground hover:text-destructive"
                >
                  {removingId === holder.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Add Holder Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Tool Holder</DialogTitle>
            <DialogDescription>
              Select a holder to associate with this machine
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tool Holder</Label>
              <Popover open={selectorOpen} onOpenChange={setSelectorOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={selectorOpen}
                    className="w-full justify-between"
                  >
                    {selectedHolder ? (
                      <span className="flex items-center gap-2">
                        {selectedHolder.name}
                        <Badge variant="secondary" className="text-xs">
                          {selectedHolder.taper_type}
                        </Badge>
                      </span>
                    ) : (
                      "Select holder..."
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search holders..." />
                    <CommandList className="max-h-[300px] overflow-y-auto">
                      <CommandEmpty>No holders found.</CommandEmpty>
                      {Object.entries(holdersByTaper).map(([taper, holders]) => (
                        <CommandGroup key={taper} heading={taper}>
                          {holders.map((holder) => (
                            <CommandItem
                              key={holder.id}
                              value={`${holder.name} ${holder.taper_type}`}
                              onSelect={() => {
                                setSelectedHolderId(holder.id);
                                setSelectorOpen(false);
                              }}
                            >
                              <Check
                                className={`mr-2 h-4 w-4 ${
                                  selectedHolderId === holder.id
                                    ? "opacity-100"
                                    : "opacity-0"
                                }`}
                              />
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span>{holder.name}</span>
                                  {holder.collet_type && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {holder.collet_type}
                                    </Badge>
                                  )}
                                </div>
                                {holder.vendor && (
                                  <p className="text-xs text-muted-foreground">
                                    {holder.vendor}
                                  </p>
                                )}
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      ))}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_default"
                checked={isDefault}
                onCheckedChange={(checked) => setIsDefault(checked === true)}
              />
              <Label htmlFor="is_default" className="text-sm font-normal">
                Set as default holder for this machine
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddHolder}
              disabled={!selectedHolderId || adding}
            >
              {adding ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Holder"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
