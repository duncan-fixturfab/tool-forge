"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Plus, Cpu, Loader2 } from "lucide-react";
import { MachineListCard } from "@/components/machines/machine-list-card";
import { MachineCreator } from "@/components/machines/machine-creator";
import { Machine } from "@/types/database";
import { createClient } from "@/lib/supabase/client";

export default function MachinesPage() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreator, setShowCreator] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const fetchMachines = async () => {
    try {
      const response = await fetch("/api/machines");
      if (!response.ok) {
        throw new Error("Failed to fetch machines");
      }
      const data = await response.json();
      setMachines(data.machines || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load machines");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMachines();

    // Get current user ID for ownership check
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id || null);
    });
  }, []);

  const handleMachineCreated = (machine: Machine) => {
    setMachines((prev) => [...prev, machine]);
  };

  // Group machines by manufacturer
  const manufacturers = Array.from(new Set(machines.map((m) => m.manufacturer))).sort();
  const groupedMachines: Record<string, Machine[]> = {};
  for (const manufacturer of manufacturers) {
    groupedMachines[manufacturer] = machines.filter((m) => m.manufacturer === manufacturer);
  }

  const isEmpty = machines.length === 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Machines</h1>
          <p className="text-muted-foreground mt-2">
            Browse and manage CNC machine profiles
          </p>
        </div>
        <Button onClick={() => setShowCreator(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Machine
        </Button>
      </div>

      {/* Error State */}
      {error && (
        <Card>
          <CardContent className="py-6 text-center text-destructive">
            {error}
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {isEmpty && !error && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Cpu className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No machines yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Add your first CNC machine to start building tool libraries.
            </p>
            <Button onClick={() => setShowCreator(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Machine
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Machines by Manufacturer */}
      {manufacturers.map((manufacturer) => (
        <Card key={manufacturer}>
          <CardHeader>
            <CardTitle>{manufacturer}</CardTitle>
            <CardDescription>
              {groupedMachines[manufacturer].length} machine
              {groupedMachines[manufacturer].length !== 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {groupedMachines[manufacturer].map((machine) => (
                <MachineListCard
                  key={machine.id}
                  machine={machine}
                  isOwner={machine.created_by === userId}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Machine Creator Dialog */}
      <MachineCreator
        open={showCreator}
        onOpenChange={setShowCreator}
        onMachineCreated={handleMachineCreated}
      />
    </div>
  );
}
