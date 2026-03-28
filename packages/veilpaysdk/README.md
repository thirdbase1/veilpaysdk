# 🛡️ VeilPay SDK (v1.7.0)

**The Professional Fhenix CoFHE Integration Framework**

VeilPay SDK is a production-grade TypeScript library for high-fidelity integration with **Fhenix Confidential Fully Homomorphic Encryption (CoFHE)**. It abstracts the complexities of KMS-backed encryption, HD wallet bridges, and asynchronous FHE verification, offering a stable and compliant foundation for private Web3 commerce.

---

## 💎 Core Features

-   **🔒 State Privacy:** Automated construction of `InEuint128` and `InEaddress` structs for on-chain FHE computation (`FHE.gte`).
-   **🏦 Professional Bridge:** Built-in **HD Wallet Derivation** for generating secure, one-time payment sub-addresses.
-   **🖱️ One-Click Payments:** Seamless frontend utility to trigger USDC transfers from a user's wallet to your bridge.
-   **⚡ Ultra-Lazy Initialization:** Side-effect free instantiation ensuring absolute stability during **Next.js builds** and **SSR**.
-   **🛡️ Build-Proof Gating:** Multi-signal environment detection prevents CoFHE engine crashes in restricted build workers (Vercel/CI).
-   **⛽ Gas-Optimized UX:** Automatic polling and `staticCall` logic for detecting Fhenix Coprocessor results.

---

## 🏗️ Professional Bridge Architecture

VeilPay SDK supports a high-scale architecture designed for thousands of concurrent users.

### 1. Backend: Scalable Address Generation
Generate a unique sub-address for every invoice using a master mnemonic and a database counter.

```typescript
import { VeilPayBridge } from 'veilpaysdk';

// Derive sub-address for invoice #105
const subAddress = VeilPayBridge.deriveAddress(process.env.MASTER_BRIDGE_MNEMONIC, 105);
// Store in Supabase: { requestId, subAddress, index: 105 }
```

### 2. Frontend: One-Click Payment
Let the SDK handle the complex USDC transfer logic.

```typescript
const veilPay = new VeilPayContract(ADDR, ABI, userSigner);
// The user just needs to click 'Confirm' in MetaMask
await veilPay.payRequest(subAddress, 50.00);
```

### 3. Backend: High-Performance Monitoring
Instead of watching addresses individually, monitor the **USDC Transfer Event** globally. This is extremely fast and supports millions of users.

```typescript
const usdcContract = new ethers.Contract(USDC_ADDR, USDC_ABI, provider);

// Watch ALL incoming USDC transfers
usdcContract.on("Transfer", async (from, to, value) => {
  // Check if 'to' matches a subAddress in your Supabase DB
  const request = await supabase.from('requests').select().eq('sub_address', to).single();

  if (request) {
    // TRIGGER CONFIDENTIAL VERIFICATION
    const veilPay = new VeilPayContract(ADDR, ABI, oracleSigner);
    await veilPay.submitPayment(request.request_id, ethers.formatUnits(value, 6));
  }
});
```

---

## 📊 Professional Changelog (v1.7.0)

### ✨ Feature Updates
-   **One-Click Payment:** New `payRequest()` method for automated frontend USDC transfers.
-   **HD Wallet Bridge:** Integrated `VeilPayBridge` for secure on-chain anonymity and identification.

### 🛡️ Security & Stability
-   **Concurrent Init Lock:** Global shared promise prevents re-initialization hangs in React.
-   **Build Worker Isolation:** Physically gated `@cofhe/sdk` loading during Next.js static generation.
-   **Mnemonic-Only Model:** Eliminated raw `BACKEND_PRIVATE_KEY` requirement for enhanced security.
-   **Storage Fallback:** Try-catch wrapper for `localStorage` supporting SSR and Incognito modes.

---

## 🤝 Buildathon Support
100% Compliant with **Fhenix AKINDO Buildathon Wave 1** requirements.

## 📜 License
MIT
