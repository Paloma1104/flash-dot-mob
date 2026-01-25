# Quick Deploy Guide - Flash.Mob

## 🚀 Deploy in 15 Minutes

### Step 1: Deploy Backend to Render (5 min)

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Go to Render:**
   - Visit https://dashboard.render.com
   - Click "New +" → "Web Service"
   - Connect your GitHub repo
   - Render will auto-detect `render.yaml`
   - Click "Apply"

3. **Add Secret Environment Variables:**
   In Render dashboard, add these two secrets:
   ```
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhubmFlbm9ka3R0eGxqZHdudGJiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTI5MTAwMywiZXhwIjoyMDg0ODY3MDAzfQ.gWtsq0xG8zaKneiWMMLyZ1ePLosasbN0HOCaMsrMDw0
   
   BACKEND_PRIVATE_KEY=0x61dbad316e3f6503dfde8776427a2b9b51852d8944f2be986799b53a618f1e5d
   ```

4. **Wait for deployment** (3-5 minutes)

5. **Get your backend URL:**
   ```
   https://flashmob-backend.onrender.com
   ```

### Step 2: Update Frontend (2 min)

1. **Update `.env`:**
   ```env
   EXPO_PUBLIC_BACKEND_URL=https://flashmob-backend.onrender.com
   ```

2. **Test locally:**
   ```bash
   npx expo start --clear
   ```

### Step 3: Build APK (8 min)

1. **Install EAS CLI:**
   ```bash
   npm install -g eas-cli
   ```

2. **Login:**
   ```bash
   eas login
   ```

3. **Build APK:**
   ```bash
   eas build --platform android --profile preview
   ```

4. **Wait for build** (5-10 minutes)

5. **Download APK:**
   - Go to https://expo.dev
   - Click your project → Builds
   - Download the APK

### Step 4: Install & Test (2 min)

1. **Send APK to your phone**
2. **Install** (enable "Unknown Sources")
3. **Test:**
   - Connect wallet
   - Claim credits
   - Play a game
   - Check leaderboard

## ✅ Done!

Your app is now live with:
- ✅ Backend on Render
- ✅ Database on Supabase
- ✅ APK ready to distribute

---

## 📱 Share Your APK

**Option 1: Direct Link**
- Upload APK to Google Drive / Dropbox
- Share link with users

**Option 2: QR Code**
- Use https://www.qr-code-generator.com/
- Create QR code with download link
- Users scan to download

**Option 3: TestFlight (iOS)**
- Build iOS version: `eas build --platform ios --profile preview`
- Submit to TestFlight
- Share invite link

---

## 🔄 Update Your App

**Backend Update:**
```bash
git push origin main
# Render auto-deploys
```

**APK Update:**
1. Update version in `app.json`
2. Run: `eas build --platform android --profile preview`
3. Download new APK
4. Distribute to users

---

## 🆘 Quick Fixes

**Backend not responding?**
```bash
# Check if it's sleeping (free tier)
curl https://flashmob-backend.onrender.com/health
# Wait 30 seconds for it to wake up
```

**APK won't install?**
- Settings → Security → Enable "Unknown Sources"
- Uninstall old version first
- Check storage space

**App crashes?**
- Check backend URL in `.env`
- Verify Supabase schema is created
- Check Render logs for errors

---

## 💰 Costs

**Current Setup: $0/month**
- Render Free: 750 hours
- Supabase Free: 500MB
- EAS Free: 30 builds/month

**To Remove Sleep (Optional):**
- Render Starter: $7/month
- Backend stays always-on

---

## 📞 Need Help?

Check `DEPLOYMENT_GUIDE.md` for detailed instructions.
