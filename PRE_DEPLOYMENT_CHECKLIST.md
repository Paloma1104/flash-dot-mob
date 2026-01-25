# Pre-Deployment Checklist

## ✅ Before You Deploy

### 1. Code Ready
- [ ] All features working locally
- [ ] No console errors
- [ ] Backend running without crashes
- [ ] All tests passing

### 2. Environment Variables
- [ ] `.env` file has all required variables
- [ ] Supabase credentials correct
- [ ] WalletConnect project ID valid
- [ ] Contract addresses verified

### 3. Supabase Setup
- [ ] Run `supabase_schema.sql` in Supabase SQL Editor
- [ ] Run `supabase_update_views.sql` for leaderboard views
- [ ] Test database connection
- [ ] Verify RLS policies are enabled

### 4. Backend Preparation
- [ ] `render.yaml` file created
- [ ] Backend runs with `npm start`
- [ ] All endpoints tested locally
- [ ] Provider configured for signer

### 5. Frontend Preparation
- [ ] Backend URLs use environment variables
- [ ] `app.json` configured correctly
- [ ] Package name set: `com.flashmob.app`
- [ ] Version and versionCode set
- [ ] Icons and splash screen ready

### 6. Git Repository
- [ ] Code pushed to GitHub
- [ ] `.env` in `.gitignore`
- [ ] No sensitive data in commits
- [ ] README updated

---

## 🚀 Deployment Steps

### Backend (Render)
1. [ ] Create Render account
2. [ ] Connect GitHub repository
3. [ ] Deploy from `render.yaml`
4. [ ] Add secret environment variables
5. [ ] Wait for deployment
6. [ ] Test health endpoint
7. [ ] Note backend URL

### Frontend (EAS)
1. [ ] Install EAS CLI: `npm install -g eas-cli`
2. [ ] Login: `eas login`
3. [ ] Update `.env` with production backend URL
4. [ ] Test locally with production backend
5. [ ] Build APK: `eas build --platform android --profile preview`
6. [ ] Wait for build completion
7. [ ] Download APK from Expo dashboard

---

## 🧪 Testing Checklist

### Backend Tests
```bash
# Health check
curl https://your-backend.onrender.com/health

# Leaderboard
curl https://your-backend.onrender.com/api/leaderboard/global

# Balance check (replace with your address)
curl https://your-backend.onrender.com/api/user/balance/0xYourAddress
```

### App Tests
- [ ] Install APK on Android device
- [ ] App opens without crashing
- [ ] Connect wallet successfully
- [ ] Claim free credits
- [ ] Credits show in wallet
- [ ] Start a game (credits deducted)
- [ ] Complete a game (points awarded)
- [ ] Check profile stats update
- [ ] View global leaderboard
- [ ] View nearby leaderboard
- [ ] Location permissions work
- [ ] All games playable

---

## 📋 Post-Deployment

### Monitoring
- [ ] Check Render logs for errors
- [ ] Monitor Supabase usage
- [ ] Track EAS build credits
- [ ] Watch for user feedback

### Documentation
- [ ] Share APK download link
- [ ] Create user guide
- [ ] Document known issues
- [ ] Set up support channel

### Optimization
- [ ] Monitor backend response times
- [ ] Check database query performance
- [ ] Optimize image sizes
- [ ] Review bundle size

---

## 🔧 Common Issues & Fixes

### Backend Issues

**Issue: Backend sleeping (free tier)**
- **Fix:** Upgrade to Render Starter ($7/mo) or accept 15-min sleep

**Issue: Database connection errors**
- **Fix:** Verify Supabase service role key
- **Fix:** Check if schema is created

**Issue: Signer errors**
- **Fix:** Ensure provider is configured
- **Fix:** Verify private key format

### Build Issues

**Issue: EAS build fails**
```bash
eas build --platform android --profile preview --clear-cache
```

**Issue: Environment variables not working**
- **Fix:** Restart Expo: `npx expo start --clear`
- **Fix:** Check variable names match exactly

**Issue: APK too large**
- **Fix:** Optimize images
- **Fix:** Remove unused dependencies

### App Issues

**Issue: App crashes on startup**
- **Fix:** Check backend URL is accessible
- **Fix:** Verify all env variables set
- **Fix:** Check Android logs: `adb logcat`

**Issue: Wallet won't connect**
- **Fix:** Verify WalletConnect project ID
- **Fix:** Check internet connection
- **Fix:** Try different wallet app

**Issue: Location not working**
- **Fix:** Grant location permissions
- **Fix:** Enable GPS on device
- **Fix:** Check location permissions in app.json

---

## 📊 Success Metrics

After deployment, track:
- [ ] Number of users
- [ ] Games played
- [ ] Credits claimed
- [ ] Leaderboard activity
- [ ] Backend uptime
- [ ] Database size
- [ ] API response times

---

## 🎉 You're Ready!

Once all checkboxes are complete, you're ready to deploy!

Follow either:
- `QUICK_DEPLOY.md` for fast deployment
- `DEPLOYMENT_GUIDE.md` for detailed instructions

Good luck! 🚀
