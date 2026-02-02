import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tool, ToolType } from "@/types/database";

export const TOOL_TYPE_LABELS: Record<ToolType, string> = {
  flat_endmill: "Flat End Mill",
  ball_endmill: "Ball End Mill",
  bull_endmill: "Bull End Mill",
  drill: "Drill",
  spot_drill: "Spot Drill",
  chamfer_mill: "Chamfer Mill",
  face_mill: "Face Mill",
  thread_mill: "Thread Mill",
  reamer: "Reamer",
  tap: "Tap",
  engraving_tool: "Engraving Tool",
};

interface ToolCardProps {
  tool: Tool;
}

export function ToolCard({ tool }: ToolCardProps) {
  const geometry = tool.geometry;

  return (
    <Link href={`/tools/${tool.id}`}>
      <Card className="hover:bg-accent/50 transition-colors cursor-pointer h-full">
        <CardContent className="p-4 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-medium leading-tight">{tool.name}</h3>
            {tool.coating && (
              <Badge variant="secondary" className="text-xs flex-shrink-0">
                {tool.coating}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="default" className="text-xs">
              {TOOL_TYPE_LABELS[tool.tool_type]}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {geometry.diameter_mm}mm
            </span>
            <span className="text-xs text-muted-foreground">
              {geometry.number_of_flutes} flutes
            </span>
          </div>
          {tool.vendor && (
            <p className="text-xs text-muted-foreground">{tool.vendor}</p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
