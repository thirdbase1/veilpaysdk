# 🚨 AI & Developer Guide: Integrating CoFHE SDK on Sepolia

If you or your AI assistant are struggling to interact with the `BlindPayEscrow` contract using standard Fhenix tutorials or standard `fhenixjs`, **stop** what you are doing.

You are using **CoFHE (Coprocessor for FHE)** deployed on **Sepolia**. This works fundamentally differently than deploying directly to the native Fhenix testnet (Helium).

This guide explicitly details exactly how the inputs are structured, why standard `fhenixjs` fails, and how to format the data for your frontend and backend.

---

## ❌ The Problem: Why `fhenixjs.encrypt_uint128()` Fails

If you look at standard Fhenix documentation, you will see this:
```javascript
// This is for NATIVE Fhenix networks. IT WILL FAIL ON CoFHE/SEPOLIA.
const encryptedAmount = await fhenixClient.encrypt_uint128(50);
await contract.myFunction(encryptedAmount); // Reverts!
```

**Why it fails:**
On a native Fhenix network, `inEuint128` expects raw, encrypted bytes (`bytes calldata ciphertext`).

However, on **Sepolia via CoFHE**, the EVM cannot process raw ciphertexts. Therefore, the CoFHE SDK defines `InEuint128` as a **cryptographic proof (Struct)** that the data was encrypted by an authorized off-chain Key Management Service (KMS) or Oracle.

Look at the ABI for `BlindPayEscrow.sol`. The contract expects a Tuple (Struct) for `InEuint128`:
```json
{
  "internalType": "struct InEuint128",
  "type": "tuple",
  "components": [
    { "name": "ctHash", "type": "uint256" },
    { "name": "securityZone", "type": "uint8" },
    { "name": "utype", "type": "uint8" },
    { "name": "signature", "type": "bytes" }
  ]
}
```

---

## ✅ The Solution: Using the CoFHE SDK (Frontend & Backend)

To pass data to `createRequest` or `submitPayment`, you must use the specialized **CoFHE SDK** (or interact with the Fhenix KMS API directly) to generate the `ctHash` and `signature`.

### Step 1: Encrypting Data via the CoFHE KMS

Instead of encrypting data purely locally in the browser, you must send the plaintext data to the Fhenix CoFHE KMS. The KMS encrypts it securely, stores the ciphertext off-chain (or on the Coprocessor), and returns a **hash** and a **signature** proving that it holds the encrypted value.

*(Note: The exact package name or API endpoint depends on the specific wave of the AKINDO buildathon. Usually, Fhenix provides a specific CoFHE TypeScript SDK or a KMS REST API).*

#### Pseudo-Code / SDK Logic for AI Assistants:

```javascript
import { ethers } from "ethers";
// Import the specific CoFHE SDK provided by the hackathon organizers
// e.g., import { CofheClient } from "@fhenixprotocol/cofhe-sdk";

async function createEscrowRequest(merchantSigner, priceInUSDC, expiryTime) {
    const contractAddress = "0x52a4f2b3218EE9A4bE7C91362c7CbC8db6C45B87";
    const contract = new ethers.Contract(contractAddress, ABI, merchantSigner);

    // 1. Initialize CoFHE Client (Connects to Fhenix KMS Oracle)
    // const cofheClient = new CofheClient({ network: "sepolia" });

    // 2. Encrypt the Price (uint128)
    // The CoFHE client sends the plaintext to the KMS.
    // The KMS returns the Struct: { ctHash, securityZone, utype, signature }
    const inAmountStruct = await cofheClient.encrypt(priceInUSDC, "uint128");

    // 3. Encrypt the Merchant Address (address)
    const merchantAddress = await merchantSigner.getAddress();
    const inMerchantStruct = await cofheClient.encrypt(merchantAddress, "address");

    // 4. Send the Transaction to Sepolia
    // Notice we pass the STRUCTS returned by the KMS, NOT raw bytes.
    const tx = await contract.createRequest(
        inAmountStruct,       // The CoFHE Proof Tuple
        inMerchantStruct,     // The CoFHE Proof Tuple
        expiryTime            // Standard uint256
    );

    await tx.wait();
    console.log("Request successfully created on Sepolia!");
}
```

### Step 2: Submitting a Payment (Backend)

When the backend detects a USDC transfer on Sepolia, it must perform the same CoFHE KMS encryption process before calling `submitPayment`.

```javascript
async function backendSubmitPayment(backendWallet, requestId, actualAmountPaid) {
    const contractAddress = "0x52a4f2b3218EE9A4bE7C91362c7CbC8db6C45B87";
    const contract = new ethers.Contract(contractAddress, ABI, backendWallet);

    // 1. Initialize CoFHE Client
    // const cofheClient = new CofheClient({ network: "sepolia" });

    // 2. Encrypt the Actual Amount Paid
    // The KMS returns the Struct: { ctHash, securityZone, utype, signature }
    const inPaidAmountStruct = await cofheClient.encrypt(actualAmountPaid, "uint128");

    // 3. Send the Transaction to Sepolia
    const tx = await contract.submitPayment(
        requestId,
        inPaidAmountStruct    // The CoFHE Proof Tuple
    );

    await tx.wait();
    console.log("Backend submitted encrypted payment to CoFHE Oracle!");
}
```

---

## 🛠 Instructions for your AI Assistant (Copy & Paste)

If you are using an AI (like Cursor, Claude, or ChatGPT) to write your frontend, copy and paste this exact prompt to them:

> "I am interacting with a Fhenix CoFHE Smart Contract deployed on standard Ethereum Sepolia. Do not use the standard `fhenixjs` `encrypt_uint128()` method that returns bytes.
>
> The contract's `InEuint128` and `InEaddress` types are Tuples (Structs) requiring: `(uint256 ctHash, uint8 securityZone, uint8 utype, bytes signature)`.
>
> We must use the specific CoFHE KMS SDK/API provided by the hackathon to generate these cryptographic proofs off-chain, and then pass those structs into the ethers.js contract calls."
