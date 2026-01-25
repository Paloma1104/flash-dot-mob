# Flash.Mob Deployment Commands

Quick reference for all deployment commands.

---

## 🚀 Backend Deployment (Render)

### Push to GitHub
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

### Test Backend Locally
```bash
cd backend
npm start
```

### Test Production Backend
```bash
# Health check
curl https://flashmob-backend.onrender.com/health

# Global leaderboard
curl https://flashmob-backend.onrender.com/api/leaderboard/global

# User balance (replace with your address)
curl https://flashmob-backend.onrender.com/api/user/balance/0xYourAddress
```

---

## 📱 Mobile App Build (EAS)

### Install EAS CLI
```bash
npm install -g eas-cli
```

### Login to Expo
```bash
eas login
```

### Configure EAS (First Time Only)
```bash
eas build:configure
```

### Build APK (Preview)
```bash
eas build --platform android --profile preview
```

### Build APK (Production)
```bash
eas build --platform android --profile production
```

### Build with Cache Clear
```bash
eas build --platform android --profile preview --clear-cache
```

### Check Build Status
```bash
eas build:list
```

---

## 🧪 Local Testing

### Start Frontend
```bash
npm start
# or
npx expo start
```

### Start Frontend (Clear Cache)
```bash
npm run dev
# or
npx expo start --clear
```

### Start Backend
```bash
cd backend
npm run dev
```

### Start Everything (Development)
```bash
npm run start:demo
```

---

## 📦 APK Installation

### Install via ADB
```bash
adb install flash-mob.apk
```

### Uninstall Old Version
```bash
adb uninstall com.flashmob.app
```

### View Android Logs
```bash
adb logcat | grep Expo
```

---

## 🗄️ Supabase Setup

### Run Schema (First Time)
1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to SQL Editor
4. Copy contents of `supabase_schema.sql`
5. Run the SQL

### Update Leaderboard Views
1. Go to SQL Editor
2. Copy contents of `supabase_update_views.sql`
3. Run the SQL

---

## 🔧 Environment Variables

### Update Backend URL (Production)
```bash
# Edit .env file
EXPO_PUBLIC_BACKEND_URL=https://flashmob-backend.onrender.com
```

### Update Backend URL (Local)
```bash
# Edit .env file
EXPO_PUBLIC_BACKEND_URL=http://172.22.67.186:3001
```

---

## 📊 Version Management

### Update Version
Edit `app.json`:
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

### Commit Version Update
```bash
git add app.json
git commit -m "Bump version to 1.0.1"
git push origin main
```

---

## 🔍 Debugging

### Check TypeScript Errors
```bash
npm run typecheck
```

### Check Linting
```bash
npm run lint
```

### Run All Tests
```bash
npm test
```

### Clear All Caches
```bash
# Clear Expo cache
npx expo start --clear

# Clear npm cache
npm cache clean --force

# Clear watchman (if installed)
watchman watch-del-all

# Clear Metro bundler
rm -rf $TMPDIR/metro-*
rm -rf $TMPDIR/haste-*
```

---

## 🔄 Update Deployment

### Update Backend
```bash
# Just push to GitHub - Render auto-deploys
git add .
git commit -m "Update backend"
git push origin main
```

### Update Mobile App
```bash
# 1. Update version in app.json
# 2. Build new APK
eas build --platform android --profile production

# 3. Download and distribute new APK
```

---

## 📱 EAS Profiles

### Development Build
```bash
eas build --profile development --platform android
```

### Preview Build (APK)
```bash
eas build --profile preview --platform android
```

### Production Build (AAB for Play Store)
```bash
eas build --profile production --platform android
```

---

## 🌐 Useful URLs

- **Render Dashboard:** https://dashboard.render.com
- **Expo Dashboard:** https://expo.dev
- **Supabase Dashboard:** https://supabase.com/dashboard
- **GitHub Repository:** https://github.com/yourusername/flash.mob
- **Monad Testnet Explorer:** https://testnet.monad.xyz

---

## 🆘 Emergency Commands

### Kill All Node Processes
```bash
# macOS/Linux
killall node

# Windows
taskkill /F /IM node.exe
```

### Reset Expo
```bash
npx expo start --clear
rm -rf node_modules
npm install
```

### Reset Backend
```bash
cd backend
rm -rf node_modules
npm install
```

### Full Reset
```bash
# Delete all node_modules
rm -rf node_modules
rm -rf backend/node_modules

# Reinstall everything
npm install
cd backend && npm install
```

---

## 📋 Pre-Deployment Checklist

```bash
# 1. Test backend locally
cd backend && npm start

# 2. Test frontend locally
npm start

# 3. Check for TypeScript errors
npm run typecheck

# 4. Check for linting errors
npm run lint

# 5. Verify environment variables
cat .env

# 6. Push to GitHub
git push origin main

# 7. Deploy to Render (via dashboard)

# 8. Test production backend
curl https://flashmob-backend.onrender.com/health

# 9. Update .env with production URL
# EXPO_PUBLIC_BACKEND_URL=https://flashmob-backend.onrender.com

# 10. Build APK
eas build --platform android --profile preview
```

---

## 🎯 Quick Deploy (30 Minutes)

```bash
# 1. Push to GitHub (1 min)
git add . && git commit -m "Deploy" && git push

# 2. Deploy to Render via dashboard (10 min)
# Visit https://dashboard.render.com

# 3. Update .env (1 min)
# EXPO_PUBLIC_BACKEND_URL=https://flashmob-backend.onrender.com

# 4. Build APK (20 min)
eas build --platform android --profile preview

# 5. Download and install APK
# Visit https://expo.dev
```

---

That's it! Keep this file handy for quick reference. 🚀
