import { LibraryBuilder } from "@/components/library/library-builder";

export default function NewLibraryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create Tool Library</h1>
        <p className="text-muted-foreground mt-2">
          Build a Fusion360-compatible tool library with optimized feeds and speeds
        </p>
      </div>

      <LibraryBuilder />
    </div>
  );
}
