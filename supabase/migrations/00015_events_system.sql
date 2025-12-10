-- Events System Migration
-- Adds calendar events for reservations, arrivals, activities, etc.

-- Create events table
CREATE TABLE public.events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  house_id UUID NOT NULL REFERENCES public.houses(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  name TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  event_time TIME,           -- Optional start time (e.g., "19:00" for 7pm dinner)
  end_date DATE,             -- Optional for multi-day events
  end_time TIME,             -- Optional end time for duration
  links TEXT[],              -- Array of URLs
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create event_participants join table (many-to-many)
CREATE TABLE public.event_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(event_id, user_id)
);

-- Indexes for efficient queries
CREATE INDEX idx_events_house_id ON public.events(house_id);
CREATE INDEX idx_events_created_by ON public.events(created_by);
CREATE INDEX idx_events_date ON public.events(event_date);
CREATE INDEX idx_events_house_date ON public.events(house_id, event_date);
CREATE INDEX idx_event_participants_event_id ON public.event_participants(event_id);
CREATE INDEX idx_event_participants_user_id ON public.event_participants(user_id);

-- Enable RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_participants ENABLE ROW LEVEL SECURITY;

-- Events: House members can view events in their houses
CREATE POLICY "House members can view events"
  ON public.events FOR SELECT
  USING (
    house_id IN (
      SELECT house_id FROM public.house_members
      WHERE user_id = auth.uid() AND invite_status = 'accepted'
    )
  );

-- Events: House members can create events in their houses
CREATE POLICY "House members can create events"
  ON public.events FOR INSERT
  WITH CHECK (
    house_id IN (
      SELECT house_id FROM public.house_members
      WHERE user_id = auth.uid() AND invite_status = 'accepted'
    )
    AND created_by = auth.uid()
  );

-- Events: Creators can update their own events
CREATE POLICY "Event creators can update their events"
  ON public.events FOR UPDATE
  USING (created_by = auth.uid());

-- Events: Creators can delete their own events
CREATE POLICY "Event creators can delete their events"
  ON public.events FOR DELETE
  USING (created_by = auth.uid());

-- Participants: House members can view participants for events in their houses
CREATE POLICY "House members can view event participants"
  ON public.event_participants FOR SELECT
  USING (
    event_id IN (
      SELECT id FROM public.events
      WHERE house_id IN (
        SELECT house_id FROM public.house_members
        WHERE user_id = auth.uid() AND invite_status = 'accepted'
      )
    )
  );

-- Participants: Event creators can add participants
CREATE POLICY "Event creators can add participants"
  ON public.event_participants FOR INSERT
  WITH CHECK (
    event_id IN (SELECT id FROM public.events WHERE created_by = auth.uid())
  );

-- Participants: Event creators can remove participants
CREATE POLICY "Event creators can remove participants"
  ON public.event_participants FOR DELETE
  USING (
    event_id IN (SELECT id FROM public.events WHERE created_by = auth.uid())
  );

-- Updated_at trigger for events
CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at();
