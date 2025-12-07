-- Create bulletin_items table for bulletin board feature
CREATE TABLE bulletin_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  house_id UUID NOT NULL REFERENCES houses(id) ON DELETE CASCADE,
  category TEXT DEFAULT NULL,  -- Optional: 'wifi', 'house_rules', 'emergency', 'local_tips'
  title TEXT NOT NULL,
  content TEXT NOT NULL,       -- Stores markdown content
  color TEXT DEFAULT 'yellow',
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for efficient queries by house
CREATE INDEX idx_bulletin_items_house_id ON bulletin_items(house_id);

-- Enable Row Level Security
ALTER TABLE bulletin_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies: House members can manage bulletin items
CREATE POLICY "House members can view bulletin items" ON bulletin_items
  FOR SELECT USING (
    house_id IN (
      SELECT house_id FROM house_members
      WHERE user_id = auth.uid() AND invite_status = 'accepted'
    )
  );

CREATE POLICY "House members can insert bulletin items" ON bulletin_items
  FOR INSERT WITH CHECK (
    house_id IN (
      SELECT house_id FROM house_members
      WHERE user_id = auth.uid() AND invite_status = 'accepted'
    )
  );

CREATE POLICY "House members can update bulletin items" ON bulletin_items
  FOR UPDATE USING (
    house_id IN (
      SELECT house_id FROM house_members
      WHERE user_id = auth.uid() AND invite_status = 'accepted'
    )
  );

CREATE POLICY "House members can delete bulletin items" ON bulletin_items
  FOR DELETE USING (
    house_id IN (
      SELECT house_id FROM house_members
      WHERE user_id = auth.uid() AND invite_status = 'accepted'
    )
  );
