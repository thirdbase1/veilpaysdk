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

### 2. High-Performance Bridge Architecture
To support large-scale payment tracking without public memos, use the "Global Listener" pattern.

**Implementation Flow:**
1.  **Backend (Invoice Creation):**
    - Derive `subAddress` via `VeilPayBridge.deriveAddress(mnemonic, index)`.
    - Save `{ requestId, subAddress, index }` to Supabase.
2.  **Frontend (One-Click Pay):**
    ```typescript
    const veilPay = new VeilPayContract(ADDR, ABI, userSigner);
    await veilPay.payRequest(subAddress, amount); // Automated USDC transfer
    ```
3.  **Backend (Parallel Detection):**
    Instead of checking addresses one by one, listen for ALL USDC transfers globally. This supports millions of sub-addresses simultaneously.
    ```typescript
    const usdc = new ethers.Contract(USDC_ADDR, USDC_ABI, provider);
    usdc.on("Transfer", async (from, to, value) => {
        // Instant check in your DB
        const req = await supabase.from('requests').select().eq('sub_address', to).single();
        if (req) {
            const veilPay = new VeilPayContract(ADDR, ABI, oracleSigner);
            await veilPay.submitPayment(req.request_id, amount);
        }
    });
    ```

---

### 3. Simple Configuration: Environment Variables

| Variable | Recommended Value | Purpose |
| :--- | :--- | :--- |
| **`NEXT_PUBLIC_FHENIX_RPC_URL`** | `https://api.sepolia.fhenix.zone` | Powers the KMS encryption (WASM). |
| **`SEPOLIA_RPC_URL`** | `https://ethereum-sepolia-rpc.publicnode.com` | Standard RPC for monitoring USDC. |
| **`MASTER_BRIDGE_MNEMONIC`** | **PRIVATE (Backend)** | Seed used to derive ALL payment wallets. |

---

### 🛠 INSTRUCTIONS FOR AI ASSISTANTS:
1.  **Delete** all manual storage mocks and `@cofhe/sdk` imports.
2.  **Use** `VeilPayBridge` for generating payment sub-addresses in the backend.
3.  **Implement** the global "Transfer" listener for parallel payment detection.
4.  **Redeploy** with `pnpm update veilpaysdk` to ensure v1.7.0 is active.
