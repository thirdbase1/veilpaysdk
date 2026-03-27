# 🛡️ VeilPay: Private FHE-Invoicing on Fhenix

**VeilPay** is an encrypted invoicing and payment verification system built for the Fhenix CoFHE (Confidential Fully Homomorphic Encryption) ecosystem.

### ❓ The Problem: Transparent Pricing
On standard blockchains like Ethereum or Sepolia, **Privacy is impossible.**
1.  **Merchant Privacy:** If a merchant sends an invoice for 500 USDC, everyone can see their price lists, their clients, and their total revenue.
2.  **Buyer Privacy:** If a buyer pays for a service, everyone knows exactly how much they spent and on what.
3.  **MEV & Frontrunning:** Public price data allows bots to frontrun or exploit market activity.

### ✅ The Solution: VeilPay
VeilPay uses Fhenix CoFHE to create "Blind Invoices" that leverage **State Privacy.**

- **Encrypted Amounts (`euint128`):** The requested price is encrypted via CoFHE KMS before it ever hits the blockchain. No one can see your invoice's total value.
- **Encrypted Merchant Identity (`eaddress`):** While the *transaction sender* (`msg.sender`) is public on Sepolia, the *merchant's address* stored inside the contract is encrypted.
- **On-Chain Math:** When a payment is submitted, the contract calculates `FHE.gte(submitted, required)` *inside the encryption*.
- **Asynchronous Resolution:** The Fhenix Coprocessor solves the math off-chain and returns only the boolean "SUCCESS" or "FAILURE" to the contract.

---

## 🏆 Buildathon Ready (AKINDO Wave 1 Compliance)

VeilPay and the `veilpaysdk` are purpose-built to meet and exceed the **Fhenix AKINDO Buildathon Wave 1** requirements:

1. **CoFHE Stack:** Exclusively utilizes `@fhenixprotocol/cofhe-contracts` and the `@cofhe/sdk` KMS for all FHE operations.
2. **Mandatory Permits:** The SDK includes built-in support for `generatePermit()`, a mandatory feature of the CoFHE stack for authorizing data decryption views.
3. **Library Neutrality:** The SDK has **ZERO dependencies on Wagmi, RainbowKit, or WalletConnect**, ensuring it can be plugged into any ethers-based project without configuration bloat.
4. **Hardhat & React Hooks:** Follows the recommended development flow with Hardhat-compatible contract structures and high-level React hooks for the frontend.

---

## 🛠 Architectural Flow: Site + Database + SDK

Since the blockchain is "blind," you cannot search for payments by merchant address on-chain. You must use a database to bridge the gap.

### 1. Creation (Frontend)
- **Action:** User fills in "20$" and "Merchant Address."
- **SDK:** `veilPay.createRequest(20.00, address)` encrypts the data and submits to the `BlindPayEscrow` contract.
- **Event:** The contract emits `RequestCreated(requestId)`.
- **Database Save:** Your site captures this `requestId` and saves it to your database.

### 2. Payment (Backend)
- **Action:** A customer pays USDC to your designated bridge address.
- **Backend Detector:** Your backend sees the payment and looks up the associated `requestId`.
- **SDK:** `veilPay.submitPayment(requestId, actualPaidAmount)` sends the real amount to the contract (encrypted).

### 3. Resolution (Event Listener)
- **Action:** The Fhenix Coprocessor calculates the result.
- **SDK Polling:** `veilPay.waitForResolution(requestId)` polls the contract.
- **Status Update:** Once the SDK returns `true`, your site updates the database to `"paid"`.

---

## 📊 Why Build VeilPay? (The "Privacy-by-Design" Winner)
VeilPay is a critical piece of infrastructure for the Fhenix ecosystem because it solves a real-world $500B problem: **The lack of enterprise-grade privacy in Web3 commerce.**

By building VeilPay, you are enabling:
1.  **Private B2B Invoicing:** Companies can pay each other without revealing sensitive business data.
2.  **Encrypted E-commerce:** Small merchants can accept crypto without their competitors seeing their sales volume.
3.  **Compliance-First Architecture:** Maintaining privacy on-chain while allowing the merchant to keep private records off-chain for tax/audits.

VeilPay isn't just an "Escrow"—it's a **Private Financial Bridge.**
