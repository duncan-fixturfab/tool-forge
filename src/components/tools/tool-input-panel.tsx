"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ExtractedTool } from "@/lib/agents/schemas";
import { Link, FileText, Type, Loader2, Upload } from "lucide-react";

interface ToolInputPanelProps {
  onToolExtracted: (tool: ExtractedTool, sourceType: string) => void;
}

export function ToolInputPanel({ onToolExtracted }: ToolInputPanelProps) {
  const [activeTab, setActiveTab] = useState("url");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // URL input state
  const [url, setUrl] = useState("");

  // Text input state
  const [text, setText] = useState("");
  const [textProductUrl, setTextProductUrl] = useState("");

  // PDF input state
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/tools/parse/url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to parse URL");
      }

      if (!data.success) {
        throw new Error(data.error || "Failed to extract tool data");
      }

      onToolExtracted(data.tool, "url");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/tools/parse/text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: text.trim(),
          ...(textProductUrl.trim() && { product_url: textProductUrl.trim() }),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to parse text");
      }

      if (!data.success) {
        throw new Error(data.error || "Failed to extract tool data");
      }

      onToolExtracted(data.tool, "text");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handlePdfSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pdfFile) return;

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", pdfFile);

      const response = await fetch("/api/tools/parse/pdf", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to parse PDF");
      }

      if (!data.success) {
        throw new Error(data.error || "Failed to extract tool data");
      }

      onToolExtracted(data.tool, "pdf");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Tool</CardTitle>
        <CardDescription>
          Extract tool geometry from a vendor URL, PDF datasheet, or paste tool
          specifications.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="url" disabled={loading}>
              <Link className="mr-2 h-4 w-4" />
              URL
            </TabsTrigger>
            <TabsTrigger value="pdf" disabled={loading}>
              <FileText className="mr-2 h-4 w-4" />
              PDF
            </TabsTrigger>
            <TabsTrigger value="text" disabled={loading}>
              <Type className="mr-2 h-4 w-4" />
              Text
            </TabsTrigger>
          </TabsList>

          {/* URL Tab */}
          <TabsContent value="url">
            <form onSubmit={handleUrlSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="url">Tool Product URL</Label>
                <Input
                  id="url"
                  type="url"
                  placeholder="https://www.harveytool.com/..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">
                  Paste a URL from Harvey Tool, Kennametal, Helical, or other
                  tool vendors
                </p>
              </div>
              <Button type="submit" disabled={loading || !url.trim()}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Extracting...
                  </>
                ) : (
                  "Extract Tool Data"
                )}
              </Button>
            </form>
          </TabsContent>

          {/* PDF Tab */}
          <TabsContent value="pdf">
            <form onSubmit={handlePdfSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pdf">Tool Datasheet PDF</Label>
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center">
                  <input
                    id="pdf"
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setPdfFile(file);
                    }}
                    disabled={loading}
                  />
                  <label
                    htmlFor="pdf"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                    {pdfFile ? (
                      <span className="text-sm font-medium">{pdfFile.name}</span>
                    ) : (
                      <>
                        <span className="text-sm font-medium">
                          Click to upload PDF
                        </span>
                        <span className="text-xs text-muted-foreground">
                          or drag and drop
                        </span>
                      </>
                    )}
                  </label>
                </div>
                <p className="text-xs text-muted-foreground">
                  Upload a PDF datasheet or catalog page (max 10MB)
                </p>
              </div>
              <Button type="submit" disabled={loading || !pdfFile}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Extracting...
                  </>
                ) : (
                  "Extract Tool Data"
                )}
              </Button>
            </form>
          </TabsContent>

          {/* Text Tab */}
          <TabsContent value="text">
            <form onSubmit={handleTextSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="text-product-url">
                  Product URL{" "}
                  <span className="text-muted-foreground font-normal">
                    (optional)
                  </span>
                </Label>
                <Input
                  id="text-product-url"
                  type="url"
                  placeholder="https://www.harveytool.com/..."
                  value={textProductUrl}
                  onChange={(e) => setTextProductUrl(e.target.value)}
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">
                  Link to the product page for reordering or reference
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="text">Tool Specifications</Label>
                <textarea
                  id="text"
                  className="flex min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Paste tool specifications here...

Example:
Harvey Tool 46062-C3
3 Flute Square End Mill
Diameter: 1/4&quot; (6.35mm)
OAL: 2-1/2&quot; (63.5mm)
LOC: 3/4&quot; (19.05mm)
Helix: 45°
Coating: AlTiN"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">
                  Paste tool specifications from vendor catalogs or datasheets
                </p>
              </div>
              <Button type="submit" disabled={loading || text.trim().length < 10}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Extracting...
                  </>
                ) : (
                  "Extract Tool Data"
                )}
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        {/* Error Display */}
        {error && (
          <div className="mt-4 p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-md">
            {error}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
