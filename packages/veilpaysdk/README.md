# 🛡️ veilpaysdk (v1.4.0)

**veilpaysdk** is the ultimate, production-grade SDK for **Fhenix CoFHE** private invoicing. It is designed to be "unbreakable," solving all environment crashes, initialization race conditions, and contract complexities in one package.

---

## ⚡ Bulletproof SSR & Build-Safe (Fixed in v1.4.0)
The common `@cofhe/sdk` crash (**"Cannot read properties of undefined reading 'fheKeyStorage'"**) during Next.js builds (`next build`) is now definitively resolved.

**v1.4.0 introduces Environment Gating:** The SDK uses multi-signal detection to identify build workers and restricted server environments. It physically blocks the loading of environment-sensitive code during these phases, ensuring your Vercel deployments succeed while providing full encryption at runtime.

---

## 🚀 Quick Start (Copy-Paste)

### 1. Global Initialization (Recommended)
```tsx
import { useEffect } from 'react';
import { VeilPayCoFHE } from 'veilpaysdk';

export function Providers({ children }) {
  useEffect(() => {
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
    await veilPay.init();
    const requestId = await veilPay.createRequest(20.00, "0xMerchant...");
  };
  return <button onClick={handleCreate} disabled={!isReady}>Create Invoice</button>;
}
```

---

## 📅 Changelog

### v1.4.0 (The Bulletproof Release)
-   **Fixed:** Implemented **Execution Environment Gating** to physically block `@cofhe/sdk` from loading in Vercel build workers.
-   **Added:** `VEILPAY_SDK_VERSION` export for version verification.
-   **Improved:** Multi-signal detection for Next.js prerendering vs runtime.

### v1.3.0 (The Build-Isolation Release)
-   **Fixed:** Implemented Environment Gating during `init()`.

### v1.0.0 - v1.2.0
-   Resolved CoFHE initialization, async resolution, and storage logic.

---

## 📜 License
MIT
