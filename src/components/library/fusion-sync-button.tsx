"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Cloud, AlertCircle } from "lucide-react";
import { FusionSyncDialog } from "./fusion-sync-dialog";

interface FusionSyncButtonProps {
  libraryId: string;
  libraryName: string;
  defaultMaterialIds?: string[];
}

interface ConnectionStatus {
  connected: boolean;
  expired?: boolean;
  default_hub_id?: string;
  default_hub_name?: string;
  default_project_id?: string;
  default_project_name?: string;
  default_folder_id?: string;
  default_folder_path?: string;
}

export function FusionSyncButton({
  libraryId,
  libraryName,
  defaultMaterialIds = [],
}: FusionSyncButtonProps) {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchConnectionStatus();
  }, []);

  const fetchConnectionStatus = async () => {
    try {
      const response = await fetch("/api/autodesk/connection");
      const data = await response.json();
      setConnectionStatus(data);
    } catch (error) {
      console.error("Failed to fetch connection status:", error);
      setConnectionStatus({ connected: false });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectClick = () => {
    window.location.href = "/api/autodesk/auth";
  };

  if (isLoading) {
    return (
      <Button variant="outline" disabled>
        <Cloud className="mr-2 h-4 w-4" />
        Loading...
      </Button>
    );
  }

  if (!connectionStatus?.connected) {
    return (
      <Button variant="outline" onClick={handleConnectClick}>
        <Cloud className="mr-2 h-4 w-4" />
        Connect Autodesk
      </Button>
    );
  }

  if (connectionStatus.expired) {
    return (
      <Button variant="outline" onClick={handleConnectClick} className="text-yellow-600">
        <AlertCircle className="mr-2 h-4 w-4" />
        Reconnect Autodesk
      </Button>
    );
  }

  return (
    <>
      <Button variant="outline" onClick={() => setDialogOpen(true)}>
        <Cloud className="mr-2 h-4 w-4" />
        Sync to Fusion
      </Button>
      <FusionSyncDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        libraryId={libraryId}
        libraryName={libraryName}
        defaultMaterialIds={defaultMaterialIds}
        defaultDestination={
          connectionStatus.default_hub_id
            ? {
                hubId: connectionStatus.default_hub_id,
                hubName: connectionStatus.default_hub_name || "",
                projectId: connectionStatus.default_project_id || "",
                projectName: connectionStatus.default_project_name || "",
                folderId: connectionStatus.default_folder_id || "",
                folderPath: connectionStatus.default_folder_path || "",
              }
            : undefined
        }
      />
    </>
  );
}
