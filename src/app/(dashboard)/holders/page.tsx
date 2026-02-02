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
import { Plus, Grip } from "lucide-react";
import { HolderCard } from "@/components/holders/holder-card";
import { ToolHolder, HolderTaperType } from "@/types/database";

const TAPER_TYPE_LABELS: Record<HolderTaperType, string> = {
  ISO20: "ISO20",
  ISO25: "ISO25",
  ISO30: "ISO30",
  ISO40: "ISO40",
  ISO50: "ISO50",
  CAT40: "CAT40",
  CAT50: "CAT50",
  BT30: "BT30",
  BT40: "BT40",
  BT50: "BT50",
  "HSK-A40": "HSK-A40",
  "HSK-A63": "HSK-A63",
  "HSK-A100": "HSK-A100",
  "HSK-E25": "HSK-E25",
  "HSK-E32": "HSK-E32",
  "HSK-E40": "HSK-E40",
  "HSK-F63": "HSK-F63",
  ER11: "ER11 (Direct)",
  ER16: "ER16 (Direct)",
  ER20: "ER20 (Direct)",
  ER25: "ER25 (Direct)",
  ER32: "ER32 (Direct)",
  TTS: "TTS (Tormach)",
  R8: "R8",
  MT2: "MT2",
  MT3: "MT3",
  other: "Other",
};

const TAPER_TYPE_ORDER: HolderTaperType[] = [
  "ISO20",
  "ISO25",
  "ISO30",
  "ISO40",
  "ISO50",
  "CAT40",
  "CAT50",
  "BT30",
  "BT40",
  "BT50",
  "HSK-A40",
  "HSK-A63",
  "HSK-A100",
  "TTS",
  "R8",
  "ER16",
  "ER20",
  "ER25",
  "ER32",
  "other",
];

export default async function HoldersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get user's holders plus public/system holders
  const { data: holders, error } = await supabase
    .from("tool_holders")
    .select("*")
    .or(`user_id.eq.${user?.id},is_public.eq.true,user_id.is.null`)
    .order("name");

  if (error) {
    console.error("Error fetching holders:", error);
  }

  const holderList = (holders || []) as ToolHolder[];

  // Separate user's holders from system/public holders
  const userHolders = holderList.filter((h) => h.user_id === user?.id);
  const systemHolders = holderList.filter((h) => h.user_id === null || h.is_public);

  // Group user holders by taper type
  const groupedUserHolders = TAPER_TYPE_ORDER.reduce(
    (acc, taperType) => {
      acc[taperType] = userHolders.filter((h) => h.taper_type === taperType);
      return acc;
    },
    {} as Record<HolderTaperType, ToolHolder[]>
  );

  // Group system holders by taper type
  const groupedSystemHolders = TAPER_TYPE_ORDER.reduce(
    (acc, taperType) => {
      acc[taperType] = systemHolders.filter((h) => h.taper_type === taperType);
      return acc;
    },
    {} as Record<HolderTaperType, ToolHolder[]>
  );

  // Filter to only types with user holders
  const typesWithUserHolders = TAPER_TYPE_ORDER.filter(
    (taperType) => groupedUserHolders[taperType].length > 0
  );

  // Filter to only types with system holders
  const typesWithSystemHolders = TAPER_TYPE_ORDER.filter(
    (taperType) => groupedSystemHolders[taperType].length > 0
  );

  const hasUserHolders = userHolders.length > 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tool Holders</h1>
          <p className="text-muted-foreground mt-2">
            Manage tool holders for your CNC machines
          </p>
        </div>
        <Link href="/holders/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Holder
          </Button>
        </Link>
      </div>

      {/* My Holders Section */}
      <div>
        <h2 className="text-xl font-semibold mb-4">My Holders</h2>

        {/* Empty State for User Holders */}
        {!hasUserHolders && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Grip className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No custom holders yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Add your own tool holders or use the system holders below.
              </p>
              <Link href="/holders/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Holder
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* User Holders by Taper Type */}
        {typesWithUserHolders.map((taperType) => (
          <Card key={taperType} className="mb-4">
            <CardHeader>
              <CardTitle>{TAPER_TYPE_LABELS[taperType]}</CardTitle>
              <CardDescription>
                {groupedUserHolders[taperType].length} holder
                {groupedUserHolders[taperType].length !== 1 ? "s" : ""}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {groupedUserHolders[taperType].map((holder) => (
                  <HolderCard key={holder.id} holder={holder} />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* System Holders Section */}
      {typesWithSystemHolders.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">System Holders</h2>
          <p className="text-muted-foreground mb-4">
            Pre-configured holders available for use. These cannot be edited.
          </p>

          {typesWithSystemHolders.map((taperType) => (
            <Card key={`system-${taperType}`} className="mb-4">
              <CardHeader>
                <CardTitle>{TAPER_TYPE_LABELS[taperType]}</CardTitle>
                <CardDescription>
                  {groupedSystemHolders[taperType].length} holder
                  {groupedSystemHolders[taperType].length !== 1 ? "s" : ""}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {groupedSystemHolders[taperType].map((holder) => (
                    <HolderCard
                      key={holder.id}
                      holder={holder}
                      showActions={false}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
