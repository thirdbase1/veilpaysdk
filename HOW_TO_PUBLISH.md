# 🚀 How to Publish `veilpaysdk` from Termux

Since you are using Termux on Android, follow these exact steps to clone this repo and publish the SDK to NPM.

### 📋 Prerequisites
In Termux, make sure you have `git` and `nodejs` installed:
```bash
pkg update
pkg install git nodejs
```

### 🛠 Step 1: Clone the Repository
Clone the project where you have the SDK and Contract files:
```bash
git clone <YOUR_REPO_URL>
cd <REPO_FOLDER>/packages/veilpaysdk
```

### 🛠 Step 2: Login to NPM
Run this command. NPM will ask for your **username**, **password**, and then an **Email OTP**.
```bash
npm login
```
- **Username:** `veilpaysdk`
- **Email:** `vwhehj@gmail.com`
- **NPM OTP:** Check your email (`vwhehj@gmail.com`) for the code and enter it in the terminal.

### 🏗 Step 3: Build & Publish
Compile the TypeScript code and push it to the live NPM registry.
```bash
# 1. Install internal build dependencies
npm install

# 2. Build the distribution folder
npm run build

# 3. Publish to NPM
npm publish --access public
```

### ✅ Verification
Once the command finishes, anyone can install your SDK with:
```bash
npm install veilpaysdk
```

---

## 🛠 Troubleshooting for Termux
- **`You cannot publish over previously published versions`:** This happens if the version in `package.json` was already used. Open `package.json` and increase the version (e.g., from `1.0.4` to `1.0.5`).
- **`npm install` fails:** If it hangs, make sure your internet connection is stable.
- **NPM Login Link:** If NPM gives you a link to follow, copy it and open it in Chrome on your phone to complete the verification.
