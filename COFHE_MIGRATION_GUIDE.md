# 🛡️ CoFHE Migration Guide: Switch to `veilpaysdk`

**Context:** This repository contains a production-ready SDK named `veilpaysdk` that wraps Fhenix CoFHE logic. This SDK is **100% compliant** with the **Fhenix AKINDO Buildathon Wave 1** requirements.

### 🚩 THE GOAL
Remove all manual imports of `@cofhe/sdk` and `fhenixjs` from the site's frontend and backend. Replace them with the high-level `veilpaysdk` to ensure stability and 100% contract compatibility.

---

### 1. Build-Safe & Runtime-Bulletproof (v1.8.0 Update)

**❌ THE PERSISTENT PROBLEM:**
Next.js projects often crash during `next build` or hang in the browser due to `fheKeyStorage` undefined errors.

**✅ THE v1.8.0 FIX (The Definitive Solution):**
`veilpaysdk` now implements **Execution Environment Gating** and a **Proxy-Storage Fallback**.
- **Build Isolation:** Physically blocks `@cofhe/sdk` from loading in Vercel build workers.
- **Unbreakable Storage:** A new internal storage engine ensures that `@cofhe/sdk` never sees an `undefined` storage property, even in restricted browser modes.
- **Turbopack Support:** Optimized for Next.js 16 and high-speed build pipelines.

---

### 2. Triple-Point Network Configuration
To align with Buildathon requirements and ensure 100% stability, provide these variables:

| Variable | Recommended Value | Purpose |
| :--- | :--- | :--- |
| **`NEXT_PUBLIC_FHENIX_KMS_URL`** | `https://kms.sepolia.fhenix.zone` | Powers encryption engine. |
| **`NEXT_PUBLIC_FHENIX_RPC_URL`** | `https://api.sepolia.fhenix.zone` | Fhenix-enabled RPC. |
| **`SEPOLIA_RPC_URL`** | `Standard Sepolia RPC` | Transactions & Monitoring. |
| **`MASTER_BRIDGE_MNEMONIC`** | **PRIVATE (Backend)** | Wallet derivation seed. |

---

### 3. Professional One-Click Payment Flow
Replace manual USDC transfer code with the optimized SDK method.

**Frontend Implementation:**
```typescript
const veilPay = new VeilPayContract(ADDR, ABI, signer);
await veilPay.payRequest(subAddress, amount); // Automated USDC transfer
```

---

### 🛠 INSTRUCTIONS FOR AI ASSISTANTS:
1.  **Delete** all manual storage mocks and `@cofhe/sdk` imports.
2.  **Use** the `VeilPayBridge` and `payRequest` methods for all invoicing logic.
3.  **Check** for `error` from the hooks to prevent UI hangs.
4.  **Force Update:** If you see errors, purge Vercel cache and redeploy to ensure v1.8.0 is active.
