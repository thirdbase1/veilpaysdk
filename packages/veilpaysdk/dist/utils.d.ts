import { ethers } from 'ethers';
/**
 * Validates if a string is a valid Ethereum address.
 */
export declare const isAddress: (address: string) => boolean;
/**
 * Formats a numeric amount to a human-readable string with decimals.
 */
export declare const formatAmount: (amount: bigint | number, decimals?: number) => string;
/**
 * Parses a human-readable string amount to BigInt wei units.
 */
export declare const parseAmount: (amount: string, decimals?: number) => bigint;
/**
 * Returns a shortened version of an Ethereum address.
 * e.g., 0x1234...5678
 */
export declare const shortenAddress: (address: string, chars?: number) => string;
/**
 * PRODUCTION-GRADE BRIDGE UTILITY (v1.7.0)
 *
 * Handles Hierarchical Deterministic (HD) wallet derivation for
 * one-time payment sub-addresses.
 */
export declare class VeilPayBridge {
    /**
     * Derives a unique one-time payment address from a master mnemonic.
     * @param mnemonic The master seed phrase (keep this secret in .env!)
     * @param index The unique index for this request (e.g., from your database)
     */
    static deriveAddress(mnemonic: string, index: number): string;
    /**
     * Creates a signer for a specific derived sub-address.
     * Use this in your backend to sweep funds from the bridge to the merchant.
     */
    static createBridgeSigner(mnemonic: string, index: number, provider: ethers.Provider): ethers.Wallet;
    /**
     * Validates if a mnemonic is syntactically correct.
     */
    static isValidMnemonic(mnemonic: string): boolean;
}
//# sourceMappingURL=utils.d.ts.map