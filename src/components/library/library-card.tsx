import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LibraryStatus, Machine } from "@/types/database";
import { Download, Wrench } from "lucide-react";

export const STATUS_LABELS: Record<LibraryStatus, string> = {
  complete: "Complete",
  draft: "Draft",
  archived: "Archived",
};

const STATUS_VARIANTS: Record<LibraryStatus, "default" | "secondary" | "outline"> = {
  complete: "default",
  draft: "secondary",
  archived: "outline",
};

interface LibraryCardProps {
  library: {
    id: string;
    name: string;
    description?: string;
    status: LibraryStatus;
    export_count: number;
    last_exported_at?: string;
    machines?: Machine;
    library_tools?: { id: string }[];
  };
}

export function LibraryCard({ library }: LibraryCardProps) {
  const toolCount = library.library_tools?.length ?? 0;
  const hasExported = library.export_count > 0;

  return (
    <Link href={`/libraries/${library.id}`}>
      <Card className="hover:bg-accent/50 transition-colors cursor-pointer h-full">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-medium leading-tight">{library.name}</h3>
            <Badge variant={STATUS_VARIANTS[library.status]} className="text-xs flex-shrink-0">
              {STATUS_LABELS[library.status]}
            </Badge>
          </div>

          {library.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {library.description}
            </p>
          )}

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Wrench className="h-3.5 w-3.5" />
              <span>{toolCount} tool{toolCount !== 1 ? "s" : ""}</span>
            </div>
            {hasExported && (
              <div className="flex items-center gap-1">
                <Download className="h-3.5 w-3.5" />
                <span>{library.export_count} export{library.export_count !== 1 ? "s" : ""}</span>
              </div>
            )}
          </div>

          {library.machines && (
            <p className="text-xs text-muted-foreground">
              {library.machines.manufacturer} {library.machines.model}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
