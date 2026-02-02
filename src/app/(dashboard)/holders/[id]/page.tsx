import { notFound } from "next/navigation";
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
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, ExternalLink } from "lucide-react";
import { ToolHolder } from "@/types/database";

interface HolderPageProps {
  params: Promise<{ id: string }>;
}

export default async function HolderPage({ params }: HolderPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: holder, error } = await supabase
    .from("tool_holders")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !holder) {
    notFound();
  }

  const typedHolder = holder as ToolHolder;
  const isOwner = typedHolder.user_id === user?.id;
  const isSystemHolder = typedHolder.user_id === null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/holders">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">
                {typedHolder.name}
              </h1>
              <Badge variant="outline">{typedHolder.taper_type}</Badge>
              {typedHolder.collet_type && (
                <Badge variant="secondary">{typedHolder.collet_type}</Badge>
              )}
            </div>
            {typedHolder.description && (
              <p className="text-muted-foreground mt-1">
                {typedHolder.description}
              </p>
            )}
          </div>
        </div>
        {isOwner && !isSystemHolder && (
          <Link href={`/holders/${id}/edit`}>
            <Button>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>
        )}
      </div>

      {/* Details */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Specifications Card */}
        <Card>
          <CardHeader>
            <CardTitle>Specifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Taper Type</p>
                <p className="font-medium">{typedHolder.taper_type}</p>
              </div>
              {typedHolder.collet_type && (
                <div>
                  <p className="text-sm text-muted-foreground">Collet Type</p>
                  <p className="font-medium">{typedHolder.collet_type}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Gauge Length</p>
                <p className="font-medium">{typedHolder.gauge_length_mm}mm</p>
              </div>
              {typedHolder.collet_min_mm && typedHolder.collet_max_mm && (
                <div>
                  <p className="text-sm text-muted-foreground">Collet Capacity</p>
                  <p className="font-medium">
                    {typedHolder.collet_min_mm}-{typedHolder.collet_max_mm}mm
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Vendor Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>Vendor Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {typedHolder.vendor && (
              <div>
                <p className="text-sm text-muted-foreground">Vendor</p>
                <p className="font-medium">{typedHolder.vendor}</p>
              </div>
            )}
            {typedHolder.product_id && (
              <div>
                <p className="text-sm text-muted-foreground">Product ID</p>
                <p className="font-medium">{typedHolder.product_id}</p>
              </div>
            )}
            {typedHolder.product_url && (
              <div>
                <p className="text-sm text-muted-foreground">Product Link</p>
                <a
                  href={typedHolder.product_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline flex items-center gap-1"
                >
                  View Product <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
            {!typedHolder.vendor && !typedHolder.product_id && !typedHolder.product_url && (
              <p className="text-muted-foreground">No vendor information available.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Segments Card */}
      <Card>
        <CardHeader>
          <CardTitle>Holder Geometry</CardTitle>
          <CardDescription>
            Profile segments from spindle face toward tool
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">
                    Segment
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">
                    Height (mm)
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">
                    Lower Diameter (mm)
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">
                    Upper Diameter (mm)
                  </th>
                </tr>
              </thead>
              <tbody>
                {typedHolder.segments.map((segment, index) => (
                  <tr key={index} className="border-b last:border-0">
                    <td className="px-4 py-2 font-medium">#{index + 1}</td>
                    <td className="px-4 py-2">{segment.height}</td>
                    <td className="px-4 py-2">{segment.lower_diameter}</td>
                    <td className="px-4 py-2">{segment.upper_diameter}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t bg-muted/50">
                  <td className="px-4 py-2 font-medium">Total</td>
                  <td className="px-4 py-2 font-medium">
                    {typedHolder.segments.reduce((sum, s) => sum + s.height, 0)}mm
                  </td>
                  <td className="px-4 py-2"></td>
                  <td className="px-4 py-2"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Extraction Info (if applicable) */}
      {typedHolder.extraction_source && (
        <Card>
          <CardHeader>
            <CardTitle>Extraction Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Source</p>
                <p className="font-medium capitalize">{typedHolder.extraction_source}</p>
              </div>
              {typedHolder.extraction_confidence && (
                <div>
                  <p className="text-sm text-muted-foreground">Confidence</p>
                  <p className="font-medium">
                    {Math.round(typedHolder.extraction_confidence * 100)}%
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* System/Public Badge */}
      {isSystemHolder && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Badge variant="outline">System Holder</Badge>
          This is a pre-configured system holder and cannot be modified.
        </div>
      )}
    </div>
  );
}
