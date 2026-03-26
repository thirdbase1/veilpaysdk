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
