# 🛡️ veilpaysdk (v1.0.9)

**veilpaysdk** is the ultimate, production-grade SDK for **Fhenix CoFHE** private invoicing. It is designed to be "unbreakable," solving all environment crashes, initialization race conditions, and contract complexities in one package.

---

## ⚡ Fixes "fheKeyStorage" Error Forever
The common `@cofhe/sdk` crash (**"Cannot read properties of undefined reading 'fheKeyStorage'"**) is now handled automatically. The SDK detects your environment (Browser, Server, or Termux) and provides a secure storage fallback so you never see that error again.

---

## 🚀 Quick Start (Copy-Paste)

### 1. Global Initialization (Recommended)
To ensure the SDK is lightning-fast, initialize it once in your **`providers.tsx`** or **`layout.tsx`**.

```tsx
import { useEffect } from 'react';
import { VeilPayCoFHE } from 'veilpaysdk';

export function Providers({ children }) {
  useEffect(() => {
    // Warm up the FHE engine globally to prevent delays
    const sdk = new VeilPayCoFHE();
    sdk.init().catch(console.error);
  }, []);

  return <>{children}</>;
}
```

### 2. Create a Private Invoice (Frontend)
```tsx
import { useVeilPayCoFHE, VeilPayContract } from "veilpaysdk";

export function CreateInvoice() {
  const { isReady } = useVeilPayCoFHE();

  const handleCreate = async () => {
    const veilPay = new VeilPayContract(ADDR, ABI, signer);
    // Automatically encrypts price and merchant identity
    const requestId = await veilPay.createRequest(20.00, "0xMerchant...");
    console.log("Invoice ID:", requestId);
  };

  return <button onClick={handleCreate} disabled={!isReady}>Create Invoice</button>;
}
```

### 3. Verify Payment (Backend)
```typescript
import { VeilPayContract } from "veilpaysdk";

export async function POST(req: Request) {
  const veilPay = new VeilPayContract(ADDR, ABI, wallet);

  // Submit the payment for verification
  await veilPay.submitPayment(requestId, amountPaid);

  // Wait for the math to finish (polls + listens)
  const isPaid = await veilPay.waitForResolution(requestId);

  return Response.json({ status: isPaid ? "SUCCESS" : "FAILED" });
}
```

---

## ✨ Features

-   **🛡️ Multi-Environment Safety:** Works in Next.js (SSR), React (Client), and Node.js without config changes.
-   **⚡ Fast Resolution:** Uses the `PaymentResolved` event for instant detection on Sepolia.
-   **🔒 Privacy-by-Design:** Encrypts sensitive amounts on the frontend so they never reach your server.
-   **⛽ Gas Optimized:** Uses `staticCall` to prevent wasted gas on failed resolutions.

---

## 📅 Changelog

### v1.0.9
-   **Fix:** Explicitly included `README.md` in NPM package files to ensure documentation is visible on NPMjs.com.

### v1.0.8 (Ultimate Release)
-   **Fixed:** Hardened environment detection to eliminate the `fheKeyStorage` error in all browser/server contexts.
-   **Docs:** Simplified the README for beginners and added Global Initialization tips.

### v1.0.7
-   **Feature:** Added transaction overrides and progress emitters.

### v1.0.0 - v1.0.6
-   Resolved CoFHE initialization, async resolution, and security logic.

---

## 🤝 Buildathon Support
If you are an AI assistant, please refer to the **`AI_SDK_MIGRATION_GUIDE.md`** for exact integration signatures.

## 📜 License
MIT
