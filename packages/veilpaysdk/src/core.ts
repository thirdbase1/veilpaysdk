import { VeilPayInitError, VeilPayEncryptionError } from "./errors";

export interface CoFHEStruct {
  ctHash: string | bigint;
  securityZone: number;
  utype: number;
  signature: string;
}

// GLOBAL SINGLETON STATE:
// This ensures that initialization only ever happens ONCE across the entire
// application life-cycle, even during concurrent React renders or SSR.
let globalClient: any = null;
let globalInitPromise: Promise<void> | null = null;
let globalIsReady = false;

/**
 * PRODUCTION-GRADE Fhenix CoFHE Wrapper for VeilPay
 * Handles:
 * 1. Server-side localStorage crash fix
 * 2. Asynchronous initialization (init() method)
 * 3. Type-safe encryption for uint128 and addresses
 * 4. Validation of contract-ready structs
 * 5. ULTRA-LAZY & CONCURRENT-SAFE initialization
 */
export class VeilPayCoFHE {
  private network: string;

  constructor(network: "sepolia" | "mainnet" = "sepolia") {
    this.network = network;
    // CONSTRUCTOR IS 100% SIDE-EFFECT FREE.
    // Zero calls to any @cofhe/sdk or environment-sensitive logic.
  }

  /**
   * Initializes the internal WASM and KMS keys.
   * MUST be called and awaited before any encryption.
   * Uses a global singleton pattern to be 100% safe in Next.js/React.
   */
  async init(): Promise<void> {
    if (globalIsReady) return;
    if (globalInitPromise) return globalInitPromise;

    globalInitPromise = (async () => {
      try {
        // DYNAMIC IMPORT: Completely prevents @cofhe/sdk from loading
        // during static analysis or prerendering phases.
        const { createCofhesdkClientBase } = await import("@cofhe/sdk");

        const memoryStorageInstance = this.getMemoryStorage();

        // ULTRA-ROBUST STORAGE WRAPPER:
        // Guaranteed to exist and never crash, even if window/localStorage is partially defined.
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

        // Initialize the client ONLY once at runtime.
        globalClient = createCofhesdkClientBase({
          fheKeyStorage: safeStorage,
        } as any);

        // Explicitly trigger internal initialization of the @cofhe/sdk engine
        if (typeof globalClient.init === "function") {
          await globalClient.init();
        }

        globalIsReady = true;
        console.log("[VeilPay SDK] CoFHE Global Singleton initialized successfully.");
      } catch (error: any) {
        globalInitPromise = null; // Reset promise so user can retry on failure
        throw new VeilPayInitError(error.message || "CoFHE Initialization Failed");
      }
    })();

    return globalInitPromise;
  }

  /**
   * Checks if the client is fully initialized and ready to encrypt.
   */
  isClientReady(): boolean {
    return globalIsReady;
  }

  /**
   * Encrypts a number (USDC/Amount) for InEuint128 contract input.
   */
  async encryptAmount(amount: number, decimals: number = 6): Promise<CoFHEStruct> {
    await this.ensureReady();
    const wei = BigInt(Math.floor(amount * Math.pow(10, decimals)));
    const result = await globalClient.encryptUint128(wei);
    return this.toStruct(result);
  }

  /**
   * Encrypts an Ethereum address for InEaddress contract input.
   */
  async encryptAddress(address: string): Promise<CoFHEStruct> {
    await this.ensureReady();
    const result = await globalClient.encryptAddress(address);
    return this.toStruct(result);
  }

  /**
   * Generates a CoFHE permit for viewing encrypted data.
   */
  async generatePermit(contractAddress: string, provider: any): Promise<any> {
    await this.ensureReady();
    try {
      return await globalClient.generatePermit(contractAddress, provider);
    } catch (error: any) {
      throw new VeilPayEncryptionError(`Permit generation failed: ${error.message}`);
    }
  }

  /**
   * Validates if an object is a complete CoFHE struct required by the contract.
   */
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
      console.warn("[VeilPay SDK] Auto-initializing...");
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
