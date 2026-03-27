# BlindPay Escrow (CoFHE)

**BlindPay Escrow** is a fully homomorphic encrypted (FHE) payment verification system deployed on the Sepolia Testnet, utilizing the **Fhenix CoFHE Coprocessor**.

It is designed to solve a fundamental problem in Web3 commerce: **Price Privacy.**
When a merchant requests a payment, the public blockchain should not see what the item costs or how much the buyer paid. BlindPay uses CoFHE to mathematically prove that a user paid the correct amount without ever revealing the amount on-chain.

⚠️ **ATTENTION DEVELOPERS & AI ASSISTANTS:**
If you are building the frontend/backend for this contract on Sepolia, **you MUST follow the [COFHE_MIGRATION_GUIDE.md](./COFHE_MIGRATION_GUIDE.md)** to use the official `veilpaysdk`. Legacy manual encryption logic is now deprecated and prone to crashes.

---

## 🚀 Deployed Contract
**Network:** Sepolia Testnet
**Contract Address:** `0x52a4f2b3218EE9A4bE7C91362c7CbC8db6C45B87`
**Authorized Backend:** `0x5bf88d8ea36418fc5b955609886524d8f84ed643`

---

## 🛡️ The `veilpaysdk` (v1.2.0)
The repository now includes an **Ultra-Robust, Build-Safe, and Concurrent-Safe SDK** that fixes all environment crashes:
- **Prerender & SSR-Safe:** New **Global Singleton Lazy Initialization** ensures the SDK never crashes during `next build` or server-side rendering.
- **Concurrent-Safe:** Multiple `init()` calls across your React application share a single underlying promise, preventing initialization race conditions.
- **Zero-Config Backend:** Automatically handles the `fheKeyStorage` error in Node.js.
- **Buildathon Compliant:** Includes built-in support for mandatory CoFHE permits.

### Quick Start (Frontend)
```typescript
import { useVeilPayCoFHE, VeilPayContract } from "veilpaysdk";

// In your React Component
const { isReady } = useVeilPayCoFHE();
const veilPay = new VeilPayContract(ADDR, ABI, signer);
const requestId = await veilPay.createRequest(20.00, merchantAddr);
```

### Quick Start (Backend)
```typescript
import { VeilPayContract } from "veilpaysdk";

const veilPay = new VeilPayContract(ADDR, ABI, wallet);
await veilPay.submitPayment(requestId, amountPaid);
const isPaid = await veilPay.waitForResolution(requestId); // Polls and listens for you
```

---

## 📁 Repository Structure
-   **`contracts/BlindPayEscrow.sol`**: The core FHE smart contract logic.
-   **`packages/veilpaysdk/`**: Source code for the official TypeScript SDK.
-   **`COFHE_MIGRATION_GUIDE.md`**: Guide for switching from legacy manual encryption to the SDK.
-   **`VEILPAY_MISSION.md`**: Mission statement and privacy architecture overview.
-   **`BlindPayEscrowABI.json`**: Unified ABI for contract integration.

---

Built with ❤️ for the Fhenix Ecosystem.
