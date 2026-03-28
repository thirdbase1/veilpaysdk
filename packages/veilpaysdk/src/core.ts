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

// OFFICIAL FHENIX SEPOLIA INFRASTRUCTURE
const DEFAULT_KMS_URL = "https://kms.sepolia.fhenix.zone";
const DEFAULT_RPC_URL = "https://api.sepolia.fhenix.zone";

/**
 * PRODUCTION-GRADE Fhenix CoFHE Wrapper for VeilPay (v1.7.0)
 *
 * v1.7.0 Final Revision (Runtime Bulletproofing):
 * 1. Fixed "fheKeyStorage" error via simplified storage mapping.
 * 2. Hardened dynamic client instantiation.
 * 3. Detailed browser console logging for micro-step debugging.
 */
export class VeilPayCoFHE {
  private config: VeilPayConfig;

  constructor(config: VeilPayConfig | string = "sepolia") {
    if (typeof config === 'string') {
        this.config = { network: config as any };
    } else {
        this.config = config;
    }
  }

  private isBuilding(): boolean {
    if (typeof window !== 'undefined') return false;
    return typeof process !== 'undefined' &&
        (process.env.NEXT_PHASE === 'phase-production-build' ||
         process.env.IS_NEXT_BUILD === 'true' ||
         (process.env.NODE_ENV === 'production' && !process.env.VERCEL_URL));
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

    console.log(`[VeilPay SDK v${VEILPAY_SDK_VERSION}] --- Runtime Initialization Started ---`);

    const timeoutMs = this.config.timeoutMs || 45000;

    globalInitPromise = new Promise(async (resolve, reject) => {
        const timer = setTimeout(() => {
            if (!globalIsReady) {
                const err = new VeilPayInitError(`Initialization timed out after ${timeoutMs}ms.`);
                console.error(`[VeilPay SDK] FATAL: Timeout. Engine failed to boot.`);
                globalInitPromise = null;
                reject(err);
            }
        }, timeoutMs);

        try {
            console.log(`[VeilPay SDK] Micro-step 1: Dynamic engine import...`);
            const sdkModule = await import("@cofhe/sdk");

            // Defensively extract exports
            const sdk = (sdkModule as any).default || sdkModule;
            const CofheClientClass = sdk.CofheClient;
            const createClient = sdk.createCofhesdkClientBase;

            console.log(`[VeilPay SDK] Micro-step 2: Preparing safe storage...`);
            const memoryStore: Record<string, string> = {};
            const safeStorage = {
                getItem: (key: string) => {
                    try { if (typeof window !== 'undefined' && window.localStorage) return window.localStorage.getItem(key); } catch (e) {}
                    return memoryStore[key] || null;
                },
                setItem: (key: string, value: string) => {
                    try { if (typeof window !== 'undefined' && window.localStorage) { window.localStorage.setItem(key, value); return; } } catch (e) {}
                    memoryStore[key] = value;
                },
                removeItem: (key: string) => {
                    try { if (typeof window !== 'undefined' && window.localStorage) { window.localStorage.removeItem(key); return; } } catch (e) {}
                    delete memoryStore[key];
                }
            };

            const finalConfig = {
                network: this.config.network || "sepolia",
                kmsUrl: this.config.kmsUrl || DEFAULT_KMS_URL,
                rpcUrl: this.config.rpcUrl || DEFAULT_RPC_URL,
                fheKeyStorage: safeStorage
            };

            console.log(`[VeilPay SDK] Micro-step 3: Instantiating client...`);
            if (CofheClientClass) {
                globalClient = new CofheClientClass(finalConfig);
            } else if (createClient) {
                globalClient = createClient(finalConfig as any);
            } else {
                throw new Error("Unable to locate constructor in @cofhe/sdk.");
            }

            if (globalClient && typeof globalClient.init === "function") {
                console.log(`[VeilPay SDK] Micro-step 4: Final engine bootstrapping...`);
                await globalClient.init();
            }

            clearTimeout(timer);
            globalIsReady = true;
            console.log(`[VeilPay SDK v${VEILPAY_SDK_VERSION}] SUCCESS: FHE Engine is Online.`);
            resolve();
        } catch (error: any) {
            clearTimeout(timer);
            globalInitPromise = null;
            console.error(`[VeilPay SDK] FATAL ERROR during runtime init:`, error);
            reject(new VeilPayInitError(error.message || "Runtime Initialization Failed"));
        }
    });

    return globalInitPromise;
  }

  isClientReady(): boolean {
    return globalIsReady;
  }

  async encryptAmount(amount: number, decimals: number = 6): Promise<CoFHEStruct> {
    if (!globalIsReady) await this.init();
    if (!globalClient) throw new VeilPayEncryptionError("FHE Engine Offline.");
    const wei = BigInt(Math.floor(amount * Math.pow(10, decimals)));
    const result = await globalClient.encryptUint128(wei);
    return this.toStruct(result);
  }

  async encryptAddress(address: string): Promise<CoFHEStruct> {
    if (!globalIsReady) await this.init();
    if (!globalClient) throw new VeilPayEncryptionError("FHE Engine Offline.");
    const result = await globalClient.encryptAddress(address);
    return this.toStruct(result);
  }

  async generatePermit(contractAddress: string, provider: any): Promise<any> {
    if (!globalIsReady) await this.init();
    if (!globalClient) throw new VeilPayEncryptionError("FHE Engine Offline.");
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
      throw new VeilPayEncryptionError("Incomplete KMS struct returned.");
    }
    return result as CoFHEStruct;
  }
}
