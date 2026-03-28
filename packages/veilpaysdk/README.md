# 🛡️ VeilPay SDK (v1.7.0)

**The Professional Fhenix CoFHE Integration Framework**

VeilPay SDK is a production-ready TypeScript library for high-fidelity integration with **Fhenix Confidential Fully Homomorphic Encryption (CoFHE)**. It abstracts the complexities of KMS-backed encryption, HD wallet bridges, and asynchronous FHE verification, offering a stable and compliant foundation for private Web3 commerce.

---

## 💎 Core Features

-   **🔒 State Privacy:** Automated construction of `InEuint128` and `InEaddress` structs for on-chain FHE computation (`FHE.gte`).
-   **🏦 Professional Bridge:** Built-in **HD Wallet Derivation** for generating secure, one-time payment sub-addresses.
-   **⚡ Ultra-Lazy Initialization:** Side-effect free instantiation ensuring absolute stability during **Next.js Prerendering** and **SSR**.
-   **🛡️ Build-Proof Gating:** Multi-signal environment detection prevents CoFHE engine crashes in restricted build workers (Vercel/CI).
-   **⛽ Gas-Optimized UX:** Automatic polling and `staticCall` logic for detecting Fhenix Coprocessor results.

---

## 🌐 Network Architecture (Mnemonic-First)

VeilPay SDK utilizes a specialized network strategy for maximum reliability and simplified security. By using a Master Mnemonic, you eliminate the need to manage multiple raw private keys.

### Recommended Environment (.env)
```bash
# Frontend & Backend: CoFHE Engine Endpoint
NEXT_PUBLIC_FHENIX_RPC_URL="https://api.sepolia.fhenix.zone"

# Backend: Standard Sepolia Endpoint (Monitoring USDC transfers)
SEPOLIA_RPC_URL="https://ethereum-sepolia-rpc.publicnode.com"

# Backend: Master Bridge Seed (Everything is derived from this)
MASTER_BRIDGE_MNEMONIC="your twelve word seed phrase here"
```

---

## 🏗️ Professional Bridge Implementation

To achieve 100% merchant privacy and reliable tracking, implement the **One-Time Sub-address** model.

### 1. Backend: Generate Payment Address
Derive a fresh address for every invoice using an incrementing index from your database.

```typescript
import { VeilPayBridge } from 'veilpaysdk';

// Derive unique address for index #5
const subAddress = VeilPayBridge.deriveAddress(process.env.MASTER_BRIDGE_MNEMONIC, 5);
```

### 2. Backend: Initialize Oracle Signer
Derive your backend's signing authority from index 0 of your master seed.

```typescript
import { VeilPayBridge, VeilPayContract } from 'veilpaysdk';

const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
const backendSigner = VeilPayBridge.createBridgeSigner(process.env.MASTER_BRIDGE_MNEMONIC, 0, provider);

const veilPay = new VeilPayContract(ADDR, ABI, backendSigner);
```

---

## 📊 Professional Changelog (v1.7.0)

### ✨ Stability & UX Updates
-   **Concurrent Init Lock:** Implemented a shared global promise to prevent re-initialization hangs in React Strict Mode.
-   **Initialization Watchdog:** 45-second timeout with descriptive Stage-by-Stage logging (1-3) in the browser console.

### 🛡️ Security Patches
-   **Mnemonic Integration:** Eliminated raw `BACKEND_PRIVATE_KEY` requirement in favor of secure HD Wallet derivation.
-   **Robust Storage Fallback:** Defensive try-catch wrapper for `localStorage` to support SSR and Incognito modes.

### 🔧 Internal Fixes
-   **Build Worker Isolation:** Physically gated `@cofhe/sdk` loading during Next.js static generation.

---

## 🤝 Buildathon Support
100% Compliant with **Fhenix AKINDO Buildathon Wave 1** requirements.

## 📜 License
MIT
