import { ethers } from 'ethers';

/**
 * Validates if a string is a valid Ethereum address.
 */
export const isAddress = (address: string): boolean => {
    return ethers.isAddress(address);
};

/**
 * Formats a numeric amount to a human-readable string with decimals.
 */
export const formatAmount = (amount: bigint | number, decimals: number = 6): string => {
    return ethers.formatUnits(amount, decimals);
};

/**
 * Parses a human-readable string amount to BigInt wei units.
 */
export const parseAmount = (amount: string, decimals: number = 6): bigint => {
    return ethers.parseUnits(amount, decimals);
};

/**
 * Returns a shortened version of an Ethereum address.
 * e.g., 0x1234...5678
 */
export const shortenAddress = (address: string, chars: number = 4): string => {
    if (!isAddress(address)) return address;
    return `${address.substring(0, chars + 2)}...${address.substring(42 - chars)}`;
};

/**
 * PRODUCTION-GRADE BRIDGE UTILITY (v1.7.0)
 *
 * Handles Hierarchical Deterministic (HD) wallet derivation for
 * one-time payment sub-addresses.
 */
export class VeilPayBridge {
    /**
     * Derives a unique one-time payment address from a master mnemonic.
     * @param mnemonic The master seed phrase (keep this secret in .env!)
     * @param index The unique index for this request (e.g., from your database)
     */
    static deriveAddress(mnemonic: string, index: number): string {
        const wallet = ethers.HDNodeWallet.fromPhrase(mnemonic);
        const derived = wallet.derivePath(`m/44'/60'/0'/0/${index}`);
        return derived.address;
    }

    /**
     * Creates a signer for a specific derived sub-address.
     * Use this in your backend to sweep funds from the bridge to the merchant.
     */
    static createBridgeSigner(mnemonic: string, index: number, provider: ethers.Provider): ethers.Wallet {
        const wallet = ethers.HDNodeWallet.fromPhrase(mnemonic);
        const derived = wallet.derivePath(`m/44'/60'/0'/0/${index}`);
        return new ethers.Wallet(derived.privateKey, provider);
    }

    /**
     * Validates if a mnemonic is syntactically correct.
     */
    static isValidMnemonic(mnemonic: string): boolean {
        return ethers.Mnemonic.isValidPhrase(mnemonic);
    }
}
