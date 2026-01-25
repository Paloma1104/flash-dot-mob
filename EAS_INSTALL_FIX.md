# 🔧 EAS CLI Installation Fix (macOS)

## Issue
```
EACCES: permission denied, mkdir '/usr/local/lib/node_modules/eas-cli'
```

---

## ✅ Solution 1: Use sudo (Quick Fix)

```bash
sudo npm install -g eas-cli
```

Enter your Mac password when prompted.

---

## ✅ Solution 2: Fix npm Permissions (Recommended)

This prevents needing sudo for future global installs.

### Step 1: Create npm directory in your home folder
```bash
mkdir -p ~/.npm-global
```

### Step 2: Configure npm to use this directory
```bash
npm config set prefix '~/.npm-global'
```

### Step 3: Add to your PATH
```bash
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.zshrc
source ~/.zshrc
```

### Step 4: Install EAS CLI (no sudo needed!)
```bash
npm install -g eas-cli
```

### Step 5: Verify installation
```bash
eas --version
```

---

## ✅ Solution 3: Use npx (No Installation)

You can use EAS without installing globally:

```bash
# Instead of: eas login
npx eas-cli login

# Instead of: eas build
npx eas-cli build --platform android --profile preview

# Instead of: eas build:list
npx eas-cli build:list
```

---

## 🚀 Quick Start (Choose One)

### Option A: Use sudo (fastest)
```bash
sudo npm install -g eas-cli
eas login
eas build --platform android --profile preview
```

### Option B: Use npx (no installation)
```bash
npx eas-cli login
npx eas-cli build --platform android --profile preview
```

### Option C: Fix permissions (best long-term)
```bash
mkdir -p ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.zshrc
source ~/.zshrc
npm install -g eas-cli
eas login
eas build --platform android --profile preview
```

---

## 📋 After Installation

### Login to Expo
```bash
eas login
```

### Build APK
```bash
eas build --platform android --profile preview
```

### Check build status
```bash
eas build:list
```

---

## 🆘 Still Having Issues?

### Check if EAS is installed
```bash
which eas
# or
eas --version
```

### If command not found after Option 2
```bash
# Reload your shell
source ~/.zshrc

# Or restart your terminal
```

### If npx is slow
```bash
# npx downloads the package each time
# Consider using sudo or fixing permissions instead
```

---

## ✅ Recommended Approach

**For now (quick):** Use `sudo npm install -g eas-cli`

**For future (better):** Fix npm permissions (Solution 2)

---

## 🎯 Next Steps After Installation

1. **Login to Expo:**
   ```bash
   eas login
   ```

2. **Build APK:**
   ```bash
   eas build --platform android --profile preview
   ```

3. **Wait 10-20 minutes**

4. **Download APK from:** https://expo.dev

Good luck! 🚀
