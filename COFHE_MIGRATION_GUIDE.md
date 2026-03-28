# 🛡️ CoFHE Migration Guide: Switch to `veilpaysdk`

**Context:** This repository contains a production-ready SDK named `veilpaysdk` that wraps Fhenix CoFHE logic. This SDK is **100% compliant** with the **Fhenix AKINDO Buildathon Wave 1** mandatory requirements.

### 🚩 THE GOAL
Remove all manual imports of `@cofhe/sdk` and `fhenixjs` from the site's frontend and backend. Replace them with the high-level `veilpaysdk` to ensure stability and 100% contract compatibility.

---

### 1. Build-Safe & Zero-Config (v1.7.0 Final)

**❌ THE PERSISTENT PROBLEM:**
Next.js projects often crash during the `next build` phase or hang in the browser due to `fheKeyStorage` undefined errors.

**✅ THE v1.7.0 FIX (Bulletproof):**
`veilpaysdk` now implements **Multi-Stage Runtime Hardening**.
- **Build Isolation:** Physically blocks `@cofhe/sdk` from loading in build workers (Vercel).
- **Runtime Debugging:** Provides micro-step logging (Stage 1-4) in the browser console.
- **Zero-Config:** Automatically uses the official Fhenix Sepolia endpoints.

---

### 2. Mandatory Buildathon Hooks (The "Jobs")
Use these hooks to satisfy the AKINDO requirements and provide a professional UX:

| Hook | The "Job" | Implementation |
| :--- | :--- | :--- |
| **`useEncrypt`** | **The Translator** | Converts plaintext amounts/addresses into FHE structs. |
| **`useWrite`** | **The Messenger** | Handles MetaMask transactions and submission states. |
| **`useDecrypt`** | **The Observer** | Monitors the Coprocessor for asynchronous resolution. |

---

### 3. Full Environment Configuration (.env)
Provide these four variables in your Vercel project settings:

| Variable | Recommended Value | Purpose |
| :--- | :--- | :--- |
| **`NEXT_PUBLIC_FHENIX_KMS_URL`** | `https://kms.sepolia.fhenix.zone` | Powers encryption engine. |
| **`NEXT_PUBLIC_FHENIX_RPC_URL`** | `https://api.sepolia.fhenix.zone` | Fhenix-enabled RPC. |
| **`SEPOLIA_RPC_URL`** | `https://ethereum-sepolia-rpc.publicnode.com` | Standard Sepolia RPC. |
| **`MASTER_BRIDGE_MNEMONIC`** | **PRIVATE (Backend)** | Seed phrase for derivation. |

---

### 🛠 INSTRUCTIONS FOR AI ASSISTANTS:
1.  **Delete** all manual storage mocks and `@cofhe/sdk` imports.
2.  **Use** the new hooks (`useEncrypt`, `useWrite`) to implement frontend actions.
3.  **Redeploy** with `pnpm update veilpaysdk` to ensure the final v1.7.0 is active.
