# 🛡️ CoFHE Migration Guide: Switch to `veilpaysdk`

**Context:** This repository contains a production-ready SDK named `veilpaysdk` that wraps Fhenix CoFHE logic. This SDK is **100% compliant** with the **Fhenix AKINDO Buildathon Wave 1** requirements.

### 🚩 THE GOAL
Remove all manual imports of `@cofhe/sdk` and `fhenixjs` from the site's frontend and backend. Replace them with the high-level `veilpaysdk` to ensure stability and 100% contract compatibility.

---

### 1. Build-Safe & Bulletproof (v1.4.0 Update)

**❌ THE PERSISTENT PROBLEM:**
Next.js projects often crash during the `next build` (prerendering) phase with the error:
`TypeError: Cannot read properties of undefined (reading 'fheKeyStorage')`

**✅ THE v1.4.0 FIX (Bulletproof):**
`veilpaysdk` now implements **Execution Environment Gating**.
- **Build Isolation:** The SDK uses multi-signal detection (Headers, NEXT_PHASE, and Global state) to detect a build worker. If detected, it **physically blocks** the loading of `@cofhe/sdk`.
- **Dormant Mode:** During builds, `init()` resolves immediately but leaves the engine "dormant." It only activates in a real browser or live API environment.
- **Verification:** Exported `VEILPAY_SDK_VERSION` allows you to verify you are using the latest fix.

---

### 🚨 HOW TO FORCE UPDATE (Critical for Vercel)
If you still see the error, it means Vercel is using a cached version of the old SDK. You must force a clean install:

1. **Local Fix:** `pnpm update veilpaysdk` or delete `pnpm-lock.yaml`.
2. **Vercel Fix:** Go to Project Settings -> Data Cache -> **Purge All**.
3. **Redeploy:** Ensure your build logs show `+ veilpaysdk 1.4.0`.

---

### 2. Buildathon Compliance Checklist

| Requirement | VeilPay SDK Status |
| :--- | :--- |
| **CoFHE Stack (@cofhe/sdk)** | ✅ Integrated internally as the primary engine. |
| **Mandatory Permits** | ✅ `generatePermit()` method for viewing encrypted data. |
| **No Wagmi Dependency** | ✅ Zero dependencies on Wagmi/RainbowKit. Works with raw `ethers`. |

---

### 3. Frontend Migration (React/Next.js)

```typescript
import { useVeilPayCoFHE, VeilPayContract } from "veilpaysdk";

export default function MyComponent() {
  const { sdk, isReady } = useVeilPayCoFHE("sepolia");

  const action = async () => {
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
  const veilPay = new VeilPayContract(ADDR, ABI, wallet);
  await veilPay.init();
  await veilPay.submitPayment(requestId, amount);
  const success = await veilPay.waitForResolution(requestId);
}
```
