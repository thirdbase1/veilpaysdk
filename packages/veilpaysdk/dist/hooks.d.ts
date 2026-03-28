import { VeilPayCoFHE } from './core';
export interface UseVeilPayResult {
    sdk: VeilPayCoFHE | null;
    isReady: boolean;
    error: string | null;
}
/**
 * PRODUCTION-GRADE React Hook for VeilPay CoFHE
 * Handles:
 * 1. Safe singleton initialization of the VeilPayCoFHE SDK.
 * 2. Asynchronous await for internal KMS and WASM state.
 * 3. Error state for UI feedback.
 * 4. Automatic "isReady" flag for UI components (buttons, loaders).
 */
export declare function useVeilPayCoFHE(config?: any): UseVeilPayResult;
//# sourceMappingURL=hooks.d.ts.map