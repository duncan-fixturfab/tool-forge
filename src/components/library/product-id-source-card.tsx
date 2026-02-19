"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface ProductIdSourceCardProps {
  libraryId: string;
  productIdSource: "product_id" | "internal_reference";
}

export function ProductIdSourceCard({
  libraryId,
  productIdSource: initialSource,
}: ProductIdSourceCardProps) {
  const [source, setSource] = useState<"product_id" | "internal_reference">(initialSource);
  const [saving, setSaving] = useState(false);

  const handleChange = async (value: "product_id" | "internal_reference") => {
    setSource(value);
    setSaving(true);
    try {
      await fetch(`/api/libraries/${libraryId}/product-id-source`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productIdSource: value }),
      });
    } catch (error) {
      console.error("Failed to save product ID source:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Fusion 360 Product ID
              {saving && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </CardTitle>
            <CardDescription>
              Choose which field is used as the &quot;Product ID&quot; in Fusion 360 exports
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Select
          value={source}
          onValueChange={(val) => handleChange(val as "product_id" | "internal_reference")}
        >
          <SelectTrigger className="w-[280px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="product_id">
              Product ID (vendor SKU)
            </SelectItem>
            <SelectItem value="internal_reference">
              Internal Reference (ERP / part number)
            </SelectItem>
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground mt-2">
          {source === "product_id"
            ? "The vendor SKU or product number stored on each tool will be used."
            : "Your internal part number or ERP reference stored on each tool will be used."}
        </p>
      </CardContent>
    </Card>
  );
}
