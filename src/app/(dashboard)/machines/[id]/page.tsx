import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { MachineCard } from "@/components/machines/machine-card";
import { ArrowLeft, Pencil } from "lucide-react";

export default async function MachineDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: machine, error } = await supabase
    .from("machines")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !machine) {
    notFound();
  }

  const isOwner = machine.created_by === user?.id;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/machines">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">
              {machine.manufacturer} {machine.model}
            </h1>
            <p className="text-muted-foreground">{machine.name}</p>
          </div>
        </div>
        {isOwner && (
          <Link href={`/machines/${id}/edit`}>
            <Button size="sm">
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </Link>
        )}
      </div>

      {/* Machine Details */}
      <MachineCard machine={machine} />
    </div>
  );
}
