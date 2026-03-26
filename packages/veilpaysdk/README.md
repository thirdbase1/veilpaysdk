# veilpaysdk

**veilpaysdk** is a production-grade TypeScript SDK for integrating **Fhenix CoFHE** (Confidential Fully Homomorphic Encryption) into your web applications.

Designed specifically for the **VeilPay Escrow & Invoicing** ecosystem on the **Sepolia Testnet**, it abstracts away the complexities of FHE initialization, environment-specific storage issues, and asynchronous contract resolution.

## ✨ Features

- **🚀 Smart Initialization:** Automatically manages asynchronous loading of WASM and KMS keys.
- **🛡️ Server-Side Stability:** Built-in detection and fixes for `fheKeyStorage` crashes in Node.js/Next.js (No `window.localStorage` required).
- **🔒 Type-Safe FHE Structs:** Guaranteed formatting for `InEuint128` and `InEaddress` contract inputs (`ctHash`, `securityZone`, etc.).
- **⚛️ React Hooks:** First-class support for React with the `useVeilPayCoFHE` hook.
- **📑 Contract Wrapper:** High-level API for `createRequest`, `submitPayment`, and gas-efficient `resolvePayment` polling using `staticCall`.
- **⚡ Fast Resolution:** Uses event listeners (`PaymentResolved`) to resolve payments instantly when the Coprocessor returns.
- **🛠️ Custom Errors:** Granular error classes (`VeilPayInitError`, `VeilPayContractError`) for better debugging.
- **⛽ Gas Efficient:** Automated polling now checks contract state before sending transactions.

## 📦 Installation

```bash
npm install veilpaysdk
```

## 🛠️ Usage

### 1. Frontend: Create an Encrypted Request

```tsx
import { useVeilPayCoFHE, VeilPayContract } from "veilpaysdk";
import { ethers } from "ethers";

export function CreateInvoice() {
  const { sdk, isReady, error } = useVeilPayCoFHE("sepolia");

  const handleCreate = async () => {
    if (!sdk || !isReady) return;

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    const veilPay = new VeilPayContract(CONTRACT_ADDRESS, ABI, signer);

    try {
      // Automates encryption and submission
      const requestId = await veilPay.createRequest(20.00, "0xMerchantAddress...");
      console.log("Invoice Created! Request ID:", requestId);
    } catch (err) {
      console.error("Failed to create invoice:", err);
    }
  };

  return (
    <button disabled={!isReady} onClick={handleCreate}>
      {isReady ? "Create Private Invoice" : "Initializing CoFHE..."}
    </button>
  );
}
```

### 2. Backend: Automated Payment Submission

```typescript
import { VeilPayContract } from "veilpaysdk";
import { ethers } from "ethers";

export async function POST(req: Request) {
  const { requestId, amountPaid } = await req.json();

  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  const veilPay = new VeilPayContract(CONTRACT_ADDRESS, ABI, wallet);

  // 1. Submit the paid amount to the contract (with FHE encryption)
  await veilPay.submitPayment(requestId, amountPaid);

  // 2. Asynchronous Resolution (v1.0.3 uses event listeners + polling)
  const success = await veilPay.waitForResolution(requestId);

  return Response.json({ status: success ? "Paid" : "Failed" });
}
```

---

## ❓ FAQ

### Do I need an API Key?
**No.** The `veilpaysdk` interacts directly with the Fhenix CoFHE network and KMS on Sepolia. There is no external API key required for encryption or decryption requests.

### Is the BlindPay contract already supported?
**Yes.** This SDK is hard-coded to support the function signatures and encrypted struct requirements of the `BlindPayEscrow.sol` contract.

---

## 🛡️ Security & Keys

- **Frontend:** Use `ethers.BrowserProvider` to let users sign transactions with their own wallets (MetaMask, Rabby, etc.).
- **Backend:** You **must** provide a Private Key via `ethers.Wallet`. This is required to authorize transactions (e.g., `submitPayment`) and pay for gas.
- **Privacy:** Never hardcode private keys. Use environment variables (`.env`).

## 📅 Changelog

### v1.0.5
- **Fix:** Bumped version to resolve NPM "previously published" error.
- **Security:** Enhanced backend examples with proper `process.env` and `.env` safety.
- **Troubleshooting:** Added versioning tips to `HOW_TO_PUBLISH.md`.

### v1.0.4
- **Security:** Added explicit documentation for backend private key requirements and security best practices.
- **Improved:** Better internal documentation for `BlindPayContract` signer requirements.

### v1.0.3
- **Fixed:** Added detailed console logging for all on-chain transactions.
- **Improved:** Better error context when transactions fail or events are missing.
- **Docs:** Added FAQ and detailed Changelog to README.

### v1.0.2
- **Feature:** Added custom error classes (`VeilPayInitError`, `VeilPayContractError`).
- **Feature:** Added event-driven resolution (`PaymentResolved`) for near-instant success detection.
- **Optimization:** Caching of the initialization promise for faster subsequent loads.
- **Utility:** Added `isAddress`, `formatAmount`, and `parseAmount` helpers.

### v1.0.1
- **Optimization:** Added `staticCall` check before `resolvePayment` to save gas.
- **Improved:** Added `getPaymentStatus()` helper.

### v1.0.0
- Initial release with `fheKeyStorage` server-side fix and `VeilPayContract` wrapper.

---

## 🤝 Contribution

This SDK is built for the Fhenix Buildathon. Pull requests and issues are welcome!

## 📜 License

MIT
