# BlindPay Escrow (CoFHE)

**BlindPay Escrow** is a fully homomorphic encrypted (FHE) payment verification system deployed on the Sepolia Testnet, utilizing the **Fhenix CoFHE Coprocessor**.

It is designed to solve a fundamental problem in Web3 commerce: **Price Privacy.**
When a merchant requests a payment, the public blockchain should not see what the item costs or how much the buyer paid. BlindPay uses CoFHE to mathematically prove that a user paid the correct amount without ever revealing the amount on-chain.

---

## 🚀 Deployed Contract
**Network:** Sepolia Testnet
**Contract Address:** `0x52a4f2b3218EE9A4bE7C91362c7CbC8db6C45B87`
**Authorized Backend:** `0x5bf88d8ea36418fc5b955609886524d8f84ed643`

---

## 🧠 How the FHE / CoFHE Logic Works

Unlike a standard EVM contract, this contract delegates encrypted computations to the Fhenix Coprocessor.

1. **Encrypted State:** The merchant's required payment amount and the user's submitted payment amount are stored as `euint128` (encrypted unsigned integers).
2. **The Meaningful Computation:** When a payment is submitted, the contract calls `FHE.gte(submittedAmount, requiredAmount)`.
3. **Asynchronous Resolution:** Because Sepolia cannot compute FHE math, `FHE.decrypt()` triggers an event. The Fhenix Coprocessor picks up the event, solves the encrypted equation off-chain, and returns the plaintext boolean (`true` or `false`) to the contract asynchronously.

---

## 🛠 How to Call It: Frontend (Merchant)

The Frontend must encrypt the requested payment amount using `fhenixjs` before sending it to the contract.

### 1. Setup `fhenixjs`
```javascript
import { FhenixClient, getPermit } from "fhenixjs";
import { ethers } from "ethers";

const provider = new ethers.BrowserProvider(window.ethereum);
const fhenixClient = new FhenixClient({ provider });
```

### 2. Create the Request (Encrypting the Price)
```javascript
// 1. Define your price (e.g., 50 USDC)
const price = 50;

// 2. Encrypt the amount using fhenixjs
const encryptedAmount = await fhenixClient.encrypt_uint128(price);

// 3. Encrypt the Merchant's Address for privacy
const merchantAddress = await signer.getAddress();
const encryptedMerchant = await fhenixClient.encrypt_address(merchantAddress);

// 4. Call the Smart Contract
const contract = new ethers.Contract(BLINDPAY_ADDRESS, ABI, signer);
const expiry = Math.floor(Date.now() / 1000) + 86400; // 24 hours

const tx = await contract.createRequest(
    encryptedAmount,
    encryptedMerchant,
    expiry
);
await tx.wait();
console.log("Request created securely!");
```

---

## ⚙️ How to Call It: Backend (Oracle)

The Backend acts as the bridge. It watches the standard Sepolia network for USDC transfers. When a user pays, the backend encrypts the *actual amount* the user sent, and submits it.

### 1. Setup Backend
```javascript
// Use a secure Node.js environment
const provider = new ethers.JsonRpcProvider("https://rpc.sepolia.org");
const wallet = new ethers.Wallet(BACKEND_PRIVATE_KEY, provider);
const fhenixClient = new FhenixClient({ provider });
const contract = new ethers.Contract(BLINDPAY_ADDRESS, ABI, wallet);
```

### 2. Submit the Payment
```javascript
// 1. Backend detects user sent 50 USDC for requestId "0x123..."
const amountReceived = 50;

// 2. Encrypt the received amount
const encryptedPaid = await fhenixClient.encrypt_uint128(amountReceived);

// 3. Submit it to the contract
const tx = await contract.submitPayment("0x123...", encryptedPaid);
await tx.wait();

console.log("Payment submitted to Coprocessor for evaluation!");
```

### 3. Verification
Once submitted, the Fhenix Coprocessor will evaluate if the encrypted `paid` >= encrypted `required`. It will automatically update `isPaid` to `true` if sufficient.

You can poll the status:
```javascript
const status = await contract.getRequestStatus("0x123...");
console.log("Is Resolved by CoFHE?", status.isResolved);
console.log("Is Paid Sufficiently?", status.isPaid);
```

---

## 📜 Contract ABI
The full compiled ABI for this contract is now saved in the root folder as `BlindPayEscrowABI.json`. You can import this directly into your frontend and backend projects when instantiating the `ethers.Contract`.
