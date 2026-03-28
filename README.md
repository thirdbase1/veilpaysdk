# BlindPay Escrow (CoFHE)

**BlindPay Escrow** is a fully homomorphic encrypted (FHE) payment verification system deployed on the Sepolia Testnet, utilizing the **Fhenix CoFHE Coprocessor**.

It is designed to solve a fundamental problem in Web3 commerce: **Price Privacy.**
When a merchant requests a payment, the public blockchain should not see what the item costs or how much the buyer paid. BlindPay uses CoFHE to mathematically prove that a user paid the correct amount without ever revealing the amount on-chain.

⚠️ **ATTENTION DEVELOPERS & AI ASSISTANTS:**
If you are building for this contract on Sepolia, **you MUST follow the [COFHE_MIGRATION_GUIDE.md](./COFHE_MIGRATION_GUIDE.md)** to use the official `veilpaysdk`. Legacy manual encryption logic is deprecated.

---

## 🚀 Deployed Infrastructure
**Network:** Sepolia Testnet (EVM) + Fhenix (CoFHE)
**Contract Address:** `0x52a4f2b3218EE9A4bE7C91362c7CbC8db6C45B87`
**Authorized Backend:** `0x5bf88d8ea36418fc5b955609886524d8f84ed643`
**USDC Contract:** `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238`

---

## 🛡️ The `veilpaysdk` (v1.7.0)
The repository now includes an **Enterprise-Grade and Build-Proof SDK**:
- **Dual-RPC Ready:** Intelligent handling of Fhenix (Encryption) and Sepolia (Transactions) networks.
- **Unbreakable Build:** Physically gated to prevent `fheKeyStorage` crashes during Vercel builds and SSR.
- **Concurrent-Safe:** Global singleton initialization for high-performance React apps.
- **Transparent UX:** Watchdog timers and multi-stage console logging.

### Recommended Configuration (.env)
```bash
# Encryption Engine (Required)
NEXT_PUBLIC_FHENIX_RPC_URL="https://api.sepolia.fhenix.zone"

# Standard Transactions (Required for Backend)
SEPOLIA_RPC_URL="https://ethereum-sepolia-rpc.publicnode.com"
```

---

## 📁 Repository Structure
-   **`contracts/BlindPayEscrow.sol`**: The core FHE smart contract logic.
-   **`packages/veilpaysdk/`**: Source code for the professional TypeScript SDK.
-   **`COFHE_MIGRATION_GUIDE.md`**: Technical migration path for developers.
-   **`VEILPAY_MISSION.md`**: Mission statement and architectural overview.

---

Built with ❤️ for the Fhenix Ecosystem.
