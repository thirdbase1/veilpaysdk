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
 */
export const shortenAddress = (address: string, chars: number = 4): string => {
    if (!isAddress(address)) return address;
    return `${address.substring(0, chars + 2)}...${address.substring(42 - chars)}`;
};

/**
 * PRODUCTION-GRADE BRIDGE UTILITY (v1.8.0)
 */
export class VeilPayBridge {
    /**
     * Derives a unique one-time payment address from a master mnemonic.
     */
    static deriveAddress(mnemonic: string, index: number): string {
        const wallet = ethers.HDNodeWallet.fromPhrase(mnemonic);
        const derived = wallet.derivePath(`m/44'/60'/0'/0/${index}`);
        return derived.address;
    }

    /**
     * Creates a signer for a specific derived sub-address.
     */
    static createBridgeSigner(mnemonic: string, index: number, provider: ethers.Provider): ethers.Wallet {
        const wallet = ethers.HDNodeWallet.fromPhrase(mnemonic);
        const derived = wallet.derivePath(`m/44'/60'/0'/0/${index}`);
        return new ethers.Wallet(derived.privateKey, provider);
    }

    /**
     * Validates a transaction hash for a USDC transfer to a specific sub-address.
     * @param txHash The transaction to verify.
     * @param subAddress The expected recipient.
     * @param provider Standard Sepolia Provider.
     */
    static async verifyUsdcTransfer(txHash: string, subAddress: string, provider: ethers.Provider): Promise<bigint | null> {
        const receipt = await provider.getTransactionReceipt(txHash);
        if (!receipt || receipt.status === 0) return null;

        const usdcAddress = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";
        const transferTopic = ethers.id("Transfer(address,address,uint256)");

        for (const log of receipt.logs) {
            if (log.address.toLowerCase() === usdcAddress.toLowerCase() && log.topics[0] === transferTopic) {
                const to = ethers.getAddress("0x" + log.topics[2].slice(26));
                if (to.toLowerCase() === subAddress.toLowerCase()) {
                    return ethers.toBigInt(log.data);
                }
            }
        }
        return null;
    }

    /**
     * Validates if a mnemonic is syntactically correct.
     */
    static isValidMnemonic(mnemonic: string): boolean {
        try {
            ethers.Mnemonic.fromPhrase(mnemonic);
            return true;
        } catch (e) {
            return false;
        }
    }
}
