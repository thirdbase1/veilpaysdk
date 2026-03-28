# 🛡️ VeilPay SDK (v1.8.0)

**The Definitive Fhenix CoFHE Private Invoicing Framework**

VeilPay SDK is a professional-grade TypeScript library specifically engineered for the **Fhenix Confidential Fully Homomorphic Encryption (CoFHE)** ecosystem. It provides an unbreakable foundation for building private payment settlement systems, handling everything from KMS-backed encryption to HD wallet bridge derivation and asynchronous FHE verification.

---

## 🏆 Why Use VeilPay SDK? (Manual vs. Managed)

Integrating Fhenix CoFHE manually is fragile. VeilPay SDK provides a "Bulletproof" alternative:

| Feature | Manual Integration (Legacy) | VeilPay SDK (v1.8.0) |
| :--- | :--- | :--- |
| **Build Stability** | ❌ Frequently crashes Vercel builds (`fheKeyStorage`). | ✅ **Environment Gating:** Physically blocks crashes during build. |
| **Initialization** | ❌ Complex WASM/KMS race conditions. | ✅ **Global Singleton:** Concurrent-safe single init flow. |
| **Privacy Model** | ❌ Single wallet leaks merchant identity. | ✅ **HD Bridge:** Secure one-time sub-address derivation. |
| **UX & Speed** | ❌ Infinite hangs on slow networks. | ✅ **Watchdog Timer:** 45s timeout with staged logging. |
| **Compliance** | ❌ Manual struct construction is error-prone. | ✅ **Native Hooks:** Mandatory `useEncrypt/useWrite` hooks. |

---

## 💎 Full API Reference

### 1. Core Cryptography (`VeilPayCoFHE`)
The low-level engine for Fhenix encryption and environment management.
-   **`init()`**: Asynchronous bootstrapper for WASM and KMS.
-   **`getSDKMetadata()`**: Returns diagnostic data (version, build status, engine state).
-   **`encryptAmount(number)`**: Translates a plaintext value into a confidential `InEuint128` struct.
-   **`encryptAddress(string)`**: Translates a wallet address into a confidential `InEaddress` struct.
-   **`generatePermit(address, provider)`**: Generates mandatory viewing authorization for encrypted data.

### 2. Contract Integration (`VeilPayContract`)
High-level wrapper for `BlindPayEscrow.sol` on Sepolia.
-   **`createRequest(amount, merchant, expiry)`**: Encrypts parameters and triggers on-chain invoice creation.
-   **`payRequest(subAddress, amount)`**: Automates a USDC transfer from the user's wallet to the bridge.
-   **`submitPayment(requestId, amount)`**: (Oracle Only) Submits real payment data for FHE verification.
-   **`waitForResolution(requestId)`**: Polling/Event utility that waits for the Fhenix Coprocessor result.
-   **`getPaymentStatus(requestId)`**: Returns `{ expiry, isResolved, isPaid, isExpired }`.
-   **`onPaymentResolved(requestId, callback)`**: Real-time event listener for FHE completion.

### 3. Bridge Utilities (`VeilPayBridge`)
Tools for implementing the high-privacy "Sub-address" model.
-   **`deriveAddress(mnemonic, index)`**: Generates a unique, one-time payment address from a master seed.
-   **`createBridgeSigner(mnemonic, index, provider)`**: Creates a signing wallet for specific sub-addresses.
-   **`isValidMnemonic(phrase)`**: Robust Ethers v6 validation for seed phrases.

### 4. Buildathon Hooks (React)
Specialized hooks designed to satisfy AKINDO Wave 1 requirements.
-   **`useVeilPayCoFHE()`**: Main hook for engine status (`sdk`, `isReady`, `error`).
-   **`useEncrypt()`**: The "Translator" for converting inputs into FHE structs.
-   **`useWrite(contract)`**: The "Messenger" for handling MetaMask transaction life-cycles.
-   **`useDecrypt(contract)`**: The "Observer" for monitoring the asynchronous Coprocessor result.

---

## 🚀 Professional Implementation Guide

### A. The Merchant: Creating an Invoice (Frontend)
```tsx
const { encrypt, isReady } = useEncrypt();
const { write, isSubmitting } = useWrite(blindPayContract);

const handleCreate = async () => {
  // 1. Encrypt sensitive data locally
  const encAmount = await encrypt(25.00, 'uint128');
  const encMerchant = await encrypt(myWallet, 'address');

  // 2. Submit to Fhenix (Blockchain)
  await write('createRequest', [encAmount, encMerchant, 86400]);
};
```

### B. The Payer: One-Click Settlement (Frontend)
```tsx
const veilPay = new VeilPayContract(ADDR, ABI, signer);

const handlePay = async () => {
  // Prepare and sign USDC transfer to the specific sub-address
  await veilPay.payRequest(derivedSubAddress, 25.00);
};
```

### C. The Oracle: Background Verification (Backend)
Watch ALL USDC transfers globally and match them against your sub-address database.
```typescript
const usdc = new ethers.Contract(USDC_ADDR, USDC_ABI, provider);
usdc.on("Transfer", async (from, to, value) => {
  // recipients matching your DB sub-addresses trigger verification:
  const veilPay = new VeilPayContract(ADDR, ABI, oracleSigner);
  await veilPay.submitPayment(requestId, ethers.formatUnits(value, 6));
});
```

---

## 📊 Ultimate Changelog (v1.8.0)

### 🛡️ Critical Stability Patches
-   **Definitive Storage Fix:** Re-engineered internal storage with a nested Proxy-fallback to permanently eliminate `fheKeyStorage` undefined errors.
-   **Turbo Build Isolation:** Enhanced environment detection for **Next.js 16 (Turbopack)** build safety.

### ✨ Performance & UX
-   **Micro-Step Debugging:** Introduced Stage 1-4 console tracing for transparent WASM/KMS monitoring.
-   **Shared Init Promise:** Hardened global singleton logic to prevent initialization hangs.

---

## 🤝 Buildathon Support
100% Compliant with **Fhenix AKINDO Buildathon Wave 1** requirements. Zero dependencies on Wagmi or RainbowKit.

## 📜 License
MIT
