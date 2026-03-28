# 🛡️ CoFHE Migration Guide: Switch to `veilpaysdk`

**Context:** This repository contains a production-ready SDK named `veilpaysdk` that wraps Fhenix CoFHE logic. This SDK is **100% compliant** with the **Fhenix AKINDO Buildathon Wave 1** requirements.

### 🚩 THE GOAL
Remove all manual imports of `@cofhe/sdk` and `fhenixjs` from the site's frontend and backend. Replace them with the high-level `veilpaysdk` to ensure stability and 100% contract compatibility.

---

### 1. Build-Safe & Concurrent-Safe (v1.7.0 Update)

**❌ THE PERSISTENT PROBLEM:**
Next.js projects often crash during the `next build` phase with the error:
`TypeError: Cannot read properties of undefined (reading 'fheKeyStorage')`

**✅ THE v1.7.0 FIX (Bulletproof):**
`veilpaysdk` now implements **Execution Environment Gating**.
- **Build Isolation:** If the SDK detects a build worker, it **physically blocks** the loading of `@cofhe/sdk`.
- **Dormant Mode:** During builds, `init()` resolves immediately but leaves the engine "dormant." It only activates in a real browser or live API environment.
- **Global Lock:** A shared global promise ensures that multiple components mounting at once only trigger **ONE** initialization flow.

---

### 2. Network Integration: The "Triple-Point" Configuration
For a professional project, you must manage three distinct connection points:

| Point | Key Variable | Purpose |
| :--- | :--- | :--- |
| **CoFHE Engine** | `NEXT_PUBLIC_FHENIX_RPC_URL` | Powers the KMS encryption (WASM). |
| **Transactions** | `SEPOLIA_RPC_URL` | Standard Sepolia RPC for signing and events. |
| **USDC Contract** | `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238` | The official Sepolia USDC bridge. |

---

### 3. Professional Architecture: One-Time Sub-addresses
To track payments without clashing amounts and to protect merchant privacy, use the built-in `VeilPayBridge`.

**Recommended Supabase Schema:**
```sql
CREATE TABLE requests (
  id uuid PRIMARY KEY,
  request_id bytes32 UNIQUE,   -- From Fhenix Contract
  sub_address address UNIQUE, -- Derived from SDK
  merchant_address address,    -- Plaintext (Private in DB)
  amount decimal,
  status text DEFAULT 'pending'
);
```

**Implementation Flow:**
1.  **Frontend:** Merchant clicks "Create."
2.  **Backend:**
    - Derive fresh `subAddress` using `VeilPayBridge.deriveAddress(mnemonic, next_index)`.
    - Create on-chain request via `VeilPayContract.createRequest()`.
    - Save to Supabase.
3.  **Frontend (Pay Page):** User sends USDC to the unique `sub_address`.
4.  **Backend (Oracle):** Watches USDC contract for transfers to `sub_address`. Calls `submitPayment()` on Fhenix when detected.

---

### 🛠 INSTRUCTIONS FOR AI ASSISTANTS:
1.  **Delete** all manual storage mocks and `@cofhe/sdk` imports.
2.  **Verify** `NEXT_PUBLIC_FHENIX_RPC_URL` is set to the correct Fhenix endpoint.
3.  **Check** for `error` from the hook to prevent UI hangs.
4.  **Force Update:** If you see build errors, purge Vercel cache and redeploy to ensure v1.7.0 is active.
