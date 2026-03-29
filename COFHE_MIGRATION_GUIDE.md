# 🛡️ CoFHE Migration Guide: Switch to `veilpaysdk`

**Context:** This repository contains a production-ready SDK named `veilpaysdk` that wraps Fhenix CoFHE logic. This SDK is **100% compliant** with the **Fhenix AKINDO Buildathon Wave 1** requirements.

### 🚩 THE GOAL
Remove all manual imports of `@cofhe/sdk` and `fhenixjs` from the site's frontend and backend. Replace them with the high-level `veilpaysdk` to ensure stability and 100% contract compatibility.

---

### 1. The "Master Wrapper" Pattern (v1.8.0 Update)
Your site should no longer handle initialization or complex FHE math manually. v1.8.0 introduces the **"Managed Framework"** approach.

**✅ THE v1.8.0 ADVANTAGE:**
- **Unbreakable Build:** Physically gated to prevent crashes during Vercel builds.
- **Invisible Storage:** Zero-crash proxy mapping ensures stability in all browser modes.
- **Managed Lifecycle:** One provider handles global state, WASM initialization, and error recovery.

---

### 2. Frontend Setup: The Master Provider
Wrap your entire app in the `VeilPayProvider` to give the SDK the "heavy work."

```tsx
// 1. In layout.tsx
import { VeilPayProvider } from 'veilpaysdk';

export default function Layout({ children }) {
  return (
    <VeilPayProvider config={{ network: "sepolia" }}>
      {children}
    </VeilPayProvider>
  );
}

// 2. In your components (The simple hook)
const { sdk, isReady, error } = useVeilPay();
```

---

### 3. Professional One-Click Payment Flow
Replace manual USDC transfer code with the optimized SDK method.

**Frontend Implementation:**
```typescript
const veilPay = new VeilPayContract(ADDR, ABI, userSigner);
// Automatically prepares and signs USDC transfer to the specific sub-address
await veilPay.payRequest(subAddress, 50.00);
```

---

### 4. Simple Configuration: Environment Variables

| Variable | Recommended Value | Purpose |
| :--- | :--- | :--- |
| **`NEXT_PUBLIC_FHENIX_KMS_URL`** | `https://kms.sepolia.fhenix.zone` | Powers encryption engine. |
| **`NEXT_PUBLIC_FHENIX_RPC_URL`** | `https://api.sepolia.fhenix.zone` | Fhenix-enabled RPC. |
| **`SEPOLIA_RPC_URL`** | `Standard Sepolia RPC` | Transactions & Monitoring. |
| **`MASTER_BRIDGE_MNEMONIC`** | **PRIVATE (Backend)** | Wallet derivation seed. |

---

### 🛠 INSTRUCTIONS FOR AI ASSISTANTS:
1.  **Delete** all manual storage mocks and `@cofhe/sdk` imports.
2.  **Use** the `VeilPayProvider` for global state management.
3.  **Use** `VeilPayContract.processPayment()` for backend decision logic.
4.  **Use** `VeilPayBridge.verifyUsdcTransfer()` for backend Oracle monitoring.
5.  **Redeploy** with `pnpm update veilpaysdk` to ensure v1.8.0 is active.
