# 🛡️ veilpaysdk (v1.6.0)

**veilpaysdk** is the ultimate, production-grade SDK for **Fhenix CoFHE** private invoicing. It is designed to be "unbreakable," solving all environment crashes, initialization race conditions, and contract complexities in one package.

---

## ⚡ Network-Aware & Transparent (Improved in v1.6.0)
The latest version optimizes initialization and clarifies network requirements:
-   **Double-RPC Architecture:** Explicitly supports a **Fhenix RPC** for KMS/Encryption and a **Sepolia Signer** for transactions.
-   **Pre-flight Validation:** Automatically checks for mandatory environment variables (e.g., `NEXT_PUBLIC_FHENIX_RPC_URL`) before loading heavy WASM modules.
-   **Initialization Watchdog:** 45-second timeout with descriptive error messages instead of infinite hangs.
-   **Staged Logging:** Verbose browser console logs (Stage 1, 2, 3) to track exact engine status.

---

## 🚀 Quick Start (Copy-Paste)

### 1. Mandatory Environment Variables
Ensure your `.env` includes:
```bash
NEXT_PUBLIC_FHENIX_RPC_URL="https://api.sepolia.fhenix.zone"
```

### 2. Global Initialization (Recommended)
```tsx
import { useEffect } from 'react';
import { VeilPayCoFHE } from 'veilpaysdk';

export function Providers({ children }) {
  useEffect(() => {
    // Warm up the FHE engine globally as soon as the app mounts
    const sdk = new VeilPayCoFHE();
    sdk.init().catch(console.error);
  }, []);
  return <>{children}</>;
}
```

### 3. Create a Private Invoice (Frontend)
```tsx
import { useVeilPayCoFHE, VeilPayContract } from "veilpaysdk";

export function CreateInvoice() {
  const { sdk, isReady, error } = useVeilPayCoFHE();

  if (error) return <div>FHE Initialization Failed: {error}</div>;

  const handleCreate = async () => {
    const veilPay = new VeilPayContract(ADDR, ABI, signer);
    await veilPay.init();
    const requestId = await veilPay.createRequest(20.00, "0xMerchant...");
  };

  return <button onClick={handleCreate} disabled={!isReady}>
    {isReady ? "Create Invoice" : "Initializing FHE Engine..."}
  </button>;
}
```

---

## 📅 Changelog

### v1.6.0 (The Network-Aware Release)
-   **Added:** Automatic environment detection for `NEXT_PUBLIC_FHENIX_RPC_URL`.
-   **Added:** Pre-flight validation to catch network configuration errors early.
-   **Improved:** Multi-stage logging for better developer observability.
-   **Improved:** Timeout error messages with troubleshooting advice.

### v1.5.0 (The UX & Debug Release)
-   **Added:** Initialization timeout (45s) to prevent UI hangs.

### v1.4.0 (The Bulletproof Release)
-   **Fixed:** Execution Environment Gating for Next.js builds.

---

## 📜 License
MIT
