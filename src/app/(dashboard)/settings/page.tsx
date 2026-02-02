import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getConnection } from "@/lib/autodesk/tokens";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AutodeskConnection } from "@/components/settings/autodesk-connection";
import { Settings, Cloud } from "lucide-react";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: { autodesk?: string; error?: string };
}) {
  const params = searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get Autodesk connection status
  let autodeskConnection = null;
  if (user) {
    try {
      autodeskConnection = await getConnection(user.id);
    } catch {
      // Connection doesn't exist yet
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Settings className="h-8 w-8" />
          Settings
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage your account settings and integrations
        </p>
      </div>

      {/* Status Messages */}
      {params.autodesk === "connected" && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-md">
          Successfully connected your Autodesk account.
        </div>
      )}
      {params.error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
          {params.error}
        </div>
      )}

      {/* Autodesk Integration Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5" />
            Autodesk Fusion Cloud
          </CardTitle>
          <CardDescription>
            Connect your Autodesk account to sync tool libraries directly to Fusion 360
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div className="animate-pulse h-32 bg-gray-100 rounded" />}>
            <AutodeskConnection
              initialConnection={
                autodeskConnection
                  ? {
                      connected: true,
                      autodesk_email: autodeskConnection.autodesk_email,
                      autodesk_name: autodeskConnection.autodesk_name,
                      connected_at: autodeskConnection.connected_at,
                      last_sync_at: autodeskConnection.last_sync_at,
                      default_hub_name: autodeskConnection.default_hub_name,
                      default_project_name: autodeskConnection.default_project_name,
                      default_folder_path: autodeskConnection.default_folder_path,
                    }
                  : { connected: false }
              }
            />
          </Suspense>
        </CardContent>
      </Card>

      {/* Account Section */}
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Your Tool Forge account details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              <p className="text-sm">{user?.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Member since
              </p>
              <p className="text-sm">
                {user?.created_at
                  ? new Date(user.created_at).toLocaleDateString()
                  : "Unknown"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
