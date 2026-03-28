# 🛡️ CoFHE Migration Guide: Switch to `veilpaysdk`

**Context:** This repository contains a production-ready SDK named `veilpaysdk` that wraps Fhenix CoFHE logic. This SDK is **100% compliant** with the **Fhenix AKINDO Buildathon Wave 1** requirements.

### 🚩 THE GOAL
Remove all manual imports of `@cofhe/sdk` and `fhenixjs` from the site's frontend and backend. Replace them with the high-level `veilpaysdk` to ensure stability and 100% contract compatibility.

---

### 1. Build-Safe & Concurrent-Safe (v1.7.0 Update)

**❌ THE PERSISTENT PROBLEM:**
Next.js projects often crash during the `next build` (prerendering) phase with the error:
`TypeError: Cannot read properties of undefined (reading 'fheKeyStorage')`

**✅ THE v1.7.0 FIX (Bulletproof):**
`veilpaysdk` now implements **Execution Environment Gating**.
- **Build Isolation:** If the SDK detects a build worker, it **physically blocks** the loading of `@cofhe/sdk`.
- **Dormant Mode:** During builds, `init()` resolves immediately but leaves the engine "dormant." It only activates in a real browser or live API environment.
- **Concurrent-Safe:** Implements a global singleton promise to handle multiple React components calling `init()` simultaneously.

---

### 2. Network Integration: The "Triple-Point" Configuration
For a professional FHE project, you must manage three distinct connection points:

| Point | Variable | Recommended Value | Purpose |
| :--- | :--- | :--- | :--- |
| **CoFHE Engine** | `NEXT_PUBLIC_FHENIX_RPC_URL` | `https://api.sepolia.fhenix.zone` | Powers the KMS encryption (WASM). |
| **Transactions** | `SEPOLIA_RPC_URL` | `https://ethereum-sepolia-rpc.publicnode.com` | Standard Sepolia RPC for transactions. |
| **USDC Contract** | *SDK Constant* | `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238` | The official Sepolia USDC bridge. |

---

### 3. Professional Bridge Flow (One-Time Addresses)
To maximize privacy and simplify payment tracking, use the built-in `VeilPayBridge` utility.

**Backend Flow:**
1.  **Generate Index:** Store a counter in your database.
2.  **Derive Address:**
    ```typescript
    const subAddress = VeilPayBridge.deriveAddress(process.env.MASTER_BRIDGE_MNEMONIC, index);
    ```
3.  **Monitor USDC:** Use a standard Ethers provider to watch for `Transfer` events to that `subAddress` on the USDC contract.
4.  **FHE Verify:** Once USDC is received, call `veilPay.submitPayment(requestId, amount)`.

---

### 4. Frontend Migration (React/Next.js)

```typescript
import { useVeilPayCoFHE, VeilPayContract } from "veilpaysdk";

export default function MyComponent() {
  const { isReady, error } = useVeilPayCoFHE();

  const action = async () => {
    // Uses standard signer for transaction, internal SDK handles Fhenix RPC for encryption
    const veilPay = new VeilPayContract(ADDR, ABI, signer);
    await veilPay.init();
    await veilPay.createRequest(20.00, merchantAddr);
  };
}
```

### 🛠 INSTRUCTIONS FOR AI ASSISTANTS:
1.  **Delete** all manual storage mocks and `@cofhe/sdk` imports.
2.  **Ensure** the `rpcUrl` passed to the SDK is a Fhenix-enabled RPC.
3.  **Use** `VeilPayBridge` for generating payment sub-addresses in the backend.
