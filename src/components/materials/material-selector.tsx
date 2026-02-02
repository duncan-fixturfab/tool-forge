"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Material, MaterialCategory } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface MaterialSelectorProps {
  value?: string[];
  onChange: (materialIds: string[], materials: Material[]) => void;
  multiple?: boolean;
}

const CATEGORY_LABELS: Record<MaterialCategory, string> = {
  aluminum: "Aluminum",
  steel: "Steel",
  stainless_steel: "Stainless Steel",
  titanium: "Titanium",
  brass: "Brass",
  copper: "Copper",
  plastic: "Plastic",
  wood: "Wood",
  composite: "Composite",
  cast_iron: "Cast Iron",
};

const CATEGORY_ORDER: MaterialCategory[] = [
  "aluminum",
  "steel",
  "stainless_steel",
  "titanium",
  "brass",
  "copper",
  "plastic",
  "wood",
  "composite",
  "cast_iron",
];

export function MaterialSelector({
  value = [],
  onChange,
  multiple = true,
}: MaterialSelectorProps) {
  const [open, setOpen] = useState(false);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMaterials() {
      const supabase = createClient();
      const { data } = await supabase
        .from("materials")
        .select("*")
        .eq("is_public", true)
        .order("name", { ascending: true });

      if (data) {
        setMaterials(data);
      }
      setLoading(false);
    }

    fetchMaterials();
  }, []);

  const selectedMaterials = materials.filter((m) => value.includes(m.id));

  // Group materials by category
  const materialsByCategory = materials.reduce(
    (acc, material) => {
      const category = material.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(material);
      return acc;
    },
    {} as Record<MaterialCategory, Material[]>
  );

  const handleSelect = (materialId: string) => {
    const material = materials.find((m) => m.id === materialId);
    if (!material) return;

    if (multiple) {
      if (value.includes(materialId)) {
        // Remove from selection
        const newValue = value.filter((id) => id !== materialId);
        const newMaterials = selectedMaterials.filter(
          (m) => m.id !== materialId
        );
        onChange(newValue, newMaterials);
      } else {
        // Add to selection
        const newValue = [...value, materialId];
        const newMaterials = [...selectedMaterials, material];
        onChange(newValue, newMaterials);
      }
    } else {
      // Single selection mode
      if (value.includes(materialId)) {
        onChange([], []);
      } else {
        onChange([materialId], [material]);
      }
      setOpen(false);
    }
  };

  return (
    <div className="space-y-2">
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
              ? "Loading materials..."
              : selectedMaterials.length > 0
                ? `${selectedMaterials.length} material${selectedMaterials.length > 1 ? "s" : ""} selected`
                : "Select materials..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search materials..." />
            <CommandList>
              <CommandEmpty>No material found.</CommandEmpty>
              {CATEGORY_ORDER.map((category) => {
                const categoryMaterials = materialsByCategory[category];
                if (!categoryMaterials || categoryMaterials.length === 0) {
                  return null;
                }

                return (
                  <CommandGroup
                    key={category}
                    heading={CATEGORY_LABELS[category]}
                  >
                    {categoryMaterials.map((material) => (
                      <CommandItem
                        key={material.id}
                        value={`${material.name} ${material.category}`}
                        onSelect={() => handleSelect(material.id)}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            value.includes(material.id)
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                        <div className="flex flex-col">
                          <span className="font-medium">{material.name}</span>
                          {material.description && (
                            <span className="text-xs text-muted-foreground line-clamp-1">
                              {material.description}
                            </span>
                          )}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                );
              })}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected materials display */}
      {selectedMaterials.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedMaterials.map((material) => (
            <Badge
              key={material.id}
              variant="secondary"
              className="cursor-pointer hover:bg-secondary/80"
              onClick={() => handleSelect(material.id)}
            >
              {material.name}
              <span className="ml-1 text-muted-foreground">&times;</span>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
