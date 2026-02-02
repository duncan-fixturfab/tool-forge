import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { ToolType, ToolGeometry } from "./agents/schemas"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const TOOL_TYPE_NAMES: Record<ToolType, string> = {
  flat_endmill: "Flat End Mill",
  ball_endmill: "Ball End Mill",
  bull_endmill: "Bull End Mill",
  drill: "Drill",
  spot_drill: "Spot Drill",
  chamfer_mill: "Chamfer Mill",
  face_mill: "Face Mill",
  thread_mill: "Thread Mill",
  reamer: "Reamer",
  tap: "Tap",
  engraving_tool: "Engraving Tool",
}

export function generateToolName(type: ToolType, geometry: ToolGeometry): string {
  const typeName = TOOL_TYPE_NAMES[type]
  const diameter = geometry.diameter_mm
  const flutes = geometry.number_of_flutes
  const cel = geometry.flute_length_mm

  return `${typeName}, D: ${diameter}, FL: ${flutes}, CEL: ${cel}`
}
