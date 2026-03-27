import { type CofhesdkClient, createCofhesdkClientBase } from "@cofhe/sdk";
import { VeilPayInitError, VeilPayEncryptionError } from "./errors";

export interface CoFHEStruct {
  ctHash: string | bigint;
  securityZone: number;
  utype: number;
  signature: string;
}

/**
 * PRODUCTION-GRADE Fhenix CoFHE Wrapper for VeilPay
 * Handles:
 * 1. Server-side localStorage crash fix
 * 2. Asynchronous initialization (init() method)
 * 3. Type-safe encryption for uint128 and addresses
 * 4. Validation of contract-ready structs
 */
export class VeilPayCoFHE {
  private client: CofhesdkClient;
  private isReady = false;
  private initPromise: Promise<void> | null = null;

  constructor(_network: "sepolia" | "mainnet" = "sepolia") {
    // ROBUST ENVIRONMENT DETECTION:
    // Some browsers or server environments hide window/localStorage.
    // We always provide a fallback to prevent the 'fheKeyStorage' error.
    let storageOptions;
    try {
        if (typeof window !== 'undefined' && window.localStorage) {
            storageOptions = window.localStorage;
        } else {
            storageOptions = this.getMemoryStorage();
        }
    } catch (e) {
        storageOptions = this.getMemoryStorage();
    }

    // Use the base factory function for cross-environment support
    // (Note: @cofhe/sdk default is sepolia; network is handled internally)
    this.client = createCofhesdkClientBase({
      fheKeyStorage: storageOptions,
    } as any) as CofhesdkClient;
  }

  /**
   * Initializes the internal WASM and KMS keys.
   * MUST be called and awaited before any encryption.
   * Caches the promise to avoid redundant initialization attempts.
   */
  async init(): Promise<void> {
    if (this.isReady) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      try {
        // Many versions of @cofhe/sdk require explicit init
        if (typeof (this.client as any).init === "function") {
          await (this.client as any).init();
        }
        this.isReady = true;
        console.log("[VeilPay SDK] CoFHE Client initialized successfully.");
      } catch (error: any) {
        this.initPromise = null; // Reset promise so user can retry
        throw new VeilPayInitError(error.message);
      }
    })();

    return this.initPromise;
  }

  /**
   * Checks if the client is fully initialized and ready to encrypt.
   */
  isClientReady(): boolean {
    return this.isReady;
  }

  /**
   * Encrypts a number (USDC/Amount) for InEuint128 contract input.
   * @param amount The numeric value (in units, e.g., 20)
   * @param decimals The decimals (defaults to 6 for USDC)
   */
  async encryptAmount(amount: number, decimals: number = 6): Promise<CoFHEStruct> {
    await this.ensureReady();
    const wei = BigInt(Math.floor(amount * Math.pow(10, decimals)));
    const result = await (this.client as any).encryptUint128(wei);
    return this.toStruct(result);
  }

  /**
   * Encrypts an Ethereum address for InEaddress contract input.
   */
  async encryptAddress(address: string): Promise<CoFHEStruct> {
    await this.ensureReady();
    const result = await (this.client as any).encryptAddress(address);
    return this.toStruct(result);
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
    if (!this.isReady) {
      console.warn("[VeilPay SDK] Not ready, attempting auto-init...");
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
