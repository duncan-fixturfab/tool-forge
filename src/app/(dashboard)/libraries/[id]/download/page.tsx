"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle, Download, Loader2, AlertCircle, ArrowLeft } from "lucide-react";

export default function DownloadLibraryPage() {
  const params = useParams();

  const libraryId = params.id as string;

  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const downloadInitiated = useRef(false);

  const handleDownload = async () => {
    setDownloading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/libraries/${libraryId}/download`
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to download library");
      }

      // Get the filename from Content-Disposition header
      const disposition = response.headers.get("Content-Disposition");
      const filenameMatch = disposition?.match(/filename="(.+)"/);
      const filename = filenameMatch ? filenameMatch[1] : "library.tools";

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setDownloaded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Download failed");
    } finally {
      setDownloading(false);
    }
  };

  // Auto-download on page load
  useEffect(() => {
    if (downloadInitiated.current) return;
    downloadInitiated.current = true;
    handleDownload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="max-w-xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {downloaded ? (
              <>
                <CheckCircle className="h-6 w-6 text-green-600" />
                Library Ready
              </>
            ) : error ? (
              <>
                <AlertCircle className="h-6 w-6 text-red-600" />
                Download Failed
              </>
            ) : (
              <>
                <Loader2 className="h-6 w-6 animate-spin" />
                Generating Library
              </>
            )}
          </CardTitle>
          <CardDescription>
            {downloaded
              ? "Your Fusion360 tool library has been downloaded"
              : error
                ? "There was a problem generating your library"
                : "Please wait while we generate your .tools file"}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {downloaded && (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-medium text-green-800 mb-2">
                  Import Instructions
                </h3>
                <ol className="text-sm text-green-700 space-y-2 list-decimal list-inside">
                  <li>Open Fusion360</li>
                  <li>
                    Go to <strong>Manufacture</strong> workspace
                  </li>
                  <li>
                    Click <strong>Manage</strong> → <strong>Tool Library</strong>
                  </li>
                  <li>
                    Click the <strong>Import</strong> button (folder icon)
                  </li>
                  <li>Select the downloaded .tools file</li>
                  <li>Your tools will appear with presets for each material</li>
                </ol>
              </div>

              <p className="text-sm text-muted-foreground">
                The library includes cutting presets calculated for your
                machine&apos;s spindle speed and feed rate limits.
              </p>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {!downloaded && !error && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">
                  Calculating feeds and speeds...
                </p>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-between">
          <Link href="/dashboard">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
          </Link>

          {downloaded && (
            <Button onClick={handleDownload} disabled={downloading}>
              <Download className="mr-2 h-4 w-4" />
              Download Again
            </Button>
          )}

          {error && (
            <Button onClick={handleDownload} disabled={downloading}>
              {downloading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Retrying...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Try Again
                </>
              )}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
