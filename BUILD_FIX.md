# 🔧 EAS Build Fix - Dependency Conflict

## Issue Found
```
Conflicting peer dependency: @react-native-async-storage/async-storage
WalletConnect expects: 1.x
You have: 2.2.0
```

---

## ✅ Solution: Downgrade async-storage

### Fix package.json
Change this line in `package.json`:

**FROM:**
```json
"@react-native-async-storage/async-storage": "2.2.0"
```

**TO:**
```json
"@react-native-async-storage/async-storage": "1.24.0"
```

---

## 🚀 Apply Fix Now

### Step 1: Update package.json
```bash
npm install @react-native-async-storage/async-storage@1.24.0
```

### Step 2: Test locally
```bash
npm install
npx expo start --clear
```

### Step 3: Commit changes
```bash
git add package.json package-lock.json
git commit -m "Fix: Downgrade async-storage for WalletConnect compatibility"
git push origin main
```

### Step 4: Build again
```bash
eas build --platform android --profile preview --clear-cache
```

---

## 📋 Full Commands

```bash
# 1. Fix the dependency
npm install @react-native-async-storage/async-storage@1.24.0

# 2. Test locally
npm install
npx expo start --clear

# 3. If it works, commit
git add package.json package-lock.json
git commit -m "Fix: Downgrade async-storage for WalletConnect compatibility"
git push origin main

# 4. Build APK
eas build --platform android --profile preview --clear-cache
```

---

## 🔍 Why This Happened

- Expo SDK 54 uses newer versions of packages
- WalletConnect v2 still expects older async-storage (1.x)
- EAS build fails on peer dependency conflicts
- Local dev might work but build fails

---

## ✅ After Fix

Build should succeed with:
- ✅ Dependencies installed
- ✅ No peer dependency conflicts
- ✅ APK generated successfully

---

## 🆘 Alternative: Use --legacy-peer-deps

If downgrading doesn't work, you can tell npm to ignore peer dependencies:

### Update package.json scripts:
```json
{
  "scripts": {
    "postinstall": "npm install --legacy-peer-deps"
  }
}
```

But downgrading is the cleaner solution.

---

## 📱 View Full Build Logs

Go to: https://expo.dev/accounts/amrendravs11082004/projects/flash-mob/builds/ed4b3d48-2262-4e73-bbba-6c8afc38fda1

Look for the "Install dependencies" phase to confirm this is the issue.
