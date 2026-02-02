import { Machine } from "@/types/database";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface MachineCardProps {
  machine: Machine;
}

export function MachineCard({ machine }: MachineCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">
              {machine.manufacturer} {machine.model}
            </CardTitle>
            <CardDescription>{machine.name}</CardDescription>
          </div>
          {machine.is_public && (
            <Badge variant="secondary">Public</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Spindle Speed</p>
            <p className="font-medium">
              {machine.min_rpm.toLocaleString()} - {machine.max_rpm.toLocaleString()} RPM
            </p>
          </div>
          {machine.spindle_power_kw && (
            <div>
              <p className="text-muted-foreground">Spindle Power</p>
              <p className="font-medium">{machine.spindle_power_kw} kW</p>
            </div>
          )}
          {machine.tool_holder_type && (
            <div>
              <p className="text-muted-foreground">Tool Holder</p>
              <p className="font-medium">{machine.tool_holder_type}</p>
            </div>
          )}
          {machine.travel_x_mm && machine.travel_y_mm && machine.travel_z_mm && (
            <div>
              <p className="text-muted-foreground">Work Envelope</p>
              <p className="font-medium">
                {machine.travel_x_mm} x {machine.travel_y_mm} x {machine.travel_z_mm} mm
              </p>
            </div>
          )}
          {machine.max_feed_xy_mm_min && (
            <div>
              <p className="text-muted-foreground">Max Feed Rate</p>
              <p className="font-medium">
                {machine.max_feed_xy_mm_min.toLocaleString()} mm/min
              </p>
            </div>
          )}
          {machine.max_tool_diameter_mm && (
            <div>
              <p className="text-muted-foreground">Max Tool Diameter</p>
              <p className="font-medium">{machine.max_tool_diameter_mm} mm</p>
            </div>
          )}
        </div>
        {machine.description && (
          <p className="text-sm text-muted-foreground mt-4">
            {machine.description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
