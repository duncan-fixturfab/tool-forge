import { ToolType } from "@/types/database";

export interface ToolCategory {
  key: string;
  name: string;
  description: string;
  min: number;
  max: number;
}

export const TOOL_CATEGORIES: Record<string, ToolCategory> = {
  temporary: {
    key: "temporary",
    name: "One-offs/Temporary",
    description: "Temporary or one-off tools",
    min: 1,
    max: 98,
  },
  probe: {
    key: "probe",
    name: "Probe",
    description: "Probing tools",
    min: 99,
    max: 99,
  },
  drill: {
    key: "drill",
    name: "Drills",
    description: "Drilling tools",
    min: 100,
    max: 199,
  },
  endmill: {
    key: "endmill",
    name: "End Mills",
    description: "End milling tools",
    min: 200,
    max: 299,
  },
  facemill: {
    key: "facemill",
    name: "Face Mills",
    description: "Face milling tools",
    min: 300,
    max: 399,
  },
  tap: {
    key: "tap",
    name: "Taps",
    description: "Tapping and thread milling tools",
    min: 400,
    max: 499,
  },
  reamer: {
    key: "reamer",
    name: "Reamers",
    description: "Reaming tools",
    min: 500,
    max: 599,
  },
  chamfer: {
    key: "chamfer",
    name: "Chamfer/Countersink",
    description: "Chamfer and countersink tools",
    min: 600,
    max: 699,
  },
  specialty: {
    key: "specialty",
    name: "Specialty/Engraving",
    description: "Specialty and engraving tools",
    min: 700,
    max: 799,
  },
};

export const TOOL_TYPE_TO_CATEGORY_KEY: Record<ToolType, string> = {
  drill: "drill",
  spot_drill: "drill",
  flat_endmill: "endmill",
  ball_endmill: "endmill",
  bull_endmill: "endmill",
  face_mill: "facemill",
  tap: "tap",
  thread_mill: "tap",
  reamer: "reamer",
  chamfer_mill: "chamfer",
  engraving_tool: "specialty",
};

/**
 * Returns the tool category for a given tool type.
 * Falls back to the "temporary" category if no mapping is found.
 */
export function getCategoryForToolType(toolType: ToolType): ToolCategory {
  const categoryKey = TOOL_TYPE_TO_CATEGORY_KEY[toolType];
  return TOOL_CATEGORIES[categoryKey] ?? TOOL_CATEGORIES.temporary;
}

/**
 * Returns the next available tool number within the category range for the
 * given tool type, skipping any numbers already in use.
 *
 * Returns `undefined` if the entire range is exhausted.
 */
export function getNextToolNumber(
  toolType: ToolType,
  usedNumbers: number[]
): number | undefined {
  const category = getCategoryForToolType(toolType);
  const usedSet = new Set(usedNumbers);

  for (let n = category.min; n <= category.max; n++) {
    if (!usedSet.has(n)) {
      return n;
    }
  }

  return undefined;
}
