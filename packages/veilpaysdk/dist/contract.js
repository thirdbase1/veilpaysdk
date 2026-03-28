import { ethers } from 'ethers';
import { VeilPayCoFHE } from './core';
import { VeilPayContractError, VeilPayValidationError } from './errors';
/**
 * CONTRACT-READY WRAPPER for BlindPay Escrow (CoFHE Sepolia)
 * Handles:
 * 1. Automatic FHE Encryption of amounts and addresses.
 * 2. Proper contract submission to standard Sepolia.
 * 3. Consistent struct formatting for InEuint128/InEaddress.
 * 4. Asynchronous polling for CoFHE resolution status.
 */
export class VeilPayContract {
    sdk;
    contract;
    constructor(contractAddress, abi, signerOrProvider, network = 'sepolia') {
        this.sdk = new VeilPayCoFHE(network);
        this.contract = new ethers.Contract(contractAddress, abi, signerOrProvider);
    }
    /**
     * Initializes the CoFHE SDK before use.
     */
    async init() {
        await this.sdk.init();
    }
    /**
     * Creates an encrypted payment request on-chain.
     * @param amount The price (e.g., 50.00 USDC)
     * @param merchantAddress The merchant's wallet
     * @param expirySeconds Expiry time (defaults to 24h)
     * @param overrides Optional ethers transaction overrides (gasLimit, etc.)
     */
    async createRequest(amount, merchantAddress, expirySeconds = 86400, overrides = {}) {
        if (!ethers.isAddress(merchantAddress)) {
            throw new VeilPayValidationError(`Invalid merchant address: ${merchantAddress}`);
        }
        if (amount <= 0) {
            throw new VeilPayValidationError("Amount must be greater than 0");
        }
        await this.init();
        // 1. Encrypt via KMS SDK
        const encryptedAmount = await this.sdk.encryptAmount(amount);
        const encryptedMerchant = await this.sdk.encryptAddress(merchantAddress);
        const expiryTimestamp = Math.floor(Date.now() / 1000) + expirySeconds;
        // 2. Call Sepolia Contract with the required Tuples/Structs
        try {
            console.log("[VeilPay SDK] Creating request on-chain...");
            const tx = await this.contract.createRequest(encryptedAmount, encryptedMerchant, expiryTimestamp, overrides);
            const receipt = await tx.wait();
            // 3. Extract requestId from logs (RequestCreated event)
            const event = receipt.logs.find((log) => log.fragment?.name === 'RequestCreated');
            if (!event) {
                console.error("[VeilPay SDK] RequestCreated event not found in logs.");
                throw new VeilPayContractError("Transaction succeeded but no RequestCreated event was emitted.");
            }
            const requestId = event.args[0];
            console.log(`[VeilPay SDK] Request created successfully: ${requestId}`);
            return requestId;
        }
        catch (error) {
            console.error("[VeilPay SDK] createRequest Error:", error);
            throw new VeilPayContractError(`createRequest failed: ${error.message}`, error.hash);
        }
    }
    /**
     * Submits an actual paid amount (USDC) from the Backend/Oracle.
     * @param requestId The request ID to pay
     * @param actualAmount The actual amount paid
     * @param overrides Optional ethers transaction overrides (gasLimit, etc.)
     */
    async submitPayment(requestId, actualAmount, overrides = {}) {
        if (actualAmount <= 0) {
            throw new VeilPayValidationError("Actual amount must be greater than 0");
        }
        await this.init();
        // 1. Encrypt via KMS
        const encryptedPaidAmount = await this.sdk.encryptAmount(actualAmount);
        // 2. Submit to the contract
        try {
            console.log(`[VeilPay SDK] Submitting payment for request: ${requestId}`);
            const tx = await this.contract.submitPayment(requestId, encryptedPaidAmount, overrides);
            const receipt = await tx.wait();
            console.log(`[VeilPay SDK] Payment submitted in tx: ${receipt.hash}`);
            return receipt.hash;
        }
        catch (error) {
            console.error("[VeilPay SDK] submitPayment Error:", error);
            throw new VeilPayContractError(`submitPayment failed: ${error.message}`, error.hash);
        }
    }
    /**
     * Returns the full status of a payment request.
     */
    async getPaymentStatus(requestId) {
        const [expiry, isResolved, isPaid] = await this.contract.getRequestStatus(requestId);
        return {
            expiry: Number(expiry),
            isResolved,
            isPaid,
            isExpired: Number(expiry) < Math.floor(Date.now() / 1000)
        };
    }
    /**
     * Calls the contract's resolvePayment function to update isResolved based on FHE decryption.
     * This is only successful if the Coprocessor has already returned the decryption result.
     */
    async resolvePayment(requestId) {
        try {
            // Check if result is ready via staticCall before sending a real transaction
            // This saves gas and prevents unnecessary wallet popups
            await this.contract.resolvePayment.staticCall(requestId);
            const tx = await this.contract.resolvePayment(requestId);
            await tx.wait();
            return true;
        }
        catch (error) {
            // Reverts if FHE result is not ready yet
            return false;
        }
    }
    /**
     * Polls the contract for FHE resolution status (isPaid sufficiently).
     * Automatically attempts to resolve if the contract hasn't been updated yet.
     * Uses both event listening and polling for maximum speed.
     * @param requestId The request ID to watch
     * @param timeoutMs Max time to wait (default 2 minutes)
     * @param onProgress Optional callback for status updates
     */
    async waitForResolution(requestId, timeoutMs = 120000, onProgress) {
        return new Promise(async (resolve, reject) => {
            let resolved = false;
            if (onProgress)
                onProgress("Setting up event listeners...");
            // 1. Setup Event Listener (Instant resolution)
            const filter = this.contract.filters.PaymentResolved(requestId);
            this.contract.once(filter, (id, isPaid) => {
                if (!resolved) {
                    resolved = true;
                    if (onProgress)
                        onProgress("PaymentResolved event detected!");
                    resolve(isPaid);
                }
            });
            // 2. Setup Polling Fallback (Backup)
            const startTime = Date.now();
            const poll = async () => {
                if (resolved)
                    return;
                try {
                    if (onProgress)
                        onProgress("Checking contract status...");
                    const status = await this.getPaymentStatus(requestId);
                    if (status.isResolved) {
                        resolved = true;
                        if (onProgress)
                            onProgress("Resolution confirmed via contract state.");
                        resolve(status.isPaid);
                        return;
                    }
                    // Attempt resolution on-chain
                    if (onProgress)
                        onProgress("Triggering on-chain resolution check...");
                    await this.resolvePayment(requestId);
                }
                catch (e) {
                    // Ignore transient errors during polling
                }
                if (Date.now() - startTime > timeoutMs) {
                    if (!resolved) {
                        resolved = true;
                        reject(new VeilPayContractError("Resolution timed out. Decryption may still be in progress on the Coprocessor (Sepolia)."));
                    }
                    return;
                }
                if (onProgress)
                    onProgress("Waiting for next poll cycle...");
                setTimeout(poll, 10000);
            };
            poll();
        });
    }
    /**
     * Sets up a listener for when a payment is resolved.
     */
    onPaymentResolved(requestId, callback) {
        const filter = this.contract.filters.PaymentResolved(requestId);
        this.contract.on(filter, (id, isPaid) => {
            callback(isPaid);
        });
    }
    /**
     * Sets up a listener for when a payment is submitted by the backend.
     */
    onPaymentSubmitted(requestId, callback) {
        const filter = this.contract.filters.PaymentSubmitted(requestId);
        this.contract.on(filter, (id) => {
            callback();
        });
    }
    /**
     * Returns the underlying ethers contract instance for custom calls.
     */
    getContract() {
        return this.contract;
    }
}
