"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Machine } from "@/types/database";
import { Button } from "@/components/ui/button";
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
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { MachineCreator } from "./machine-creator";

interface MachineSelectorProps {
  value?: string;
  onChange: (machineId: string | undefined, machine?: Machine) => void;
  onRequestNew?: () => void;
}

export function MachineSelector({
  value,
  onChange,
  onRequestNew,
}: MachineSelectorProps) {
  const [open, setOpen] = useState(false);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatorOpen, setCreatorOpen] = useState(false);

  const fetchMachines = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("machines")
      .select("*")
      .order("manufacturer", { ascending: true });

    if (data) {
      setMachines(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMachines();
  }, [fetchMachines]);

  const handleMachineCreated = (machine: Machine) => {
    // Refresh the machine list and select the new machine
    fetchMachines();
    onChange(machine.id, machine);
  };

  const handleRequestNew = () => {
    if (onRequestNew) {
      onRequestNew();
    } else {
      setCreatorOpen(true);
    }
  };

  const selectedMachine = machines.find((m) => m.id === value);

  // Group machines by manufacturer
  const machinesByManufacturer = machines.reduce(
    (acc, machine) => {
      const manufacturer = machine.manufacturer;
      if (!acc[manufacturer]) {
        acc[manufacturer] = [];
      }
      acc[manufacturer].push(machine);
      return acc;
    },
    {} as Record<string, Machine[]>
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={loading}
        >
          {loading
            ? "Loading machines..."
            : selectedMachine
              ? `${selectedMachine.manufacturer} ${selectedMachine.model}`
              : "Select a machine..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search machines..." />
          <CommandList>
            <CommandEmpty>
              <div className="py-6 text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  No machine found.
                </p>
                <Button variant="outline" size="sm" onClick={handleRequestNew}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add New Machine
                </Button>
              </div>
            </CommandEmpty>
            {Object.entries(machinesByManufacturer).map(
              ([manufacturer, machineList]) => (
                <CommandGroup key={manufacturer} heading={manufacturer}>
                  {machineList.map((machine) => (
                    <CommandItem
                      key={machine.id}
                      value={`${machine.manufacturer} ${machine.model} ${machine.name}`}
                      onSelect={() => {
                        onChange(
                          machine.id === value ? undefined : machine.id,
                          machine.id === value ? undefined : machine
                        );
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === machine.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex flex-col">
                        <span className="font-medium">{machine.model}</span>
                        <span className="text-xs text-muted-foreground">
                          {machine.max_rpm.toLocaleString()} RPM max
                          {machine.spindle_power_kw &&
                            ` / ${machine.spindle_power_kw}kW`}
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )
            )}
            <CommandGroup>
              <CommandItem
                onSelect={() => {
                  handleRequestNew();
                  setOpen(false);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add New Machine
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>

      <MachineCreator
        open={creatorOpen}
        onOpenChange={setCreatorOpen}
        onMachineCreated={handleMachineCreated}
      />
    </Popover>
  );
}
