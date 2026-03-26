# 🚀 How to Publish `veilpaysdk` to NPM

Because NPM requires a **Second-Factor Verification (OTP)** from your email, I cannot publish the SDK for you. You must run these commands from your local machine.

### 📋 Prerequisites
1.  Make sure you are in the `packages/veilpaysdk` directory.
2.  Ensure you have `npm` installed.

### 🛠 Step 1: Login to your account
Run this command and follow the prompts:
```bash
npm login
```
- **Username:** `veilpaysdk`
- **Password:** `Anthony7$`
- **Email:** `vwhehj@gmail.com`
- **NPM OTP:** Check your email (`vwhehj@gmail.com`) for the code and enter it in the terminal.

### 🏗 Step 2: Build the SDK
Before publishing, make sure the TypeScript code is compiled into the `dist/` folder.
```bash
npm run build
```

### 📦 Step 3: Publish to NPM
Run the final publish command:
```bash
npm publish --access public
```

### ✅ Verification
Once published, you can install it in any project with:
```bash
npm install veilpaysdk
```

---

## 🛠 Troubleshooting
- **Version Error:** If you need to publish a new version later, change the `"version": "1.0.1"` in `package.json` before running `npm publish`.
- **Registry Error:** If it says "unauthorized," try `npm logout` and then `npm login` again.
