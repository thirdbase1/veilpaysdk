# 🛡️ VeilPay: Private FHE-Invoicing on Fhenix

**VeilPay** is an encrypted invoicing and payment verification system built for the Fhenix CoFHE (Confidential Fully Homomorphic Encryption) ecosystem.

### ❓ The Problem: Transparent Pricing
On standard blockchains like Ethereum or Sepolia, **Privacy is impossible.**
1.  **Merchant Privacy:** Everyone can see their price lists, their clients, and their total revenue.
2.  **Buyer Privacy:** Everyone knows exactly how much a buyer spent and on what.

### ✅ The Solution: VeilPay
VeilPay uses Fhenix CoFHE to create "Blind Invoices" that leverage **State Privacy.**

- **Encrypted Amounts (`euint128`):** The requested price is encrypted via CoFHE KMS before it hits the blockchain.
- **Encrypted Merchant Identity (`eaddress`):** The merchant's address stored inside the contract is encrypted.
- **On-Chain Math:** The contract calculates `FHE.gte(submitted, required)` inside the encryption.

---

## 🏗️ Technical Architecture: Payment Verification

VeilPay provides a secure bridge between standard USDC transfers and confidential FHE verification.

### 1. USDC Monitoring (The Oracle Phase)
The authorized backend (Oracle) monitors the **Sepolia USDC Contract** (`0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238`) for `Transfer` events.

- **Trigger:** When a user pays USDC to the bridge, the backend captures the transaction.
- **Verification:** The backend confirms the amount sent matches the intended payment for a specific `requestId`.

### 2. Confidential Submission
Once the backend verifies the USDC transfer in plaintext, it performs a **Confidential Submission**:
1.  Backend encrypts the *actual* amount paid via the CoFHE KMS.
2.  Backend calls `submitPayment(requestId, encryptedPaidAmount)` on the `BlindPayEscrow` contract.
3.  The contract triggers the Fhenix Coprocessor to evaluate the sufficiency of the payment WITHOUT revealing the amount.

---

## 🛠 Architectural Flow: Site + Database + SDK

Since the blockchain is "blind," you must use a database to bridge the gap.

### 1. Creation (Frontend)
- **SDK:** `veilPay.createRequest(20.00, address)` encrypts the data and submits to the contract.
- **Database Save:** Your site captures the emitted `requestId` and saves it to your database.

### 2. Resolution (The Coprocessor Cycle)
- **Polling:** The SDK (`waitForResolution`) polls the contract for the `PaymentResolved` event.
- **Status Update:** Once the Fhenix Coprocessor returns `true` (sufficient payment), your site updates the database to `"paid"`.

---

## 📊 Why Build VeilPay? (The "Privacy-by-Design" Winner)
VeilPay solves a real-world $500B problem: **The lack of enterprise-grade privacy in Web3 commerce.**

By building VeilPay, you are enabling:
1.  **Private B2B Invoicing:** Companies can pay each other confidentially.
2.  **Encrypted E-commerce:** Merchants can accept crypto without competitors seeing sales volume.
3.  **Compliance-First Architecture:** Maintaining privacy on-chain while allowing private records off-chain for audits.
