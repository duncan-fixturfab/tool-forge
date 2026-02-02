"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Cloud,
  RefreshCw,
  Folder,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Wand2,
} from "lucide-react";

interface SyncDestination {
  hubId: string;
  hubName: string;
  projectId: string;
  projectName: string;
  folderId: string;
  folderPath: string;
}

interface FusionSyncDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  libraryId: string;
  libraryName: string;
  defaultMaterialIds?: string[];
  defaultDestination?: SyncDestination;
}

interface Hub {
  id: string;
  name: string;
}

interface Project {
  id: string;
  name: string;
}

interface FolderItem {
  id: string;
  name: string;
  type: "folders";
}

interface BreadcrumbItem {
  id: string;
  name: string;
}

export function FusionSyncDialog({
  open,
  onOpenChange,
  libraryId,
  libraryName,
  defaultMaterialIds = [],
  defaultDestination,
}: FusionSyncDialogProps) {
  // State
  const [hubs, setHubs] = useState<Hub[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);

  const [selectedHub, setSelectedHub] = useState<Hub | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [currentFolder, setCurrentFolder] = useState<FolderItem | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ fileName: string; isNewItem: boolean } | null>(null);
  const [saveDestinationAsDefault, setSaveDestinationAsDefault] = useState(true);

  // Load hubs on open
  useEffect(() => {
    if (open) {
      loadHubs();
    } else {
      // Reset state when closing
      setSuccess(null);
      setError(null);
    }
  }, [open]);

  // Apply default destination if available
  useEffect(() => {
    if (
      open &&
      defaultDestination?.hubId &&
      hubs.length > 0 &&
      !selectedHub
    ) {
      const hub = hubs.find((h) => h.id === defaultDestination.hubId);
      if (hub) {
        setSelectedHub(hub);
      }
    }
  }, [open, defaultDestination, hubs, selectedHub]);

  const loadHubs = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/autodesk/hubs");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load hubs");
      }

      setHubs(data.hubs);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load hubs");
    } finally {
      setIsLoading(false);
    }
  };

  const loadProjects = useCallback(async (hubId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/autodesk/hubs/${hubId}/projects`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load projects");
      }

      setProjects(data.projects);

      // Apply default if matching hub
      if (defaultDestination?.hubId === hubId && defaultDestination.projectId) {
        const project = data.projects.find(
          (p: Project) => p.id === defaultDestination.projectId
        );
        if (project) {
          setSelectedProject(project);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load projects");
    } finally {
      setIsLoading(false);
    }
  }, [defaultDestination]);

  const loadTopFolders = useCallback(async (projectId: string, hubId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/autodesk/projects/${projectId}/top-folders?hubId=${hubId}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load folders");
      }

      setFolders(data.folders);
      setBreadcrumbs([]);
      setCurrentFolder(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load folders");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadFolderContents = async (folderId: string, folderName: string) => {
    if (!selectedProject) return;

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/autodesk/projects/${selectedProject.id}/folders?folderId=${folderId}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load folder contents");
      }

      setFolders(data.folders);

      // Update breadcrumbs
      if (currentFolder) {
        setBreadcrumbs([...breadcrumbs, { id: currentFolder.id, name: currentFolder.name }]);
      }
      setCurrentFolder({ id: folderId, name: folderName, type: "folders" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load folder contents");
    } finally {
      setIsLoading(false);
    }
  };

  const navigateBack = () => {
    if (breadcrumbs.length === 0) {
      // Go back to top folders
      setCurrentFolder(null);
      if (selectedProject && selectedHub) {
        loadTopFolders(selectedProject.id, selectedHub.id);
      }
    } else {
      // Go back one level
      const newBreadcrumbs = [...breadcrumbs];
      const previousFolder = newBreadcrumbs.pop();
      setBreadcrumbs(newBreadcrumbs);
      if (previousFolder && selectedProject) {
        setCurrentFolder({
          id: previousFolder.id,
          name: previousFolder.name,
          type: "folders",
        });
        // Reload that folder's contents
        fetch(
          `/api/autodesk/projects/${selectedProject.id}/folders?folderId=${previousFolder.id}`
        )
          .then((res) => res.json())
          .then((data) => {
            if (data.folders) {
              setFolders(data.folders);
            }
          });
      }
    }
  };

  const findCamAssets = async () => {
    if (!selectedProject || !selectedHub) return;

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/autodesk/projects/${selectedProject.id}/cam-assets?hubId=${selectedHub.id}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to find CAM assets folder");
      }

      // Navigate to the CAM assets folder
      setCurrentFolder({
        id: data.folder.id,
        name: data.folder.name,
        type: "folders",
      });
      setBreadcrumbs([
        { id: "cam", name: "CAM" },
        { id: "libraries", name: "Libraries" },
        { id: "assets", name: "Assets" },
      ]);
      setFolders([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to find CAM assets folder");
    } finally {
      setIsLoading(false);
    }
  };

  const handleHubChange = (hubId: string) => {
    const hub = hubs.find((h) => h.id === hubId);
    if (hub) {
      setSelectedHub(hub);
      setSelectedProject(null);
      setCurrentFolder(null);
      setFolders([]);
      setBreadcrumbs([]);
      loadProjects(hubId);
    }
  };

  const handleProjectChange = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    if (project && selectedHub) {
      setSelectedProject(project);
      setCurrentFolder(null);
      setBreadcrumbs([]);
      loadTopFolders(projectId, selectedHub.id);
    }
  };

  const handleSync = async () => {
    if (!selectedHub || !selectedProject || !currentFolder) {
      setError("Please select a destination folder");
      return;
    }

    setIsSyncing(true);
    setError(null);
    setSuccess(null);

    try {
      const folderPath = [
        ...breadcrumbs.map((b) => b.name),
        currentFolder.name,
      ].join("/");

      const response = await fetch(`/api/libraries/${libraryId}/sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          hubId: selectedHub.id,
          hubName: selectedHub.name,
          projectId: selectedProject.id,
          projectName: selectedProject.name,
          folderId: currentFolder.id,
          folderPath,
          saveAsDefault: saveDestinationAsDefault,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to sync library");
      }

      setSuccess({
        fileName: data.fileName,
        isNewItem: data.isNewItem,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sync library");
    } finally {
      setIsSyncing(false);
    }
  };

  const folderPath = currentFolder
    ? [...breadcrumbs.map((b) => b.name), currentFolder.name].join(" / ")
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5" />
            Sync to Fusion Cloud
          </DialogTitle>
          <DialogDescription>
            Upload &quot;{libraryName}&quot; to your Fusion Team Hub
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <p className="font-medium text-green-800">Sync Successful!</p>
                <p className="text-sm text-green-700">
                  {success.isNewItem ? "Created" : "Updated"} {success.fileName}
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Your tool library will appear in Fusion 360 under Cloud &gt; CAM
              Tools after refreshing.
            </p>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Hub Selection */}
            <div className="space-y-2">
              <Label>Team Hub</Label>
              <Select
                value={selectedHub?.id || ""}
                onValueChange={handleHubChange}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a hub..." />
                </SelectTrigger>
                <SelectContent>
                  {hubs.map((hub) => (
                    <SelectItem key={hub.id} value={hub.id}>
                      {hub.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Project Selection */}
            {selectedHub && (
              <div className="space-y-2">
                <Label>Project</Label>
                <Select
                  value={selectedProject?.id || ""}
                  onValueChange={handleProjectChange}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a project..." />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Folder Browser */}
            {selectedProject && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Destination Folder</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={findCamAssets}
                    disabled={isLoading}
                  >
                    <Wand2 className="mr-2 h-4 w-4" />
                    Find CAM Assets
                  </Button>
                </div>

                {/* Breadcrumb navigation */}
                {(currentFolder || breadcrumbs.length > 0) && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={navigateBack}
                      className="h-6 px-2"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span>
                      {breadcrumbs.map((b) => b.name).join(" / ")}
                      {breadcrumbs.length > 0 && currentFolder && " / "}
                      {currentFolder?.name}
                    </span>
                  </div>
                )}

                {/* Folder list */}
                <div className="border rounded-md h-48 overflow-y-auto">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : folders.length === 0 && currentFolder ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                      <Folder className="h-8 w-8 mb-2 opacity-50" />
                      <p className="text-sm">This folder is empty</p>
                      <p className="text-xs">You can sync to this folder</p>
                    </div>
                  ) : folders.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                      No folders available
                    </div>
                  ) : (
                    <div className="p-1">
                      {folders.map((folder) => (
                        <button
                          key={folder.id}
                          onClick={() => loadFolderContents(folder.id, folder.name)}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-100 text-left text-sm"
                        >
                          <Folder className="h-4 w-4 text-muted-foreground" />
                          <span className="flex-1">{folder.name}</span>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Selected folder display */}
                {currentFolder && (
                  <div className="text-sm bg-gray-50 rounded-md px-3 py-2">
                    <span className="text-muted-foreground">Will sync to: </span>
                    <span className="font-medium">{folderPath}</span>
                  </div>
                )}
              </div>
            )}

            {/* No Materials Warning */}
            {defaultMaterialIds.length === 0 && (
              <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-md">
                <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-amber-800">No materials selected</p>
                  <p className="text-amber-700">
                    This library has no materials. The sync will not include cutting presets.
                  </p>
                </div>
              </div>
            )}

            {/* Save destination as default checkbox */}
            {currentFolder && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="saveDestinationDefault"
                  checked={saveDestinationAsDefault}
                  onCheckedChange={(checked) => setSaveDestinationAsDefault(checked === true)}
                />
                <label
                  htmlFor="saveDestinationDefault"
                  className="text-sm text-muted-foreground cursor-pointer"
                >
                  Save as default destination
                </label>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {success ? (
            <Button onClick={() => onOpenChange(false)}>Done</Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSync}
                disabled={!currentFolder || isSyncing}
              >
                {isSyncing ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <Cloud className="mr-2 h-4 w-4" />
                    Sync Library
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
