# 🛡️ VeilPay: Private FHE-Invoicing on Fhenix

**VeilPay** is an encrypted invoicing and payment verification system built for the Fhenix CoFHE (Confidential Fully Homomorphic Encryption) ecosystem.

### ❓ The Problem: Transparent Pricing
On standard blockchains like Ethereum or Sepolia, **Privacy is impossible.**
1.  **Merchant Privacy:** Everyone can see their price lists, their clients, and their total revenue.
2.  **Buyer Privacy:** Everyone knows exactly how much a buyer spent and on what.

### ✅ The Solution: VeilPay
VeilPay uses Fhenix CoFHE to create "Blind Invoices" that leverage **State Privacy** and **Infrastructure Anonymity.**

- **Encrypted State:** Invoice prices and merchant identities are stored as encrypted ciphertexts hits the blockchain.
- **Meaningful Computation:** The contract evaluates `FHE.gte(submitted, required)` inside the encryption.

---

## 🏗️ Technical Architecture: The Professional Bridge

VeilPay implements a **One-Time Sub-address** model to break the on-chain link between users and merchants.

### 1. HD Wallet Derivation (Anonymity)
For every invoice, the system generates a unique, one-time Ethereum address (Sub-address) using Hierarchical Deterministic (HD) derivation.
- **Benefit:** Observers cannot link different payments to the same platform or merchant.
- **Identification:** Each payment hits a unique wallet, making it 100% clear which `requestId` is being settled without needing public memo fields.

### 2. USDC Monitoring (The Oracle Phase)
The backend monitors the **Sepolia USDC Contract** (`0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238`) for incoming transfers to these sub-addresses.

### 3. Confidential Verification
Once USDC is detected, the backend performs a **Confidential Submission**:
1.  Backend encrypts the paid amount via the CoFHE KMS.
2.  Backend calls `submitPayment(requestId, encryptedAmount)`.
3.  The Fhenix Coprocessor proves the payment sufficiency without revealing the values.

---

## 🛠 Architectural Flow: Site + Database + SDK

Since the blockchain is "blind," VeilPay uses an off-chain bridge to maintain the privacy-link.

### 1. Creation (Frontend)
- **SDK:** `veilPay.createRequest(20.00, address)` encrypts data on the frontend.
- **Database:** Captures the `requestId` and stores the plaintext merchant address privately.

### 2. Resolution (The Coprocessor Cycle)
- **Polling:** The SDK (`waitForResolution`) polls the contract for the `PaymentResolved` event.
- **Status Update:** Once confirmed by Fhenix, the site updates the database to `"paid"` and settles the USDC to the merchant.

---

## 📊 Why Build VeilPay? (The "Privacy-by-Design" Winner)
VeilPay solves a real-world $500B problem: **The lack of enterprise-grade privacy in Web3 commerce.**

By building VeilPay, you are enabling:
1.  **Private B2B Invoicing:** Companies can pay each other confidentially.
2.  **Encrypted E-commerce:** Merchants can accept crypto without competitors seeing volume.
3.  **Compliance-First Architecture:** Maintaining privacy on-chain while allowing private records off-chain for audits.
