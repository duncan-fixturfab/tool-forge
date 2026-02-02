"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ToolEditFormData } from "./tool-edit-tabs";

interface GeneralTabProps {
  description: string;
  vendor: string;
  product_id: string;
  product_url: string;
  notes: string;
  onChange: (data: Partial<ToolEditFormData>) => void;
  disabled?: boolean;
}

export function GeneralTab({
  description,
  vendor,
  product_id,
  product_url,
  notes,
  onChange,
  disabled = false,
}: GeneralTabProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          value={description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="Tool description"
          disabled={disabled}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="vendor">Vendor</Label>
        <Input
          id="vendor"
          value={vendor}
          onChange={(e) => onChange({ vendor: e.target.value })}
          placeholder="e.g., Harvey Tool, Kennametal"
          disabled={disabled}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="product_id">Product ID</Label>
        <Input
          id="product_id"
          value={product_id}
          onChange={(e) => onChange({ product_id: e.target.value })}
          placeholder="SKU or product number"
          disabled={disabled}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="product_url">Product link</Label>
        <Input
          id="product_url"
          type="url"
          value={product_url}
          onChange={(e) => onChange({ product_url: e.target.value })}
          placeholder="https://..."
          disabled={disabled}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => onChange({ notes: e.target.value })}
          placeholder="Additional notes about this tool..."
          rows={3}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
