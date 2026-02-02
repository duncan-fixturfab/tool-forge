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
import { Plus, Library, Wrench, Download } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();

  // Fetch user's tools count
  const { count: toolsCount } = await supabase
    .from("tools")
    .select("*", { count: "exact", head: true });

  // Fetch user's libraries count
  const { count: librariesCount } = await supabase
    .from("tool_libraries")
    .select("*", { count: "exact", head: true });

  // Fetch recent libraries
  const { data: recentLibraries } = await supabase
    .from("tool_libraries")
    .select("*, machines(name)")
    .order("created_at", { ascending: false })
    .limit(5);

  // Fetch recent tools
  const { data: recentTools } = await supabase
    .from("tools")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Create and manage your Fusion360 tool libraries
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tools</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{toolsCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              Tools in your collection
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Libraries</CardTitle>
            <Library className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{librariesCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              Tool libraries created
            </p>
          </CardContent>
        </Card>

        <Link href="/tools/new" className="block">
          <Card className="h-full hover:border-primary transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Add Tool</CardTitle>
              <Plus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Extract tool data from URL, PDF, or text
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/libraries/new" className="block">
          <Card className="h-full hover:border-primary transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                New Library
              </CardTitle>
              <Download className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Create a new Fusion360 tool library
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Libraries */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Libraries</CardTitle>
            <CardDescription>
              Your recently created tool libraries
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentLibraries && recentLibraries.length > 0 ? (
              <div className="space-y-4">
                {recentLibraries.map((library) => (
                  <div
                    key={library.id}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium">{library.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {library.machines?.name || "No machine assigned"}
                      </p>
                    </div>
                    <Link href={`/libraries/${library.id}`}>
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Library className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No libraries yet</p>
                <Link href="/libraries/new">
                  <Button variant="link" className="mt-2">
                    Create your first library
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Tools */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Tools</CardTitle>
            <CardDescription>Your recently added tools</CardDescription>
          </CardHeader>
          <CardContent>
            {recentTools && recentTools.length > 0 ? (
              <div className="space-y-4">
                {recentTools.map((tool) => (
                  <div
                    key={tool.id}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium">{tool.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {tool.vendor || "Unknown vendor"} -{" "}
                        {tool.tool_type.replace(/_/g, " ")}
                      </p>
                    </div>
                    <Link href={`/tools/${tool.id}`}>
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Wrench className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No tools yet</p>
                <Link href="/tools/new">
                  <Button variant="link" className="mt-2">
                    Add your first tool
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
