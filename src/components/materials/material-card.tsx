import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Material, MaterialCategory } from "@/types/database";

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

interface MaterialCardProps {
  material: Material;
  isOwner?: boolean;
}

export function MaterialCard({ material, isOwner }: MaterialCardProps) {
  const hasHardness = material.hardness_hrc_min && material.hardness_hrc_max;

  return (
    <Link href={`/materials/${material.id}`}>
      <Card className="hover:bg-accent/50 transition-colors cursor-pointer h-full">
        <CardContent className="p-4 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-medium leading-tight">{material.name}</h3>
            <div className="flex gap-1 flex-shrink-0">
              {isOwner ? (
                <Badge variant="secondary" className="text-xs">
                  Private
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs">
                  Public
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="default" className="text-xs">
              {CATEGORY_LABELS[material.category]}
            </Badge>
            {hasHardness && (
              <span className="text-xs text-muted-foreground">
                {material.hardness_hrc_min}-{material.hardness_hrc_max} HRC
              </span>
            )}
          </div>
          {material.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {material.description}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

export { CATEGORY_LABELS };
