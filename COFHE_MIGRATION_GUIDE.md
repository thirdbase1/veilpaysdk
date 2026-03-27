# 🛡️ CoFHE Migration Guide: Switch to `veilpaysdk`

**Context:** This repository contains a production-ready SDK named `veilpaysdk` that wraps Fhenix CoFHE logic. This SDK is **100% compliant** with the **Fhenix AKINDO Buildathon Wave 1** requirements.

### 🚩 THE GOAL
Remove all manual imports of `@cofhe/sdk` and `fhenixjs` from the site's frontend and backend. Replace them with the high-level `veilpaysdk` to ensure stability and 100% contract compatibility.

---

### 1. Build-Ready & Environment-Gated (v1.3.0 Update)

**❌ THE OLD PROBLEM:**
Next.js projects often crash during the `next build` (prerendering) phase with the error:
`TypeError: Cannot read properties of undefined (reading 'fheKeyStorage')`

**✅ THE v1.3.0 FIX (Build-Proof):**
`veilpaysdk` now implements **Environment Gating**.
- **Build Isolation:** If the SDK detects it is running inside a Next.js build worker (`NEXT_PHASE`), it **completely skips** loading the environment-sensitive `@cofhe/sdk`.
- **Runtime Activation:** The SDK automatically "wakes up" and initializes the CoFHE engine as soon as it detects a real runtime environment (Browser or live Node.js).
- **Concurrent-Safe:** Shared global promise prevents race conditions in React.

---

### 2. Buildathon Compliance Checklist

| Requirement | VeilPay SDK Status |
| :--- | :--- |
| **CoFHE Stack (@cofhe/sdk)** | ✅ Integrated internally as the primary engine. |
| **Mandatory Permits** | ✅ New `generatePermit()` method for viewing encrypted data. |
| **No Wagmi/RainbowKit Dependency** | ✅ Zero dependencies on Wagmi/RainbowKit. Works with raw `ethers`. |
| **Hardhat Recommended** | ✅ Compatible with Hardhat and standard Sepolia. |
| **React Hooks Recommended** | ✅ Includes a high-performance `useVeilPayCoFHE()` hook. |

---

### 3. Frontend Migration (React/Next.js)

**❌ OLD WAY (Broken/Manual):**
```typescript
import { CofheClient } from "@cofhe/sdk";
// Manual init, manual waiting for WASM, manual struct construction
```

**✅ NEW WAY (Using `veilpaysdk`):**
```typescript
import { useVeilPayCoFHE, VeilPayContract } from "veilpaysdk";

export default function MyComponent() {
  const { sdk, isReady } = useVeilPayCoFHE("sepolia");

  const action = async () => {
    // Constructor is 100% side-effect free and SSR-Safe
    const veilPay = new VeilPayContract(ADDR, ABI, signer);

    // Explicit init (safe to call multiple times)
    await veilPay.init();

    // Automatic encryption for InEuint128 and InEaddress
    await veilPay.createRequest(20.00, merchantAddr);
  };
}
```

---

### 4. Backend Migration (API Routes)

**❌ OLD WAY (Manual Memory Mocks):**
```typescript
// Previously required manual storage hacks that often failed
const memoryStorage = {};
const client = new CofheClient({ network: "sepolia", fheKeyStorage: { ... } });
```

**✅ NEW WAY (Zero-Config Backend):**
```typescript
import { VeilPayContract } from "veilpaysdk";

export async function POST(req) {
  // Constructor is safe for Node.js
  const veilPay = new VeilPayContract(ADDR, ABI, wallet);

  // Storage fallback is automatic during this call
  await veilPay.init();

  await veilPay.submitPayment(requestId, amount);

  // Handles the 20s Coprocessor delay automatically
  const success = await veilPay.waitForResolution(requestId);
}
```

### 🛠 INSTRUCTIONS FOR AI ASSISTANTS:
1.  **Scan** the codebase for any `import ... from "@cofhe/sdk"` or `fhenixjs`.
2.  **Delete** those imports and their associated initialization logic.
3.  **Install** the new SDK: `npm install veilpaysdk`.
4.  **Rewrite** the contract calls using the `VeilPayContract` wrapper.
5.  **Never** construct the `{ ctHash, signature, ... }` structs manually. Let the SDK methods (`createRequest`, `submitPayment`) do it.
