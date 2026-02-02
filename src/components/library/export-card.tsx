"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle, Download } from "lucide-react";
import { FusionSyncButton } from "./fusion-sync-button";

interface ExportCardProps {
  libraryId: string;
  libraryName: string;
  exportCount: number;
  lastExportedAt: string | null;
  defaultMaterialIds?: string[];
}

export function ExportCard({ libraryId, libraryName, exportCount, lastExportedAt, defaultMaterialIds = [] }: ExportCardProps) {
  const router = useRouter();
  const [showWarningDialog, setShowWarningDialog] = useState(false);

  const handleExportClick = () => {
    if (defaultMaterialIds.length === 0) {
      setShowWarningDialog(true);
    } else {
      router.push(`/libraries/${libraryId}/download`);
    }
  };

  const handleConfirmExport = () => {
    setShowWarningDialog(false);
    router.push(`/libraries/${libraryId}/download`);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Export & Sync</CardTitle>
          <CardDescription>
            Download locally or sync directly to Fusion 360 Cloud
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                {exportCount > 0
                  ? `Exported ${exportCount} time${exportCount > 1 ? "s" : ""}`
                  : "Not yet exported"}
              </p>
              {lastExportedAt && (
                <p className="text-xs text-muted-foreground">
                  Last exported:{" "}
                  {new Date(lastExportedAt).toLocaleDateString()}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <FusionSyncButton
                libraryId={libraryId}
                libraryName={libraryName}
                defaultMaterialIds={defaultMaterialIds}
              />
              <Button onClick={handleExportClick}>
                <Download className="mr-2 h-4 w-4" />
                Download .tools
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showWarningDialog} onOpenChange={setShowWarningDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              No Materials Selected
            </DialogTitle>
            <DialogDescription>
              This library has no materials selected. The export will not include
              cutting presets for any materials.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 text-sm text-muted-foreground">
            You can add materials to this library from the Materials card to
            generate cutting presets with calculated feeds and speeds.
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowWarningDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleConfirmExport}>
              <Download className="mr-2 h-4 w-4" />
              Export Anyway
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
