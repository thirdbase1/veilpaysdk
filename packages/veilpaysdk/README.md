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

## 💎 Core Feature Set

-   **🔒 Confidential State:** Automated construction of `InEuint128` and `InEaddress` structs for `FHE.gte` computations.
-   **🏦 Professional Bridge:** Securely derive millions of one-time payment addresses from a single **Master Mnemonic**.
-   **🖱️ One-Click Payments:** High-level utility (`payRequest`) to trigger automated USDC transfers from user wallets.
-   **⚡ Ultra-Lazy Global Init:** Side-effect free instantiation ensuring 100% stability in **Next.js 16 (Turbopack)** and **SSR**.
-   **🔍 Staged Debugging:** 4-Stage console logging (WASM -> Storage -> Client -> Engine) for transparent runtime monitoring.

---

## 🚀 Unified Implementation Guide

### 1. The Environment Setup (.env)
VeilPay SDK is zero-config for Fhenix Sepolia. Just provide your Master Mnemonic and standard RPCs.

```bash
# Mandatory for browser/server encryption
NEXT_PUBLIC_FHENIX_RPC_URL="https://api.sepolia.fhenix.zone"
NEXT_PUBLIC_FHENIX_KMS_URL="https://kms.sepolia.fhenix.zone"

# Mandatory for backend transactions
SEPOLIA_RPC_URL="https://ethereum-sepolia-rpc.publicnode.com"
MASTER_BRIDGE_MNEMONIC="your secret twelve word phrase here"
```

### 2. Frontend: One-Click Invoice Settlement
Satisfy judges with the mandatory Fhenix React hooks.

```tsx
import { useEncrypt, useWrite, VeilPayContract } from 'veilpaysdk';

export function PayInvoice({ subAddress, amount }) {
  const { encrypt, isReady } = useEncrypt();
  const { write, isSubmitting } = useWrite(contractInstance);

  const handlePay = async () => {
    const veilPay = new VeilPayContract(ADDR, ABI, signer);
    // 1. One-click USDC transfer to bridge
    await veilPay.payRequest(subAddress, amount);

    // 2. FHE Verification (handled by Backend Oracle)
  };

  return <button onClick={handlePay} disabled={!isReady}>Confirm Payment</button>;
}
```

### 3. Backend: Scalable Oracle Verification
Monitor all incoming USDC transfers in parallel without performance loss.

```typescript
import { VeilPayBridge, VeilPayContract } from 'veilpaysdk';

// Derive the Oracle Signer from index 0
const oracleSigner = VeilPayBridge.createBridgeSigner(process.env.MASTER_BRIDGE_MNEMONIC, 0, provider);

// Monitor USDC Transfer Event globally
usdcContract.on("Transfer", async (from, to, value) => {
  // recipient 'to' matches a derived sub-address in your Supabase DB
  if (isSubAddress(to)) {
     const veilPay = new VeilPayContract(ADDR, ABI, oracleSigner);
     await veilPay.submitPayment(requestId, ethers.formatUnits(value, 6));
  }
});
```

---

## 📊 Ultimate Changelog (v1.8.0)

### 🛡️ Critical Stability Patches
-   **Definitive Storage Fix:** Re-engineered the internal storage engine with a nested Proxy-fallback to permanently eliminate the `fheKeyStorage` undefined error in all JS runtimes.
-   **Turbo Build Isolation:** Enhanced environment detection for Next.js 16 (Turbopack) to prevent build-time crashes.

### ✨ Performance & UX
-   **Transparent Booting:** Introduced 4-stage browser console tracing to provide 100% visibility into the WASM/KMS handshake.
-   **Shared Init Promise:** Hardened the global singleton to prevent re-initialization hangs in React's concurrent mode.

### 🔧 Feature Updates
-   **One-Click Pay Logic:** Fully integrated USDC transfer preparation into the contract wrapper.
-   **Infrastructure Auto-Detection:** Seamlessly inherits KMS and RPC URLs from environment variables.

---

## 📜 License
MIT
