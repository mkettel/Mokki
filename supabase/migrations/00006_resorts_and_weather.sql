-- Create resorts table for ski resort data
CREATE TABLE resorts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  latitude DECIMAL(9,6) NOT NULL,
  longitude DECIMAL(9,6) NOT NULL,
  elevation_base INTEGER,        -- in feet
  elevation_summit INTEGER,      -- in feet
  timezone TEXT DEFAULT 'America/Los_Angeles',
  website_url TEXT,
  webcam_urls JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for common queries
CREATE INDEX idx_resorts_slug ON resorts(slug);

-- RLS: Resorts are publicly readable
ALTER TABLE resorts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view resorts" ON resorts
  FOR SELECT USING (true);

-- Add resort_id to houses table
ALTER TABLE houses
ADD COLUMN resort_id UUID REFERENCES resorts(id) ON DELETE SET NULL;

CREATE INDEX idx_houses_resort_id ON houses(resort_id);

-- Seed popular ski resorts with coordinates
INSERT INTO resorts (name, slug, latitude, longitude, elevation_base, elevation_summit, timezone, website_url, webcam_urls) VALUES
-- Lake Tahoe Region
('Palisades Tahoe', 'palisades-tahoe', 39.1969, -120.2356, 6200, 9050, 'America/Los_Angeles', 'https://www.palisadestahoe.com',
  '[{"name": "High Camp", "url": "https://www.palisadestahoe.com/the-mountain/mountain-conditions/mountain-cams", "type": "embed"}]'::jsonb),
('Northstar California', 'northstar', 39.2746, -120.1211, 6330, 8610, 'America/Los_Angeles', 'https://www.northstarcalifornia.com',
  '[]'::jsonb),
('Kirkwood Mountain', 'kirkwood', 38.6850, -120.0650, 7800, 9800, 'America/Los_Angeles', 'https://www.kirkwood.com',
  '[]'::jsonb),
('Heavenly', 'heavenly', 38.9353, -119.9400, 6540, 10067, 'America/Los_Angeles', 'https://www.skiheavenly.com',
  '[]'::jsonb),
('Sugar Bowl', 'sugar-bowl', 39.3047, -120.3344, 6883, 8383, 'America/Los_Angeles', 'https://www.sugarbowl.com',
  '[]'::jsonb),
('Sierra at Tahoe', 'sierra-at-tahoe', 38.8019, -120.0803, 6640, 8852, 'America/Los_Angeles', 'https://www.sierraattahoe.com',
  '[]'::jsonb),
('Mt Rose', 'mt-rose', 39.3149, -119.8855, 7900, 9700, 'America/Los_Angeles', 'https://www.skirose.com',
  '[]'::jsonb),
('Boreal', 'boreal', 39.3324, -120.3479, 7200, 7800, 'America/Los_Angeles', 'https://www.rideboreal.com',
  '[]'::jsonb),

-- California
('Mammoth Mountain', 'mammoth', 37.6485, -119.0324, 7953, 11053, 'America/Los_Angeles', 'https://www.mammothmountain.com',
  '[]'::jsonb),

-- Colorado
('Vail', 'vail', 39.6403, -106.3742, 8120, 11570, 'America/Denver', 'https://www.vail.com',
  '[]'::jsonb),
('Breckenridge', 'breckenridge', 39.4817, -106.0384, 9600, 12998, 'America/Denver', 'https://www.breckenridge.com',
  '[]'::jsonb),
('Aspen Snowmass', 'aspen-snowmass', 39.2084, -106.9490, 8104, 12510, 'America/Denver', 'https://www.aspensnowmass.com',
  '[]'::jsonb),

-- Utah
('Park City', 'park-city', 40.6514, -111.5080, 6800, 10000, 'America/Denver', 'https://www.parkcitymountain.com',
  '[]'::jsonb),
('Snowbird', 'snowbird', 40.5830, -111.6538, 7760, 11000, 'America/Denver', 'https://www.snowbird.com',
  '[]'::jsonb),

-- Pacific Northwest
('Crystal Mountain', 'crystal-mountain', 46.9282, -121.4746, 4400, 7012, 'America/Los_Angeles', 'https://www.crystalmountainresort.com',
  '[]'::jsonb),
('Mt Bachelor', 'mt-bachelor', 43.9792, -121.6886, 5700, 9065, 'America/Los_Angeles', 'https://www.mtbachelor.com',
  '[]'::jsonb);
