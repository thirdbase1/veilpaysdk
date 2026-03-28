export interface CoFHEStruct {
    ctHash: string | bigint;
    securityZone: number;
    utype: number;
    signature: string;
}
export interface VeilPayConfig {
    network?: "sepolia" | "mainnet";
    kmsUrl?: string;
    rpcUrl?: string;
    timeoutMs?: number;
}
export declare const VEILPAY_SDK_VERSION = "1.7.0";
/**
 * PRODUCTION-GRADE Fhenix CoFHE Wrapper for VeilPay (v1.7.0)
 *
 * v1.7.0 FEATURES:
 * 1. Double-RPC Validation: Ensures a Fhenix-compatible RPC is used for KMS.
 * 2. Pre-flight Checks: Catches missing environment variables BEFORE loading WASM.
 * 3. Warm-up Ready: Optimized for background initialization.
 * 4. Enterprise Resilience: Shared global singleton promise with hardened failure paths.
 */
export declare class VeilPayCoFHE {
    private config;
    constructor(config?: VeilPayConfig | string);
    /**
     * Returns metadata about the current SDK state.
     * Useful for debugging UI hangs.
     */
    getSDKMetadata(): {
        version: string;
        isReady: boolean;
        isBuilding: boolean;
        hasClient: boolean;
        network: "sepolia" | "mainnet";
    };
    private isBuilding;
    /**
     * Performs basic validation of the environment and configuration.
     */
    private validatePreflight;
    /**
     * Initializes the internal WASM and KMS keys.
     */
    init(): Promise<void>;
    isClientReady(): boolean;
    encryptAmount(amount: number, decimals?: number): Promise<CoFHEStruct>;
    encryptAddress(address: string): Promise<CoFHEStruct>;
    generatePermit(contractAddress: string, provider: any): Promise<any>;
    validateStruct(struct: any): boolean;
    private toStruct;
    private getMemoryStorage;
}
//# sourceMappingURL=core.d.ts.map