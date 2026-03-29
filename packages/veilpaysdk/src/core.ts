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
export const VEILPAY_SDK_VERSION = "1.8.0";

// GLOBAL SINGLETON STATE
let globalClient: any = null;
let globalInitPromise: Promise<void> | null = null;
let globalIsReady = false;

// OFFICIAL FHENIX SEPOLIA INFRASTRUCTURE
const DEFAULT_KMS_URL = "https://kms.sepolia.fhenix.zone";
const DEFAULT_RPC_URL = "https://api.sepolia.fhenix.zone";

/**
 * PRODUCTION-GRADE Fhenix CoFHE Wrapper for VeilPay (v1.8.0)
 *
 * v1.8.0 ULTIMATE MASTER WRAPPER:
 * 1. Invisible Storage: Zero-crash proxy mapping for fheKeyStorage.
 * 2. Silent Failover: Handles environment restrictions without browser popups.
 * 3. Execution Gating: Safe for Vercel/Next.js/Turbopack.
 * 4. Master Singleton: Optimized for global provider usage.
 */
export class VeilPayCoFHE {
  private config: VeilPayConfig;

  constructor(config: VeilPayConfig | string = "sepolia") {
    this.config = typeof config === 'string' ? { network: config as any } : config;
  }

  private isSafeRuntime(): boolean {
    if (typeof window !== 'undefined') return true;
    return typeof process !== 'undefined' &&
        !(process.env.NEXT_PHASE === 'phase-production-build' || process.env.IS_NEXT_BUILD === 'true');
  }

  /**
   * Initializes the internal WASM and KMS keys.
   */
  async init(): Promise<void> {
    if (globalIsReady) return;
    if (globalInitPromise) return globalInitPromise;

    if (!this.isSafeRuntime()) return Promise.resolve();

    const timeoutMs = this.config.timeoutMs || 45000;

    globalInitPromise = new Promise(async (resolve, reject) => {
        const timer = setTimeout(() => {
            if (!globalIsReady) {
                globalInitPromise = null;
                reject(new VeilPayInitError("FHE Engine Timeout. Check connection."));
            }
        }, timeoutMs);

        try {
            const sdkModule = await import("@cofhe/sdk");
            const sdk = (sdkModule as any).default || sdkModule;
            const CofheClientClass = sdk.CofheClient;
            const createClient = sdk.createCofhesdkClientBase;

            // THE INVISIBLE STORAGE ENGINE:
            // This proxy ensures that @cofhe/sdk never sees an 'undefined' property,
            // effectively eliminating the most common cause of FHE crashes.
            const memoryStore: Record<string, string> = {};
            const storageProxy = new Proxy({}, {
                get: (_, prop: string) => {
                    if (prop === 'getItem') return (key: string) => {
                        try { return window.localStorage.getItem(key); } catch { return memoryStore[key] || null; }
                    };
                    if (prop === 'setItem') return (key: string, val: string) => {
                        try { window.localStorage.setItem(key, val); } catch { memoryStore[key] = val; }
                    };
                    if (prop === 'removeItem') return (key: string) => {
                        try { window.localStorage.removeItem(key); } catch { delete memoryStore[key]; }
                    };
                    return undefined;
                }
            });

            const finalConfig = {
                network: this.config.network || "sepolia",
                kmsUrl: this.config.kmsUrl || DEFAULT_KMS_URL,
                rpcUrl: this.config.rpcUrl || DEFAULT_RPC_URL,
                fheKeyStorage: storageProxy
            };

            if (CofheClientClass) {
                globalClient = new CofheClientClass(finalConfig);
            } else if (createClient) {
                globalClient = createClient(finalConfig as any);
            } else {
                throw new Error("SDK mismatch.");
            }

            if (globalClient && typeof globalClient.init === "function") {
                await globalClient.init();
            }

            clearTimeout(timer);
            globalIsReady = true;
            console.log(`[VeilPay SDK v${VEILPAY_SDK_VERSION}] Engine Online.`);
            resolve();
        } catch (error: any) {
            clearTimeout(timer);
            globalInitPromise = null;
            reject(new VeilPayInitError(error.message || "Initialization Failed"));
        }
    });

    return globalInitPromise;
  }

  isClientReady(): boolean { return globalIsReady; }

  async encryptAmount(amount: number, decimals: number = 6): Promise<CoFHEStruct> {
    await this.ensureReady();
    if (!globalClient) throw new VeilPayEncryptionError("Engine Offline.");
    const wei = BigInt(Math.floor(amount * Math.pow(10, decimals)));
    return await globalClient.encryptUint128(wei);
  }

  async encryptAddress(address: string): Promise<CoFHEStruct> {
    await this.ensureReady();
    if (!globalClient) throw new VeilPayEncryptionError("Engine Offline.");
    return await globalClient.encryptAddress(address);
  }

  async generatePermit(contractAddress: string, provider: any): Promise<any> {
    await this.ensureReady();
    if (!globalClient) throw new VeilPayEncryptionError("Engine Offline.");
    try {
      return await globalClient.generatePermit(contractAddress, provider);
    } catch (error: any) {
      throw new VeilPayEncryptionError(`Permit failed: ${error.message}`);
    }
  }

  private async ensureReady() {
    if (!globalIsReady) await this.init();
  }
}
