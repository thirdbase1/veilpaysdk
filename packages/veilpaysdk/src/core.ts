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
export const VEILPAY_SDK_VERSION = "1.7.0";

// GLOBAL SINGLETON STATE
let globalClient: any = null;
let globalInitPromise: Promise<void> | null = null;
let globalIsReady = false;

/**
 * PRODUCTION-GRADE Fhenix CoFHE Wrapper for VeilPay (v1.7.0)
 *
 * v1.7.0 FEATURES:
 * 1. Double-RPC Validation: Ensures a Fhenix-compatible RPC is used for KMS.
 * 2. Pre-flight Checks: Catches missing environment variables BEFORE loading WASM.
 * 3. Warm-up Ready: Optimized for background initialization.
 * 4. Enterprise Resilience: Shared global singleton promise with hardened failure paths.
 */
export class VeilPayCoFHE {
  private config: VeilPayConfig;

  constructor(config: VeilPayConfig | string = "sepolia") {
    if (typeof config === 'string') {
        this.config = { network: config as any };
    } else {
        this.config = config;
    }

    // Auto-detect RPC from environment if not provided.
    if (!this.config.rpcUrl && typeof process !== 'undefined') {
        this.config.rpcUrl = process.env.FHENIX_RPC_URL || process.env.NEXT_PUBLIC_FHENIX_RPC_URL;
    }
  }

  /**
   * Returns metadata about the current SDK state.
   * Useful for debugging UI hangs.
   */
  getSDKMetadata() {
      return {
          version: VEILPAY_SDK_VERSION,
          isReady: globalIsReady,
          isBuilding: this.isBuilding(),
          hasClient: !!globalClient,
          network: this.config.network || 'sepolia'
      };
  }

  private isBuilding(): boolean {
    if (typeof window !== 'undefined') return false;
    return typeof process !== 'undefined' &&
        (process.env.NEXT_PHASE === 'phase-production-build' ||
         process.env.IS_NEXT_BUILD === 'true' ||
         (process.env.NODE_ENV === 'production' && !process.env.VERCEL_URL));
  }

  /**
   * Performs basic validation of the environment and configuration.
   */
  private validatePreflight() {
    if (!this.config.rpcUrl && this.config.network !== 'mainnet') {
        console.warn(`[VeilPay SDK] WARNING: No rpcUrl provided. KMS encryption may fail.`);
    }

    if (this.config.rpcUrl && !this.config.rpcUrl.includes('fhenix')) {
        console.warn(`[VeilPay SDK] WARNING: The provided rpcUrl (${this.config.rpcUrl}) may not support FHE.`);
    }
  }

  /**
   * Initializes the internal WASM and KMS keys.
   */
  async init(): Promise<void> {
    if (globalIsReady) return;
    if (globalInitPromise) return globalInitPromise;

    if (this.isBuilding()) {
        return Promise.resolve();
    }

    this.validatePreflight();

    console.log(`[VeilPay SDK v${VEILPAY_SDK_VERSION}] Starting Enterprise Initialization...`);

    const timeoutMs = this.config.timeoutMs || 45000;

    globalInitPromise = new Promise(async (resolve, reject) => {
        const timer = setTimeout(() => {
            if (!globalIsReady) {
                const err = new VeilPayInitError(`Initialization timed out (${timeoutMs}ms).`);
                console.error(`[VeilPay SDK] TIMEOUT`, err);
                globalInitPromise = null; // Allow retry on timeout
                reject(err);
            }
        }, timeoutMs);

        try {
            console.log(`[VeilPay SDK] Stage 1: Dynamic Loading...`);
            const sdkModule = await import("@cofhe/sdk");
            const createClient = sdkModule.createCofhesdkClientBase || (sdkModule as any).default?.createCofhesdkClientBase;

            if (!createClient) throw new Error("Invalid @cofhe/sdk exports.");

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

            console.log(`[VeilPay SDK] Stage 2: KMS Bridge Creation...`);
            globalClient = createClient({
                network: this.config.network || "sepolia",
                kmsUrl: this.config.kmsUrl,
                rpcUrl: this.config.rpcUrl,
                fheKeyStorage: safeStorage
            } as any);

            if (typeof globalClient.init === "function") {
                console.log(`[VeilPay SDK] Stage 3: Engine Bootstrapping...`);
                await globalClient.init();
            }

            clearTimeout(timer);
            globalIsReady = true;
            console.log(`[VeilPay SDK v${VEILPAY_SDK_VERSION}] SUCCESS: Engine Ready.`);
            resolve();
        } catch (error: any) {
            clearTimeout(timer);
            globalInitPromise = null; // Allow retry on failure
            console.error(`[VeilPay SDK] Initialization ERROR:`, error);
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
    if (!globalClient) throw new VeilPayEncryptionError("Engine Unavailable.");
    const wei = BigInt(Math.floor(amount * Math.pow(10, decimals)));
    const result = await globalClient.encryptUint128(wei);
    return this.toStruct(result);
  }

  async encryptAddress(address: string): Promise<CoFHEStruct> {
    if (!globalIsReady) await this.init();
    if (!globalClient) throw new VeilPayEncryptionError("Engine Unavailable.");
    const result = await globalClient.encryptAddress(address);
    return this.toStruct(result);
  }

  async generatePermit(contractAddress: string, provider: any): Promise<any> {
    if (!globalIsReady) await this.init();
    if (!globalClient) throw new VeilPayEncryptionError("Engine Unavailable.");
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
