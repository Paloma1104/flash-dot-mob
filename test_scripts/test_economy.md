# Token Economy Validation

## 💰 Economic Model Verification

### Exchange Rates

#### MON to AP Conversion

- **Rate**: 100 MON = 1000 AP
- **Ratio**: 1:10
- **Formula**: `AP = (MON / 100) * 1000`

| MON Input | Expected AP Output | Test Result | Status |
| --------- | ------------------ | ----------- | ------ |
| 100       | 1000               | -           | ⏳     |
| 500       | 5000               | -           | ⏳     |
| 1000      | 10000              | -           | ⏳     |
| 5000      | 50000              | -           | ⏳     |
| 50        | ERROR              | -           | ⏳     |
| 150       | ERROR              | -           | ⏳     |

#### AP to Game Play Conversion

| Game Difficulty | AP Cost | Games per 1000 AP | Test Result | Status |
| --------------- | ------- | ----------------- | ----------- | ------ |
| Easy            | 10      | 100               | -           | ⏳     |
| Medium          | 25      | 40                | -           | ⏳     |
| Hard            | 50      | 20                | -           | ⏳     |

### Reward Structure

#### MON Rewards by Difficulty

Based on score multiplier and base rewards:

| Difficulty | Base Reward | Perfect Score | Good Score | OK Score |
| ---------- | ----------- | ------------- | ---------- | -------- |
| Easy       | ~50 MON     | 50            | 35-45      | 20-30    |
| Medium     | ~125 MON    | 125           | 87-112     | 50-75    |
| Hard       | ~250 MON    | 250           | 175-225    | 100-150  |

**Test Cases**:

- [ ] Easy game, 100% accuracy → 50 MON
- [ ] Easy game, 70% accuracy → 35 MON
- [ ] Medium game, 100% accuracy → 125 MON
- [ ] Medium game, 70% accuracy → 87 MON
- [ ] Hard game, 100% accuracy → 250 MON
- [ ] Hard game, 70% accuracy → 175 MON

---

## 🎯 ROI Analysis

### Scenario 1: Perfect Player (100% Accuracy)

#### Easy Games

- **Investment**: 100 MON → 1000 AP → 100 games
- **Returns**: 100 games × 50 MON = 5000 MON
- **Net Profit**: 5000 - 100 = 4900 MON
- **ROI**: 4900%

#### Medium Games

- **Investment**: 100 MON → 1000 AP → 40 games
- **Returns**: 40 games × 125 MON = 5000 MON
- **Net Profit**: 5000 - 100 = 4900 MON
- **ROI**: 4900%

#### Hard Games

- **Investment**: 100 MON → 1000 AP → 20 games
- **Returns**: 20 games × 250 MON = 5000 MON
- **Net Profit**: 5000 - 100 = 4900 MON
- **ROI**: 4900%

**Observation**: All difficulties have same ROI for perfect players - balanced economy ✅

---

### Scenario 2: Average Player (70% Accuracy)

#### Easy Games

- **Investment**: 100 MON → 1000 AP → 100 games
- **Returns**: 100 games × 35 MON = 3500 MON
- **Net Profit**: 3500 - 100 = 3400 MON
- **ROI**: 3400%

#### Medium Games

- **Investment**: 100 MON → 1000 AP → 40 games
- **Returns**: 40 games × 87 MON = 3480 MON
- **Net Profit**: 3480 - 100 = 3380 MON
- **ROI**: 3380%

#### Hard Games

- **Investment**: 100 MON → 1000 AP → 20 games
- **Returns**: 20 games × 175 MON = 3500 MON
- **Net Profit**: 3500 - 100 = 3400 MON
- **ROI**: 3500%

**Observation**: Average players still profit significantly - incentivizes play ✅

---

### Scenario 3: Poor Player (40% Accuracy)

#### Easy Games

- **Investment**: 100 MON → 1000 AP → 100 games
- **Returns**: 100 games × 20 MON = 2000 MON
- **Net Profit**: 2000 - 100 = 1900 MON
- **ROI**: 1900%

#### Medium Games

- **Investment**: 100 MON → 1000 AP → 40 games
- **Returns**: 40 games × 50 MON = 2000 MON
- **Net Profit**: 2000 - 100 = 1900 MON
- **ROI**: 1900%

#### Hard Games

- **Investment**: 100 MON → 1000 AP → 20 games
- **Returns**: 20 games × 100 MON = 2000 MON
- **Net Profit**: 2000 - 100 = 1900 MON
- **ROI**: 1900%

**Observation**: Even poor players profit - very generous economy ⚠️

---

## ⚠️ Economic Sustainability

### Initial Airdrop Impact

- **Per User**: 1000 AP free
- **Equivalent MON Value**: 100 MON
- **User Can Play**:
  - 100 easy games
  - 40 medium games
  - 20 hard games
- **Potential Earnings** (70% accuracy):
  - Easy: 3500 MON
  - Medium: 3480 MON
  - Hard: 3500 MON

**Risk**: Users can earn 3500 MON from free 1000 AP (35x value) ⚠️

### Recommendations

#### Option 1: Reduce Rewards

- Easy: 10 MON (instead of 50)
- Medium: 25 MON (instead of 125)
- Hard: 50 MON (instead of 250)
- **New ROI**: ~1000% for perfect players, ~500% for average

#### Option 2: Reduce Initial Airdrop

- Give 100 AP instead of 1000
- Still allows 10 easy games to try
- Forces earlier purchase decision

#### Option 3: Reduce Exchange Rate

- 100 MON = 100 AP (instead of 1000)
- Makes AP more expensive
- Maintains game costs the same

#### Option 4: Increase Game Costs

- Easy: 50 AP (instead of 10)
- Medium: 125 AP (instead of 25)
- Hard: 250 AP (instead of 50)
- 1000 AP → 20 easy / 8 medium / 4 hard games

---

## 📊 Test Scenarios

### Test 1: Initial Airdrop Value

**Objective**: Verify 1000 AP airdrop value

1. Claim 1000 AP airdrop
2. Play only easy games until AP = 0
3. Claim all rewards
4. ✅ Verify total MON earned
5. Compare to 100 MON cost

**Expected**: User earns 35x value if average player

**Status**: ⏳ Pending

---

### Test 2: Break-Even Point

**Objective**: Find minimum win rate to break even

1. Purchase 100 MON → 1000 AP
2. Play games with varying scores
3. Find score threshold where MON earned = 100 MON

**Expected**: ~15-20% accuracy for break-even

**Status**: ⏳ Pending

---

### Test 3: Whale Attack

**Objective**: Test large-scale exploitation

1. Purchase 10,000 MON → 100,000 AP
2. Play maximum games (rate limited to 20/hour)
3. Play 480 games over 24 hours (20/hour × 24)
4. Calculate max MON earned

**Scenario A: Perfect Player, All Hard Games**

- Investment: 10,000 MON
- Games possible: 100,000 AP / 50 AP = 2000 games
- Rate limited to: 480 games/day
- Over 5 days: 2000 games (consumes all AP)
- Earnings: 2000 × 250 = 500,000 MON
- Profit: 490,000 MON (49x) ⚠️

**Scenario B: Average Player, All Easy Games**

- Investment: 10,000 MON
- Games possible: 100,000 AP / 10 AP = 10,000 games
- Rate limited to: 480 games/day
- Over 21 days: 10,000 games
- Earnings: 10,000 × 35 = 350,000 MON
- Profit: 340,000 MON (34x) ⚠️

**Status**: ⏳ Pending

---

### Test 4: Token Supply

**Objective**: Track total MON distributed

1. Deploy with initial MON supply
2. Track all claimReward() calls
3. Monitor MON balance in GameRewards contract
4. ✅ Verify contract doesn't run out of MON
5. ✅ Calculate burn rate

**Metrics**:

- Total MON distributed per day
- Average MON per user
- Top earners
- MON supply remaining

**Status**: ⏳ Pending

---

### Test 5: AP Token Supply

**Objective**: Verify AP minting/burning balance

1. Track total AP minted (airdrop + purchases)
2. Track total AP burned (games played)
3. Calculate net AP supply
4. ✅ Verify matches on-chain totalSupply()

**Metrics**:

- Total AP minted
- Total AP burned
- Net supply change
- AP per user average

**Status**: ⏳ Pending

---

## 🔒 Economic Safeguards

### Current Protections

- [x] Rate limiting (20 games/hour)
- [x] One-time airdrop per wallet
- [x] EIP-712 signature verification (prevents fake scores)
- [x] AP burning (deflationary for games)
- [ ] MON supply cap
- [ ] Reward scaling based on total players
- [ ] Dynamic pricing

### Recommended Additional Protections

#### 1. Progressive Difficulty Rewards

```solidity
// Reduce rewards as user levels up
function calculateReward(uint256 baseReward, uint256 userLevel) returns (uint256) {
    return baseReward * 100 / (100 + userLevel);
}
```

#### 2. Daily Reward Cap

```solidity
// Max 1000 MON per user per day
mapping(address => mapping(uint256 => uint256)) public dailyRewards;
uint256 public constant MAX_DAILY_REWARDS = 1000 * 10**18;
```

#### 3. Diminishing Returns

```solidity
// Each game in session gives less reward
function getSessionMultiplier(uint256 gamesInHour) returns (uint256) {
    if (gamesInHour <= 5) return 100;      // 100%
    if (gamesInHour <= 10) return 75;      // 75%
    if (gamesInHour <= 15) return 50;      // 50%
    return 25;                              // 25%
}
```

#### 4. Tournament Mode

- Separate economy for competitive play
- Entry fee in MON
- Prize pool distributed to top players
- Sustainable and engaging

---

## 📈 Long-Term Sustainability

### Projected Growth

#### Month 1

- **Users**: 1,000
- **Airdrop Cost**: 1,000,000 AP (≈ 100,000 MON value)
- **Games Played**: ~50,000
- **MON Distributed**: ~1,750,000 MON

#### Month 3

- **Users**: 10,000
- **Airdrop Cost**: 10,000,000 AP
- **Games Played**: ~500,000
- **MON Distributed**: ~17,500,000 MON

#### Year 1

- **Users**: 100,000
- **Total MON Distributed**: ~200,000,000 MON

### Funding Requirements

To sustain this economy, GameRewards contract needs:

- **Initial**: 10,000,000 MON
- **Monthly Top-Up**: ~6,000,000 MON
- **Annual**: ~70,000,000 MON

**Recommendation**: Implement revenue stream or reduce reward rates ⚠️

---

## ✅ Validation Checklist

- [ ] All exchange rates calculate correctly
- [ ] Rewards scale properly with difficulty
- [ ] ROI reasonable for all player skill levels
- [ ] Airdrop value not exploitable
- [ ] Rate limiting prevents abuse
- [ ] Economic model sustainable long-term
- [ ] Token supply tracked accurately
- [ ] Whale attacks mitigated
- [ ] Break-even point reasonable
- [ ] Daily reward caps (if implemented)

## 🎯 Final Recommendations

### For Testnet (Current)

✅ Keep generous rewards - encourages testing and engagement

### For Mainnet (Future)

⚠️ **Must implement**:

1. Reduce rewards by 10x
2. Reduce airdrop to 100 AP
3. Add daily reward cap (1000 MON)
4. Implement diminishing returns
5. Add tournament mode for high-skill players
6. Monitor and adjust dynamically

---

## 📝 Test Results

| Test                    | Expected      | Actual | Status |
| ----------------------- | ------------- | ------ | ------ |
| 100 MON → AP            | 1000 AP       | -      | ⏳     |
| Easy game cost          | 10 AP         | -      | ⏳     |
| Medium game cost        | 25 AP         | -      | ⏳     |
| Hard game cost          | 50 AP         | -      | ⏳     |
| Perfect easy reward     | 50 MON        | -      | ⏳     |
| Perfect medium reward   | 125 MON       | -      | ⏳     |
| Perfect hard reward     | 250 MON       | -      | ⏳     |
| Initial airdrop         | 1000 AP       | -      | ⏳     |
| Airdrop once per wallet | TRUE          | -      | ⏳     |
| Rate limit              | 20 games/hour | -      | ⏳     |

**Overall Status**: ⏳ Testing not yet started
