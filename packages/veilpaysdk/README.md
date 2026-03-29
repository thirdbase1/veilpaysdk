# 🛡️ VeilPay SDK (v1.8.0)

**The Definitive Fhenix CoFHE Private Invoicing Framework**

VeilPay SDK is an enterprise-grade TypeScript framework engineered for the **Fhenix Confidential Fully Homomorphic Encryption (CoFHE)** ecosystem. It acts as a **Managed Master Wrapper** for your entire application, handling everything from WASM bootstrapping to HD wallet bridge derivation and parallel payment detection.

---

## 🏆 Why Use VeilPay SDK? (The Managed Advantage)

Integrating Fhenix CoFHE manually is fragile. VeilPay SDK provides a "Bulletproof" alternative:

| Feature | Manual Integration (Legacy) | VeilPay SDK (v1.8.0) |
| :--- | :--- | :--- |
| **Stability** | ❌ Frequent crashes in Build/SSR mode. | ✅ **Gated:** 100% Build-Safe for Vercel/CI. |
| **Storage** | ❌ Runtime errors in Incognito/Private. | ✅ **Invisible Engine:** Recursive Proxy-Storage. |
| **Tracking** | ❌ Public memos leak merchant ID. | ✅ **HD Bridge:** Privacy-preserving sub-addresses. |
| **Speed** | ❌ Sequential/Slow verification. | ✅ **Global Listener:** Parallel monitoring. |
| **Logic** | ❌ 500+ lines of manual FHE code. | ✅ **Decision Engine:** Standardized payment states. |

---

## 🚀 One-Click Master Integration

VeilPay SDK follows a "Wrapper-First" philosophy. Your site provides the UI; the SDK provides the Brain.

### 1. Global Setup (`layout.tsx`)
```tsx
import { VeilPayProvider } from 'veilpaysdk';

export default function RootLayout({ children }) {
  return (
    <VeilPayProvider config={{ network: "sepolia" }}>
      {children}
    </VeilPayProvider>
  );
}
```

### 2. Frontend: Standard Invoicing
```tsx
const { encrypt, isReady } = useEncrypt();
const { write, isSubmitting } = useWrite(blindPayContract);

const handleCreate = async () => {
  const encAmount = await encrypt(50.00, 'uint128');
  const encMerchant = await encrypt(myWallet, 'address');
  await write('createRequest', [encAmount, encMerchant, 86400]);
};
```

### 3. Frontend: One-Click Payment
```tsx
const veilPay = new VeilPayContract(ADDR, ABI, signer);
// Automated USDC transfer to your private bridge sub-address
await veilPay.payRequest(subAddress, 50.00);
```

---

## 🏗️ Professional Architecture (Scalable Oracle)

For a high-traffic production system, use the **Global Transfer Listener** pattern to monitor millions of invoices in parallel.

### 1. Parallel Monitoring (Backend)
```typescript
const usdc = new ethers.Contract(USDC_ADDR, USDC_ABI, provider);

usdc.on("Transfer", async (from, to, value) => {
  // recipient 'to' matches a registered sub_address in your DB
  const req = await db.from('requests').select().eq('sub_address', to).single();

  if (req) {
     const veilPay = new VeilPayContract(ADDR, ABI, oracleSigner);

     // 🧠 CALL THE DECISION ENGINE
     const decision = veilPay.processPayment(value, req.amount, req.expiry);

     if (decision.status === "COMPLETED") {
        await veilPay.submitPayment(req.request_id, value);
     } else if (decision.status === "PARTIAL") {
        // Start "Smart Refund" timer...
     }
  }
});
```

---

## 💎 Full API Reference

### 🎣 React Hooks
-   **`useVeilPay()`**: Access managed global engine state and SDK instance.
-   **`useEncrypt()`**: Translates plaintext data into confidential FHE structs.
-   **`useWrite(contract)`**: Handles the transaction life-cycle for the confidential layer.
-   **`useDecrypt(contract)`**: Monitors the Fhenix Coprocessor for verification results.

### 🌉 Bridge Utilities (`VeilPayBridge`)
-   **`deriveAddress(mnemonic, index)`**: Securely derives a unique payment address.
-   **`verifyUsdcTransfer(txHash, subAddress, provider)`**: Professional log-parsing for Oracle verification.
-   **`createBridgeSigner(mnemonic, index, provider)`**: Creates an ethers wallet for settlement.

---

## 📊 Ultimate Changelog (v1.8.0)

#### 🛡️ Critical Stability
-   **Invisible Storage Engine:** Proprietary recursive Proxy Interceptor for `fheKeyStorage`.
-   **Build Gating:** Intelligent multi-signal detection for Next.js 16 build safety.

#### ✨ UX & Logic
-   **Payment Decision Engine:** Structured response system for handling partial/expired payments.
-   **One-Click Pay Utility:** Fully automated USDC transfer logic for frontend settlement.
-   **Diagnostic Stage Logging:** Transparent 4-stage console tracing for browser debugging.

---

## 🤝 Buildathon Support
100% Compliant with **Fhenix AKINDO Buildathon Wave 1** requirements.

## 📜 License
MIT
