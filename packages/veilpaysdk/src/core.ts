import { VeilPayInitError, VeilPayEncryptionError } from "./errors";

export interface CoFHEStruct {
  ctHash: string | bigint;
  securityZone: number;
  utype: number;
  signature: string;
}

// GLOBAL SINGLETON STATE
let globalClient: any = null;
let globalInitPromise: Promise<void> | null = null;
let globalIsReady = false;

/**
 * PRODUCTION-GRADE Fhenix CoFHE Wrapper for VeilPay (v1.3.0)
 *
 * v1.3.0 FEATURES:
 * 1. Build-Time Gating: Prevents crashes during 'next build' / Prerendering.
 * 2. Ultra-Lazy Initialization: Only loads @cofhe/sdk at runtime.
 * 3. Concurrent-Safe: Shared global promise prevents race conditions.
 * 4. Safe Storage Fallback: Bulletproof memory fallback for Node.js/SSR.
 */
export class VeilPayCoFHE {
  private network: string;

  constructor(network: "sepolia" | "mainnet" = "sepolia") {
    this.network = network;
  }

  /**
   * Initializes the internal WASM and KMS keys.
   * GATED: Resolves silently during Next.js build/prerender to prevent crashes.
   */
  async init(): Promise<void> {
    if (globalIsReady) return;
    if (globalInitPromise) return globalInitPromise;

    // DETECT BUILD ENVIRONMENT:
    // If we are in a Next.js build phase (Prerendering), we MUST NOT load @cofhe/sdk.
    const isNextBuild =
        typeof process !== 'undefined' &&
        (process.env.NEXT_PHASE === 'phase-production-build' || process.env.IS_NEXT_BUILD === 'true');

    // DETECT SERVER-SIDE RENDERING:
    const isSSR = typeof window === 'undefined';

    // If we are in a build/prerender phase, we resolve early.
    // This allows the build to finish while the actual encryption happens only in the browser.
    if (isNextBuild && isSSR) {
        console.log("[VeilPay SDK] Build phase detected. Skipping CoFHE load to prevent crash.");
        return Promise.resolve();
    }

    globalInitPromise = (async () => {
      try {
        // DYNAMIC IMPORT: Shield build-time analysis from environment-sensitive code.
        const sdkModule = await import("@cofhe/sdk");

        // Handle different export patterns (default vs named)
        const createClient = sdkModule.createCofhesdkClientBase || (sdkModule as any).default?.createCofhesdkClientBase;

        if (!createClient) {
            throw new Error("Could not find createCofhesdkClientBase in @cofhe/sdk");
        }

        const memoryStorageInstance = this.getMemoryStorage();

        // ULTRA-ROBUST STORAGE WRAPPER
        const safeStorage = {
          getItem: (key: string) => {
            try {
              if (typeof window !== 'undefined' && window.localStorage) {
                return window.localStorage.getItem(key);
              }
            } catch (e) {}
            return memoryStorageInstance.getItem(key);
          },
          setItem: (key: string, value: string) => {
            try {
              if (typeof window !== 'undefined' && window.localStorage) {
                window.localStorage.setItem(key, value);
                return;
              }
            } catch (e) {}
            memoryStorageInstance.setItem(key, value);
          },
          removeItem: (key: string) => {
            try {
              if (typeof window !== 'undefined' && window.localStorage) {
                window.localStorage.removeItem(key);
                return;
              }
            } catch (e) {}
            memoryStorageInstance.removeItem(key);
          }
        };

        // Initialize the client once at runtime.
        globalClient = createClient({
          fheKeyStorage: safeStorage,
        } as any);

        if (typeof globalClient.init === "function") {
          await globalClient.init();
        }

        globalIsReady = true;
        console.log("[VeilPay SDK] CoFHE Global Singleton initialized successfully.");
      } catch (error: any) {
        globalInitPromise = null;
        console.error("[VeilPay SDK] Initialization failed:", error);
        throw new VeilPayInitError(error.message || "CoFHE Initialization Failed");
      }
    })();

    return globalInitPromise;
  }

  isClientReady(): boolean {
    return globalIsReady;
  }

  async encryptAmount(amount: number, decimals: number = 6): Promise<CoFHEStruct> {
    await this.ensureReady();
    if (!globalClient) {
        throw new VeilPayEncryptionError("SDK called during build/SSR. Encryption is only available at runtime.");
    }
    const wei = BigInt(Math.floor(amount * Math.pow(10, decimals)));
    const result = await globalClient.encryptUint128(wei);
    return this.toStruct(result);
  }

  async encryptAddress(address: string): Promise<CoFHEStruct> {
    await this.ensureReady();
    if (!globalClient) {
        throw new VeilPayEncryptionError("SDK called during build/SSR. Encryption is only available at runtime.");
    }
    const result = await globalClient.encryptAddress(address);
    return this.toStruct(result);
  }

  async generatePermit(contractAddress: string, provider: any): Promise<any> {
    await this.ensureReady();
    if (!globalClient) {
        throw new VeilPayEncryptionError("SDK called during build/SSR. Permits are only available at runtime.");
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

  private async ensureReady() {
    if (!globalIsReady) {
      await this.init();
    }
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
      setItem: (key: string, value: string) => {
        memoryStorage[key] = value;
      },
      removeItem: (key: string) => {
        delete memoryStorage[key];
      },
    };
  }
}
