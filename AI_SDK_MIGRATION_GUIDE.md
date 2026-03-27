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

### 🧩 Exact Method Signatures & Architectural Patterns

**Note on Signers:**
- `VeilPayCoFHE` (Raw Encryption): Needs **NO** signer or provider.
- `VeilPayContract` (Blockchain): **REQUIRES** a `Signer` (for transactions) or `Provider` (for reading status).

1. **Creating a Request (Automated Flow):**
   `const requestId = await veilPay.createRequest(amount: number, address: string): Promise<string>`
   - *Architectural Tip:* This should be called on the **Frontend**. It encrypts parameters internally and submits the TX to the contract.
   - *Database:* Save the returned `requestId` to your DB (e.g., Supabase) as a unique identifier.

2. **Verifying a Payment (Backend Flow):**
   `const txHash = await veilPay.submitPayment(requestId: string, amount: number): Promise<string>`
   - *Architectural Tip:* Called on the **Backend** once a USDC transfer is detected. It encrypts the paid amount and tells the contract to start FHE verification.

3. **Handling Resolution (Async):**
   `const isPaid = await veilPay.waitForResolution(requestId: string): Promise<boolean>`
   - *Logic:* Handles the 20s Coprocessor delay. Returns `true` if sufficient.
   - *Tip:* Use this to update your DB status from 'pending' to 'paid'.

4. **Encryption Output Data Structure:**
   Raw methods (`encryptAmount`, `encryptAddress`) return the `CoFHEStruct` required by the contract:
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
