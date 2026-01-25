-- Flash.Mob Leaderboard Schema for Supabase
-- Run this SQL in your Supabase SQL Editor

-- Enable PostGIS for location-based queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- Players table
CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT UNIQUE NOT NULL,
  display_name TEXT,
  total_points INTEGER DEFAULT 0,
  total_games_played INTEGER DEFAULT 0,
  total_wins INTEGER DEFAULT 0,
  credits INTEGER DEFAULT 0,
  has_claimed_free_credits BOOLEAN DEFAULT FALSE,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  location GEOGRAPHY(POINT, 4326), -- PostGIS geography type for efficient location queries
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Game sessions table
CREATE TABLE IF NOT EXISTS game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  game_type TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  score INTEGER NOT NULL,
  points_earned INTEGER NOT NULL,
  credits_spent INTEGER DEFAULT 5,
  time_spent INTEGER, -- in seconds
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  location GEOGRAPHY(POINT, 4326),
  tx_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Leaderboard view - Global (show all players who have played games)
CREATE OR REPLACE VIEW leaderboard_global AS
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

-- Function to get nearby leaderboard (within radius in meters)
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

-- Function to update player stats after game
CREATE OR REPLACE FUNCTION update_player_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update player stats
  UPDATE players
  SET 
    total_points = total_points + NEW.points_earned,
    total_games_played = total_games_played + 1,
    total_wins = total_wins + CASE WHEN NEW.score > 0 THEN 1 ELSE 0 END,
    latitude = COALESCE(NEW.latitude, latitude),
    longitude = COALESCE(NEW.longitude, longitude),
    location = CASE 
      WHEN NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL 
      THEN ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography
      ELSE location
    END,
    last_active = NOW(),
    updated_at = NOW()
  WHERE wallet_address = NEW.wallet_address;
  
  -- Create player if doesn't exist
  IF NOT FOUND THEN
    INSERT INTO players (
      wallet_address,
      total_points,
      total_games_played,
      total_wins,
      latitude,
      longitude,
      location
    ) VALUES (
      NEW.wallet_address,
      NEW.points_earned,
      1,
      CASE WHEN NEW.score > 0 THEN 1 ELSE 0 END,
      NEW.latitude,
      NEW.longitude,
      CASE 
        WHEN NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL 
        THEN ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography
        ELSE NULL
      END
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update player stats when game session is inserted
DROP TRIGGER IF EXISTS trigger_update_player_stats ON game_sessions;
CREATE TRIGGER trigger_update_player_stats
  AFTER INSERT ON game_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_player_stats();

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_players_wallet ON players(wallet_address);
CREATE INDEX IF NOT EXISTS idx_players_points ON players(total_points DESC);
CREATE INDEX IF NOT EXISTS idx_players_location ON players USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_game_sessions_player ON game_sessions(player_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_wallet ON game_sessions(wallet_address);
CREATE INDEX IF NOT EXISTS idx_game_sessions_created ON game_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_game_sessions_location ON game_sessions USING GIST(location);

-- Row Level Security (RLS) Policies
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;

-- Allow public read access to leaderboard data
CREATE POLICY "Public read access to players" ON players
  FOR SELECT USING (true);

CREATE POLICY "Public read access to game sessions" ON game_sessions
  FOR SELECT USING (true);

-- Allow authenticated inserts (backend will use service role key)
CREATE POLICY "Service role can insert players" ON players
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can update players" ON players
  FOR UPDATE USING (true);

CREATE POLICY "Service role can insert game sessions" ON game_sessions
  FOR INSERT WITH CHECK (true);

-- Sample data for testing (optional - remove in production)
-- INSERT INTO players (wallet_address, display_name, total_points, total_games_played, total_wins, latitude, longitude, location)
-- VALUES 
--   ('0x1234567890123456789012345678901234567890', 'Player1', 150, 10, 7, 26.9363, 75.9235, ST_SetSRID(ST_MakePoint(75.9235, 26.9363), 4326)::geography),
--   ('0x2234567890123456789012345678901234567890', 'Player2', 120, 8, 5, 26.9370, 75.9240, ST_SetSRID(ST_MakePoint(75.9240, 26.9370), 4326)::geography),
--   ('0x3234567890123456789012345678901234567890', 'Player3', 100, 6, 4, 26.9350, 75.9230, ST_SetSRID(ST_MakePoint(75.9230, 26.9350), 4326)::geography);

COMMENT ON TABLE players IS 'Stores player profiles and aggregate stats';
COMMENT ON TABLE game_sessions IS 'Records individual game sessions with location data';
COMMENT ON FUNCTION get_nearby_leaderboard IS 'Returns leaderboard for players within specified radius';
