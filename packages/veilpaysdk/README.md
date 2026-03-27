# 🛡️ veilpaysdk (v1.0.7)

**veilpaysdk** is the official, production-grade TypeScript SDK for the **VeilPay** private invoicing ecosystem. It allows you to build privacy-first payment applications on the **Fhenix Sepolia Testnet** using Fully Homomorphic Encryption (FHE).

---

## 🚀 Quick Start for Beginners (End-to-End)

If you are new to Fhenix or FHE, follow this 3-step guide to get your first private payment working.

### 1. Installation
```bash
npm install veilpaysdk
```

### 2. Frontend: Create a Private Invoice
Use the `useVeilPayCoFHE` hook. It handles all the complex "waiting" for the FHE engine to load.

```tsx
import { useVeilPayCoFHE, VeilPayContract } from "veilpaysdk";
import { ethers } from "ethers";

export function CreateInvoice() {
  // 1. Initialize the SDK
  const { sdk, isReady } = useVeilPayCoFHE();

  const handleCreate = async () => {
    if (!isReady) return;

    // 2. Setup standard ethers signer (MetaMask)
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    // 3. Connect to the contract
    const veilPay = new VeilPayContract(CONTRACT_ADDRESS, ABI, signer);

    // 4. Create the request ($20.00)
    // The SDK automatically encrypts the price and merchant address!
    const requestId = await veilPay.createRequest(20.00, "0xMerchantAddress...");

    alert("Private Invoice Created! ID: " + requestId);
  };

  return <button onClick={handleCreate} disabled={!isReady}>Create Private Invoice</button>;
}
```

### 3. Backend: Verify & Finalize Payment
Your backend detects a USDC transfer and tells the Fhenix Coprocessor to verify it.

```typescript
import { VeilPayContract } from "veilpaysdk";
import { ethers } from "ethers";

export async function POST(req: Request) {
  const { requestId, amountPaid } = await req.json();

  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  const veilPay = new VeilPayContract(CONTRACT_ADDRESS, ABI, wallet);

  // 1. Submit payment for FHE verification
  await veilPay.submitPayment(requestId, amountPaid);

  // 2. Wait for the Coprocessor result
  // This method polls the contract and resolves instantly when math is done!
  const success = await veilPay.waitForResolution(requestId, 120000, (progress) => {
      console.log("Current Step:", progress);
  });

  return Response.json({ status: success ? "PAID" : "FAILED" });
}
```

---

## ❓ FAQ & Architecture

### Should I encrypt on the Frontend or Backend?
**Frontend.** For maximum privacy, you should encrypt the payment amount on the frontend. This ensures the plaintext price never leaves the user's machine. The backend only needs to encrypt during the payment verification step.

### Does the SDK need a Signer for all operations?
**No.**
- **Raw Encryption:** If you use the `VeilPayCoFHE` class directly, you do **not** need to pass a signer or provider.
- **Contract Calls:** If you use the `VeilPayContract` wrapper, you **must** pass a `signerOrProvider` in the constructor.

### Is the BlindPay contract already supported?
**Yes.** This SDK is hard-coded to support the function signatures and encrypted struct requirements of the `BlindPayEscrow.sol` contract.

---

## 📖 API Reference

### 1. Create a Payment Request (Encrypted)
**Method:** `veilPay.createRequest(amount: number, merchantAddress: string, expirySeconds?: number, overrides?: ethers.Overrides): Promise<string>`

- **Encryption:** Automatically encrypts the `amount` into an `InEuint128` struct and the `merchantAddress` into an `InEaddress` struct using the Fhenix CoFHE KMS.
- **Return:** Returns the `requestId` (`bytes32` string) emitted by the smart contract. Use this ID to track the payment in your database.

### 2. Handle Asynchronous Resolution
**Method:** `veilPay.waitForResolution(requestId: string, timeoutMs?: number, onProgress?: (status: string) => void): Promise<boolean>`

- **Logic:** Since CoFHE decryption on Sepolia is asynchronous, this method listens for the `PaymentResolved` event and polls the contract's `isResolved` state.
- **Return:** Returns `true` if the payment was sufficient (decrypted result), or `false` if underpaid. Throws a `VeilPayContractError` on timeout.

### 3. Encryption Data Structure
**Interface:** `CoFHEStruct`

The SDK's encryption methods return this exact data structure required by the `BlindPayEscrow` smart contract:

```typescript
export interface CoFHEStruct {
  ctHash: string | bigint; // The hash of the ciphertext
  securityZone: number;    // Fhenix security zone
  utype: number;           // The FHE type identifier (e.g., uint128)
  signature: string;       // The KMS-generated cryptographic signature
}
```

---

## ✨ Features (v1.0.7)

-   **⚡ Fast Resolution:** Uses event listeners (`PaymentResolved`) for instant success detection.
-   **📡 Progress Tracking:** Optional callback in `waitForResolution` to show real-time status in your UI.
-   **⛽ Gas Control:** Pass custom gas overrides (`gasLimit`, etc.) to all contract methods.
-   **🛠️ Pro Listeners:** Built-in `onPaymentResolved` and `onPaymentSubmitted` handlers.
-   **🛡️ Stable Backend:** Automatically fixes the common `fheKeyStorage` crash in Node.js.
-   **🔒 State Privacy:** Encrypts invoice amounts and merchant identities on-chain.

---

## 🛡️ Security & Keys

- **Frontend:** Use `ethers.BrowserProvider` to let users sign transactions with their own wallets (MetaMask, Rabby, etc.).
- **Backend:** You **must** provide a Private Key via `ethers.Wallet`. This is required to authorize transactions (e.g., `submitPayment`) and pay for gas.
- **Privacy:** Never hardcode private keys. Use environment variables (`.env`).

---

## 📅 Version Changelog

### v1.0.7 (Current)
-   **New:** Support for transaction **overrides** (gasLimit, feeData).
-   **New:** Added **Progress Callback** to `waitForResolution`.
-   **New:** Added **Event Emitters** (`onPaymentResolved`, `onPaymentSubmitted`).
-   **Improved:** Massive README overhaul for absolute beginners and AI assistants.

### v1.0.6
-   **Security:** Enforced backend-only logic for `submitPayment`.
-   **Docs:** Added detailed security architecture warnings.

### v1.0.5
-   **Fix:** Resolved NPM version publishing conflicts.
-   **Security:** Added `.env` best practices for private key management.

### v1.0.0 - v1.0.4
-   Initial builds with CoFHE core, server-side memory mocks, and React hooks.

---

## 🤝 Need Help?
VeilPay is built for the **Fhenix Buildathon**. If you are an AI assistant, please refer to the `AI_SDK_MIGRATION_GUIDE.md` in the root folder.

## 📜 License
MIT
