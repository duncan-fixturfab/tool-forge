-- Seed Data for Common Tool Holders
-- ==================================
-- These are public system holders (user_id = NULL) available to all users

-- ISO20 ER16 Collet Chuck (Tormach style - from example data)
INSERT INTO tool_holders (
  id, user_id, name, description, taper_type, collet_type,
  collet_min_mm, collet_max_mm, gauge_length_mm, segments,
  vendor, product_id, product_url, is_public
) VALUES (
  '7d08fb9e-62b6-4b20-bcef-e55107cb9de9',
  NULL,
  'ISO20 ER16 Collet Chuck',
  'Standard ISO20 taper with ER16 collet chuck. Suitable for tools with 1-10mm shank diameter.',
  'ISO20',
  'ER16',
  1.0, 10.0,
  55,
  '[
    {"height": 19, "lower_diameter": 28, "upper_diameter": 28},
    {"height": 8.5, "lower_diameter": 24, "upper_diameter": 24},
    {"height": 27.5, "lower_diameter": 28, "upper_diameter": 28}
  ]'::jsonb,
  'Tormach',
  '50891',
  'https://tormach.com/iso20-tool-holder-er20a-30mm-gauge-length-50891.html',
  true
);

-- ISO20 ER20 Collet Chuck
INSERT INTO tool_holders (
  id, user_id, name, description, taper_type, collet_type,
  collet_min_mm, collet_max_mm, gauge_length_mm, segments,
  vendor, product_id, product_url, is_public
) VALUES (
  gen_random_uuid(),
  NULL,
  'ISO20 ER20 Collet Chuck',
  'Standard ISO20 taper with ER20 collet chuck. Suitable for tools with 1-13mm shank diameter.',
  'ISO20',
  'ER20',
  1.0, 13.0,
  60,
  '[
    {"height": 20, "lower_diameter": 32, "upper_diameter": 32},
    {"height": 10, "lower_diameter": 28, "upper_diameter": 28},
    {"height": 30, "lower_diameter": 32, "upper_diameter": 32}
  ]'::jsonb,
  'Tormach',
  '50892',
  'https://tormach.com/iso20-tool-holder-er20.html',
  true
);

-- CAT40 ER32 Collet Chuck
INSERT INTO tool_holders (
  id, user_id, name, description, taper_type, collet_type,
  collet_min_mm, collet_max_mm, gauge_length_mm, segments,
  vendor, product_id, product_url, is_public
) VALUES (
  gen_random_uuid(),
  NULL,
  'CAT40 ER32 Collet Chuck',
  'CAT40 taper with ER32 collet chuck. Suitable for tools with 2-20mm shank diameter.',
  'CAT40',
  'ER32',
  2.0, 20.0,
  100,
  '[
    {"height": 35, "lower_diameter": 63, "upper_diameter": 63},
    {"height": 15, "lower_diameter": 50, "upper_diameter": 50},
    {"height": 50, "lower_diameter": 50, "upper_diameter": 45}
  ]'::jsonb,
  NULL,
  NULL,
  NULL,
  true
);

-- BT30 ER25 Collet Chuck
INSERT INTO tool_holders (
  id, user_id, name, description, taper_type, collet_type,
  collet_min_mm, collet_max_mm, gauge_length_mm, segments,
  vendor, product_id, product_url, is_public
) VALUES (
  gen_random_uuid(),
  NULL,
  'BT30 ER25 Collet Chuck',
  'BT30 taper with ER25 collet chuck. Suitable for tools with 1-16mm shank diameter.',
  'BT30',
  'ER25',
  1.0, 16.0,
  70,
  '[
    {"height": 25, "lower_diameter": 45, "upper_diameter": 45},
    {"height": 12, "lower_diameter": 38, "upper_diameter": 38},
    {"height": 33, "lower_diameter": 42, "upper_diameter": 38}
  ]'::jsonb,
  NULL,
  NULL,
  NULL,
  true
);

-- BT40 ER32 Collet Chuck
INSERT INTO tool_holders (
  id, user_id, name, description, taper_type, collet_type,
  collet_min_mm, collet_max_mm, gauge_length_mm, segments,
  vendor, product_id, product_url, is_public
) VALUES (
  gen_random_uuid(),
  NULL,
  'BT40 ER32 Collet Chuck',
  'BT40 taper with ER32 collet chuck. Suitable for tools with 2-20mm shank diameter.',
  'BT40',
  'ER32',
  2.0, 20.0,
  90,
  '[
    {"height": 30, "lower_diameter": 55, "upper_diameter": 55},
    {"height": 15, "lower_diameter": 45, "upper_diameter": 45},
    {"height": 45, "lower_diameter": 50, "upper_diameter": 45}
  ]'::jsonb,
  NULL,
  NULL,
  NULL,
  true
);

-- HSK-A63 ER32 Collet Chuck
INSERT INTO tool_holders (
  id, user_id, name, description, taper_type, collet_type,
  collet_min_mm, collet_max_mm, gauge_length_mm, segments,
  vendor, product_id, product_url, is_public
) VALUES (
  gen_random_uuid(),
  NULL,
  'HSK-A63 ER32 Collet Chuck',
  'HSK-A63 taper with ER32 collet chuck. High-speed spindle compatible. Suitable for tools with 2-20mm shank diameter.',
  'HSK-A63',
  'ER32',
  2.0, 20.0,
  80,
  '[
    {"height": 20, "lower_diameter": 63, "upper_diameter": 63},
    {"height": 15, "lower_diameter": 48, "upper_diameter": 48},
    {"height": 45, "lower_diameter": 50, "upper_diameter": 42}
  ]'::jsonb,
  NULL,
  NULL,
  NULL,
  true
);

-- R8 ER32 Collet Chuck (Bridgeport style)
INSERT INTO tool_holders (
  id, user_id, name, description, taper_type, collet_type,
  collet_min_mm, collet_max_mm, gauge_length_mm, segments,
  vendor, product_id, product_url, is_public
) VALUES (
  gen_random_uuid(),
  NULL,
  'R8 ER32 Collet Chuck',
  'R8 taper with ER32 collet chuck. Common on Bridgeport-style mills. Suitable for tools with 2-20mm shank diameter.',
  'R8',
  'ER32',
  2.0, 20.0,
  75,
  '[
    {"height": 30, "lower_diameter": 44, "upper_diameter": 44},
    {"height": 15, "lower_diameter": 38, "upper_diameter": 38},
    {"height": 30, "lower_diameter": 44, "upper_diameter": 40}
  ]'::jsonb,
  NULL,
  NULL,
  NULL,
  true
);

-- TTS ER20 (Tormach Tooling System)
INSERT INTO tool_holders (
  id, user_id, name, description, taper_type, collet_type,
  collet_min_mm, collet_max_mm, gauge_length_mm, segments,
  vendor, product_id, product_url, is_public
) VALUES (
  gen_random_uuid(),
  NULL,
  'TTS ER20 Collet Chuck',
  'Tormach Tooling System (TTS) with ER20 collet chuck. For Tormach PCNC mills without ATC.',
  'TTS',
  'ER20',
  1.0, 13.0,
  50,
  '[
    {"height": 12, "lower_diameter": 38.1, "upper_diameter": 38.1},
    {"height": 8, "lower_diameter": 32, "upper_diameter": 32},
    {"height": 30, "lower_diameter": 38.1, "upper_diameter": 32}
  ]'::jsonb,
  'Tormach',
  '31825',
  'https://tormach.com/tts-er20-collet-chuck-31825.html',
  true
);
