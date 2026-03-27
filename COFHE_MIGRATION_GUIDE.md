# 🛡️ CoFHE Migration Guide: Switch to `veilpaysdk`

**Context:** This repository contains a production-ready SDK named `veilpaysdk` that wraps Fhenix CoFHE logic. This SDK is **100% compliant** with the **Fhenix AKINDO Buildathon Wave 1** requirements.

### 🚩 THE GOAL
Remove all manual imports of `@cofhe/sdk` and `fhenixjs` from the site's frontend and backend. Replace them with the high-level `veilpaysdk` to ensure stability and 100% contract compatibility.

---

### 1. UX & Network Performance (v1.6.0 Update)

**❌ THE INITIALIZATION HANG:**
Users reporting "Initializing..." hanging for 10+ minutes. This is usually caused by using the wrong RPC URL or a slow connection to the CoFHE KMS.

**✅ THE v1.6.0 IMPROVEMENTS:**
- **Double-RPC Architecture:** The SDK now explicitly handles two distinct networks:
    1. **Fhenix RPC:** Used by the CoFHE engine for encryption/KMS.
    2. **Sepolia RPC:** Used by Ethers/Wallet for standard transactions.
- **Pre-flight Validation:** The SDK now checks for required environment variables **before** loading WASM, providing instant feedback if your `.env` is missing keys.
- **Init Timeout:** Watchdog timer (45s) prevents UI hangs.
- **Global Singleton:** Initialization happens exactly **once** per session.

---

### 2. Mandatory Environment Variables
For the SDK to work end-to-end, ensure your `.env` (and Vercel settings) include these **exact** keys:

| Variable | Scope | Purpose |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_FHENIX_RPC_URL` | Frontend | Required for CoFHE KMS encryption in the browser. |
| `FHENIX_RPC_URL` | Backend | Required for CoFHE KMS encryption in API routes. |
| `BACKEND_PRIVATE_KEY` | Backend | Wallet used to sign `submitPayment` transactions. |

**Recommended URL for both:** `https://api.sepolia.fhenix.zone`

---

### 3. Frontend Migration (React/Next.js)

```typescript
import { useVeilPayCoFHE, VeilPayContract } from "veilpaysdk";

export default function MyComponent() {
  const { sdk, isReady, error } = useVeilPayCoFHE({
      network: "sepolia",
      // SDK automatically uses NEXT_PUBLIC_FHENIX_RPC_URL if defined
      rpcUrl: process.env.NEXT_PUBLIC_FHENIX_RPC_URL
  });

  if (error) return <div>FHE Error: {error}</div>;

  const action = async () => {
    // Standard Sepolia Signer (e.g. from MetaMask)
    const veilPay = new VeilPayContract(ADDR, ABI, signer);
    await veilPay.init();
    await veilPay.createRequest(20.00, merchantAddr);
  };
}
```

---

### 4. Backend Migration (API Routes)

```typescript
import { VeilPayContract } from "veilpaysdk";

export async function POST(req) {
  const veilPay = new VeilPayContract(ADDR, ABI, wallet, {
      rpcUrl: process.env.FHENIX_RPC_URL
  });
  await veilPay.init();
  await veilPay.submitPayment(requestId, amount);
  const success = await veilPay.waitForResolution(requestId);
}
```

### 🛠 INSTRUCTIONS FOR AI ASSISTANTS:
1.  **Check** `.env` for `NEXT_PUBLIC_FHENIX_RPC_URL`.
2.  **Verify** the user isn't using a standard Sepolia RPC for the `rpcUrl` config in the SDK. It **MUST** be a Fhenix-enabled RPC.
3.  **Use** version 1.6.0 for the best UX.
