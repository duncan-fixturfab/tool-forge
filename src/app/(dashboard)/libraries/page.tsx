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
import { Plus, BookOpen } from "lucide-react";
import { LibraryCard, STATUS_LABELS } from "@/components/library/library-card";
import { LibraryStatus, Machine } from "@/types/database";

const STATUS_ORDER: LibraryStatus[] = ["complete", "draft", "archived"];

interface LibraryWithRelations {
  id: string;
  name: string;
  description?: string;
  status: LibraryStatus;
  export_count: number;
  last_exported_at?: string;
  machines?: Machine;
  library_tools?: { id: string }[];
}

export default async function LibrariesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: libraries, error } = await supabase
    .from("tool_libraries")
    .select(`*, machines (*), library_tools (id)`)
    .eq("user_id", user?.id)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Error fetching libraries:", error);
  }

  const libraryList = (libraries || []) as LibraryWithRelations[];

  // Group libraries by status
  const groupedLibraries = STATUS_ORDER.reduce(
    (acc, status) => {
      acc[status] = libraryList.filter((lib) => lib.status === status);
      return acc;
    },
    {} as Record<LibraryStatus, LibraryWithRelations[]>
  );

  // Filter to only statuses with libraries
  const statusesWithLibraries = STATUS_ORDER.filter(
    (status) => groupedLibraries[status].length > 0
  );

  const isEmpty = libraryList.length === 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Libraries</h1>
          <p className="text-muted-foreground mt-2">
            Manage your Fusion360 tool libraries
          </p>
        </div>
        <Link href="/libraries/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Library
          </Button>
        </Link>
      </div>

      {/* Empty State */}
      {isEmpty && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No libraries yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first tool library to organize tools for your CNC machine.
            </p>
            <Link href="/libraries/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Library
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Libraries by Status */}
      {statusesWithLibraries.map((status) => (
        <Card key={status}>
          <CardHeader>
            <CardTitle>{STATUS_LABELS[status]}</CardTitle>
            <CardDescription>
              {groupedLibraries[status].length} librar
              {groupedLibraries[status].length !== 1 ? "ies" : "y"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {groupedLibraries[status].map((library) => (
                <LibraryCard key={library.id} library={library} />
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
