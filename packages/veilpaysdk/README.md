# 🛡️ veilpaysdk (v1.3.0)

**veilpaysdk** is the ultimate, production-grade SDK for **Fhenix CoFHE** private invoicing. It is designed to be "unbreakable," solving all environment crashes, initialization race conditions, and contract complexities in one package.

---

## ⚡ Build-Safe & Concurrent-Safe (Fixed in v1.3.0)
The common `@cofhe/sdk` crash (**"Cannot read properties of undefined reading 'fheKeyStorage'"**) during Next.js builds (`next build`) or React's concurrent rendering is now fully resolved.

**v1.3.0 introduces Environment Gating:** The SDK detects if it is running during a Next.js build or prerendering phase and automatically skips the loading of environment-sensitive code. This allows your build to succeed while ensuring encryption works perfectly when your users hit the site in their browsers.

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
    // init() is now build-proof and concurrent-safe!
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
    // Constructor is 100% side-effect free and Build-Safe
    const veilPay = new VeilPayContract(ADDR, ABI, signer);

    // Explicit init (safe to call multiple times)
    await veilPay.init();

    // Automatic encryption for InEuint128 and InEaddress
    const requestId = await veilPay.createRequest(20.00, "0xMerchant...");
    console.log("Invoice ID:", requestId);
  };

  return <button onClick={handleCreate} disabled={!isReady}>Create Invoice</button>;
}
```

---

## ✨ Features

-   **🛡️ Multi-Environment Safety:** Works in Next.js (SSR), React (Client), and Node.js without config changes.
-   **🔒 Build-Proof:** Environment gating prevents crashes during static page generation.
-   **⚡ Global Singleton:** Ensures initialization happens exactly once across your entire application.
-   **⛽ Gas Optimized:** Uses `staticCall` to prevent wasted gas on failed resolutions.

---

## 📅 Changelog

### v1.3.0 (The Build-Isolation Release)
-   **Fixed:** Implemented **Environment Gating** to physically skip `@cofhe/sdk` loading during Next.js static builds (`phase-production-build`).
-   **Improved:** Added more robust checks for SSR vs Browser vs Build phases.
-   **Improved:** Optimized dynamic imports to handle various module export patterns.

### v1.2.0 (The Concurrent-Safe Release)
-   **Fixed:** Implemented **Global Singleton Initialization** to prevent concurrent race conditions.

### v1.1.0 (The Build-Safe Release)
-   **Fixed:** Implemented **Ultra-Lazy Initialization** using dynamic imports.

---

## 📜 License
MIT
