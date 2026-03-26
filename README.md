# VeilPay: Fhenix CoFHE Private Invoicing

**VeilPay** is a production-grade encrypted invoicing and payment verification system built for the **Fhenix Buildathon**. It utilizes Confidential Fully Homomorphic Encryption (CoFHE) on the **Sepolia Testnet** to provide state privacy for Web3 payments.

## 📁 Repository Structure

-   **`contracts/BlindPayEscrow.sol`**: The core FHE smart contract that performs meaningful encrypted computations (`FHE.gte`) on Sepolia.
-   **`BlindPayEscrowABI.json`**: The contract ABI required for frontend and backend integration.
-   **`packages/veilpaysdk/`**: The source code for the official **`veilpaysdk`** NPM package.
-   **`VEILPAY_MISSION.md`**: Detailed analysis of the project's mission, privacy model, and technical architecture.
-   **`COFHE_FIXED_IMPLEMENTATION.md`**: Technical guide for developers on how to replace legacy/broken FHE logic with the new SDK.
-   **`HOW_TO_PUBLISH.md`**: Guide for publishing the SDK from specialized environments like Termux.

## 🚀 Getting Started

To use VeilPay in your own project:

1.  **Install the SDK:**
    ```bash
    npm install veilpaysdk
    ```

2.  **Explore the Documentation:**
    -   Read [VEILPAY_MISSION.md](./VEILPAY_MISSION.md) to understand the FHE privacy model.
    -   Follow [COFHE_FIXED_IMPLEMENTATION.md](./COFHE_FIXED_IMPLEMENTATION.md) for step-by-step code examples.

## 🛡️ Technical Highlights

-   **State Privacy:** Protects invoice amounts and merchant identities from on-chain observers.
-   **Zero-Config Backend:** Solves the common `fheKeyStorage` crash in Node.js/Next.js.
-   **Asynchronous UX:** Encapsulates the Fhenix Coprocessor's decryption delay into a simple `waitForResolution` pattern.

---

Built with ❤️ for the Fhenix Ecosystem.
