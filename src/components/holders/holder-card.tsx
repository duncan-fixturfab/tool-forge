"use client";

import { ToolHolder } from "@/types/database";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, ExternalLink } from "lucide-react";

interface HolderCardProps {
  holder: ToolHolder;
  onEdit?: (holder: ToolHolder) => void;
  onDelete?: (holder: ToolHolder) => void;
  showActions?: boolean;
}

export function HolderCard({
  holder,
  onEdit,
  onDelete,
  showActions = true,
}: HolderCardProps) {
  const isSystemHolder = holder.user_id === null;

  return (
    <Card className="relative">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{holder.name}</CardTitle>
            {holder.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {holder.description}
              </p>
            )}
          </div>
          <div className="flex gap-1">
            <Badge variant="outline">{holder.taper_type}</Badge>
            {holder.collet_type && (
              <Badge variant="secondary">{holder.collet_type}</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Gauge Length:</span>{" "}
            <span className="font-medium">{holder.gauge_length_mm}mm</span>
          </div>
          {holder.collet_min_mm && holder.collet_max_mm && (
            <div>
              <span className="text-muted-foreground">Collet Range:</span>{" "}
              <span className="font-medium">
                {holder.collet_min_mm}-{holder.collet_max_mm}mm
              </span>
            </div>
          )}
          {holder.vendor && (
            <div>
              <span className="text-muted-foreground">Vendor:</span>{" "}
              <span className="font-medium">{holder.vendor}</span>
            </div>
          )}
          {holder.product_id && (
            <div>
              <span className="text-muted-foreground">Part #:</span>{" "}
              <span className="font-medium">{holder.product_id}</span>
            </div>
          )}
        </div>

        {/* Product Link */}
        {holder.product_url && (
          <div className="mt-3">
            <a
              href={holder.product_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline flex items-center gap-1"
            >
              View Product <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}

        {/* Actions */}
        {showActions && !isSystemHolder && (
          <div className="flex gap-2 mt-4 pt-4 border-t">
            {onEdit && (
              <Button variant="outline" size="sm" onClick={() => onEdit(holder)}>
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
            )}
            {onDelete && (
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700"
                onClick={() => onDelete(holder)}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            )}
          </div>
        )}

        {/* System/Public Badge */}
        {isSystemHolder && (
          <Badge variant="outline" className="mt-3 text-xs">
            System Holder
          </Badge>
        )}
        {!isSystemHolder && holder.is_public && (
          <Badge variant="outline" className="mt-3 text-xs">
            Public
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}
