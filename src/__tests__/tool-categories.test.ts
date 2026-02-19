import {
  TOOL_CATEGORIES,
  TOOL_TYPE_TO_CATEGORY_KEY,
  getCategoryForToolType,
  getNextToolNumber,
} from "@/lib/tool-categories";
import { ToolType } from "@/types/database";

describe("Tool Categories", () => {
  describe("TOOL_CATEGORIES ranges", () => {
    it("should define correct range for temporary tools (1-98)", () => {
      expect(TOOL_CATEGORIES.temporary.min).toBe(1);
      expect(TOOL_CATEGORIES.temporary.max).toBe(98);
    });

    it("should define correct range for probe (99)", () => {
      expect(TOOL_CATEGORIES.probe.min).toBe(99);
      expect(TOOL_CATEGORIES.probe.max).toBe(99);
    });

    it("should define correct range for drills (100-199)", () => {
      expect(TOOL_CATEGORIES.drill.min).toBe(100);
      expect(TOOL_CATEGORIES.drill.max).toBe(199);
    });

    it("should define correct range for end mills (200-299)", () => {
      expect(TOOL_CATEGORIES.endmill.min).toBe(200);
      expect(TOOL_CATEGORIES.endmill.max).toBe(299);
    });

    it("should define correct range for face mills (300-399)", () => {
      expect(TOOL_CATEGORIES.facemill.min).toBe(300);
      expect(TOOL_CATEGORIES.facemill.max).toBe(399);
    });

    it("should define correct range for taps (400-499)", () => {
      expect(TOOL_CATEGORIES.tap.min).toBe(400);
      expect(TOOL_CATEGORIES.tap.max).toBe(499);
    });

    it("should define correct range for reamers (500-599)", () => {
      expect(TOOL_CATEGORIES.reamer.min).toBe(500);
      expect(TOOL_CATEGORIES.reamer.max).toBe(599);
    });

    it("should define correct range for chamfer tools (600-699)", () => {
      expect(TOOL_CATEGORIES.chamfer.min).toBe(600);
      expect(TOOL_CATEGORIES.chamfer.max).toBe(699);
    });

    it("should define correct range for specialty tools (700-799)", () => {
      expect(TOOL_CATEGORIES.specialty.min).toBe(700);
      expect(TOOL_CATEGORIES.specialty.max).toBe(799);
    });
  });

  describe("TOOL_TYPE_TO_CATEGORY_KEY", () => {
    it("should map drill to drill category", () => {
      expect(TOOL_TYPE_TO_CATEGORY_KEY.drill).toBe("drill");
    });

    it("should map spot_drill to drill category", () => {
      expect(TOOL_TYPE_TO_CATEGORY_KEY.spot_drill).toBe("drill");
    });

    it("should map flat_endmill to endmill category", () => {
      expect(TOOL_TYPE_TO_CATEGORY_KEY.flat_endmill).toBe("endmill");
    });

    it("should map ball_endmill to endmill category", () => {
      expect(TOOL_TYPE_TO_CATEGORY_KEY.ball_endmill).toBe("endmill");
    });

    it("should map bull_endmill to endmill category", () => {
      expect(TOOL_TYPE_TO_CATEGORY_KEY.bull_endmill).toBe("endmill");
    });

    it("should map face_mill to facemill category", () => {
      expect(TOOL_TYPE_TO_CATEGORY_KEY.face_mill).toBe("facemill");
    });

    it("should map tap to tap category", () => {
      expect(TOOL_TYPE_TO_CATEGORY_KEY.tap).toBe("tap");
    });

    it("should map thread_mill to tap category", () => {
      expect(TOOL_TYPE_TO_CATEGORY_KEY.thread_mill).toBe("tap");
    });

    it("should map reamer to reamer category", () => {
      expect(TOOL_TYPE_TO_CATEGORY_KEY.reamer).toBe("reamer");
    });

    it("should map chamfer_mill to chamfer category", () => {
      expect(TOOL_TYPE_TO_CATEGORY_KEY.chamfer_mill).toBe("chamfer");
    });

    it("should map engraving_tool to specialty category", () => {
      expect(TOOL_TYPE_TO_CATEGORY_KEY.engraving_tool).toBe("specialty");
    });

    it("should have a mapping for every ToolType", () => {
      const toolTypes: ToolType[] = [
        "flat_endmill",
        "ball_endmill",
        "bull_endmill",
        "drill",
        "spot_drill",
        "chamfer_mill",
        "face_mill",
        "thread_mill",
        "reamer",
        "tap",
        "engraving_tool",
      ];
      for (const toolType of toolTypes) {
        expect(TOOL_TYPE_TO_CATEGORY_KEY[toolType]).toBeDefined();
      }
    });
  });

  describe("getCategoryForToolType", () => {
    it("should return the drill category for drills", () => {
      const category = getCategoryForToolType("drill");
      expect(category.key).toBe("drill");
      expect(category.min).toBe(100);
      expect(category.max).toBe(199);
    });

    it("should return the endmill category for flat end mills", () => {
      const category = getCategoryForToolType("flat_endmill");
      expect(category.key).toBe("endmill");
      expect(category.min).toBe(200);
    });

    it("should return the tap category for thread mills", () => {
      const category = getCategoryForToolType("thread_mill");
      expect(category.key).toBe("tap");
      expect(category.min).toBe(400);
    });

    it("should return the specialty category for engraving tools", () => {
      const category = getCategoryForToolType("engraving_tool");
      expect(category.key).toBe("specialty");
      expect(category.min).toBe(700);
      expect(category.max).toBe(799);
    });
  });

  describe("getNextToolNumber", () => {
    it("should return the first number in range when no tools exist", () => {
      expect(getNextToolNumber("drill", [])).toBe(100);
      expect(getNextToolNumber("flat_endmill", [])).toBe(200);
      expect(getNextToolNumber("tap", [])).toBe(400);
      expect(getNextToolNumber("engraving_tool", [])).toBe(700);
    });

    it("should skip used numbers and return the next available one", () => {
      const usedNumbers = [100, 101, 102];
      expect(getNextToolNumber("drill", usedNumbers)).toBe(103);
    });

    it("should only skip numbers within the same category range", () => {
      // Numbers 200-205 are used for end mills; drills start at 100
      const usedNumbers = [200, 201, 202, 203, 204, 205];
      expect(getNextToolNumber("drill", usedNumbers)).toBe(100);
    });

    it("should find gaps in a non-contiguous used list", () => {
      const usedNumbers = [100, 102, 103]; // 101 is free
      expect(getNextToolNumber("drill", usedNumbers)).toBe(101);
    });

    it("should return undefined when the category range is fully exhausted", () => {
      // Fill the entire probe range (only slot 99)
      const usedNumbers = [99];
      expect(getNextToolNumber("drill", usedNumbers.concat(
        Array.from({ length: 100 }, (_, i) => i + 100) // 100-199
      ))).toBeUndefined();
    });

    it("should handle multiple tool types with shared used numbers list", () => {
      const usedNumbers: number[] = [];

      const drill1 = getNextToolNumber("drill", usedNumbers);
      expect(drill1).toBe(100);
      usedNumbers.push(drill1!);

      const drill2 = getNextToolNumber("drill", usedNumbers);
      expect(drill2).toBe(101);
      usedNumbers.push(drill2!);

      const endmill1 = getNextToolNumber("flat_endmill", usedNumbers);
      expect(endmill1).toBe(200);
      usedNumbers.push(endmill1!);

      const tap1 = getNextToolNumber("tap", usedNumbers);
      expect(tap1).toBe(400);
      usedNumbers.push(tap1!);

      // Second drill still finds the next sequential number
      const drill3 = getNextToolNumber("drill", usedNumbers);
      expect(drill3).toBe(102);
    });
  });
});
