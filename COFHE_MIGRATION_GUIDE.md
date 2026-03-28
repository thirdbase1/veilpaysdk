# 🛡️ CoFHE Migration Guide: Switch to `veilpaysdk`

**Context:** This repository contains a production-ready SDK named `veilpaysdk` that wraps Fhenix CoFHE logic. This SDK is **100% compliant** with the **Fhenix AKINDO Buildathon Wave 1** requirements.

### 🚩 THE GOAL
Remove all manual imports of `@cofhe/sdk` and `fhenixjs` from the site's frontend and backend. Replace them with the high-level `veilpaysdk` to ensure stability and 100% contract compatibility.

---

### 1. Build-Safe & Bulletproof (v1.7.0 Update)

**❌ THE PERSISTENT PROBLEM:**
Next.js projects often crash during the `next build` (prerendering) phase with the error:
`TypeError: Cannot read properties of undefined (reading 'fheKeyStorage')`

**✅ THE v1.7.0 FIX (Bulletproof):**
`veilpaysdk` now implements **Execution Environment Gating**.
- **Build Isolation:** The SDK uses multi-signal detection (Headers, NEXT_PHASE, and Global state) to detect a build worker. If detected, it **physically blocks** the loading of `@cofhe/sdk`.
- **Dormant Mode:** During builds, `init()` resolves immediately but leaves the engine "dormant." It only activates in a real browser or live API environment.
- **Concurrent-Safe:** Implements a global singleton promise to handle multiple React components calling `init()` simultaneously.

---

### 2. Network Integration: The "Triple-Point" Configuration
For a professional project, you need to manage three distinct connection points:

| Point | Key Variable | Value | Purpose |
| :--- | :--- | :--- | :--- |
| **CoFHE Engine** | `NEXT_PUBLIC_FHENIX_RPC_URL` | `https://api.sepolia.fhenix.zone` | Powers the KMS encryption (WASM). |
| **Transactions** | `SEPOLIA_RPC_URL` | `https://ethereum-sepolia-rpc.publicnode.com` | Standard Sepolia RPC for signing and events. |
| **USDC Contract** | *Internal SDK Constant* | `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238` | The official Sepolia USDC bridge. |

---

### 3. Frontend Migration (React/Next.js)

```typescript
import { useVeilPayCoFHE, VeilPayContract } from "veilpaysdk";

export default function MyComponent() {
  const { sdk, isReady, error } = useVeilPayCoFHE({
      network: "sepolia"
  });

  if (error) return <div>FHE Initialization Failed: {error}</div>;

  const action = async () => {
    // Standard Sepolia Signer (e.g. from MetaMask)
    const veilPay = new VeilPayContract(ADDR, ABI, signer);
    await veilPay.init();
    await veilPay.createRequest(20.00, merchantAddr);
  };
}
```

---

### 4. Backend Migration (API Routes)

```typescript
import { VeilPayContract } from "veilpaysdk";

export async function POST(req) {
  // Use SEPOLIA_RPC_URL for the provider
  const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
  const wallet = new ethers.Wallet(process.env.BACKEND_PRIVATE_KEY, provider);

  const veilPay = new VeilPayContract(ADDR, ABI, wallet);

  await veilPay.init(); // Uses FHENIX_RPC_URL internally for encryption
  await veilPay.submitPayment(requestId, amount);
  const success = await veilPay.waitForResolution(requestId);
}
```

### 🛠 INSTRUCTIONS FOR AI ASSISTANTS:
1.  **Delete** all manual storage mocks and `@cofhe/sdk` imports.
2.  **Verify** `NEXT_PUBLIC_FHENIX_RPC_URL` is set to the correct Fhenix endpoint.
3.  **Ensure** transactions are sent via a standard Sepolia RPC, while encryption uses the Fhenix RPC.
