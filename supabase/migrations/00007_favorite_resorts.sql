-- Add favorite_resort_ids array to houses for tracking multiple resorts
ALTER TABLE houses
ADD COLUMN favorite_resort_ids UUID[] DEFAULT '{}';

-- Create index for efficient lookups
CREATE INDEX idx_houses_favorite_resort_ids ON houses USING GIN (favorite_resort_ids);
