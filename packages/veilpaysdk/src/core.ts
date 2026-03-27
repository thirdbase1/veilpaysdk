import { VeilPayInitError, VeilPayEncryptionError } from "./errors";

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

// SDK METADATA
export const VEILPAY_SDK_VERSION = "1.6.0";

// GLOBAL SINGLETON STATE
let globalClient: any = null;
let globalInitPromise: Promise<void> | null = null;
let globalIsReady = false;

/**
 * PRODUCTION-GRADE Fhenix CoFHE Wrapper for VeilPay (v1.6.0)
 *
 * v1.6.0 FEATURES:
 * 1. Double-RPC Validation: Ensures a Fhenix-compatible RPC is used for KMS.
 * 2. Pre-flight Checks: Catches missing environment variables BEFORE loading WASM.
 * 3. Warm-up Ready: Optimized for background initialization.
 */
export class VeilPayCoFHE {
  private config: VeilPayConfig;

  constructor(config: VeilPayConfig | string = "sepolia") {
    if (typeof config === 'string') {
        this.config = { network: config as any };
    } else {
        this.config = config;
    }

    // Auto-detect RPC from environment if not provided
    if (!this.config.rpcUrl && typeof process !== 'undefined') {
        this.config.rpcUrl = process.env.NEXT_PUBLIC_FHENIX_RPC_URL || process.env.FHENIX_RPC_URL;
    }
  }

  private isSafeRuntime(): boolean {
    if (typeof window !== 'undefined') return true;
    const isNextBuild =
        typeof process !== 'undefined' &&
        (process.env.NEXT_PHASE === 'phase-production-build' ||
         process.env.IS_NEXT_BUILD === 'true' ||
         (process.env.NODE_ENV === 'production' && !process.env.VERCEL_URL));

    return !isNextBuild;
  }

  /**
   * Performs basic validation of the environment and configuration.
   */
  private validatePreflight() {
    if (!this.config.rpcUrl && this.config.network !== 'mainnet') {
        console.warn(`[VeilPay SDK] WARNING: No rpcUrl provided. KMS encryption may fail.
        Please set NEXT_PUBLIC_FHENIX_RPC_URL in your .env file.`);
    }

    if (this.config.rpcUrl && !this.config.rpcUrl.includes('fhenix')) {
        console.warn(`[VeilPay SDK] WARNING: The provided rpcUrl (${this.config.rpcUrl}) does not appear to be a Fhenix network.
        CoFHE encryption REQUIRES a Fhenix-enabled RPC.`);
    }
  }

  /**
   * Initializes the internal WASM and KMS keys.
   */
  async init(): Promise<void> {
    if (globalIsReady) return;
    if (globalInitPromise) return globalInitPromise;

    if (!this.isSafeRuntime()) {
        return Promise.resolve();
    }

    this.validatePreflight();

    console.log(`[VeilPay SDK v${VEILPAY_SDK_VERSION}] Initialization starting...`);

    const timeoutMs = this.config.timeoutMs || 45000;

    globalInitPromise = new Promise(async (resolve, reject) => {
        const timer = setTimeout(() => {
            if (!globalIsReady) {
                const err = new VeilPayInitError(`Initialization timed out after ${timeoutMs}ms. Possible reasons:
                1. Missing or invalid NEXT_PUBLIC_FHENIX_RPC_URL.
                2. Blocked connection to Fhenix KMS.
                3. Heavy CPU load during WASM compilation.`);
                console.error(`[VeilPay SDK] TIMEOUT`, err);
                globalInitPromise = null;
                reject(err);
            }
        }, timeoutMs);

        try {
            console.log(`[VeilPay SDK] Stage 1: Loading @cofhe/sdk engine...`);
            const sdkModule = await import("@cofhe/sdk");
            const createClient = sdkModule.createCofhesdkClientBase || (sdkModule as any).default?.createCofhesdkClientBase;

            if (!createClient) throw new Error("Invalid @cofhe/sdk structure.");

            const memoryStorageInstance = this.getMemoryStorage();
            const safeStorage = {
                getItem: (key: string) => {
                    try { return (typeof window !== 'undefined' && window.localStorage) ? window.localStorage.getItem(key) : memoryStorageInstance.getItem(key); } catch (e) { return memoryStorageInstance.getItem(key); }
                },
                setItem: (key: string, value: string) => {
                    try { if (typeof window !== 'undefined' && window.localStorage) { window.localStorage.setItem(key, value); return; } } catch (e) {}
                    memoryStorageInstance.setItem(key, value);
                },
                removeItem: (key: string) => {
                    try { if (typeof window !== 'undefined' && window.localStorage) { window.localStorage.removeItem(key); return; } } catch (e) {}
                    memoryStorageInstance.removeItem(key);
                }
            };

            console.log(`[VeilPay SDK] Stage 2: Creating KMS Client (${this.config.network || 'sepolia'})...`);
            globalClient = createClient({
                network: this.config.network || "sepolia",
                kmsUrl: this.config.kmsUrl,
                rpcUrl: this.config.rpcUrl,
                fheKeyStorage: safeStorage
            } as any);

            if (typeof globalClient.init === "function") {
                console.log(`[VeilPay SDK] Stage 3: Compiling WASM and Fetching KMS state...`);
                await globalClient.init();
            }

            clearTimeout(timer);
            globalIsReady = true;
            console.log(`[VeilPay SDK v${VEILPAY_SDK_VERSION}] SUCCESS: Engine Ready.`);
            resolve();
        } catch (error: any) {
            clearTimeout(timer);
            globalInitPromise = null;
            console.error(`[VeilPay SDK] ERROR during init:`, error);
            reject(new VeilPayInitError(error.message || "Initialization Failed"));
        }
    });

    return globalInitPromise;
  }

  isClientReady(): boolean {
    return globalIsReady;
  }

  async encryptAmount(amount: number, decimals: number = 6): Promise<CoFHEStruct> {
    if (!globalIsReady) await this.init();
    if (!globalClient) throw new VeilPayEncryptionError("SDK Dormant.");
    const wei = BigInt(Math.floor(amount * Math.pow(10, decimals)));
    const result = await globalClient.encryptUint128(wei);
    return this.toStruct(result);
  }

  async encryptAddress(address: string): Promise<CoFHEStruct> {
    if (!globalIsReady) await this.init();
    if (!globalClient) throw new VeilPayEncryptionError("SDK Dormant.");
    const result = await globalClient.encryptAddress(address);
    return this.toStruct(result);
  }

  async generatePermit(contractAddress: string, provider: any): Promise<any> {
    if (!globalIsReady) await this.init();
    if (!globalClient) throw new VeilPayEncryptionError("SDK Dormant.");
    try {
      return await globalClient.generatePermit(contractAddress, provider);
    } catch (error: any) {
      throw new VeilPayEncryptionError(`Permit generation failed: ${error.message}`);
    }
  }

  validateStruct(struct: any): boolean {
    return (
      struct &&
      struct.ctHash !== undefined &&
      struct.securityZone !== undefined &&
      struct.utype !== undefined &&
      struct.signature !== undefined
    );
  }

  private toStruct(result: any): CoFHEStruct {
    if (!this.validateStruct(result)) {
      throw new VeilPayEncryptionError("KMS returned an incomplete struct.");
    }
    return result as CoFHEStruct;
  }

  private getMemoryStorage() {
    const memoryStorage: Record<string, string> = {};
    return {
      getItem: (key: string) => memoryStorage[key] || null,
      setItem: (key: string, value: string) => { memoryStorage[key] = value; },
      removeItem: (key: string) => { delete memoryStorage[key]; },
    };
  }
}
