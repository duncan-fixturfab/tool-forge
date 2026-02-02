import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Plus, Wrench } from "lucide-react";
import { ToolCard, TOOL_TYPE_LABELS } from "@/components/tools/tool-card";
import { Tool, ToolType } from "@/types/database";

const TOOL_TYPE_ORDER: ToolType[] = [
  "flat_endmill",
  "ball_endmill",
  "bull_endmill",
  "drill",
  "spot_drill",
  "chamfer_mill",
  "face_mill",
  "thread_mill",
  "reamer",
  "tap",
  "engraving_tool",
];

export default async function ToolsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: tools, error } = await supabase
    .from("tools")
    .select("*")
    .eq("user_id", user?.id)
    .order("name");

  if (error) {
    console.error("Error fetching tools:", error);
  }

  const toolList = (tools || []) as Tool[];

  // Group tools by type
  const groupedTools = TOOL_TYPE_ORDER.reduce(
    (acc, toolType) => {
      acc[toolType] = toolList.filter((t) => t.tool_type === toolType);
      return acc;
    },
    {} as Record<ToolType, Tool[]>
  );

  // Filter to only types with tools
  const typesWithTools = TOOL_TYPE_ORDER.filter(
    (toolType) => groupedTools[toolType].length > 0
  );

  const isEmpty = toolList.length === 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tools</h1>
          <p className="text-muted-foreground mt-2">
            Manage your cutting tool collection
          </p>
        </div>
        <Link href="/tools/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Tool
          </Button>
        </Link>
      </div>

      {/* Empty State */}
      {isEmpty && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Wrench className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No tools yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Add your first cutting tool to start building your library.
            </p>
            <Link href="/tools/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Tool
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Tools by Type */}
      {typesWithTools.map((toolType) => (
        <Card key={toolType}>
          <CardHeader>
            <CardTitle>{TOOL_TYPE_LABELS[toolType]}</CardTitle>
            <CardDescription>
              {groupedTools[toolType].length} tool
              {groupedTools[toolType].length !== 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {groupedTools[toolType].map((tool) => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
