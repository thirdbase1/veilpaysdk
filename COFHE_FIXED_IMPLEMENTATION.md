# @blindpay/cofhe-sdk Implementation Guide

This document provides instructions on how to integrate the newly built `@blindpay/cofhe-sdk` into your project. This SDK resolves all previously identified issues including the `fheKeyStorage` crash, the "client not ready" initialization error, and the asynchronous resolution flow.

## 🚀 1. Installation

You can install the SDK from your local `packages/cofhe-sdk` directory into your main project.

```bash
# In your main project directory
npm install ./packages/cofhe-sdk
```

---

## 🎨 2. Frontend: Simple "Create Request"

The SDK handles initialization for you with the `useBlindPayCoFHE` hook.

```typescript
// /app/(pages)/create/page.tsx
import { useBlindPayCoFHE, BlindPayContract } from "@blindpay/cofhe-sdk";
import { ethers } from "ethers";

export default function CreatePage() {
    const { sdk, isReady, error } = useBlindPayCoFHE("sepolia");

    const handleCreate = async () => {
        if (!sdk || !isReady) return;

        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();

        const blindPay = new BlindPayContract(CONTRACT_ADDRESS, ABI, signer);

        // AUTOMATICALLY:
        // 1. Encrypts amount (20.00 USDC)
        // 2. Encrypts merchant address
        // 3. Submits correctly formatted structs to Sepolia
        const requestId = await blindPay.createRequest(20.00, "0xMerchant...");

        console.log("Success! Request ID:", requestId);
    };

    if (error) return <div>Error: {error}</div>;

    return (
        <button disabled={!isReady} onClick={handleCreate}>
            {isReady ? "Create Payment Request" : "Initializing CoFHE (Please wait...)"}
        </button>
    );
}
```

---

## ⚙️ 3. Backend: Automated Payment Submission

The SDK automatically mocks `fheKeyStorage` to prevent server-side crashes.

```typescript
// /app/api/cofhe/submit-payment/route.ts
import { BlindPayCoFHE, BlindPayContract } from "@blindpay/cofhe-sdk";
import { ethers } from "ethers";

export async function POST(req: Request) {
    const { requestId, actualAmountPaid } = await req.json();

    const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
    const wallet = new ethers.Wallet(process.env.BACKEND_PRIVATE_KEY, provider);

    const blindPay = new BlindPayContract(CONTRACT_ADDRESS, ABI, wallet);

    // 1. Submit payment to the contract (with automatic encryption)
    await blindPay.submitPayment(requestId, actualAmountPaid);

    // 2. Poll for the Coprocessor result (Asynchronous Resolution)
    // This waits for the Fhenix Coprocessor to provide the result.
    const isPaidSufficiently = await blindPay.waitForResolution(requestId);

    if (isPaidSufficiently) {
        // Update database SET status = 'paid'
    }

    return Response.json({ success: true, isPaid: isPaidSufficiently });
}
```

---

## 🛠 Features Summary
- **Zero-Config Server Side:** Automatically handles Node.js environments without manual `localStorage` mocks.
- **Smart Initialization:** Guarantees WASM and KMS keys are ready before calling `.encrypt()`.
- **Contract-Ready Structs:** Always returns the 4 required fields (`ctHash`, `securityZone`, `utype`, `signature`).
- **Unified Logic:** Use the same SDK for frontend creation and backend submission.
- **Async Polling:** Built-in `waitForResolution` to handle the asynchronous FHE.decrypt cycle on Sepolia.
