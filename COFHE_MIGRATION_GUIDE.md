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

### 2. Simple Configuration: Environment Variables
With the new **Bridge Architecture**, you no longer need a separate `BACKEND_PRIVATE_KEY`. Everything is derived from your **Master Mnemonic**.

| Variable | Scope | Purpose |
| :--- | :--- | :--- |
| **`NEXT_PUBLIC_FHENIX_RPC_URL`** | Frontend/Backend | Required for CoFHE KMS encryption (WASM). |
| **`SEPOLIA_RPC_URL`** | Backend | Standard RPC for monitoring USDC and transactions. |
| **`MASTER_BRIDGE_MNEMONIC`** | **PRIVATE (Backend)** | Secret 12/24 words used to derive ALL payment wallets. |

---

### 3. Professional Bridge Flow (One-Time Addresses)
Use the `VeilPayBridge` utility to manage your payment gateway securely.

**Recommended Supabase Schema:**
```sql
CREATE TABLE requests (
  id uuid PRIMARY KEY,
  request_id bytes32 UNIQUE,   -- From Fhenix Contract
  sub_address address UNIQUE, -- Derived from SDK (index N)
  merchant_address address,    -- Plaintext (Private in DB)
  wallet_index integer,        -- The HD index used (0, 1, 2...)
  status text DEFAULT 'pending'
);
```

**Backend Implementation:**
```typescript
import { VeilPayBridge, VeilPayContract } from 'veilpaysdk';

// 1. Derive one-time payment address for a new customer
const subAddress = VeilPayBridge.deriveAddress(process.env.MASTER_BRIDGE_MNEMONIC, index);

// 2. Create the Oracle Signer (using index 0 for the main backend tasks)
const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
const backendSigner = VeilPayBridge.createBridgeSigner(process.env.MASTER_BRIDGE_MNEMONIC, 0, provider);

// 3. Initialize Contract with derived backend signer
const veilPay = new VeilPayContract(ADDR, ABI, backendSigner);
```

---

### 🛠 INSTRUCTIONS FOR AI ASSISTANTS:
1.  **Delete** all manual storage mocks and `@cofhe/sdk` imports.
2.  **Use** `MASTER_BRIDGE_MNEMONIC` to derive wallets; do not ask for a private key.
3.  **Ensure** transactions are sent via standard Sepolia RPC, while encryption uses the Fhenix RPC.
4.  **Force Update:** If you see build errors, purge Vercel cache and redeploy to ensure v1.7.0 is active.
