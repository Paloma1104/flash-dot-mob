-- Update Leaderboard Views to Show All Players Who Have Played Games
-- Run this in Supabase SQL Editor to update the views

-- Drop and recreate the global leaderboard view
DROP VIEW IF EXISTS leaderboard_global;

CREATE VIEW leaderboard_global AS
SELECT 
  p.wallet_address,
  p.display_name,
  p.total_points,
  p.total_games_played,
  p.total_wins,
  p.last_active,
  ROW_NUMBER() OVER (ORDER BY p.total_points DESC, p.total_wins DESC, p.total_games_played DESC) as rank
FROM players p
WHERE p.total_games_played > 0
ORDER BY p.total_points DESC, p.total_wins DESC, p.total_games_played DESC
LIMIT 100;

-- Update the nearby leaderboard function
CREATE OR REPLACE FUNCTION get_nearby_leaderboard(
  user_lat DOUBLE PRECISION,
  user_lon DOUBLE PRECISION,
  radius_meters INTEGER DEFAULT 5000
)
RETURNS TABLE (
  wallet_address TEXT,
  display_name TEXT,
  total_points INTEGER,
  total_games_played INTEGER,
  total_wins INTEGER,
  distance_meters DOUBLE PRECISION,
  rank BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.wallet_address,
    p.display_name,
    p.total_points,
    p.total_games_played,
    p.total_wins,
    ST_Distance(
      p.location::geography,
      ST_SetSRID(ST_MakePoint(user_lon, user_lat), 4326)::geography
    ) as distance_meters,
    ROW_NUMBER() OVER (ORDER BY p.total_points DESC, p.total_wins DESC, p.total_games_played DESC) as rank
  FROM players p
  WHERE 
    p.total_games_played > 0
    AND p.location IS NOT NULL
    AND ST_DWithin(
      p.location::geography,
      ST_SetSRID(ST_MakePoint(user_lon, user_lat), 4326)::geography,
      radius_meters
    )
  ORDER BY p.total_points DESC, p.total_wins DESC, p.total_games_played DESC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql;

-- Verify the changes
SELECT 'Views updated successfully!' as status;
