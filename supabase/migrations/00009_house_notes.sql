-- house_notes: Single collaborative note per house (like a fridge note)
CREATE TABLE house_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  house_id UUID NOT NULL UNIQUE REFERENCES houses(id) ON DELETE CASCADE,
  content TEXT NOT NULL DEFAULT '',
  updated_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for efficient queries
CREATE INDEX idx_house_notes_house_id ON house_notes(house_id);

-- Enable RLS
ALTER TABLE house_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies (same pattern as bulletin_items)
CREATE POLICY "House members can view house notes" ON house_notes
  FOR SELECT USING (
    house_id IN (
      SELECT house_id FROM house_members
      WHERE user_id = auth.uid() AND invite_status = 'accepted'
    )
  );

CREATE POLICY "House members can insert house notes" ON house_notes
  FOR INSERT WITH CHECK (
    house_id IN (
      SELECT house_id FROM house_members
      WHERE user_id = auth.uid() AND invite_status = 'accepted'
    )
  );

CREATE POLICY "House members can update house notes" ON house_notes
  FOR UPDATE USING (
    house_id IN (
      SELECT house_id FROM house_members
      WHERE user_id = auth.uid() AND invite_status = 'accepted'
    )
  );
