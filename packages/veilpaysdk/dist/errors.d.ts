/**
 * BASE ERROR CLASS FOR VEILPAY SDK
 */
export declare class VeilPayError extends Error {
    code: string;
    constructor(message: string, code: string);
}
/**
 * INITIALIZATION ERROR
 * Thrown when WASM or KMS keys fail to load.
 */
export declare class VeilPayInitError extends VeilPayError {
    constructor(message: string);
}
/**
 * ENCRYPTION ERROR
 * Thrown when KMS fails to encrypt a value.
 */
export declare class VeilPayEncryptionError extends VeilPayError {
    constructor(message: string);
}
/**
 * CONTRACT INTERACTION ERROR
 * Thrown when an ethers transaction or call fails.
 */
export declare class VeilPayContractError extends VeilPayError {
    txHash?: string | undefined;
    constructor(message: string, txHash?: string | undefined);
}
/**
 * VALIDATION ERROR
 * Thrown when an input address or amount is malformed.
 */
export declare class VeilPayValidationError extends VeilPayError {
    constructor(message: string);
}
//# sourceMappingURL=errors.d.ts.map