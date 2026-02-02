"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ToolType,
  ToolGeometry,
  ShaftSegment,
  PostProcessSettings,
} from "@/types/database";
import { GeneralTab } from "./general-tab";
import { CutterTab } from "./cutter-tab";
import { ShaftTab } from "./shaft-tab";
import { PostProcessorTab } from "./post-processor-tab";

export interface ToolEditFormData {
  // General tab
  name: string;
  description: string;
  vendor: string;
  product_id: string;
  product_url: string;
  notes: string;
  // Cutter tab
  tool_type: ToolType;
  unit: "mm" | "inch";
  clockwise_rotation: boolean;
  substrate: string;
  coating: string;
  geometry: ToolGeometry;
  // Shaft tab
  shaft_segments: ShaftSegment[];
  // Post processor tab
  post_process: PostProcessSettings;
}

interface ToolEditTabsProps {
  formData: ToolEditFormData;
  onChange: (data: Partial<ToolEditFormData>) => void;
  disabled?: boolean;
}

export function ToolEditTabs({
  formData,
  onChange,
  disabled = false,
}: ToolEditTabsProps) {
  return (
    <Tabs defaultValue="general" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="general" disabled={disabled}>
          General
        </TabsTrigger>
        <TabsTrigger value="cutter" disabled={disabled}>
          Cutter
        </TabsTrigger>
        <TabsTrigger value="shaft" disabled={disabled}>
          Shaft
        </TabsTrigger>
        <TabsTrigger value="post-processor" disabled={disabled}>
          Post processor
        </TabsTrigger>
      </TabsList>

      <TabsContent value="general" className="mt-4">
        <GeneralTab
          description={formData.description}
          vendor={formData.vendor}
          product_id={formData.product_id}
          product_url={formData.product_url}
          notes={formData.notes}
          onChange={onChange}
          disabled={disabled}
        />
      </TabsContent>

      <TabsContent value="cutter" className="mt-4">
        <CutterTab
          tool_type={formData.tool_type}
          unit={formData.unit}
          clockwise_rotation={formData.clockwise_rotation}
          substrate={formData.substrate}
          coating={formData.coating}
          geometry={formData.geometry}
          onChange={onChange}
          disabled={disabled}
        />
      </TabsContent>

      <TabsContent value="shaft" className="mt-4">
        <ShaftTab
          segments={formData.shaft_segments}
          onChange={(segments) => onChange({ shaft_segments: segments })}
          disabled={disabled}
        />
      </TabsContent>

      <TabsContent value="post-processor" className="mt-4">
        <PostProcessorTab
          settings={formData.post_process}
          onChange={(settings) => onChange({ post_process: settings })}
          disabled={disabled}
        />
      </TabsContent>
    </Tabs>
  );
}
