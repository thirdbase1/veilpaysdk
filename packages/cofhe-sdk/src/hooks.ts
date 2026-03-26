import { useState, useEffect, useMemo } from 'react';
import { BlindPayCoFHE } from './core';

export interface UseBlindPayResult {
    sdk: BlindPayCoFHE | null;
    isReady: boolean;
    error: string | null;
}

/**
 * PRODUCTION-GRADE React Hook for BlindPay CoFHE
 * Handles:
 * 1. Safe singleton initialization of the BlindPayCoFHE SDK.
 * 2. Asynchronous await for internal KMS and WASM state.
 * 3. Error state for UI feedback.
 * 4. Automatic "isReady" flag for UI components (buttons, loaders).
 */
export function useBlindPayCoFHE(network: 'sepolia' | 'mainnet' = 'sepolia'): UseBlindPayResult {
    const [sdk, setSdk] = useState<BlindPayCoFHE | null>(null);
    const [isReady, setIsReady] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Ensure we only create the instance once
    const sdkInstance = useMemo(() => new BlindPayCoFHE(network), [network]);

    useEffect(() => {
        let isMounted = true;

        const initSdk = async () => {
            try {
                // Wait for the SDK to perform its internal setup (KMS, WASM, Storage)
                await sdkInstance.init();

                if (isMounted) {
                    setSdk(sdkInstance);
                    setIsReady(true);
                    console.log("[BlindPay SDK] Ready for encryption.");
                }
            } catch (err: any) {
                console.error("[BlindPay SDK] Hook Error:", err);
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
