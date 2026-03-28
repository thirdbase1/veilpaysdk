# 🛡️ VeilPay SDK (v1.7.0)

**The Professional Fhenix CoFHE Integration Framework**

VeilPay SDK is a robust, production-grade TypeScript library designed for high-fidelity integration with **Fhenix Confidential Fully Homomorphic Encryption (CoFHE)**. It abstracts the complexities of KMS-backed encryption and asynchronous FHE verification, offering a stable and compliant foundation for private Web3 commerce.

---

## 💎 Core Features

-   **🔒 State Privacy:** Seamlessly handles `InEuint128` and `InEaddress` struct construction for on-chain FHE computation (`FHE.gte`).
-   **🌉 Bridge Infrastructure:** Built-in **HD Wallet Derivation** for generating secure, one-time payment sub-addresses.
-   **⚡ Ultra-Lazy Initialization:** Side-effect free instantiation ensures absolute stability during **Next.js Prerendering** and **SSR**.
-   **🛡️ Execution Gating:** Intelligent environment detection prevents CoFHE engine crashes in restricted build workers (Vercel/CI).
-   **⛽ Gas-Optimized Polling:** Utilizes `staticCall` to verify FHE resolution state before triggering on-chain transactions.

---

## 🌐 Network Architecture

VeilPay SDK utilizes a **Double-RPC Strategy** for maximum reliability:

1.  **CoFHE Engine (Fhenix):** Connects to the Fhenix KMS for encryption and cryptographic proofs.
2.  **Blockchain Layer (Sepolia):** Connects to standard Ethereum Sepolia RPCs for signing transactions and monitoring events.

### Recommended Environment Setup
```bash
# Frontend & Backend: CoFHE Engine Endpoint
NEXT_PUBLIC_FHENIX_RPC_URL="https://api.sepolia.fhenix.zone"

# Backend: Transaction & Monitoring Endpoint
SEPOLIA_RPC_URL="https://ethereum-sepolia-rpc.publicnode.com"

# Bridge: Master Seed Phrase (Backend Only)
MASTER_BRIDGE_MNEMONIC="your secret twelve word seed phrase here"
```

---

## 🚀 Professional Quick Start

### 1. Unified Initialization
Ensure the CoFHE engine is "warmed up" globally for a seamless user experience.

```tsx
import { useEffect } from 'react';
import { VeilPayCoFHE } from 'veilpaysdk';

export function FHEProvider({ children }) {
  useEffect(() => {
    const sdk = new VeilPayCoFHE();
    sdk.init().catch(console.error); // Safe global singleton init
  }, []);
  return <>{children}</>;
}
```

### 2. Secure Bridge Generation (Backend)
Generate unique, one-time payment addresses for every invoice.

```typescript
import { VeilPayBridge } from 'veilpaysdk';

// Generate address for index #5 from master mnemonic
const subAddress = VeilPayBridge.deriveAddress(process.env.MASTER_BRIDGE_MNEMONIC, 5);
```

---

## 📊 Professional Changelog

### v1.7.0 (The Enterprise Stability Release)
> **Summary:** Consolidated fixes for Next.js 16 (Turbopack) and introduced one-time sub-address utilities.

#### 🔧 Internal Fixes
-   **Build worker Isolation:** Physically gated `@cofhe/sdk` loading using dynamic imports and `NEXT_PHASE` detection.
-   **Concurrent Init Lock:** Implemented a shared global singleton promise to prevent initialization deadlocks in React.

#### 🛡️ Security Patches
-   **Storage Fallback:** Robust try-catch wrapper for `localStorage` to support Private/Incognito modes and Node.js.
-   **Bridge Utility:** Added HD Wallet derivation for secure on-chain anonymity.

#### ✨ UX & Visibility
-   **Init Timeout:** 45-second watchdog timer with descriptive Stage-by-Stage logging (1-3) in the browser console.

### v1.0.0 - v1.6.0
-   Established core CoFHE encryption wrappers and basic contract resolution patterns.

---

## 🤝 Buildathon Support
Compatible with **Fhenix AKINDO Buildathon Wave 1** requirements. Zero dependencies on Wagmi, RainbowKit, or WalletConnect.

## 📜 License
MIT
