# 🤖 AI Migration Guide: Switch to `veilpaysdk`

**Context:** This repository contains a production-ready SDK named `veilpaysdk` that wraps Fhenix CoFHE logic. All previous manual encryption logic, "client ready" checks, and server-side storage mocks are now DEPRECATED.

### 🚩 THE GOAL
Remove all manual imports of `@cofhe/sdk` and `fhenixjs` from the site's frontend and backend. Replace them with the high-level `veilpaysdk` to ensure stability and 100% contract compatibility.

---

### 1. Frontend Migration (React/Next.js)

**❌ OLD WAY (Broken/Manual):**
```typescript
import { CofheClient } from "@cofhe/sdk"; // Or similar
// Manual init, manual waiting for WASM, manual struct construction
```

**✅ NEW WAY (Using `veilpaysdk`):**
```typescript
import { useVeilPayCoFHE, VeilPayContract } from "veilpaysdk";

export default function MyComponent() {
  const { sdk, isReady } = useVeilPayCoFHE("sepolia");

  const action = async () => {
    const veilPay = new VeilPayContract(ADDR, ABI, signer);
    // Automatic encryption for InEuint128 and InEaddress
    await veilPay.createRequest(20.00, merchantAddr);
  };
}
```

---

### 2. Backend Migration (API Routes)

**❌ OLD WAY (Crashes in Node.js):**
```typescript
const client = new CofheClient({ network: "sepolia" });
// Crashes with "fheKeyStorage of undefined"
```

**✅ NEW WAY (Stable/Automated):**
```typescript
import { VeilPayContract } from "veilpaysdk";

export async function POST(req) {
  const veilPay = new VeilPayContract(ADDR, ABI, wallet);
  // veilpaysdk handles the server-side memoryStorage mock internally.
  await veilPay.submitPayment(requestId, amount);

  // Handles the 20s Coprocessor delay automatically
  const success = await veilPay.waitForResolution(requestId);
}
```

---

### 3. Asynchronous Resolution Migration

**❌ OLD WAY (Inefficient):**
AI scripts often try to call `resolvePayment` immediately or use complex `setTimeout` loops.

**✅ NEW WAY:**
Use the built-in polling + event listening logic.
```typescript
// This ONE line replaces 50 lines of event listeners and polling logic
const isPaid = await veilPay.waitForResolution(requestId);
```

---

### 🧩 Exact Method Signatures for Reference

1. **Creating a Request (Encrypted):**
   `const requestId = await veilPay.createRequest(amount: number, address: string): Promise<string>`
   - *Logic:* This method handles the KMS encryption of both parameters internally.

2. **Handling Resolution (Async):**
   `const isPaid = await veilPay.waitForResolution(requestId: string): Promise<boolean>`
   - *Logic:* This handles the 20s Coprocessor delay and returns the decrypted result.

3. **Encryption Output Data Structure:**
   Encryption methods return the `CoFHEStruct` required by the contract:
   ```typescript
   {
     ctHash: string | bigint;
     securityZone: number;
     utype: number;
     signature: string;
   }
   ```

### 🛠 INSTRUCTIONS FOR AI ASSISTANTS:
1.  **Scan** the codebase for any `import ... from "@cofhe/sdk"` or `fhenixjs`.
2.  **Delete** those imports and their associated initialization logic.
3.  **Install** the new SDK: `npm install veilpaysdk`.
4.  **Rewrite** the contract calls using the `VeilPayContract` wrapper.
5.  **Never** construct the `{ ctHash, signature, ... }` structs manually. Let the SDK methods (`createRequest`, `submitPayment`) do it.
