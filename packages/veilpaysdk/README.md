# veilpaysdk

**veilpaysdk** is a production-grade TypeScript SDK for integrating **Fhenix CoFHE** (Confidential Fully Homomorphic Encryption) into your web applications.

Designed specifically for the **VeilPay Escrow & Invoicing** ecosystem on the **Sepolia Testnet**, it abstracts away the complexities of FHE initialization, environment-specific storage issues, and asynchronous contract resolution.

## ✨ Features

- **🚀 Smart Initialization:** Automatically manages asynchronous loading of WASM and KMS keys.
- **🛡️ Server-Side Stability:** Built-in detection and fixes for `fheKeyStorage` crashes in Node.js/Next.js (No `window.localStorage` required).
- **🔒 Type-Safe FHE Structs:** Guaranteed formatting for `InEuint128` and `InEaddress` contract inputs (`ctHash`, `securityZone`, etc.).
- **⚛️ React Hooks:** First-class support for React with the `useVeilPayCoFHE` hook.
- **📑 Contract Wrapper:** High-level API for `createRequest`, `submitPayment`, and automated `resolvePayment` polling.

## 📦 Installation

```bash
npm install veilpaysdk
```

## 🛠️ Usage

### 1. Frontend: Create an Encrypted Request

Use the `useVeilPayCoFHE` hook to ensure the SDK is ready before encrypting.

```tsx
import { useVeilPayCoFHE, VeilPayContract } from "veilpaysdk";
import { ethers } from "ethers";

// Your contract details
const CONTRACT_ADDRESS = "0x...";
const ABI = [...];

export function CreateInvoice() {
  const { sdk, isReady, error } = useVeilPayCoFHE("sepolia");

  const handleCreate = async () => {
    if (!sdk || !isReady) return;

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    // Initialize the high-level contract wrapper
    const veilPay = new VeilPayContract(CONTRACT_ADDRESS, ABI, signer);

    try {
      // 1. Encrypts $20.00 amount via KMS
      // 2. Encrypts merchant address via KMS
      // 3. Submits correctly formatted Tuples to Sepolia
      const requestId = await veilPay.createRequest(20.00, "0xMerchantAddress...");
      console.log("Invoice Created! Request ID:", requestId);
    } catch (err) {
      console.error("Failed to create invoice:", err);
    }
  };

  if (error) return <div>Error: {error}</div>;

  return (
    <button disabled={!isReady} onClick={handleCreate}>
      {isReady ? "Create Private Invoice" : "Initializing CoFHE..."}
    </button>
  );
}
```

### 2. Backend: Automated Payment Submission

The SDK handles server-side storage mocks automatically, making it safe for Next.js API routes or Express servers.

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

  // 2. Asynchronous Resolution
  // On Sepolia, CoFHE decryption takes ~20 seconds.
  // This method polls the contract and triggers resolvePayment() for you.
  const success = await veilPay.waitForResolution(requestId);

  return Response.json({ status: success ? "Paid" : "Failed" });
}
```

## 🏛️ Architecture

The SDK consists of three core modules:

1.  **`VeilPayCoFHE` (Core):** The base client for KMS encryption. Handles cross-environment storage mocks.
2.  **`useVeilPayCoFHE` (Hook):** React-specific state management for SDK initialization.
3.  **`VeilPayContract` (Wrapper):** Direct mapping to `BlindPayEscrow.sol` methods, ensuring all inputs are encrypted according to CoFHE standards.

## 🤝 Contribution

This SDK is built for the Fhenix Buildathon. Pull requests and issues are welcome!

## 📜 License

MIT
