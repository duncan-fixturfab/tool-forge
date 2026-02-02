import {
  generateFusion360Tool,
  generateFusion360Library,
  validateLibrary,
} from "@/lib/fusion360/generator";
import { Tool, Machine, Material, MachineMaterialPreset } from "@/types/database";

describe("Fusion360 Generator", () => {
  const mockMachine: Machine = {
    id: "test-machine",
    name: "Test CNC",
    manufacturer: "Test",
    model: "TM-1",
    max_rpm: 24000,
    min_rpm: 1000,
    spindle_power_kw: 2.2,
    max_feed_xy_mm_min: 10000,
    max_feed_z_mm_min: 5000,
    is_public: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const mockAluminum: Material = {
    id: "aluminum-6061",
    name: "6061 Aluminum",
    category: "aluminum",
    chip_load_factor: 1.2,
    surface_speed_max_m_min: 400,
    is_public: true,
    created_at: new Date().toISOString(),
  };

  const mockTool: Tool = {
    id: "test-tool-1",
    user_id: "user-1",
    name: "1/4\" 3-Flute Carbide End Mill",
    tool_type: "flat_endmill",
    vendor: "Harvey Tool",
    product_id: "46062-C3",
    geometry: {
      diameter_mm: 6.35,
      number_of_flutes: 3,
      overall_length_mm: 63.5,
      flute_length_mm: 19.05,
      shank_diameter_mm: 6.35,
      helix_angle_deg: 45,
    },
    coating: "AlTiN",
    substrate: "Carbide",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  describe("generateFusion360Tool", () => {
    it("should generate a valid Fusion360 tool structure", () => {
      const presets = new Map<string, MachineMaterialPreset>();
      const fusionTool = generateFusion360Tool(
        mockTool,
        1,
        undefined, // postProcess
        mockMachine,
        [mockAluminum],
        presets
      );

      // Check basic structure
      expect(fusionTool.type).toBe("flat end mill");
      expect(fusionTool.description).toBe(mockTool.name);
      expect(fusionTool.vendor).toBe("Harvey Tool");
      expect(fusionTool["product-id"]).toBe("46062-C3");
      expect(fusionTool.unit).toBe("millimeters");

      // Check geometry
      expect(fusionTool.geometry.DC).toBe(6.35);
      expect(fusionTool.geometry.NOF).toBe(3);
      expect(fusionTool.geometry.LCF).toBe(19.05);
      expect(fusionTool.geometry.OAL).toBe(63.5);
      expect(fusionTool.geometry.SFDM).toBe(6.35);
      expect(fusionTool.geometry.HA).toBe(45);

      // Check post-process
      expect(fusionTool["post-process"].number).toBe(1);
      expect(fusionTool["post-process"]["length-offset"]).toBe(1);
      expect(fusionTool["post-process"]["diameter-offset"]).toBe(1);

      // Check presets
      expect(fusionTool["start-values"].presets).toHaveLength(1);
      expect(fusionTool["start-values"].presets[0].name).toBe("6061 Aluminum");
    });

    it("should generate correct presets with cutting parameters", () => {
      const presets = new Map<string, MachineMaterialPreset>();
      const fusionTool = generateFusion360Tool(
        mockTool,
        1,
        undefined, // postProcess
        mockMachine,
        [mockAluminum],
        presets
      );

      const preset = fusionTool["start-values"].presets[0];

      // Check that preset has required fields
      expect(preset.n).toBeGreaterThan(0);
      expect(preset.v_f).toBeGreaterThan(0);
      expect(preset.v_f_plunge).toBeGreaterThan(0);
      expect(preset.n).toBeLessThanOrEqual(mockMachine.max_rpm);
      expect(preset.v_f).toBeLessThanOrEqual(mockMachine.max_feed_xy_mm_min!);
    });

    it("should generate end mill presets with all required Fusion360 fields", () => {
      const presets = new Map<string, MachineMaterialPreset>();
      const fusionTool = generateFusion360Tool(
        mockTool,
        1,
        undefined,
        mockMachine,
        [mockAluminum],
        presets
      );

      const preset = fusionTool["start-values"].presets[0];

      // Check new required fields
      expect(preset.guid).toBeDefined();
      expect(preset.guid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);

      // Note: Presets should NOT have expressions - only tool-level objects have expressions
      expect(preset.material).toBeDefined();
      expect(preset.material.category).toBe("all");
      expect(preset.material["use-hardness"]).toBe(false);

      expect(preset["tool-coolant"]).toBeDefined();
      expect(preset["ramp-angle"]).toBe(2);
      expect(preset["use-stepdown"]).toBe(true);
      expect(preset["use-stepover"]).toBe(true);

      // End mill specific fields
      expect(preset.f_n).toBeDefined();
      expect(preset.f_z).toBeDefined();
      expect(preset.v_f_transition).toBe(preset.v_f);
      expect(preset.v_f_ramp).toBe(preset.v_f);
    });

    it("should generate drill presets with drill-specific fields", () => {
      const drillTool: Tool = {
        ...mockTool,
        id: "test-drill-2",
        name: "6mm Carbide Drill",
        tool_type: "drill",
        geometry: {
          diameter_mm: 6,
          number_of_flutes: 2,
          overall_length_mm: 62,
          flute_length_mm: 30,
          point_angle_deg: 135,
        },
      };

      const presets = new Map<string, MachineMaterialPreset>();
      const fusionTool = generateFusion360Tool(
        drillTool,
        1,
        undefined,
        mockMachine,
        [mockAluminum],
        presets
      );

      const preset = fusionTool["start-values"].presets[0];

      // Check drill-specific fields
      expect(preset.guid).toBeDefined();
      // Note: Presets should NOT have expressions - only tool-level objects have expressions
      expect(preset.material).toBeDefined();
      expect(preset["tool-coolant"]).toBeDefined();
      expect(preset["use-feed-per-revolution"]).toBe(false);
      expect(preset.v_f_retract).toBeGreaterThan(0);
      expect(preset.v_f_plunge).toBeGreaterThan(0);

      // Drill presets should NOT have end mill fields
      expect(preset.v_f).toBeUndefined();
      expect(preset.stepdown).toBeUndefined();
      expect(preset["use-stepdown"]).toBeUndefined();
    });

    it("should map drill tool type correctly", () => {
      const drillTool: Tool = {
        ...mockTool,
        id: "test-drill",
        name: "5mm Carbide Drill",
        tool_type: "drill",
        geometry: {
          diameter_mm: 5,
          number_of_flutes: 2,
          overall_length_mm: 62,
          flute_length_mm: 30,
          point_angle_deg: 135,
        },
      };

      const presets = new Map<string, MachineMaterialPreset>();
      const fusionTool = generateFusion360Tool(
        drillTool,
        2,
        undefined, // postProcess
        mockMachine,
        [mockAluminum],
        presets
      );

      expect(fusionTool.type).toBe("drill");
      expect(fusionTool.geometry.SIG).toBe(135);
    });

    it("should include substrate info (BMC)", () => {
      const presets = new Map<string, MachineMaterialPreset>();
      const fusionTool = generateFusion360Tool(
        mockTool,
        1,
        undefined, // postProcess
        mockMachine,
        [mockAluminum],
        presets
      );

      // Note: GRADE is not used by Fusion360 (validator has it commented out)
      // Only BMC (body material class) is required
      expect(fusionTool.BMC).toBe("Carbide");
    });
  });

  describe("generateFusion360Library", () => {
    it("should generate a library with correct version", () => {
      const library = generateFusion360Library({
        libraryName: "Test Library",
        tools: [{ tool: mockTool, toolNumber: 1 }],
        machine: mockMachine,
        materials: [mockAluminum],
        presets: new Map(),
      });

      expect(library.version).toBe(36);
    });

    it("should include all tools", () => {
      const tool2: Tool = {
        ...mockTool,
        id: "test-tool-2",
        name: "3/8\" 4-Flute End Mill",
        geometry: {
          ...mockTool.geometry,
          diameter_mm: 9.525,
          number_of_flutes: 4,
        },
      };

      const library = generateFusion360Library({
        libraryName: "Test Library",
        tools: [
          { tool: mockTool, toolNumber: 1 },
          { tool: tool2, toolNumber: 2 },
        ],
        machine: mockMachine,
        materials: [mockAluminum],
        presets: new Map(),
      });

      expect(library.data).toHaveLength(2);
      expect(library.data[0]["post-process"].number).toBe(1);
      expect(library.data[1]["post-process"].number).toBe(2);
    });

    it("should generate presets for all materials", () => {
      const mockSteel: Material = {
        id: "steel-1018",
        name: "1018 Steel",
        category: "steel",
        chip_load_factor: 1.0,
        surface_speed_max_m_min: 100,
        is_public: true,
        created_at: new Date().toISOString(),
      };

      const library = generateFusion360Library({
        libraryName: "Test Library",
        tools: [{ tool: mockTool, toolNumber: 1 }],
        machine: mockMachine,
        materials: [mockAluminum, mockSteel],
        presets: new Map(),
      });

      const presets = library.data[0]["start-values"].presets;
      expect(presets).toHaveLength(2);
      expect(presets.map((p) => p.name)).toContain("6061 Aluminum");
      expect(presets.map((p) => p.name)).toContain("1018 Steel");
    });
  });

  describe("validateLibrary", () => {
    it("should validate a correct library", () => {
      const library = generateFusion360Library({
        libraryName: "Test Library",
        tools: [{ tool: mockTool, toolNumber: 1 }],
        machine: mockMachine,
        materials: [mockAluminum],
        presets: new Map(),
      });

      const result = validateLibrary(library);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should detect empty library", () => {
      const result = validateLibrary({ data: [], version: 17 });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Library contains no tools");
    });

    it("should detect missing diameter", () => {
      const library = {
        data: [
          {
            type: "flat end mill",
            geometry: { DC: 0 },
            "start-values": { presets: [{ name: "Test", n: 10000, v_f: 1000, v_f_plunge: 500 }] },
          },
        ],
        version: 17,
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = validateLibrary(library as any);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("diameter"))).toBe(true);
    });

    it("should detect missing presets", () => {
      const library = {
        data: [
          {
            type: "flat end mill",
            geometry: { DC: 6 },
            "start-values": { presets: [] },
          },
        ],
        version: 17,
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = validateLibrary(library as any);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("presets"))).toBe(true);
    });

    it("should detect invalid RPM", () => {
      const library = {
        data: [
          {
            type: "flat end mill",
            geometry: { DC: 6 },
            "start-values": { presets: [{ name: "Test", n: 0, v_f: 1000, v_f_plunge: 500 }] },
          },
        ],
        version: 17,
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = validateLibrary(library as any);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("RPM"))).toBe(true);
    });
  });
});
