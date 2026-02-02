"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { LogIn, LogOut, RefreshCw, Folder, CheckCircle, AlertCircle } from "lucide-react";

interface AutodeskConnectionProps {
  initialConnection: {
    connected: boolean;
    expired?: boolean;
    autodesk_email?: string | null;
    autodesk_name?: string | null;
    connected_at?: string | null;
    last_sync_at?: string | null;
    default_hub_name?: string | null;
    default_project_name?: string | null;
    default_folder_path?: string | null;
  };
}

export function AutodeskConnection({ initialConnection }: AutodeskConnectionProps) {
  const router = useRouter();
  const [connection, setConnection] = useState(initialConnection);
  const [isLoading, setIsLoading] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const handleConnect = () => {
    setIsLoading(true);
    // Redirect to OAuth flow
    window.location.href = "/api/autodesk/auth";
  };

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      const response = await fetch("/api/autodesk/disconnect", {
        method: "POST",
      });

      if (response.ok) {
        setConnection({ connected: false });
        router.refresh();
      } else {
        const data = await response.json();
        console.error("Disconnect failed:", data.error);
      }
    } catch (error) {
      console.error("Disconnect error:", error);
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleReconnect = () => {
    setIsLoading(true);
    window.location.href = "/api/autodesk/auth";
  };

  if (!connection.connected) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-muted-foreground">
            Not Connected
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Connect your Autodesk account to push tool libraries directly to your
          Fusion Team Hub. Your libraries will automatically sync to Fusion 360.
        </p>
        <Button onClick={handleConnect} disabled={isLoading}>
          {isLoading ? (
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <LogIn className="mr-2 h-4 w-4" />
          )}
          Connect Autodesk Account
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {connection.expired ? (
            <>
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              <Badge variant="outline" className="text-yellow-600 border-yellow-300 bg-yellow-50">
                Session Expired
              </Badge>
            </>
          ) : (
            <>
              <CheckCircle className="h-5 w-5 text-green-500" />
              <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50">
                Connected
              </Badge>
            </>
          )}
        </div>
        <div className="flex gap-2">
          {connection.expired && (
            <Button variant="outline" size="sm" onClick={handleReconnect} disabled={isLoading}>
              {isLoading ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Reconnect
            </Button>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                <LogOut className="mr-2 h-4 w-4" />
                Disconnect
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Disconnect Autodesk Account?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will remove the connection to your Autodesk account. You can
                  reconnect at any time. Your synced libraries in Fusion 360 will not
                  be affected.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDisconnect}
                  disabled={isDisconnecting}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {isDisconnecting ? "Disconnecting..." : "Disconnect"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Account Details */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Autodesk Account</p>
          <p className="text-sm">{connection.autodesk_name || connection.autodesk_email || "Unknown"}</p>
          {connection.autodesk_name && connection.autodesk_email && (
            <p className="text-xs text-muted-foreground">{connection.autodesk_email}</p>
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Connected</p>
          <p className="text-sm">
            {connection.connected_at
              ? new Date(connection.connected_at).toLocaleDateString()
              : "Unknown"}
          </p>
        </div>
      </div>

      {/* Default Destination */}
      {(connection.default_hub_name || connection.default_project_name) && (
        <div className="border-t pt-4">
          <p className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
            <Folder className="h-4 w-4" />
            Default Sync Destination
          </p>
          <div className="text-sm bg-gray-50 rounded-md px-3 py-2">
            {connection.default_hub_name && (
              <span className="font-medium">{connection.default_hub_name}</span>
            )}
            {connection.default_project_name && (
              <>
                <span className="text-muted-foreground"> / </span>
                <span>{connection.default_project_name}</span>
              </>
            )}
            {connection.default_folder_path && (
              <>
                <span className="text-muted-foreground"> / </span>
                <span className="text-muted-foreground">{connection.default_folder_path}</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Last Sync */}
      {connection.last_sync_at && (
        <div className="text-xs text-muted-foreground">
          Last synced: {new Date(connection.last_sync_at).toLocaleString()}
        </div>
      )}
    </div>
  );
}
