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

## 🌐 Network Architecture (Dual-RPC)

VeilPay SDK utilizes a specialized network strategy for maximum reliability:

1.  **CoFHE Engine (Fhenix):** Connects to the Fhenix KMS for encryption and cryptographic proofs.
2.  **Blockchain Layer (Sepolia):** Connects to standard Ethereum Sepolia RPCs for signing transactions and monitoring USDC transfers.

### Recommended Environment (.env)
```bash
# Frontend & Backend: CoFHE KMS Endpoint
NEXT_PUBLIC_FHENIX_RPC_URL="https://api.sepolia.fhenix.zone"

# Backend: Standard Sepolia Endpoint (Transactions/Monitoring)
SEPOLIA_RPC_URL="https://ethereum-sepolia-rpc.publicnode.com"

# Backend: Master Bridge Seed (Never expose to Frontend!)
MASTER_BRIDGE_MNEMONIC="your twelve word seed phrase here"
```

---

## 🏗️ Professional Bridge Implementation

To achieve 100% merchant privacy and reliable tracking, implement the **One-Time Sub-address** model.

### 1. Backend: Generate & Save (Supabase)
Generate a fresh address for every invoice using an incrementing index from your database.

```typescript
import { VeilPayBridge } from 'veilpaysdk';

// 1. Get next index from your DB (e.g. 5)
const subAddress = VeilPayBridge.deriveAddress(process.env.MASTER_BRIDGE_MNEMONIC, 5);

// 2. Save to Supabase: { requestId, subAddress, status: 'pending' }
```

### 2. Frontend: Display Payment Info
Show the user the unique sub-address and the Request ID.

```tsx
<div>
  <p>Send USDC to: {subAddress}</p>
  <p>Request ID: {requestId}</p>
</div>
```

### 3. Backend: Oracle Verification
Watch the Sepolia USDC contract for transfers to the generated sub-address.

```typescript
import { VeilPayContract } from 'veilpaysdk';

// Detect USDC Transfer to subAddress...
// Then verify via Fhenix:
const veilPay = new VeilPayContract(ADDR, ABI, backendWallet);
await veilPay.init();
await veilPay.submitPayment(requestId, amountReceived);
```

---

## 📊 Professional Changelog (v1.7.0)

### ✨ Stability & UX Updates
-   **Concurrent Init Lock:** Implemented a shared global promise to prevent re-initialization hangs in React Strict Mode.
-   **Initialization Watchdog:** 45-second timeout with descriptive Stage-by-Stage logging (1-3) in the browser console.
-   **Diagnostic Metadata:** New `getSDKMetadata()` method for debugging environment gating issues.

### 🛡️ Security Patches
-   **HD Wallet Bridge:** Integrated `VeilPayBridge` for secure on-chain anonymity and identification.
-   **Robust Storage Fallback:** Defensive try-catch wrapper for `localStorage` to support SSR and Incognito modes.

### 🔧 Internal Fixes
-   **Build Worker Isolation:** Physically gated `@cofhe/sdk` loading during Next.js static generation.
-   **Auto-RPC Prioritization:** Enhanced auto-detection to prioritize backend-only `FHENIX_RPC_URL`.

---

## 📜 License
MIT
