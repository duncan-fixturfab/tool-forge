-- Seed Data for Tool Forge
-- ==============================

-- ==============================
-- SEED MATERIALS
-- ==============================

INSERT INTO materials (name, category, description, hardness_hrc_min, hardness_hrc_max, hardness_brinell, surface_speed_min_m_min, surface_speed_max_m_min, chip_load_factor, common_grades) VALUES

-- Aluminum alloys
('6061 Aluminum', 'aluminum', 'General purpose aluminum alloy, excellent machinability', NULL, NULL, 95, 150, 500, 1.2, ARRAY['6061-T6', '6061-T651']),
('7075 Aluminum', 'aluminum', 'High strength aluminum alloy, aerospace grade', NULL, NULL, 150, 120, 400, 1.1, ARRAY['7075-T6', '7075-T651']),
('2024 Aluminum', 'aluminum', 'High strength aluminum, good fatigue resistance', NULL, NULL, 120, 130, 450, 1.15, ARRAY['2024-T3', '2024-T351']),
('Cast Aluminum', 'aluminum', 'Cast aluminum alloys', NULL, NULL, 80, 100, 350, 1.0, ARRAY['A356', 'A380', '319']),

-- Steels
('1018 Steel', 'steel', 'Low carbon steel, excellent machinability', NULL, NULL, 126, 60, 150, 1.0, ARRAY['1018', 'A36']),
('4140 Steel', 'steel', 'Chrome-moly alloy steel', 28, 32, 197, 50, 120, 0.9, ARRAY['4140', '4142']),
('4340 Steel', 'steel', 'High strength alloy steel', 28, 36, 217, 45, 100, 0.85, ARRAY['4340']),
('Tool Steel D2', 'steel', 'High carbon, high chromium tool steel', 58, 62, NULL, 20, 60, 0.6, ARRAY['D2', 'A2']),

-- Stainless steels
('304 Stainless', 'stainless_steel', 'Austenitic stainless steel, most common', NULL, NULL, 201, 40, 100, 0.75, ARRAY['304', '304L']),
('316 Stainless', 'stainless_steel', 'Marine grade stainless steel', NULL, NULL, 217, 35, 90, 0.7, ARRAY['316', '316L']),
('17-4 PH Stainless', 'stainless_steel', 'Precipitation hardening stainless', 35, 44, NULL, 30, 80, 0.65, ARRAY['17-4 PH', '15-5 PH']),

-- Titanium
('Ti-6Al-4V', 'titanium', 'Grade 5 titanium, most common titanium alloy', 36, 40, 334, 30, 60, 0.5, ARRAY['Grade 5', 'Ti 6-4']),
('Pure Titanium', 'titanium', 'Commercially pure titanium', NULL, NULL, 200, 40, 80, 0.6, ARRAY['Grade 2', 'Grade 4']),

-- Brass/Copper
('360 Brass', 'brass', 'Free-cutting brass, excellent machinability', NULL, NULL, 78, 100, 300, 1.3, ARRAY['C36000', 'Free Cutting Brass']),
('C110 Copper', 'copper', 'Electrolytic tough pitch copper', NULL, NULL, 50, 80, 250, 1.2, ARRAY['C110', 'ETP Copper']),

-- Plastics
('Delrin (POM)', 'plastic', 'Acetal homopolymer, excellent dimensional stability', NULL, NULL, NULL, 100, 400, 1.5, ARRAY['Delrin', 'Acetal', 'POM']),
('HDPE', 'plastic', 'High density polyethylene', NULL, NULL, NULL, 150, 500, 1.6, ARRAY['HDPE', 'PE-HD']),
('Acrylic (PMMA)', 'plastic', 'Polymethyl methacrylate, clear plastic', NULL, NULL, NULL, 100, 350, 1.4, ARRAY['Acrylic', 'PMMA', 'Plexiglass']),
('UHMW', 'plastic', 'Ultra-high molecular weight polyethylene', NULL, NULL, NULL, 150, 500, 1.6, ARRAY['UHMW', 'UHMWPE']),
('Nylon 6/6', 'plastic', 'Polyamide, good wear resistance', NULL, NULL, NULL, 100, 400, 1.4, ARRAY['Nylon 6/6', 'PA66']),

-- Wood
('Hardwood', 'wood', 'Oak, maple, walnut, etc.', NULL, NULL, NULL, 200, 600, 1.5, ARRAY['Oak', 'Maple', 'Walnut', 'Cherry']),
('Softwood', 'wood', 'Pine, cedar, spruce, etc.', NULL, NULL, NULL, 250, 800, 1.8, ARRAY['Pine', 'Cedar', 'Spruce']),
('MDF', 'wood', 'Medium density fiberboard', NULL, NULL, NULL, 200, 500, 1.4, ARRAY['MDF']),
('Plywood', 'wood', 'Laminated wood product', NULL, NULL, NULL, 200, 500, 1.4, ARRAY['Baltic Birch', 'Marine Plywood']),

-- Composites
('Carbon Fiber', 'composite', 'CFRP - Carbon fiber reinforced polymer', NULL, NULL, NULL, 50, 150, 0.6, ARRAY['CFRP', 'Carbon Fiber']),
('G10/FR4', 'composite', 'Glass fiber reinforced epoxy laminate', NULL, NULL, NULL, 60, 180, 0.7, ARRAY['G10', 'FR4', 'Garolite']),

-- Cast Iron
('Gray Cast Iron', 'cast_iron', 'Most common cast iron', NULL, NULL, 200, 60, 120, 0.9, ARRAY['Class 30', 'Class 40']),
('Ductile Iron', 'cast_iron', 'Nodular cast iron', NULL, NULL, 250, 50, 100, 0.85, ARRAY['65-45-12', '80-55-06']);

-- ==============================
-- SEED MACHINES
-- ==============================

INSERT INTO machines (name, manufacturer, model, description, max_rpm, min_rpm, spindle_power_kw, travel_x_mm, travel_y_mm, travel_z_mm, max_feed_xy_mm_min, max_feed_z_mm_min, tool_holder_type, max_tool_diameter_mm, is_public) VALUES

-- Desktop/Hobbyist machines
('Shapeoko 4', 'Carbide 3D', 'Shapeoko 4 XL', 'Popular desktop CNC router', 24000, 10000, 1.1, 838, 406, 95, 10000, 5000, 'ER11', 6.35, true),
('Nomad 3', 'Carbide 3D', 'Nomad 3', 'Desktop CNC mill, enclosed', 24000, 2000, 0.25, 203, 203, 76, 2540, 2540, 'ER11', 6.35, true),
('Bantam Tools Desktop', 'Bantam Tools', 'Desktop PCB Milling Machine', 'Desktop CNC for PCB and soft materials', 26000, 10000, 0.25, 140, 114, 38, 4572, 4572, 'ER11', 6.35, true),

-- Prosumer/Small Shop
('Tormach PCNC 440', 'Tormach', 'PCNC 440', 'Compact benchtop CNC mill', 10000, 100, 0.75, 254, 159, 254, 4064, 2540, 'TTS', 25.4, true),
('Tormach PCNC 770', 'Tormach', 'PCNC 770', 'Popular prosumer vertical mill', 10000, 100, 1.5, 457, 305, 419, 4064, 2540, 'TTS', 38.1, true),
('Tormach PCNC 1100', 'Tormach', 'PCNC 1100', 'Larger prosumer vertical mill', 10000, 100, 2.2, 635, 381, 419, 4064, 2540, 'TTS', 50.8, true),
('Pocket NC V2-50', 'Pocket NC', 'V2-50', '5-axis desktop CNC mill', 50000, 2000, 0.35, 127, 76, 63, 3000, 3000, 'ER11', 6.35, true),

-- Industrial/Professional
('Haas VF-2', 'Haas', 'VF-2', 'Vertical machining center', 8100, 1, 22.4, 762, 406, 508, 25400, 25400, 'CAT40', 89, true),
('Haas Mini Mill', 'Haas', 'Mini Mill', 'Compact vertical machining center', 6000, 1, 7.5, 406, 305, 254, 12700, 12700, 'CAT40', 63.5, true),
('DMG MORI CMX 600 V', 'DMG MORI', 'CMX 600 V', 'High-precision vertical machining center', 12000, 1, 18.5, 600, 560, 510, 36000, 36000, 'SK40/BT40', 80, true),

-- Routers
('Avid CNC PRO4824', 'Avid CNC', 'PRO4824', 'Full-size CNC router', 24000, 8000, 2.2, 1219, 610, 152, 15000, 7500, 'ER20', 12.7, true),
('Shopbot PRSalpha', 'ShopBot', 'PRSalpha 96-48', 'Large format CNC router', 18000, 8000, 3.0, 2438, 1219, 203, 15000, 7500, 'ER20', 12.7, true),

-- High Speed
('Datron neo', 'Datron', 'neo', 'High-speed dental/small parts mill', 60000, 5000, 2.0, 360, 360, 220, 30000, 30000, 'ER11', 10, true),

-- Specific brands popular with hobbyists
('PrintNC', 'PrintNC', 'V2', 'Open source steel frame CNC router', 24000, 8000, 2.2, 600, 400, 150, 15000, 5000, 'ER20', 12.7, true),
('Onefinity Woodworker', 'Onefinity', 'Woodworker X-35', 'Desktop CNC router', 24000, 10000, 2.2, 812, 812, 114, 10000, 5000, 'ER20', 12.7, true);
