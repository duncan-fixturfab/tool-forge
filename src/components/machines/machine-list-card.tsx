import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Machine } from "@/types/database";

interface MachineListCardProps {
  machine: Machine;
  isOwner?: boolean;
}

export function MachineListCard({ machine, isOwner }: MachineListCardProps) {
  return (
    <Link href={`/machines/${machine.id}`}>
      <Card className="hover:bg-accent/50 transition-colors cursor-pointer h-full">
        <CardContent className="p-4 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-medium leading-tight">
                {machine.manufacturer} {machine.model}
              </h3>
              {machine.name !== `${machine.manufacturer} ${machine.model}` && (
                <p className="text-xs text-muted-foreground">{machine.name}</p>
              )}
            </div>
            <Badge
              variant={isOwner ? "secondary" : "outline"}
              className="text-xs flex-shrink-0"
            >
              {isOwner ? "Private" : "Public"}
            </Badge>
          </div>
          <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
            <span>
              {machine.min_rpm.toLocaleString()} - {machine.max_rpm.toLocaleString()} RPM
            </span>
            {machine.spindle_power_kw && (
              <>
                <span>•</span>
                <span>{machine.spindle_power_kw} kW</span>
              </>
            )}
            {machine.tool_holder_type && (
              <>
                <span>•</span>
                <span>{machine.tool_holder_type}</span>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
