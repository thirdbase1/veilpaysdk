# 🛡️ veilpaysdk (v1.2.0)

**veilpaysdk** is the ultimate, production-grade SDK for **Fhenix CoFHE** private invoicing. It is designed to be "unbreakable," solving all environment crashes, initialization race conditions, and contract complexities in one package.

---

## ⚡ Build-Safe & Concurrent-Safe (Fixed in v1.2.0)
The common `@cofhe/sdk` crash (**"Cannot read properties of undefined reading 'fheKeyStorage'"**) during Next.js builds (`next build`) or React's concurrent rendering is now fully resolved. The SDK uses **Ultra-Lazy Global Initialization**, ensuring that the environment-sensitive CoFHE engine is only loaded and initialized once across the entire application lifecycle, safely at runtime.

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
    // init() is now global and concurrent-safe!
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
    // Constructor is 100% side-effect free and SSR-Safe
    const veilPay = new VeilPayContract(ADDR, ABI, signer);

    // Explicit init (safe to call multiple times)
    await veilPay.init();

    // Automatically encrypts price and merchant identity
    const requestId = await veilPay.createRequest(20.00, "0xMerchant...");
    console.log("Invoice ID:", requestId);
  };

  return <button onClick={handleCreate} disabled={!isReady}>Create Invoice</button>;
}
```

---

## ✨ Features

-   **🛡️ Multi-Environment Safety:** Works in Next.js (SSR), React (Client), and Node.js without config changes.
-   **⚡ Global Singleton:** Ensures initialization happens exactly once across your entire application.
-   **🔒 Build-Safe:** Dynamic imports prevent `@cofhe/sdk` from crashing your static builds.
-   **⛽ Gas Optimized:** Uses `staticCall` to prevent wasted gas on failed resolutions.

---

## 📅 Changelog

### v1.2.0 (The Final Robust Release)
-   **Fixed:** Implemented **Global Singleton Initialization** to prevent concurrent race conditions during React's render phase.
-   **Fixed:** Guaranteed side-effect free constructor to prevent crashes during Next.js static page generation.
-   **Added:** Support for concurrent `init()` calls sharing a single underlying promise.

### v1.1.0 (The Build-Safe Release)
-   **Fixed:** Implemented **Ultra-Lazy Initialization** using dynamic imports to prevent the `@cofhe/sdk` from crashing during Next.js `next build` (prerendering) or SSR.

### v1.0.0 - v1.0.9
-   Resolved CoFHE initialization, async resolution, and security logic.

---

## 📜 License
MIT
