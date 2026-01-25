# Supabase Setup Guide for Flash.Mob Leaderboard

## Quick Setup (5 minutes)

### 1. Run the SQL Schema

1. Go to your Supabase project: https://supabase.com/dashboard/project/xnnaenodkttxljdwntbb
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste the entire contents of `supabase_schema.sql`
5. Click **Run** (or press Cmd/Ctrl + Enter)

This will create:
- ✅ `players` table - stores player profiles and stats
- ✅ `game_sessions` table - records all game plays with location
- ✅ `leaderboard_global` view - global top 100 players
- ✅ `get_nearby_leaderboard()` function - location-based leaderboard
- ✅ Auto-update triggers - keeps player stats in sync
- ✅ Indexes for fast queries
- ✅ Row Level Security policies

### 2. Verify Setup

Run this query to check if tables were created:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('players', 'game_sessions');
```

You should see both tables listed.

### 3. Test the System

The backend is already configured and will automatically:
- Save game sessions to Supabase when players complete games
- Update player stats (points, games played, wins)
- Track player locations for nearby leaderboard

### 4. View Data

Go to **Table Editor** in Supabase to see:
- `players` - All registered players
- `game_sessions` - All completed games

## Features

### Global Leaderboard
- Top 100 players worldwide
- Ranked by total points
- Accessible at: `GET /api/leaderboard/global`

### Nearby Leaderboard
- Players within customizable radius (default 5km)
- Uses PostGIS for efficient location queries
- Accessible at: `GET /api/leaderboard/nearby?lat=26.9363&lon=75.9235&radius=5000`

### Player Profiles
- Individual player stats
- Game history
- Display names
- Accessible at: `GET /api/player/:address`

## API Endpoints

All endpoints are available at `http://172.22.67.186:3001`:

```
GET  /api/leaderboard/global
GET  /api/leaderboard/nearby?lat=X&lon=Y&radius=Z
GET  /api/player/:address
GET  /api/player/:address/sessions
POST /api/player/update-name
```

## Frontend Integration

The leaderboard is integrated into the Market tab:
1. Open the app
2. Go to Market tab
3. Switch to "🏆 Leaderboard" tab
4. Toggle between "📍 Nearby" and "🌍 Global"

The Profile tab shows:
- Player stats (points, credits, games, win rate)
- Global rank
- Recent game history
- Editable display name

## Troubleshooting

### No data showing?
- Play some games first! Data appears after completing games
- Check backend logs for Supabase connection errors
- Verify `.env` has correct Supabase credentials

### Location not working?
- Grant location permissions in the app
- Check if PostGIS extension is enabled in Supabase

### Backend errors?
- Restart backend: `cd backend && npm start`
- Check Supabase service role key is correct
- Verify network connectivity to Supabase

## Database Schema

### players table
- `wallet_address` - Unique player identifier
- `display_name` - Optional custom name
- `total_points` - Cumulative points earned
- `total_games_played` - Number of games
- `total_wins` - Games with score > 0
- `credits` - Current credit balance
- `location` - PostGIS geography point

### game_sessions table
- `wallet_address` - Player who played
- `game_type` - Type of game
- `difficulty` - easy/medium/hard
- `score` - Game score (0-100)
- `points_earned` - Points awarded (score/10)
- `location` - Where game was played
- `tx_hash` - Blockchain transaction

## Next Steps

1. ✅ Run the SQL schema
2. ✅ Play some games to populate data
3. ✅ Check leaderboard in Market tab
4. ✅ View your profile in Profile tab
5. ✅ Customize display name

That's it! Your leaderboard is now live and tracking all game activity.
