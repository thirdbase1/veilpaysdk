# 🛡️ VeilPay SDK (v1.7.0)

**The Professional Fhenix CoFHE Integration Framework**

VeilPay SDK is a production-grade TypeScript library for high-fidelity integration with **Fhenix Confidential Fully Homomorphic Encryption (CoFHE)**. It abstracts the complexities of KMS-backed encryption, HD wallet bridges, and asynchronous FHE verification, offering a stable and compliant foundation for private Web3 commerce.

---

## 💎 Core Features

-   **🔒 State Privacy:** Automated construction of `InEuint128` and `InEaddress` structs for on-chain FHE computation (`FHE.gte`).
-   **🏦 Professional Bridge:** Built-in **HD Wallet Derivation** for generating secure, one-time payment sub-addresses.
-   **🖱️ One-Click Payments:** Seamless frontend utility to trigger USDC transfers from a user's wallet to your bridge.
-   **🛡️ Build-Proof Gating:** Multi-signal environment detection prevents CoFHE engine crashes in restricted build workers (Vercel/CI).
-   **⚡ Micro-Step Logging:** Verbose browser console tracing (Steps 1-4) for bulletproof runtime debugging.

---

## 🎣 Buildathon Hooks (The "Jobs")
VeilPay SDK provides specialized hooks that satisfy the **Mandatory AKINDO Buildathon Requirements**. Each hook has a specific "Job" in your frontend architecture:

### 1. `useEncrypt` (The Translator)
**The Job:** Converts plaintext data (like a 50.00 USDC price) into a confidential FHE struct.
-   **When to use:** Use this immediately before calling your contract creation method.
-   **Benefit:** Keeps sensitive values hidden from your frontend logs.

### 2. `useWrite` (The Messenger)
**The Job:** Handles the MetaMask transaction lifecycle.
-   **When to use:** Use this to send your `createRequest` or `payRequest` transactions.
-   **Benefit:** Provides automatic `isSubmitting` and `error` states for your UI buttons.

### 3. `useDecrypt` (The Observer)
**The Job:** Watches the Fhenix network for the asynchronous Coprocessor result.
-   **When to use:** Use this on your "Payment Success" screen to wait for the final verification.
-   **Benefit:** Seamlessly handles the 20-30 second network delay for your users.

---

## 🌐 Network Architecture (Infrastructure-Aware)

VeilPay SDK uses a zero-config strategy. It automatically detects the official **Fhenix Sepolia** endpoints from your environment or uses hardcoded defaults for maximum speed.

| Layer | Recommended Variable | Recommended Value |
| :--- | :--- | :--- |
| **KMS Engine** | `NEXT_PUBLIC_FHENIX_KMS_URL` | `https://kms.sepolia.fhenix.zone` |
| **CoFHE State** | `NEXT_PUBLIC_FHENIX_RPC_URL` | `https://api.sepolia.fhenix.zone` |
| **Transactions** | `SEPOLIA_RPC_URL` | `https://ethereum-sepolia-rpc.publicnode.com` |

---

## 📊 Professional Changelog (v1.7.0)

### ✨ Feature Updates
-   **Mandatory Hooks:** Added `useEncrypt`, `useWrite`, and `useDecrypt` for Buildathon compliance.
-   **One-Click Pay:** New `payRequest()` method for automated frontend USDC transfers.
-   **HD Bridge:** Integrated `VeilPayBridge` for secure on-chain anonymity.

### 🛡️ Security & Stability
-   **Runtime Bulletproofing:** Fixed the `fheKeyStorage` undefined error with a defensive storage mapper and hardened client instantiation.
-   **Micro-Step Debugging:** Multi-stage browser logging (Stage 1-4) to track engine boot progress.
-   **Mnemonic-Only Model:** Simplified security by deriving all backend authority from a single master seed.

---

## 🤝 Buildathon Support
100% Compliant with **Fhenix AKINDO Buildathon Wave 1** requirements.

## 📜 License
MIT
