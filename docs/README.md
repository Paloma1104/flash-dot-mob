# Flash.Mob Backend API

Backend signing service for Flash.Mob blockchain integration.

## Purpose

Provides EIP-712 signatures for:
- **Game rewards** - Verifies game completion and signs reward claims
- **Location drops** - Verifies GPS proximity and signs drop claims

This prevents users from cheating by:
- Claiming rewards without playing games
- Claiming drops from far away locations

## Quick Start

```bash
# Install dependencies
npm install

# Start development server (with hot reload)
npm run dev

# Start production server
npm start
```

Server runs on **http://localhost:3001**

## API Endpoints

### POST /api/sign-reward
Sign game reward claim

**Request:**
```json
{
  "sessionId": "game-123",
  "player": "0x742d35Cc...",
  "score": 85,
  "difficulty": "medium",
  "gameType": "sudoku"
}
```

**Response:**
```json
{
  "success": true,
  "signature": "0xabc...",
  "monReward": 106,
  "deadline": 1737522000,
  "sessionIdBytes32": "0xdef..."
}
```

### POST /api/sign-drop
Sign location drop claim (with GPS verification)

**Request:**
```json
{
  "dropId": "drop-xyz",
  "claimer": "0x742d35Cc...",
  "amount": 100,
  "userLat": 37.7749,
  "userLon": -122.4194,
  "dropLat": 37.7750,
  "dropLon": -122.4195
}
```

**Response:**
```json
{
  "success": true,
  "signature": "0xghi...",
  "nonce": 1705789234,
  "deadline": 1705792834,
  "dropIdBytes32": "0xjkl..."
}
```

**Error (too far away):**
```json
{
  "error": "Not in range",
  "message": "You must be within 50 meters of the drop location"
}
```

### GET /health
Health check endpoint

**Response:**
```json
{
  "status": "healthy",
  "signer": "0x8626...",
  "chainId": 31337,
  "timestamp": "2026-01-22T10:30:00Z"
}
```

## Configuration

Set these in your `.env` (root directory):

```env
BACKEND_PORT=3001
BACKEND_PRIVATE_KEY=0x0000000000000000000000000000000000000000000000000000000000001234
EXPO_PUBLIC_GAME_REWARDS_ADDRESS=0xF62849F9A0B5Bf2913b396098F7c7019b51A820a
EXPO_PUBLIC_FLASH_MOB_ADDRESS=0x5991A2dF15A8F6A256D3Ec51E99254Cd3fb576A9
EXPO_PUBLIC_CHAIN_ID=31337
```

## How It Works

### Game Rewards

1. Player completes game (frontend)
2. Frontend calls `/api/sign-reward` with score
3. Backend:
   - Calculates MON reward based on score & difficulty
   - Signs EIP-712 message with GameRewards domain
   - Returns signature
4. Frontend submits signature + score to GameRewards contract
5. Contract verifies signature matches backend signer
6. MON tokens transferred to player

### Location Drops

1. Player walks to drop location (frontend)
2. Frontend gets GPS coordinates
3. Frontend calls `/api/sign-drop` with user & drop coords
4. Backend:
   - Calculates distance (Haversine formula)
   - Rejects if > 50 meters
   - Signs EIP-712 message with FlashMobV2 domain
   - Returns signature
5. Frontend submits signature to FlashMobV2 contract
6. Contract verifies signature
7. MON tokens transferred to player

## Security

- **Private Key**: Never commit real private keys!
- **Rate Limiting**: Add in production (Express-rate-limit)
- **Authentication**: Add JWT tokens for production
- **Nonce Tracking**: Currently uses timestamp, should use database
- **GPS Spoofing**: Additional checks needed for production

## Development

### Watch Mode
```bash
npm run dev
```
Auto-restarts on file changes

### View Logs
```bash
# Terminal shows:
✅ Signed reward for 0x742d35Cc...: 106 MON
✅ Signed drop claim for 0x742d35Cc...: 100 MON
❌ Error signing reward: Invalid score
```

### Test Endpoints
```bash
# Health check
curl http://localhost:3001/health

# Sign reward
curl -X POST http://localhost:3001/api/sign-reward \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"test","player":"0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb","score":85,"difficulty":"medium","gameType":"sudoku"}'

# Sign drop (in range)
curl -X POST http://localhost:3001/api/sign-drop \
  -H "Content-Type: application/json" \
  -d '{"dropId":"test","claimer":"0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb","amount":100,"userLat":37.7749,"userLon":-122.4194,"dropLat":37.7750,"dropLon":-122.4195}'
```

## Production Deployment

Before deploying to production:

1. **Generate secure private key**
   ```bash
   node -e "console.log('0x' + require('crypto').randomBytes(32).toString('hex'))"
   ```

2. **Use environment variables** (not .env file)
   - Railway, Heroku, AWS: Set via dashboard
   - Never commit private keys to git

3. **Add database** for nonce tracking
   - PostgreSQL or MongoDB
   - Track nonces per user per contract

4. **Add rate limiting**
   ```typescript
   import rateLimit from 'express-rate-limit';
   const limiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 100 // limit each IP to 100 requests per windowMs
   });
   app.use('/api/', limiter);
   ```

5. **Add authentication**
   - Verify requests from your frontend only
   - Use JWT tokens or API keys

6. **HTTPS only**
   - Use reverse proxy (nginx, Cloudflare)
   - Never send signatures over HTTP

## Troubleshooting

### Port already in use
```bash
# Find process
lsof -i :3001
# Kill process
kill -9 <PID>
```

### Module not found
```bash
npm install
```

### Signature verification fails
- Check `BACKEND_PRIVATE_KEY` matches backend signer in contracts
- Check contract addresses correct
- Check chain ID matches (31337 for Anvil)

### GPS verification fails
- Increase range in `verifyLocation()` for testing
- Check lat/lon format (decimal degrees)
- Check user actually within 50m

---

**Ready to run!** Start with `npm run dev`
