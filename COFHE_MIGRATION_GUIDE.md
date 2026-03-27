# 🛡️ CoFHE Migration Guide: Switch to `veilpaysdk`

**Context:** This repository contains a production-ready SDK named `veilpaysdk` that wraps Fhenix CoFHE logic. All previous manual encryption logic, "client ready" checks, and server-side storage mocks are now DEPRECATED.

### 🚩 THE GOAL
Remove all manual imports of `@cofhe/sdk` and `fhenixjs` from the site's frontend and backend. Replace them with the high-level `veilpaysdk` to ensure stability and 100% contract compatibility.

---

### 1. The "Ultra-Robust" Storage Fix (New in v1.0.9)

**❌ THE OLD PROBLEM:**
Next.js SSR and Node.js environments frequently crash with:
`TypeError: Cannot read properties of undefined (reading 'fheKeyStorage')`

**✅ THE NEW FIX:**
`veilpaysdk` now implements a **try-catch storage wrapper with automatic persistent memory fallback**.
- **No manual mocks needed:** You no longer need to pass `memoryStorage` dictionaries to the client.
- **SSR-Safe:** The SDK detection logic now handles the transition between server-side and client-side execution flawlessly.

---

### 2. Frontend Migration (React/Next.js)

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
    const veilPay = new VeilPayContract(ADDR, ABI, signer);
    // Automatic encryption for InEuint128 and InEaddress
    await veilPay.createRequest(20.00, merchantAddr);
  };
}
```

---

### 3. Backend Migration (API Routes)

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
  // ZERO config needed! Storage fallback is automatic.
  const veilPay = new VeilPayContract(ADDR, ABI, wallet);
  await veilPay.submitPayment(requestId, amount);

  // Handles the 20s Coprocessor delay automatically
  const success = await veilPay.waitForResolution(requestId);
}
```

---

### 🧩 Exact Method Signatures & Architectural Patterns

1. **Creating a Request (Automated Flow):**
   `const requestId = await veilPay.createRequest(amount: number, address: string): Promise<string>`
   - *Architectural Tip:* This should be called on the **Frontend**. It encrypts parameters internally and submits the TX to the contract.

2. **Verifying a Payment (Backend Flow):**
   `const txHash = await veilPay.submitPayment(requestId: string, amount: number): Promise<string>`
   - *Architectural Tip:* Called on the **Backend** once a USDC transfer is detected. It encrypts the paid amount and tells the contract to start FHE verification.

3. **Handling Resolution (Async):**
   `const isPaid = await veilPay.waitForResolution(requestId: string): Promise<boolean>`
   - *Logic:* Handles the 20s Coprocessor delay. Returns `true` if sufficient.

### 🛠 INSTRUCTIONS FOR AI ASSISTANTS:
1.  **Scan** the codebase for any `import ... from "@cofhe/sdk"` or `fhenixjs`.
2.  **Delete** those imports and their associated initialization logic.
3.  **Install** the new SDK: `npm install veilpaysdk`.
4.  **Rewrite** the contract calls using the `VeilPayContract` wrapper.
5.  **Never** construct the `{ ctHash, signature, ... }` structs manually. Let the SDK methods (`createRequest`, `submitPayment`) do it.
