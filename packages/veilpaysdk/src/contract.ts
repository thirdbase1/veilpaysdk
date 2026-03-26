import { ethers } from 'ethers';
import { VeilPayCoFHE, CoFHEStruct } from './core';

/**
 * CONTRACT-READY WRAPPER for VeilPay Escrow (CoFHE Sepolia)
 * Handles:
 * 1. Automatic FHE Encryption of amounts and addresses.
 * 2. Proper contract submission to standard Sepolia.
 * 3. Consistent struct formatting for InEuint128/InEaddress.
 * 4. Asynchronous polling for CoFHE resolution status.
 */
export class VeilPayContract {
    private sdk: VeilPayCoFHE;
    private contract: ethers.Contract;

    constructor(
        contractAddress: string,
        abi: any[],
        signerOrProvider: ethers.Signer | ethers.Provider,
        network: 'sepolia' | 'mainnet' = 'sepolia'
    ) {
        this.sdk = new VeilPayCoFHE(network);
        this.contract = new ethers.Contract(contractAddress, abi, signerOrProvider);
    }

    /**
     * Initializes the CoFHE SDK before use.
     */
    async init(): Promise<void> {
        await this.sdk.init();
    }

    /**
     * Creates an encrypted payment request on-chain.
     * @param amount The price (e.g., 50.00 USDC)
     * @param merchantAddress The merchant's wallet
     * @param expirySeconds Expiry time (defaults to 24h)
     */
    async createRequest(
        amount: number,
        merchantAddress: string,
        expirySeconds: number = 86400
    ): Promise<string> {
        await this.init();

        // 1. Encrypt via KMS SDK
        const encryptedAmount = await this.sdk.encryptAmount(amount);
        const encryptedMerchant = await this.sdk.encryptAddress(merchantAddress);

        const expiryTimestamp = Math.floor(Date.now() / 1000) + expirySeconds;

        // 2. Call Sepolia Contract with the required Tuples/Structs
        const tx = await this.contract.createRequest(
            encryptedAmount,
            encryptedMerchant,
            expiryTimestamp
        );
        const receipt = await tx.wait();

        // 3. Extract requestId from logs (RequestCreated event)
        const event = receipt.logs.find((log: any) => log.fragment?.name === 'RequestCreated');
        if (!event) throw new Error("[VeilPay SDK] Transaction failed to emit RequestCreated event.");

        return event.args[0]; // requestId
    }

    /**
     * Submits an actual paid amount (USDC) from the Backend/Oracle.
     */
    async submitPayment(requestId: string, actualAmount: number): Promise<string> {
        await this.init();

        // 1. Encrypt via KMS
        const encryptedPaidAmount = await this.sdk.encryptAmount(actualAmount);

        // 2. Submit to the contract
        const tx = await this.contract.submitPayment(requestId, encryptedPaidAmount);
        const receipt = await tx.wait();

        return receipt.hash;
    }

    /**
     * Calls the contract's resolvePayment function to update isResolved based on FHE decryption.
     * This is only successful if the Coprocessor has already returned the decryption result.
     */
    async resolvePayment(requestId: string): Promise<boolean> {
        try {
            const tx = await this.contract.resolvePayment(requestId);
            await tx.wait();
            return true;
        } catch (error) {
            // Reverts if FHE result is not ready yet
            return false;
        }
    }

    /**
     * Polls the contract for FHE resolution status (isPaid sufficiently).
     * Automatically attempts to resolve if the contract hasn't been updated yet.
     */
    async waitForResolution(requestId: string, maxAttempts: number = 12): Promise<boolean> {
        let attempts = 0;

        while (attempts < maxAttempts) {
            attempts++;

            // 1. Check current state
            const status = await this.contract.getRequestStatus(requestId);

            if (status.isResolved) {
                return status.isPaid; // true if sufficient, false if underpaid
            }

            // 2. Attempt to trigger resolution (in case Coprocessor finished but contract hasn't updated)
            await this.resolvePayment(requestId);

            // Wait 10 seconds before next poll (Decryption on Sepolia can take 2-3 blocks)
            await new Promise(resolve => setTimeout(resolve, 10000));
        }

        throw new Error("[VeilPay SDK] Resolution timed out. Decryption may still be in progress on the Coprocessor (Sepolia).");
    }
}
