/**
 * BASE ERROR CLASS FOR VEILPAY SDK
 */
export class VeilPayError extends Error {
    code;
    constructor(message, code) {
        super(`[VeilPay SDK] ${message}`);
        this.code = code;
        this.name = 'VeilPayError';
    }
}
/**
 * INITIALIZATION ERROR
 * Thrown when WASM or KMS keys fail to load.
 */
export class VeilPayInitError extends VeilPayError {
    constructor(message) {
        super(message, 'INIT_FAILURE');
        this.name = 'VeilPayInitError';
    }
}
/**
 * ENCRYPTION ERROR
 * Thrown when KMS fails to encrypt a value.
 */
export class VeilPayEncryptionError extends VeilPayError {
    constructor(message) {
        super(message, 'ENCRYPTION_FAILURE');
        this.name = 'VeilPayEncryptionError';
    }
}
/**
 * CONTRACT INTERACTION ERROR
 * Thrown when an ethers transaction or call fails.
 */
export class VeilPayContractError extends VeilPayError {
    txHash;
    constructor(message, txHash) {
        super(message, 'CONTRACT_FAILURE');
        this.txHash = txHash;
        this.name = 'VeilPayContractError';
    }
}
/**
 * VALIDATION ERROR
 * Thrown when an input address or amount is malformed.
 */
export class VeilPayValidationError extends VeilPayError {
    constructor(message) {
        super(message, 'VALIDATION_FAILURE');
        this.name = 'VeilPayValidationError';
    }
}
