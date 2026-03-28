# 🛡️ VeilPay SDK (v1.7.0)

**The Enterprise-Grade Fhenix CoFHE Integration Framework**

VeilPay SDK is a robust, environment-aware TypeScript library designed for high-performance integration with **Fhenix Confidential Fully Homomorphic Encryption (CoFHE)**. It abstracts the complexities of KMS-backed encryption and asynchronous FHE verification, providing a stable, production-ready foundation for private Web3 payments.

---

## 💎 Core Features

-   **🔒 State-of-the-Art Privacy:** Seamlessly handles `InEuint128` and `InEaddress` struct construction for on-chain FHE logic.
-   **⚡ Ultra-Lazy Initialization:** Side-effect free instantiation ensures absolute stability during **Next.js Prerendering** and **SSR**.
-   **🛡️ Execution Gating:** Intelligent environment detection prevents CoFHE engine crashes in restricted build workers (Vercel/CI).
-   **⛽ Gas-Efficient Design:** Utilizes `staticCall` to verify FHE resolution state before triggering on-chain transactions.
-   **📢 Async UX Support:** Built-in polling and event-listening logic for the Fhenix Coprocessor's asynchronous decryption cycle.

---

## 🌐 Network Architecture

VeilPay SDK utilizes a **Dual-RPC Strategy** for maximum performance and security:

1.  **Encryption Engine (Fhenix):** Uses the Fhenix-enabled RPC for CoFHE KMS operations.
2.  **Transaction Layer (Sepolia):** Uses standard Ethereum Sepolia RPCs for signing and submitting transactions.

### Mandatory Configuration
Ensure your environment includes the following:
```bash
# Frontend & Backend: CoFHE Engine Endpoint
NEXT_PUBLIC_FHENIX_RPC_URL="https://api.sepolia.fhenix.zone"

# Backend: Standard Transaction Endpoint
SEPOLIA_RPC_URL="https://ethereum-sepolia-rpc.publicnode.com"
```

---

## 🚀 Professional Quick Start

### 1. Unified Initialization (Recommended)
Warm up the engine globally to ensure instantaneous responsiveness for your users.

```tsx
import { useEffect } from 'react';
import { VeilPayCoFHE } from 'veilpaysdk';

export function FHEProvider({ children }) {
  useEffect(() => {
    const sdk = new VeilPayCoFHE();
    sdk.init().catch(console.error); // Safe, concurrent-safe global init
  }, []);
  return <>{children}</>;
}
```

### 2. High-Level Contract Integration
```typescript
import { useVeilPayCoFHE, VeilPayContract } from "veilpaysdk";

export function createPrivateInvoice() {
  const { isReady, error } = useVeilPayCoFHE();

  const handleAction = async () => {
    const veilPay = new VeilPayContract(CONTRACT_ADDR, ABI, ethersSigner);
    await veilPay.init(); // Joins global init promise

    // Automatically encrypts and submits to BlindPayEscrow.sol
    const requestId = await veilPay.createRequest(50.00, "0xMerchantAddress");
  };
}
```

---

## 📊 Professional Changelog

### v1.7.0 (The Enterprise Stability Release)
> **Summary:** Consolidated final fixes for Next.js 16+ (Turbopack) and multi-component initialization race conditions.

#### 🔧 Internal Fixes & Hardening
-   **Next.js Build Isolation:** Fully physically gated `@cofhe/sdk` loading using dynamic imports and `NEXT_PHASE` environment detection.
-   **Concurrent Init Lock:** Implemented a shared global singleton promise to prevent initialization deadlocks in React's concurrent mode.
-   **Environment Detection:** Enhanced multi-signal detection (Headers + Process + Window) for bulletproof build worker identification.

#### 🛡️ Security Patches
-   **Storage Fallback:** Implemented a recursive try-catch wrapper for `localStorage` to prevent crashes in private/incognito browser modes and Node.js.
-   **Signer Isolation:** Hardened contract methods to ensure private keys never reach the encryption engine configuration.

#### ✨ Minor Updates
-   **Init Timeout:** Added a 45-second watchdog timer with verbose Stage-by-Stage logging (1-3) to the browser console.
-   **Auto-RPC Detection:** Added automatic fallback for `FHENIX_RPC_URL` vs `NEXT_PUBLIC_FHENIX_RPC_URL`.

### v1.0.0 - v1.6.0
-   Established core FHE encryption wrappers and basic contract resolution patterns.

---

## 🤝 Buildathon Support
Compatible with **Fhenix AKINDO Buildathon Wave 1** requirements. Zero dependencies on Wagmi, RainbowKit, or WalletConnect.

## 📜 License
MIT
