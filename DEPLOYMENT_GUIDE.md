# Flash.Mob Deployment Guide

Complete guide to deploy your backend to Render and build APK with EAS.

---

## Part 1: Deploy Backend to Render

### Prerequisites
- GitHub account
- Render account (free tier available at https://render.com)
- Your code pushed to GitHub

### Step 1: Prepare Backend for Deployment

1. **Create a `render.yaml` file in the root directory:**

```yaml
services:
  - type: web
    name: flashmob-backend
    env: node
    region: oregon
    plan: free
    buildCommand: cd backend && npm install
    startCommand: cd backend && npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: BACKEND_PORT
        value: 3001
      - key: EXPO_PUBLIC_RPC_URL
        sync: false
      - key: EXPO_PUBLIC_CHAIN_ID
        sync: false
      - key: EXPO_PUBLIC_GAME_REWARDS_ADDRESS
        sync: false
      - key: EXPO_PUBLIC_FLASH_MOB_ADDRESS
        sync: false
      - key: EXPO_PUBLIC_SUPABASE_URL
        sync: false
      - key: SUPABASE_SERVICE_ROLE_KEY
        sync: false
      - key: BACKEND_PRIVATE_KEY
        sync: false
```

2. **Update backend package.json** (already correct):
```json
{
  "scripts": {
    "start": "tsx server.ts",
    "dev": "tsx watch server.ts"
  }
}
```

### Step 2: Deploy to Render

1. **Go to Render Dashboard:**
   - Visit https://dashboard.render.com
   - Click "New +" → "Web Service"

2. **Connect GitHub Repository:**
   - Select "Connect a repository"
   - Authorize Render to access your GitHub
   - Select your `flash.mob` repository

3. **Configure Service:**
   - **Name:** `flashmob-backend`
   - **Region:** Oregon (or closest to you)
   - **Branch:** `main`
   - **Root Directory:** Leave empty
   - **Environment:** `Node`
   - **Build Command:** `cd backend && npm install`
   - **Start Command:** `cd backend && npm start`
   - **Plan:** Free

4. **Add Environment Variables:**
   Click "Advanced" → "Add Environment Variable" and add these:

   ```
   NODE_ENV=production
   BACKEND_PORT=3001
   
   # Blockchain
   EXPO_PUBLIC_RPC_URL=https://testnet-rpc.monad.xyz
   EXPO_PUBLIC_CHAIN_ID=10143
   EXPO_PUBLIC_GAME_REWARDS_ADDRESS=0x22b9152E9878C1EFE498479718f8f2b62b1b586E
   EXPO_PUBLIC_FLASH_MOB_ADDRESS=0x09F48a7E427AA0331A67fE2f8B6066d673172F12
   EXPO_PUBLIC_CREDITS_MARKETPLACE_ADDRESS=0xc078f3b67A684fe0f1be2440551F3F7de6F2ae63
   
   # Supabase
   EXPO_PUBLIC_SUPABASE_URL=https://xnnaenodkttxljdwntbb.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhubmFlbm9ka3R0eGxqZHdudGJiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTI5MTAwMywiZXhwIjoyMDg0ODY3MDAzfQ.gWtsq0xG8zaKneiWMMLyZ1ePLosasbN0HOCaMsrMDw0
   
   # Backend Signer (IMPORTANT: Use a secure key in production!)
   BACKEND_PRIVATE_KEY=0x61dbad316e3f6503dfde8776427a2b9b51852d8944f2be986799b53a618f1e5d
   ```

5. **Deploy:**
   - Click "Create Web Service"
   - Wait 5-10 minutes for deployment
   - Your backend will be live at: `https://flashmob-backend.onrender.com`

6. **Test Deployment:**
   ```bash
   curl https://flashmob-backend.onrender.com/health
   ```
   Should return: `{"status":"healthy","signer":"0x...","chainId":10143}`

### Step 3: Update Frontend to Use Production Backend

1. **Update `.env` file:**
   ```env
   EXPO_PUBLIC_BACKEND_URL=https://flashmob-backend.onrender.com
   ```

2. **Update hardcoded URLs in code:**
   - `src/hooks/useGameCredits.ts` - Line 16
   - `src/components/leaderboard/LeaderboardScreen.tsx` - Line 21
   - `app/(tabs)/profile.tsx` - Line 21

   Change all from:
   ```typescript
   const BACKEND_URL = "http://172.22.67.186:3001";
   ```
   To:
   ```typescript
   const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || "https://flashmob-backend.onrender.com";
   ```

---

## Part 2: Build APK with EAS

### Prerequisites
- Expo account (free at https://expo.dev)
- EAS CLI installed globally

### Step 1: Install EAS CLI

```bash
npm install -g eas-cli
```

### Step 2: Login to Expo

```bash
eas login
```

Enter your Expo credentials.

### Step 3: Configure EAS Build

1. **Initialize EAS:**
   ```bash
   eas build:configure
   ```

2. **Update `eas.json`** (should already exist):
   ```json
   {
     "cli": {
       "version": ">= 5.2.0"
     },
     "build": {
       "development": {
         "developmentClient": true,
         "distribution": "internal",
         "android": {
           "gradleCommand": ":app:assembleDebug"
         }
       },
       "preview": {
         "distribution": "internal",
         "android": {
           "buildType": "apk"
         }
       },
       "production": {
         "android": {
           "buildType": "apk"
         }
       }
     },
     "submit": {
       "production": {}
     }
   }
   ```

### Step 4: Update app.json

Make sure your `app.json` has proper configuration:

```json
{
  "expo": {
    "name": "Flash.Mob",
    "slug": "flash-mob",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "scheme": "flashmob",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/images/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#000000"
    },
    "android": {
      "package": "com.flashmob.app",
      "versionCode": 1,
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#000000"
      },
      "permissions": [
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION"
      ]
    },
    "plugins": [
      "expo-router",
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "Allow Flash.Mob to use your location to find nearby games."
        }
      ]
    ],
    "experiments": {
      "typedRoutes": true
    }
  }
}
```

### Step 5: Build APK

**For Preview/Testing (Recommended first):**
```bash
eas build --platform android --profile preview
```

**For Production:**
```bash
eas build --platform android --profile production
```

### Step 6: Wait for Build

- Build takes 10-20 minutes
- You'll get a link to track progress
- You can close terminal and check status at: https://expo.dev/accounts/[your-username]/projects/flash-mob/builds

### Step 7: Download APK

Once build completes:
1. Go to https://expo.dev
2. Click on your project
3. Go to "Builds"
4. Click on the completed build
5. Click "Download" to get the APK

### Step 8: Install APK on Android Device

**Method 1: Direct Download**
- Send the download link to your phone
- Open link on phone
- Download and install APK
- Enable "Install from Unknown Sources" if prompted

**Method 2: ADB Install**
```bash
# Download APK from Expo
# Then install via ADB
adb install flash-mob.apk
```

---

## Part 3: Environment Variables for Production

### Create `.env.production` file:

```env
# Production Backend
EXPO_PUBLIC_BACKEND_URL=https://flashmob-backend.onrender.com
EXPO_PUBLIC_API_URL=https://flashmob-backend.onrender.com

# Blockchain (Monad Testnet)
EXPO_PUBLIC_CHAIN_ID=10143
EXPO_PUBLIC_RPC_URL=https://testnet-rpc.monad.xyz
EXPO_PUBLIC_CHAIN_NAME=Monad Testnet

# Contract Addresses
EXPO_PUBLIC_MOCK_MON_ADDRESS=0xDbb458BF29B7AdDf8AE78D496EC0aF23A0E9B448
EXPO_PUBLIC_AP_TOKEN_ADDRESS=0xee3100f0e16c02f5B737fb27398540Fbee051072
EXPO_PUBLIC_GAME_REWARDS_ADDRESS=0x22b9152E9878C1EFE498479718f8f2b62b1b586E
EXPO_PUBLIC_FLASH_MOB_ADDRESS=0x09F48a7E427AA0331A67fE2f8B6066d673172F12
EXPO_PUBLIC_CREDITS_MARKETPLACE_ADDRESS=0xc078f3b67A684fe0f1be2440551F3F7de6F2ae63

# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://xnnaenodkttxljdwntbb.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhubmFlbm9ka3R0eGxqZHdudGJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyOTEwMDMsImV4cCI6MjA4NDg2NzAwM30.fdAI02vwYJRHxBV6WFxWO7tZ0WbdkSUXMj_KvZao0Ak

# WalletConnect
EXPO_PUBLIC_WALLETCONNECT_PROJECT_ID=f259c9bc36470ba5decd99e94dcc6a5c

# Mapbox
EXPO_PUBLIC_MAPBOX_TOKEN=pk.eyJ1IjoibGVvc3RlcmVvIiwiYSI6ImNta2Z5aWYwaTAwcWMzZXI0d2g0ZTMzazAifQ.gdiUCpGGWX_asX0ZqSqQrA
```

---

## Part 4: Testing Checklist

### Before Building APK:

- [ ] Backend deployed and accessible
- [ ] Supabase schema created (run `supabase_schema.sql`)
- [ ] All environment variables set correctly
- [ ] Test backend endpoints:
  ```bash
  curl https://flashmob-backend.onrender.com/health
  curl https://flashmob-backend.onrender.com/api/leaderboard/global
  ```
- [ ] Update all hardcoded backend URLs in code
- [ ] Test app locally with production backend:
  ```bash
  EXPO_PUBLIC_BACKEND_URL=https://flashmob-backend.onrender.com npx expo start
  ```

### After Installing APK:

- [ ] Connect wallet
- [ ] Claim free credits
- [ ] Play a game
- [ ] Check leaderboard
- [ ] Check profile stats
- [ ] Test location permissions
- [ ] Test nearby leaderboard

---

## Part 5: Troubleshooting

### Backend Issues:

**Backend not responding:**
- Check Render logs: Dashboard → Your Service → Logs
- Verify environment variables are set
- Check if service is sleeping (free tier sleeps after 15 min inactivity)

**Database errors:**
- Verify Supabase credentials
- Check if schema is created
- Test Supabase connection in SQL Editor

### Build Issues:

**EAS build fails:**
```bash
# Clear cache and retry
eas build:configure
eas build --platform android --profile preview --clear-cache
```

**APK won't install:**
- Enable "Install from Unknown Sources" in Android settings
- Check if you have enough storage
- Try uninstalling old version first

**App crashes on startup:**
- Check if all environment variables are set
- Verify backend URL is accessible
- Check Expo logs: `npx expo start` and connect via QR code

---

## Part 6: Updating Your App

### Update Backend:
1. Push changes to GitHub
2. Render auto-deploys from `main` branch
3. Check deployment logs

### Update APK:
1. Increment version in `app.json`:
   ```json
   {
     "expo": {
       "version": "1.0.1",
       "android": {
         "versionCode": 2
       }
     }
   }
   ```
2. Build new APK:
   ```bash
   eas build --platform android --profile production
   ```
3. Download and distribute new APK

---

## Part 7: Cost Breakdown

### Free Tier (What you're using):
- **Render:** Free (750 hours/month, sleeps after 15 min)
- **Supabase:** Free (500MB database, 2GB bandwidth)
- **EAS Build:** Free (30 builds/month)
- **Expo:** Free (unlimited projects)

### Paid Upgrades (Optional):
- **Render Starter:** $7/month (always on, no sleep)
- **Supabase Pro:** $25/month (8GB database, 50GB bandwidth)
- **EAS Priority:** $29/month (faster builds, more builds)

---

## Quick Commands Reference

```bash
# Backend
cd backend && npm start                    # Run locally
git push origin main                       # Deploy to Render

# Mobile App
npx expo start                             # Run locally
npx expo start --clear                     # Clear cache
eas login                                  # Login to Expo
eas build --platform android --profile preview    # Build APK
eas build:list                             # List builds

# Testing
curl https://flashmob-backend.onrender.com/health
adb install flash-mob.apk
adb logcat | grep Expo                     # View Android logs
```

---

## Support

- **Render Docs:** https://render.com/docs
- **EAS Docs:** https://docs.expo.dev/build/introduction/
- **Supabase Docs:** https://supabase.com/docs

Your app is now ready for production! 🚀
