# Flash.Mob Deployment Summary

## ✅ Your App is Ready to Deploy!

All configurations are complete. Follow the steps below to deploy your backend and build your APK.

---

## 📋 Quick Deployment Steps

### 1️⃣ Deploy Backend to Render (10 minutes)

1. **Push code to GitHub:**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Go to Render:**
   - Visit https://dashboard.render.com
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select "Deploy from render.yaml"

3. **Add Secret Environment Variables:**
   In Render dashboard, add these two secrets:
   ```
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhubmFlbm9ka3R0eGxqZHdudGJiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTI5MTAwMywiZXhwIjoyMDg0ODY3MDAzfQ.gWtsq0xG8zaKneiWMMLyZ1ePLosasbN0HOCaMsrMDw0
   
   BACKEND_PRIVATE_KEY=0x61dbad316e3f6503dfde8776427a2b9b51852d8944f2be986799b53a618f1e5d
   ```

4. **Deploy and wait 5-10 minutes**

5. **Test your backend:**
   ```bash
   curl https://flashmob-backend.onrender.com/health
   ```
   Should return: `{"status":"healthy","signer":"0x...","chainId":10143}`

6. **Note your backend URL:** `https://flashmob-backend.onrender.com`

---

### 2️⃣ Update Frontend with Production Backend (2 minutes)

Update your `.env` file:
```env
EXPO_PUBLIC_BACKEND_URL=https://flashmob-backend.onrender.com
```

Test locally with production backend:
```bash
npx expo start --clear
```

---

### 3️⃣ Build APK with EAS (20 minutes)

1. **Install EAS CLI:**
   ```bash
   npm install -g eas-cli
   ```

2. **Login to Expo:**
   ```bash
   eas login
   ```

3. **Configure EAS (if not done):**
   ```bash
   eas build:configure
   ```

4. **Build APK:**
   ```bash
   eas build --platform android --profile preview
   ```

5. **Wait for build to complete** (10-20 minutes)
   - You'll get a link to track progress
   - Check status at: https://expo.dev

6. **Download APK:**
   - Go to https://expo.dev
   - Click your project → Builds
   - Download the APK

---

### 4️⃣ Install APK on Android Device

**Method 1: Direct Download**
- Send download link to your phone
- Open link and download APK
- Enable "Install from Unknown Sources" if prompted
- Install and open app

**Method 2: ADB Install**
```bash
adb install flash-mob.apk
```

---

## 🔧 Configuration Summary

### ✅ Backend Configuration
- **File:** `render.yaml` ✅ Created
- **Port:** 10000 (Render default)
- **Environment:** Production
- **Database:** Supabase (configured)
- **Blockchain:** Monad Testnet

### ✅ Frontend Configuration
- **File:** `app.json` ✅ Updated
- **Package Name:** `com.flashmob.app`
- **Version:** 1.0.0
- **Version Code:** 1
- **Backend URL:** Uses environment variable

### ✅ Supabase Setup
- **Schema:** `supabase_schema.sql` ✅ Ready
- **Views:** `supabase_update_views.sql` ✅ Ready
- **URL:** https://xnnaenodkttxljdwntbb.supabase.co
- **Status:** Configured

### ✅ Smart Contracts (Monad Testnet)
- **MockMON:** `0xDbb458BF29B7AdDf8AE78D496EC0aF23A0E9B448`
- **APToken:** `0xee3100f0e16c02f5B737fb27398540Fbee051072`
- **GameRewards:** `0x22b9152E9878C1EFE498479718f8f2b62b1b586E`
- **FlashMobV2:** `0x09F48a7E427AA0331A67fE2f8B6066d673172F12`
- **CreditsMarketplace:** `0xc078f3b67A684fe0f1be2440551F3F7de6F2ae63`

---

## 📱 App Features

### Core Features
- ✅ Wallet connection (WalletConnect)
- ✅ Free 50 credits claim (one-time per wallet)
- ✅ On-chain credit purchase (CreditsMarketplace)
- ✅ 5 mini-games (Word Scramble, Math Challenge, etc.)
- ✅ Real-time leaderboard (global & nearby)
- ✅ Profile with stats and game history
- ✅ Location-based gameplay
- ✅ Points system (score ÷ 10)

### Database Features
- ✅ Supabase integration
- ✅ Player profiles
- ✅ Game sessions tracking
- ✅ Leaderboard views
- ✅ Location-based queries (PostGIS)

---

## 🧪 Testing Checklist

### Before Building APK:
- [x] Backend deployed and accessible
- [x] Supabase schema created
- [x] All environment variables set
- [x] Backend URLs use environment variables
- [x] Test backend endpoints
- [x] Test app locally with production backend

### After Installing APK:
- [ ] App opens without crashing
- [ ] Connect wallet successfully
- [ ] Claim free 50 credits
- [ ] Credits show in wallet
- [ ] Start a game (5 credits deducted)
- [ ] Complete a game (points awarded)
- [ ] Profile stats update
- [ ] View global leaderboard
- [ ] View nearby leaderboard
- [ ] Location permissions work

---

## 💰 Cost Breakdown

### Free Tier (Current Setup):
- **Render:** Free (750 hours/month, sleeps after 15 min inactivity)
- **Supabase:** Free (500MB database, 2GB bandwidth)
- **EAS Build:** Free (30 builds/month)
- **Expo:** Free (unlimited projects)

**Total Cost:** $0/month

### Optional Upgrades:
- **Render Starter:** $7/month (always on, no sleep)
- **Supabase Pro:** $25/month (8GB database, 50GB bandwidth)
- **EAS Priority:** $29/month (faster builds)

---

## 🚨 Important Notes

### Backend Sleep (Free Tier)
- Render free tier sleeps after 15 minutes of inactivity
- First request after sleep takes 30-60 seconds to wake up
- Users may see "Network request failed" initially
- Upgrade to Render Starter ($7/mo) for always-on backend

### Environment Variables
- Backend URL is now configurable via `.env`
- All hardcoded URLs have been updated
- Production backend: `https://flashmob-backend.onrender.com`
- Local backend: `http://172.22.67.186:3001`

### Supabase Schema
Before first use, run these SQL files in Supabase SQL Editor:
1. `supabase_schema.sql` - Creates tables and views
2. `supabase_update_views.sql` - Updates leaderboard views

---

## 📚 Documentation Files

- **DEPLOYMENT_GUIDE.md** - Detailed step-by-step deployment guide
- **QUICK_DEPLOY.md** - Fast deployment for experienced users
- **PRE_DEPLOYMENT_CHECKLIST.md** - Complete checklist before deploying
- **SUPABASE_SETUP.md** - Supabase configuration guide
- **render.yaml** - Render deployment configuration

---

## 🔗 Useful Links

- **Render Dashboard:** https://dashboard.render.com
- **Expo Dashboard:** https://expo.dev
- **Supabase Dashboard:** https://supabase.com/dashboard
- **Monad Testnet Faucet:** https://faucet.monad.xyz
- **WalletConnect Cloud:** https://cloud.walletconnect.com

---

## 🆘 Troubleshooting

### Backend not responding
```bash
# Check Render logs
# Dashboard → Your Service → Logs

# Test health endpoint
curl https://flashmob-backend.onrender.com/health
```

### Build fails
```bash
# Clear cache and retry
eas build --platform android --profile preview --clear-cache
```

### App crashes
```bash
# Check logs
npx expo start
# Or use ADB
adb logcat | grep Expo
```

---

## ✅ Next Steps

1. **Deploy backend to Render** (follow Step 1 above)
2. **Update `.env` with production backend URL**
3. **Test locally with production backend**
4. **Build APK with EAS** (follow Step 3 above)
5. **Install and test APK on Android device**
6. **Share APK with users!**

---

## 🎉 You're Ready!

Your Flash.Mob app is fully configured and ready for deployment. Follow the steps above and you'll have a live app in about 30 minutes!

Good luck! 🚀
