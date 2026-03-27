# 🛡️ CoFHE Migration Guide: Switch to `veilpaysdk`

**Context:** This repository contains a production-ready SDK named `veilpaysdk` that wraps Fhenix CoFHE logic. This SDK is **100% compliant** with the **Fhenix AKINDO Buildathon Wave 1** requirements.

### 🚩 THE GOAL
Remove all manual imports of `@cofhe/sdk` and `fhenixjs` from the site's frontend and backend. Replace them with the high-level `veilpaysdk` to ensure stability and 100% contract compatibility.

---

### 1. Build-Safe & Concurrent-Safe (v1.2.0 Update)

**❌ THE OLD PROBLEM:**
Even with lazy initialization, React's concurrent rendering or multiple component mounts could trigger multiple CoFHE initializations, leading to:
`TypeError: Cannot read properties of undefined (reading 'fheKeyStorage')`

**✅ THE v1.2.0 FIX (Final & Robust):**
`veilpaysdk` now implements a **Global Singleton State** and **Module-Level Locking**.
- **Side-Effect Free Constructor:** Instantiating `VeilPayCoFHE` or `VeilPayContract` is now **100% safe** in any environment (SSR, Prerender, Node.js) as it performs zero logic.
- **Global Init Promise:** The `init()` call uses a shared global promise. Even if 10 components call `init()` at the same time, the SDK is only loaded and initialized **ONCE**.
- **Dynamic Import Barrier:** The environment-sensitive `@cofhe/sdk` is only imported at the moment of the first runtime `init()` call, completely shielding your build process from its internal crashes.

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
