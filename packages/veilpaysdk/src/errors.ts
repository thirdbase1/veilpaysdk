/**
 * BASE ERROR CLASS FOR VEILPAY SDK
 */
export class VeilPayError extends Error {
    constructor(message: string, public code: string) {
        super(`[VeilPay SDK] ${message}`);
        this.name = 'VeilPayError';
    }
}

/**
 * INITIALIZATION ERROR
 * Thrown when WASM or KMS keys fail to load.
 */
export class VeilPayInitError extends VeilPayError {
    constructor(message: string) {
        super(message, 'INIT_FAILURE');
        this.name = 'VeilPayInitError';
    }
}

/**
 * ENCRYPTION ERROR
 * Thrown when KMS fails to encrypt a value.
 */
export class VeilPayEncryptionError extends VeilPayError {
    constructor(message: string) {
        super(message, 'ENCRYPTION_FAILURE');
        this.name = 'VeilPayEncryptionError';
    }
}

/**
 * CONTRACT INTERACTION ERROR
 * Thrown when an ethers transaction or call fails.
 */
export class VeilPayContractError extends VeilPayError {
    constructor(message: string, public txHash?: string) {
        super(message, 'CONTRACT_FAILURE');
        this.name = 'VeilPayContractError';
    }
}

/**
 * VALIDATION ERROR
 * Thrown when an input address or amount is malformed.
 */
export class VeilPayValidationError extends VeilPayError {
    constructor(message: string) {
        super(message, 'VALIDATION_FAILURE');
        this.name = 'VeilPayValidationError';
    }
}
