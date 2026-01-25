# 🔍 EAS Build Failed - How to Debug

## Get Detailed Logs

### Option 1: View in Expo Dashboard (Easiest)
1. Go to https://expo.dev
2. Click on your project
3. Go to "Builds" tab
4. Click on the failed build
5. Look at the "Install dependencies" phase logs

### Option 2: Command Line
```bash
eas build:list
```
This shows your recent builds with their IDs.

Then get logs for the failed build:
```bash
eas build:view [BUILD_ID]
```

### Option 3: Direct Link
The build URL should be in your terminal output. Look for something like:
```
https://expo.dev/accounts/[username]/projects/flash-mob/builds/[build-id]
```

---

## Common Issues & Fixes

### Issue 1: Node Modules / Dependencies
**Error:** "npm install failed" or "yarn install failed"

**Fix:** Check `package.json` for issues
```bash
# Test locally first
npm install
npm run typecheck
```

### Issue 2: Incompatible Dependencies
**Error:** "peer dependency" or "version conflict"

**Fix:** Update `package.json`
```bash
npm install --legacy-peer-deps
```

### Issue 3: Missing Assets
**Error:** "Cannot find icon.png" or "splash screen"

**Fix:** Verify assets exist
```bash
ls -la assets/images/
```

### Issue 4: app.json Configuration
**Error:** "Invalid configuration"

**Fix:** Validate `app.json`
```bash
npx expo config --type public
```

### Issue 5: EAS Configuration
**Error:** "Invalid eas.json"

**Fix:** Check `eas.json` format

---

## 🔧 Quick Fixes to Try

### 1. Clear Cache and Retry
```bash
eas build --platform android --profile preview --clear-cache
```

### 2. Check Package.json
Make sure all dependencies are valid:
```bash
npm install
npm run typecheck
```

### 3. Verify App.json
```bash
cat app.json | grep -E "name|slug|version|package"
```

### 4. Check for Missing Files
```bash
# Check assets
ls -la assets/images/icon.png
ls -la assets/images/splash-icon.png

# Check config files
ls -la app.json eas.json
```

---

## 📋 Share These Details

To help debug, share:

1. **Build logs from Expo dashboard**
2. **Your package.json dependencies**
3. **Your app.json configuration**
4. **Any error messages from the "Install dependencies" phase**

---

## 🚀 Try This Now

```bash
# 1. Get build details
eas build:list

# 2. View the failed build logs
eas build:view [BUILD_ID]

# 3. Or go to Expo dashboard
open https://expo.dev
```

Then share the error message from the logs!
