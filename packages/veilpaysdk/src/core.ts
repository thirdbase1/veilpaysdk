import { VeilPayInitError, VeilPayEncryptionError } from "./errors";

export interface CoFHEStruct {
  ctHash: string | bigint;
  securityZone: number;
  utype: number;
  signature: string;
}

// SDK METADATA
export const VEILPAY_SDK_VERSION = "1.4.0";

// GLOBAL SINGLETON STATE
let globalClient: any = null;
let globalInitPromise: Promise<void> | null = null;
let globalIsReady = false;

/**
 * PRODUCTION-GRADE Fhenix CoFHE Wrapper for VeilPay (v1.4.0)
 *
 * v1.4.0 FEATURES:
 * 1. Bulletproof Gating: Multi-signal detection for Next.js build workers.
 * 2. Version Verification: Exported VEILPAY_SDK_VERSION for debugging.
 * 3. Graceful No-Op: Prevents crashes if called during SSR/Build.
 * 4. Zero Module Side-Effects: Safe to import anywhere.
 */
export class VeilPayCoFHE {
  private network: string;

  constructor(network: "sepolia" | "mainnet" = "sepolia") {
    this.network = network;
    // CONSTRUCTOR IS 100% SIDE-EFFECT FREE.
  }

  /**
   * Returns true if we are in a safe runtime environment (Browser or Live Node).
   * Returns false if we are in a Build Worker or restricted SSR.
   */
  private isSafeRuntime(): boolean {
    if (typeof window !== 'undefined') return true;

    // Check for Next.js build signals
    const isNextBuild =
        typeof process !== 'undefined' &&
        (process.env.NEXT_PHASE === 'phase-production-build' ||
         process.env.IS_NEXT_BUILD === 'true' ||
         process.env.NODE_ENV === 'production' && !process.env.VERCEL_URL); // Common build worker pattern

    return !isNextBuild;
  }

  /**
   * Initializes the internal WASM and KMS keys.
   * GATED: Physically skips loading @cofhe/sdk during static builds.
   */
  async init(): Promise<void> {
    if (globalIsReady) return;
    if (globalInitPromise) return globalInitPromise;

    if (!this.isSafeRuntime()) {
        console.log(`[VeilPay SDK v${VEILPAY_SDK_VERSION}] Build/SSR detected. Dormant mode active.`);
        return Promise.resolve();
    }

    globalInitPromise = (async () => {
      try {
        // DYNAMIC IMPORT Barrier
        const sdkModule = await import("@cofhe/sdk");
        const createClient = sdkModule.createCofhesdkClientBase || (sdkModule as any).default?.createCofhesdkClientBase;

        if (!createClient) {
            throw new Error("Invalid @cofhe/sdk export structure.");
        }

        const memoryStorageInstance = this.getMemoryStorage();

        // ULTRA-DEFENSIVE STORAGE
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

        globalClient = createClient({ fheKeyStorage: safeStorage } as any);

        if (typeof globalClient.init === "function") {
          await globalClient.init();
        }

        globalIsReady = true;
        console.log(`[VeilPay SDK v${VEILPAY_SDK_VERSION}] Initialized successfully.`);
      } catch (error: any) {
        globalInitPromise = null;
        throw new VeilPayInitError(error.message || "Initialization Failed");
      }
    })();

    return globalInitPromise;
  }

  isClientReady(): boolean {
    return globalIsReady;
  }

  async encryptAmount(amount: number, decimals: number = 6): Promise<CoFHEStruct> {
    if (!globalIsReady) await this.init();
    if (!globalClient) {
        throw new VeilPayEncryptionError("SDK is in dormant mode (Build/SSR). Encryption requires a live environment.");
    }
    const wei = BigInt(Math.floor(amount * Math.pow(10, decimals)));
    const result = await globalClient.encryptUint128(wei);
    return this.toStruct(result);
  }

  async encryptAddress(address: string): Promise<CoFHEStruct> {
    if (!globalIsReady) await this.init();
    if (!globalClient) {
        throw new VeilPayEncryptionError("SDK is in dormant mode (Build/SSR). Encryption requires a live environment.");
    }
    const result = await globalClient.encryptAddress(address);
    return this.toStruct(result);
  }

  async generatePermit(contractAddress: string, provider: any): Promise<any> {
    if (!globalIsReady) await this.init();
    if (!globalClient) {
        throw new VeilPayEncryptionError("SDK is in dormant mode (Build/SSR). Permits require a live environment.");
    }
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
