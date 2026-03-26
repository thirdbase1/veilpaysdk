# Fixed CoFHE Implementation Guide

This document provides the corrected, production-ready implementation for the BlindPay Escrow CoFHE integration. Use these snippets to replace the broken logic in your `create/page.tsx`, `lib/server/cofheServer.ts`, and `submit-payment/route.ts` files.

## 1. Frontend: Corrected Struct Validation
**File:** `/app/(pages)/create/page.tsx`

The previous AI response used a broken logic check `!encryptedAmount.securityZone === undefined`. This corrected version properly validates all four required fields in the CoFHE struct (`ctHash`, `securityZone`, `utype`, and `signature`).

```typescript
/**
 * PRODUCTION VALIDATION: Ensures the encrypted input is a valid CoFHE struct
 * before submitting to the Sepolia blockchain.
 */
function validateCofheStruct(encryptedInput: any, label: string) {
    if (!encryptedInput || typeof encryptedInput !== 'object') {
        throw new Error(`${label} must be a valid CoFHE struct object.`);
    }

    const missingFields = [];
    if (encryptedInput.ctHash === undefined) missingFields.push('ctHash');
    if (encryptedInput.securityZone === undefined) missingFields.push('securityZone');
    if (encryptedInput.utype === undefined) missingFields.push('utype');
    if (encryptedInput.signature === undefined) missingFields.push('signature');

    if (missingFields.length > 0) {
        throw new Error(`Invalid ${label}: Missing CoFHE fields [${missingFields.join(', ')}].`);
    }
}

// Usage in your submission handler:
// validateCofheStruct(encryptedAmount, "Encrypted Amount");
// validateCofheStruct(encryptedMerchant, "Encrypted Merchant Address");
```

---

## 2. Backend: Server-Side `fheKeyStorage` Fix
**File:** `/lib/server/cofheServer.ts`

To prevent the `TypeError: Cannot read properties of undefined (reading 'fheKeyStorage')` crash in Node.js/Next.js API routes, you must provide a `memoryStorage` mock for the CoFHE client.

```typescript
import { CofheClient } from "@cofhe/sdk";

/**
 * SERVER-SIDE INITIALIZATION: Prevents localStorage crashes in Node.js
 */
const memoryStorage: Record<string, string> = {};

export const getCofheServerClient = () => {
    return new CofheClient({
        network: "sepolia",
        fheKeyStorage: {
            getItem: (key: string) => memoryStorage[key] || null,
            setItem: (key: string, value: string) => { memoryStorage[key] = value; },
            removeItem: (key: string) => { delete memoryStorage[key]; }
        }
    });
};
```

---

## 3. Backend: Asynchronous Decryption Flow (Phase 4)
**File:** `/app/api/cofhe/submit-payment/route.ts`

**CRITICAL:** Do NOT call `resolvePayment` in the same execution context as `submitPayment`. CoFHE decryption happens asynchronously on a Coprocessor and takes several blocks to complete.

### Step A: The Submission API
Your API route should ONLY submit the payment to the contract.

```typescript
// /app/api/cofhe/submit-payment/route.ts

export async function POST(req: Request) {
    const { requestId, actualAmountPaid } = await req.json();

    const cofheClient = getCofheServerClient();
    const encryptedPaidAmount = await cofheClient.encrypt(actualAmountPaid, "uint128");

    // Submit the encrypted amount to the contract
    // This triggers the asynchronous FHE.decrypt event on Sepolia
    const tx = await contract.submitPayment(requestId, encryptedPaidAmount);
    await tx.wait();

    // DO NOT CALL resolvePayment here.
    // Return success and let the background worker/listener handle resolution.
    return Response.json({
        success: true,
        message: "Payment submitted. Decryption pending on Fhenix Coprocessor.",
        txHash: tx.hash
    });
}
```

### Step B: The Resolution Listener
Use an event listener or a background job to call `resolvePayment` once the Coprocessor has returned the result.

```typescript
// lib/services/paymentWatcher.ts

/**
 * Listens for PaymentSubmitted events and attempts to resolve them
 * after a delay to allow the Coprocessor to finish decryption.
 */
contract.on("PaymentSubmitted", async (requestId) => {
    console.log(`[CoFHE] Payment submitted for ${requestId}. Waiting for Coprocessor...`);

    // Wait for ~10-15 seconds for the Coprocessor to provide the result
    setTimeout(async () => {
        try {
            const tx = await contract.resolvePayment(requestId);
            const receipt = await tx.wait();
            console.log(`[CoFHE] Request ${requestId} resolved in tx: ${receipt.hash}`);
        } catch (error) {
            console.error(`[CoFHE] Resolution failed for ${requestId}:`, error);
        }
    }, 15000);
});
```

---

## 4. Frontend: Fixing "CoFHE client not ready"
**File:** `/app/(pages)/create/page.tsx` or `/hooks/useCofhe.ts`

The "CoFHE client not ready" error occurs because the SDK needs to initialize asynchronously (loading WASM or keys) before you can call `.encrypt()`. You must `await client.init()` or track the initialization state.

### Using a React Hook (Recommended)
```typescript
import { useState, useEffect } from 'react';
import { CofheClient } from "@cofhe/sdk";

export function useCofhe() {
    const [client, setClient] = useState<CofheClient | null>(null);
    const [isReady, setIsReady] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const init = async () => {
            try {
                const cofhe = new CofheClient({ network: "sepolia" });
                // CRITICAL: Must await the internal initialization
                if (typeof (cofhe as any).init === 'function') {
                    await (cofhe as any).init();
                }
                setClient(cofhe);
                setIsReady(true);
            } catch (err: any) {
                console.error("CoFHE Init Failed:", err);
                setError(err.message);
            }
        };
        init();
    }, []);

    return { client, isReady, error };
}

// Usage in your component:
// const { client, isReady } = useCofhe();
// if (!isReady) return <button disabled>Initializing CoFHE...</button>;
```

### Manual Async Initialization
If you are initializing the client directly inside a function, ensure you await it:
```typescript
async function handleCreateRequest() {
    const client = new CofheClient({ network: "sepolia" });

    // Ensure initialization is complete
    if (typeof (client as any).init === 'function') {
        await (client as any).init();
    }

    const encryptedAmount = await client.encrypt(amount, "uint128");
    // ... rest of your logic
}
```

---

## Summary Checklist
- [ ] Fixed `page.tsx` validation to include `utype` and fix the `undefined` logic error.
- [ ] Added `memoryStorage` mock to `cofheServer.ts` initialization.
- [ ] Added `await client.init()` or a `useCofhe` hook to prevent "client not ready" errors.
- [ ] Removed `resolvePayment` from the `submit-payment` API route to respect asynchronous decryption.
- [ ] Implemented an event listener or delayed job to handle payment resolution.
