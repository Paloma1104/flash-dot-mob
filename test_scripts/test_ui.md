# UI/UX Testing Checklist

## 🎨 Wallet Screen (AP Balance Display)

### Visual Tests

- [ ] **AP Balance Card Visible**
  - Card displays below MON balance
  - Has distinct teal/cyan gradient (rgba(78, 205, 196, ...))
  - Shows "ACTIVITY POINTS" label
  - Displays AP balance as integer (no decimals)
- [ ] **Buy AP Button**
  - Button visible in top-right of AP card
  - Says "+ Buy AP"
  - Teal color scheme matches card
  - Clickable and responsive

- [ ] **AP Info Text**
  - Shows: "🎮 Use AP to play games • 100 MON = 1000 AP"
  - Located at bottom of AP card
  - Gray/muted color
  - Legible font size

### Functional Tests

- [ ] **AP Balance Updates**
  - Initial value is 0
  - Updates after claiming airdrop
  - Updates after purchase
  - Updates after playing game (deduction)

- [ ] **Buy AP Button**
  - Opens APPurchaseModal when clicked
  - Modal displays correctly
  - Modal can be closed

## 💳 AP Purchase Modal

### Visual Tests

- [ ] **Modal Appearance**
  - Dark overlay behind modal
  - Modal centered on screen
  - Rounded corners
  - Border glow effect
  - Close button (X) in top-right

- [ ] **Exchange Rate Display**
  - Purple gradient card
  - Shows "Exchange Rate"
  - Shows "100 MON = 1000 AP"
  - Large, readable text

- [ ] **Balance Display**
  - Two cards side-by-side
  - Left: MON Balance
  - Right: AP Balance
  - Current values displayed
  - Proper formatting

- [ ] **Input Section**
  - Label: "MON Amount"
  - Input field with placeholder
  - Hint text: "Must be multiple of 100"
  - Numeric keyboard on mobile

- [ ] **Quick Amount Buttons**
  - Four buttons: 100, 500, 1000, 5000
  - Highlights selected amount
  - Click to auto-fill input

- [ ] **Preview Section**
  - Shows "You Pay: X MON"
  - Shows "You Get: Y AP"
  - Divider line between
  - AP amount in teal color

- [ ] **Purchase Button**
  - Large, prominent button
  - Purple gradient background
  - Says "Purchase AP"
  - Shows loading spinner when processing
  - Disabled state when insufficient balance

### Functional Tests

- [ ] **Amount Validation**
  - Rejects non-numeric input
  - Rejects amounts < 100
  - Rejects non-multiples of 100
  - Shows error alert for invalid input

- [ ] **Balance Checks**
  - Disables button if MON < amount
  - Shows "Insufficient Balance" message
  - Prevents purchase with insufficient funds

- [ ] **Purchase Flow**
  - Clicking purchase shows loading
  - Success: Modal closes
  - Success: AP balance updates
  - Success: MON balance updates
  - Success: Shows success alert
  - Failure: Shows error alert
  - Failure: Balances unchanged

- [ ] **Quick Buttons**
  - Clicking sets input value
  - Highlights active button
  - Updates preview calculations

- [ ] **Calculations**
  - 100 MON → 1000 AP
  - 500 MON → 5000 AP
  - 1000 MON → 10000 AP
  - Custom amounts calculate correctly

## 🎮 Game Modal

### Visual Tests

- [ ] **AP Cost Display**
  - Shows "🎟️ Cost to Play: X AP"
  - Located in info section
  - Color: Green if enough AP, Red if insufficient
  - Value matches game difficulty
    - Easy: 10 AP
    - Medium: 25 AP
    - Hard: 50 AP

- [ ] **Insufficient Balance Warning**
  - Shows when AP < cost
  - Red/pink background
  - Warning icon (⚠️)
  - Says how many more AP needed

### Functional Tests

- [ ] **AP Balance Check**
  - Checks balance before starting game
  - Allows start if AP >= cost
  - Blocks start if AP < cost

- [ ] **Insufficient Balance Alert**
  - Shows alert when trying to start with insufficient AP
  - Alert message clear and helpful
  - Suggests buying more AP
  - Offers "Buy AP" button option

- [ ] **AP Deduction**
  - Deducts AP when game starts
  - Updates user store
  - Optimistic update (immediate)

## 📊 Profile/Stats Screen

### Visual Tests

- [ ] **AP Stats Display** (if implemented)
  - Shows total AP spent
  - Shows current AP balance
  - Integrated with game stats

### Functional Tests

- [ ] **Stats Accuracy**
  - AP spent matches game history
  - Updates after each game
  - Persists across app restarts

## 🗺️ Map Screen (Game Drops)

### Visual Tests

- [ ] **Game Drop Cards**
  - Show AP cost on drop info
  - Clear indication of cost before opening

### Functional Tests

- [ ] **Drop Selection**
  - Can select drop
  - Opens GameModal
  - Shows correct AP cost

## ⚡ General UI Tests

### Responsiveness

- [ ] Works on small screens (< 375px)
- [ ] Works on medium screens (375-768px)
- [ ] Works on large screens (> 768px)

### Animations

- [ ] Modal slide-in smooth
- [ ] Button press feedback
- [ ] Loading spinners animate
- [ ] Balance updates animate

### Accessibility

- [ ] Text readable (sufficient contrast)
- [ ] Buttons large enough to tap
- [ ] Labels descriptive
- [ ] Error messages clear

### Error Handling

- [ ] Network errors handled gracefully
- [ ] Transaction failures show errors
- [ ] Invalid input handled
- [ ] Loading states prevent double-clicks

## 📱 User Flow Tests

### First Time User

1. [ ] Opens app
2. [ ] Connects wallet
3. [ ] Sees 0 AP balance
4. [ ] Claims 1000 AP airdrop
5. [ ] Balance updates to 1000 AP
6. [ ] Can play 100 easy games OR 40 medium OR 20 hard

### Buying AP

1. [ ] Opens wallet screen
2. [ ] Clicks "+ Buy AP"
3. [ ] Modal opens
4. [ ] Enters amount (e.g., 500)
5. [ ] Sees preview: 5000 AP
6. [ ] Clicks "Purchase AP"
7. [ ] Loading indicator
8. [ ] Success message
9. [ ] Balances update
10. [ ] Modal closes

### Playing Game

1. [ ] Opens map
2. [ ] Selects game drop
3. [ ] Modal shows game info
4. [ ] Shows AP cost (e.g., 25 AP)
5. [ ] Sufficient balance → "Start Game" enabled
6. [ ] Clicks "Start Game"
7. [ ] AP deducted (25 AP)
8. [ ] Game starts
9. [ ] Complete game
10. [ ] Receive MON reward

### Running Out of AP

1. [ ] Play games until AP < 10
2. [ ] Try to start Easy game (10 AP)
3. [ ] If 0 AP: Alert shows
4. [ ] Alert suggests buying AP
5. [ ] Can click "Buy AP" from alert
6. [ ] Opens purchase modal

## 🐛 Edge Cases

- [ ] **Zero Balance**
  - Displays "0" not blank
  - Buy button still works
- [ ] **Large Numbers**
  - 10,000+ AP displays correctly
  - 100,000+ MON displays correctly
  - No overflow issues

- [ ] **Rapid Clicks**
  - Double-click prevented on purchase
  - Can't start game twice
  - Loading states prevent spam

- [ ] **Offline Mode**
  - Shows appropriate error
  - Doesn't crash
  - Can retry when online

- [ ] **Low Battery/Memory**
  - App doesn't crash
  - Animations still smooth
  - Data persists

## ✅ Test Results Summary

| Category          | Total Tests | Passed | Failed |
| ----------------- | ----------- | ------ | ------ |
| Wallet Screen     | 0           | 0      | 0      |
| AP Purchase Modal | 0           | 0      | 0      |
| Game Modal        | 0           | 0      | 0      |
| User Flows        | 0           | 0      | 0      |
| Edge Cases        | 0           | 0      | 0      |
| **TOTAL**         | **0**       | **0**  | **0**  |

## 📝 Issues Found

1. **Issue**: [Description]
   - **Severity**: Low/Medium/High
   - **File**: [file path]
   - **Fix**: [what needs to be done]

## ✨ Improvements Suggested

1. [Improvement idea]
2. [Improvement idea]
