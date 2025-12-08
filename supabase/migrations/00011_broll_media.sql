-- B-Roll Media Gallery Feature
-- Allows house members to share photos and videos in a feed

-- Create media_type enum
CREATE TYPE media_type AS ENUM ('image', 'video');

-- Create b_roll_media table
CREATE TABLE public.b_roll_media (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  house_id UUID NOT NULL REFERENCES public.houses(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES public.profiles(id),
  media_type media_type NOT NULL,
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  thumbnail_url TEXT,
  caption TEXT,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  width INTEGER,
  height INTEGER,
  duration INTEGER,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indexes for efficient queries
CREATE INDEX idx_broll_media_house_id ON public.b_roll_media(house_id);
CREATE INDEX idx_broll_media_uploaded_by ON public.b_roll_media(uploaded_by);
CREATE INDEX idx_broll_media_house_created ON public.b_roll_media(house_id, created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.b_roll_media ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- House members can view b-roll media for their houses
CREATE POLICY "House members can view b-roll media"
  ON public.b_roll_media FOR SELECT
  USING (
    house_id IN (
      SELECT house_id FROM public.house_members
      WHERE user_id = auth.uid() AND invite_status = 'accepted'
    )
  );

-- House members can upload b-roll media to their houses
CREATE POLICY "House members can upload b-roll media"
  ON public.b_roll_media FOR INSERT
  WITH CHECK (
    house_id IN (
      SELECT house_id FROM public.house_members
      WHERE user_id = auth.uid() AND invite_status = 'accepted'
    )
    AND uploaded_by = auth.uid()
  );

-- Users can update their own b-roll media (caption only)
CREATE POLICY "Users can update their own b-roll media"
  ON public.b_roll_media FOR UPDATE
  USING (uploaded_by = auth.uid());

-- Users can delete their own b-roll media
CREATE POLICY "Users can delete their own b-roll media"
  ON public.b_roll_media FOR DELETE
  USING (uploaded_by = auth.uid());

-- Add updated_at trigger
CREATE TRIGGER update_broll_media_updated_at
  BEFORE UPDATE ON public.b_roll_media
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at();
