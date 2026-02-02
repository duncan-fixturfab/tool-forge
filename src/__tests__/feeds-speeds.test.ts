import {
  calculateRpm,
  calculateFeedRate,
  calculateSurfaceSpeed,
  calculateCuttingParameters,
  calculateChipThinningFeed,
  calculateMrr,
} from "@/lib/calculators/feeds-speeds";
import { Machine, Material, MachineMaterialPreset, ToolGeometry } from "@/types/database";

describe("Feed/Speed Calculator", () => {
  describe("calculateRpm", () => {
    it("should calculate RPM correctly for 6mm endmill at 200 m/min", () => {
      // N = (Vc × 1000) / (π × D)
      // N = (200 × 1000) / (π × 6)
      // N ≈ 10610
      const rpm = calculateRpm(200, 6);
      expect(rpm).toBeCloseTo(10610, -1); // Within 10 RPM
    });

    it("should calculate RPM correctly for 1/4 inch endmill at 150 m/min", () => {
      const diameter = 6.35; // 1/4 inch in mm
      const rpm = calculateRpm(150, diameter);
      // N = (150 × 1000) / (π × 6.35) ≈ 7520
      expect(rpm).toBeCloseTo(7520, -1);
    });

    it("should calculate RPM correctly for large diameter tool", () => {
      const rpm = calculateRpm(100, 50);
      // N = (100 × 1000) / (π × 50) ≈ 637
      expect(rpm).toBeCloseTo(637, -1);
    });
  });

  describe("calculateFeedRate", () => {
    it("should calculate feed rate correctly", () => {
      // F = N × fz × z
      // F = 10000 × 0.05 × 3 = 1500 mm/min
      const feed = calculateFeedRate(10000, 0.05, 3);
      expect(feed).toBe(1500);
    });

    it("should handle 4 flute endmill", () => {
      const feed = calculateFeedRate(8000, 0.04, 4);
      // F = 8000 × 0.04 × 4 = 1280 mm/min
      expect(feed).toBe(1280);
    });

    it("should handle single flute tool", () => {
      const feed = calculateFeedRate(24000, 0.1, 1);
      // F = 24000 × 0.1 × 1 = 2400 mm/min
      expect(feed).toBe(2400);
    });
  });

  describe("calculateSurfaceSpeed", () => {
    it("should calculate surface speed from RPM and diameter", () => {
      // Vc = (π × D × N) / 1000
      const surfaceSpeed = calculateSurfaceSpeed(10000, 6);
      // Vc = (π × 6 × 10000) / 1000 ≈ 188.5 m/min
      expect(surfaceSpeed).toBeCloseTo(188.5, 1);
    });
  });

  describe("calculateCuttingParameters", () => {
    const mockMachine: Machine = {
      id: "test-machine",
      name: "Test Machine",
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

    const mockSteel: Material = {
      id: "steel-1018",
      name: "1018 Steel",
      category: "steel",
      chip_load_factor: 1.0,
      surface_speed_max_m_min: 100,
      is_public: true,
      created_at: new Date().toISOString(),
    };

    const mockGeometry: ToolGeometry = {
      diameter_mm: 6.35,
      number_of_flutes: 3,
      overall_length_mm: 63.5,
      flute_length_mm: 19.05,
    };

    it("should calculate parameters for aluminum with default settings", () => {
      const params = calculateCuttingParameters({
        toolGeometry: mockGeometry,
        toolType: "flat_endmill",
        machine: mockMachine,
        material: mockAluminum,
      });

      // Should respect machine max RPM
      expect(params.rpm).toBeLessThanOrEqual(mockMachine.max_rpm);
      expect(params.rpm).toBeGreaterThanOrEqual(mockMachine.min_rpm);

      // Should have reasonable feed rate
      expect(params.feed_mm_min).toBeGreaterThan(0);
      expect(params.feed_mm_min).toBeLessThanOrEqual(mockMachine.max_feed_xy_mm_min!);

      // Plunge should be less than XY feed
      expect(params.plunge_feed_mm_min).toBeLessThanOrEqual(params.feed_mm_min);
    });

    it("should calculate lower RPM for steel", () => {
      const aluminumParams = calculateCuttingParameters({
        toolGeometry: mockGeometry,
        toolType: "flat_endmill",
        machine: mockMachine,
        material: mockAluminum,
      });

      const steelParams = calculateCuttingParameters({
        toolGeometry: mockGeometry,
        toolType: "flat_endmill",
        machine: mockMachine,
        material: mockSteel,
      });

      // Steel should have lower RPM than aluminum (lower surface speed)
      expect(steelParams.rpm).toBeLessThan(aluminumParams.rpm);
    });

    it("should use preset values when provided", () => {
      const preset: MachineMaterialPreset = {
        id: "test-preset",
        machine_id: mockMachine.id,
        material_id: mockAluminum.id,
        surface_speed_m_min: 300,
        chip_load_mm: 0.08,
        axial_depth_factor: 1.5,
        radial_depth_factor: 0.4,
        plunge_rate_factor: 0.3,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const params = calculateCuttingParameters({
        toolGeometry: mockGeometry,
        toolType: "flat_endmill",
        machine: mockMachine,
        material: mockAluminum,
        preset,
      });

      // Axial depth should be 1.5× diameter
      expect(params.axial_depth_mm).toBeCloseTo(6.35 * 1.5, 1);

      // Radial depth should be 0.4× diameter
      expect(params.radial_depth_mm).toBeCloseTo(6.35 * 0.4, 1);
    });

    it("should handle drill tool type differently", () => {
      const drillGeometry: ToolGeometry = {
        diameter_mm: 6.35,
        number_of_flutes: 2,
        overall_length_mm: 100,
        flute_length_mm: 50,
        point_angle_deg: 118,
      };

      const params = calculateCuttingParameters({
        toolGeometry: drillGeometry,
        toolType: "drill",
        machine: mockMachine,
        material: mockAluminum,
      });

      // For drills, feed should equal plunge feed
      expect(params.feed_mm_min).toBe(params.plunge_feed_mm_min);

      // Axial depth should be flute length
      expect(params.axial_depth_mm).toBe(drillGeometry.flute_length_mm);
    });

    it("should clamp RPM to machine limits", () => {
      const limitedMachine: Machine = {
        ...mockMachine,
        max_rpm: 6000,
        min_rpm: 500,
      };

      const params = calculateCuttingParameters({
        toolGeometry: mockGeometry,
        toolType: "flat_endmill",
        machine: limitedMachine,
        material: mockAluminum,
      });

      expect(params.rpm).toBeLessThanOrEqual(6000);
      expect(params.rpm).toBeGreaterThanOrEqual(500);
    });
  });

  describe("calculateChipThinningFeed", () => {
    it("should not increase feed at 50% engagement", () => {
      const baseFeed = 1000;
      const adjusted = calculateChipThinningFeed(baseFeed, 10, 5);
      expect(adjusted).toBe(baseFeed);
    });

    it("should increase feed at lower engagement", () => {
      const baseFeed = 1000;
      const adjusted = calculateChipThinningFeed(baseFeed, 10, 2);
      expect(adjusted).toBeGreaterThan(baseFeed);
    });

    it("should cap feed multiplier at 2x", () => {
      const baseFeed = 1000;
      const adjusted = calculateChipThinningFeed(baseFeed, 10, 0.5);
      expect(adjusted).toBeLessThanOrEqual(baseFeed * 2);
    });
  });

  describe("calculateMrr", () => {
    it("should calculate material removal rate correctly", () => {
      // MRR = ap × ae × Vf / 1000 (cm³/min)
      const mrr = calculateMrr(1000, 5, 3);
      // MRR = 5 × 3 × 1000 / 1000 = 15 cm³/min
      expect(mrr).toBe(15);
    });

    it("should handle small values", () => {
      const mrr = calculateMrr(500, 1, 0.5);
      // MRR = 1 × 0.5 × 500 / 1000 = 0.25 cm³/min
      expect(mrr).toBe(0.25);
    });
  });
});
