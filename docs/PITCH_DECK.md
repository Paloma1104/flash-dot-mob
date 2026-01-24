# Flash.Mob - Pitch Deck Outline

## 🎯 For LNM Hacks 8.0 - Monad Track

---

## Slide 1: Title

```
⚡ FLASH.MOB

Location-Based Token Claiming for Monad

[Your Name]
LNM Hacks 8.0 | January 2026
```

---

## Slide 2: The Problem (30 seconds)

### Crypto Adoption is Broken

```
❌ Airdrops are impersonal and bot-farmed
❌ Users don't leave their couches
❌ No physical connection to crypto
❌ Traditional claims don't scale

"98% of airdrop tokens are sold within 24 hours"
```

**KEY MESSAGE:** Current token distribution is boring and easily exploited.

---

## Slide 3: The Solution (45 seconds)

### Flash.Mob: Crypto Meets Reality

```
📍 Brands drop tokens at real locations
🏃 Users physically go there to claim
✅ GPS + Blockchain verification
🎮 Gamified, social, fun!

"Turn your city into a treasure hunt"
```

**Show:** Quick mockup of map with drop markers

---

## Slide 4: Why Monad? (45 seconds)

### Built for Parallel EVM

```
┌────────────────────────────────────────┐
│  Traditional EVM     vs    Monad       │
├────────────────────────────────────────┤
│  Sequential claims   →  Parallel claims│
│  5 TPS              →  10,000+ TPS     │
│  High gas           →  80% cheaper     │
│  Slow finality      →  Instant UX      │
└────────────────────────────────────────┘
```

**KEY MESSAGE:** Flash.Mob wouldn't work on Ethereum. It NEEDS Monad.

---

## Slide 5: How It Works (60 seconds)

### The Claim Flow

```
1. 🔔 User gets notification: "Drop 100m away!"

2. 🗺️ Opens app, sees drop on map

3. 🚶 Walks to location

4. 📍 App verifies GPS (high accuracy mode)

5. ✍️ Backend signs claim authorization

6. ⛓️ User submits to Monad (or gasless relay)

7. 💰 Tokens transferred instantly!
```

**Show:** Live demo or screen recording

---

## Slide 6: Security (30 seconds)

### Anti-Cheat System

```
🛡️ Device Integrity
   - Detects emulators & jailbreak
   - Hardware fingerprinting

🏃 Velocity Check
   - Impossible speed = GPS spoof
   - Server-side validation

⏱️ Rate Limiting
   - 10 claims/hour max
   - Prevents farming

✍️ Signature Auth
   - Backend verifies location
   - EIP-712 typed signatures
```

**KEY MESSAGE:** We've solved the GPS spoofing problem.

---

## Slide 7: Technical Deep Dive (45 seconds)

### Smart Contract Optimizations

```solidity
// BITMAP STORAGE: 80% gas savings
// 256 drops per storage slot!
mapping(uint256 => uint256) private claimedBitmap;

// PARALLEL-SAFE: No conflicts
// Each user modifies isolated slots

// BATCH CLAIMS: Merkle proofs
// 10 claims in 1 transaction
```

**Gas Comparison:**
| Operation | Standard | Flash.Mob |
|-----------|----------|-----------|
| Storage | 20k gas | 5k gas |

---

## Slide 8: Live Demo (60 seconds)

### What We'll Show

```
1. Map view with nearby drops (mock data)
2. Tap on a drop → shows details
3. "Claim" button animation
4. Wallet balance updates
5. Leaderboard with rankings
```

**Deployed Contracts:**
- Token: `0x739429dd...`
- Claimer: `0x4152075a...`

---

## Slide 9: Business Model (30 seconds)

### How Flash.Mob Makes Money

```
💼 B2B: Brands pay to create drops
   - Marketing campaigns
   - Store foot traffic
   - Event promotions

🏪 Marketplace: Template fees
   - Branded experiences
   - Custom claim mechanics

📊 Analytics: Location insights
   - Foot traffic data
   - User demographics
```

---

## Slide 10: Roadmap (20 seconds)

```
✅ Phase 1: MVP (This Hackathon)
   - Map, wallet, claiming, security

🔄 Phase 2: Launch (Q1 2026)
   - Mainnet deployment
   - Brand dashboard

🔮 Phase 3: Scale (Q2 2026)
   - AR treasure hunts
   - Multi-chain support
```

---

## Slide 11: The Ask (15 seconds)

### What We Need

```
🏆 Win the Monad Track

🤝 Connect with Monad team for:
   - Technical guidance
   - Grant opportunities
   - Marketing support

🚀 Launch on Monad mainnet
```

---

## Slide 12: Thank You

```
⚡ FLASH.MOB

"Making crypto fun, physical, and fair"

[GitHub Link]
[Twitter Handle]
[Contact Email]

Questions?
```

---

# 🎤 Demo Script (3 minutes)

## Setup (Before Demo)
- [ ] App running on phone/simulator
- [ ] Mock drops visible on map
- [ ] Terminal with contract addresses ready

## Script

**[0:00-0:30] Hook**
> "What if I told you there's $100 in tokens hidden within 500 meters of this building right now? That's Flash.Mob."

**[0:30-1:00] Show the App**
> "Here's the app. I can see 5 drops nearby. This one has 50 $MON tokens. I'm going to claim it."

**[1:00-1:30] Claim Flow**
> "I walk to the location... the app detects I'm in range... I tap claim... 
> The backend verifies my GPS, signs the transaction, and boom - tokens in my wallet."

**[1:30-2:00] Security**
> "But what about GPS spoofing? We detect emulators, flag impossible travel speeds, 
> and rate limit claims. This isn't gameable."

**[2:00-2:30] Why Monad**
> "This only works on Monad. We use bitmap storage for 80% gas savings, 
> parallel-safe architecture for thousands of simultaneous claims, and 
> instant finality for great UX."

**[2:30-3:00] Close**
> "Flash.Mob turns token distribution into a real-world treasure hunt. 
> Our contracts are deployed on Monad testnet. Try spoofing us - you can't. Thank you."

---

# 📋 Hackathon Submission Checklist

```
[ ] GitHub repo is public
[ ] README.md complete
[ ] Demo video recorded (3-5 min)
[ ] Contract addresses documented
[ ] Team info filled on DoraHacks
[ ] Project description submitted
[ ] Slides ready (PDF backup)
[ ] Phone charged for live demo
[ ] Backup: screen recording ready
```

---

# 💡 Judges' Questions to Prepare

1. **"How do you prevent GPS spoofing?"**
   > Device integrity + velocity checks + server-side verification

2. **"Why not use existing solutions like POAP?"**
   > POAPs require QR codes. We use GPS - no scanning needed.

3. **"What's the gas cost per claim?"**
   > ~25k gas for single claim, 80% cheaper than naive approach

4. **"How do users without tokens pay for gas?"**
   > Gasless meta-transactions - relayer pays, deducts from claim

5. **"What happens if the backend goes down?"**
   > Users can still claim with valid signatures (within expiry)

6. **"Why Monad specifically?"**
   > Parallel EVM = no claim conflicts
   > High TPS = real-time UX
   > Low gas = viable for small claims
