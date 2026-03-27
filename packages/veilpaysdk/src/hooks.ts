import { useState, useEffect, useMemo } from 'react';
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
export function useVeilPayCoFHE(config: any = 'sepolia'): UseVeilPayResult {
    const [sdk, setSdk] = useState<VeilPayCoFHE | null>(null);
    const [isReady, setIsReady] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Ensure we only create the instance once
    const sdkInstance = useMemo(() => new VeilPayCoFHE(config), [config]);

    useEffect(() => {
        let isMounted = true;

        const initSdk = async () => {
            try {
                // Wait for the SDK to perform its internal setup (KMS, WASM, Storage)
                await sdkInstance.init();

                if (isMounted) {
                    setSdk(sdkInstance);
                    setIsReady(true);
                    console.log("[VeilPay SDK] Ready for encryption.");
                }
            } catch (err: any) {
                console.error("[VeilPay SDK] Hook Error:", err);
                if (isMounted) {
                    setError(err.message || "Initialization failed.");
                }
            }
        };

        initSdk();

        return () => {
            isMounted = false;
        };
    }, [sdkInstance]);

    return { sdk, isReady, error };
}
