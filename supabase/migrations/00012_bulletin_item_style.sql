-- Add style column to bulletin_items for different note appearances
ALTER TABLE bulletin_items
ADD COLUMN style TEXT DEFAULT 'sticky';

-- Add comment for documentation
COMMENT ON COLUMN bulletin_items.style IS 'Visual style: sticky, paper, sticker, keychain';
