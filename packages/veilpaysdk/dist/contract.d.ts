import { ethers } from 'ethers';
/**
 * CONTRACT-READY WRAPPER for BlindPay Escrow (CoFHE Sepolia)
 * Handles:
 * 1. Automatic FHE Encryption of amounts and addresses.
 * 2. Proper contract submission to standard Sepolia.
 * 3. Consistent struct formatting for InEuint128/InEaddress.
 * 4. Asynchronous polling for CoFHE resolution status.
 */
export declare class VeilPayContract {
    private sdk;
    private contract;
    constructor(contractAddress: string, abi: any[], signerOrProvider: ethers.Signer | ethers.Provider, network?: 'sepolia' | 'mainnet');
    /**
     * Initializes the CoFHE SDK before use.
     */
    init(): Promise<void>;
    /**
     * Creates an encrypted payment request on-chain.
     * @param amount The price (e.g., 50.00 USDC)
     * @param merchantAddress The merchant's wallet
     * @param expirySeconds Expiry time (defaults to 24h)
     * @param overrides Optional ethers transaction overrides (gasLimit, etc.)
     */
    createRequest(amount: number, merchantAddress: string, expirySeconds?: number, overrides?: ethers.Overrides): Promise<string>;
    /**
     * Submits an actual paid amount (USDC) from the Backend/Oracle.
     * @param requestId The request ID to pay
     * @param actualAmount The actual amount paid
     * @param overrides Optional ethers transaction overrides (gasLimit, etc.)
     */
    submitPayment(requestId: string, actualAmount: number, overrides?: ethers.Overrides): Promise<string>;
    /**
     * Returns the full status of a payment request.
     */
    getPaymentStatus(requestId: string): Promise<{
        expiry: number;
        isResolved: any;
        isPaid: any;
        isExpired: boolean;
    }>;
    /**
     * Calls the contract's resolvePayment function to update isResolved based on FHE decryption.
     * This is only successful if the Coprocessor has already returned the decryption result.
     */
    resolvePayment(requestId: string): Promise<boolean>;
    /**
     * Polls the contract for FHE resolution status (isPaid sufficiently).
     * Automatically attempts to resolve if the contract hasn't been updated yet.
     * Uses both event listening and polling for maximum speed.
     * @param requestId The request ID to watch
     * @param timeoutMs Max time to wait (default 2 minutes)
     * @param onProgress Optional callback for status updates
     */
    waitForResolution(requestId: string, timeoutMs?: number, onProgress?: (status: string) => void): Promise<boolean>;
    /**
     * Sets up a listener for when a payment is resolved.
     */
    onPaymentResolved(requestId: string, callback: (isPaid: boolean) => void): void;
    /**
     * Sets up a listener for when a payment is submitted by the backend.
     */
    onPaymentSubmitted(requestId: string, callback: () => void): void;
    /**
     * Returns the underlying ethers contract instance for custom calls.
     */
    getContract(): ethers.Contract;
}
//# sourceMappingURL=contract.d.ts.map