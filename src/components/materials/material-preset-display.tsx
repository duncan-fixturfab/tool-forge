import { Material, MachineMaterialPreset } from "@/types/database";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface MaterialPresetDisplayProps {
  material: Material;
  preset?: MachineMaterialPreset;
  toolDiameter?: number;
  numberOfFlutes?: number;
}

export function MaterialPresetDisplay({
  material,
  preset,
  toolDiameter,
  numberOfFlutes,
}: MaterialPresetDisplayProps) {
  // Calculate recommended values if preset and tool info provided
  let calculatedRpm: number | undefined;
  let calculatedFeed: number | undefined;

  if (preset && toolDiameter) {
    // N = (Vc × 1000) / (π × D)
    calculatedRpm = Math.round(
      (preset.surface_speed_m_min * 1000) / (Math.PI * toolDiameter)
    );

    if (numberOfFlutes) {
      // F = N × fz × z
      calculatedFeed = Math.round(
        calculatedRpm * preset.chip_load_mm * numberOfFlutes
      );
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">{material.name}</CardTitle>
          <Badge variant="outline" className="text-xs">
            {material.category.replace(/_/g, " ")}
          </Badge>
        </div>
        {material.description && (
          <CardDescription className="text-xs">
            {material.description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        {preset ? (
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Surface Speed</p>
              <p className="font-medium">{preset.surface_speed_m_min} m/min</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Chip Load</p>
              <p className="font-medium">{preset.chip_load_mm} mm/tooth</p>
            </div>
            {calculatedRpm && (
              <div>
                <p className="text-muted-foreground text-xs">Calculated RPM</p>
                <p className="font-medium text-primary">
                  {calculatedRpm.toLocaleString()}
                </p>
              </div>
            )}
            {calculatedFeed && (
              <div>
                <p className="text-muted-foreground text-xs">Calculated Feed</p>
                <p className="font-medium text-primary">
                  {calculatedFeed.toLocaleString()} mm/min
                </p>
              </div>
            )}
            <div>
              <p className="text-muted-foreground text-xs">Axial Depth</p>
              <p className="font-medium">{preset.axial_depth_factor}× dia</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Radial Depth</p>
              <p className="font-medium">{preset.radial_depth_factor}× dia</p>
            </div>
            {preset.coolant_type && (
              <div className="col-span-2">
                <p className="text-muted-foreground text-xs">Coolant</p>
                <p className="font-medium capitalize">{preset.coolant_type}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">
            <p>Default cutting parameters:</p>
            <div className="grid grid-cols-2 gap-3 mt-2">
              {material.surface_speed_min_m_min &&
                material.surface_speed_max_m_min && (
                  <div>
                    <p className="text-xs">Surface Speed Range</p>
                    <p className="font-medium">
                      {material.surface_speed_min_m_min} -{" "}
                      {material.surface_speed_max_m_min} m/min
                    </p>
                  </div>
                )}
              <div>
                <p className="text-xs">Chip Load Factor</p>
                <p className="font-medium">{material.chip_load_factor}×</p>
              </div>
              {material.hardness_brinell && (
                <div>
                  <p className="text-xs">Hardness (Brinell)</p>
                  <p className="font-medium">{material.hardness_brinell} HB</p>
                </div>
              )}
              {material.hardness_hrc_min && material.hardness_hrc_max && (
                <div>
                  <p className="text-xs">Hardness (HRC)</p>
                  <p className="font-medium">
                    {material.hardness_hrc_min} - {material.hardness_hrc_max} HRC
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
