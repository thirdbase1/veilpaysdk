import { useState, useEffect, useMemo } from 'react';
import { VeilPayCoFHE } from './core';

export interface UseVeilPayResult {
    sdk: VeilPayCoFHE | null;
    isReady: boolean;
    error: string | null;
}

/**
 * PRODUCTION-GRADE React Hook for VeilPay CoFHE
 * Main entry point for initializing the FHE engine.
 */
export function useVeilPayCoFHE(config: any = 'sepolia'): UseVeilPayResult {
    const [sdk, setSdk] = useState<VeilPayCoFHE | null>(null);
    const [isReady, setIsReady] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const sdkInstance = useMemo(() => new VeilPayCoFHE(config), [config]);

    useEffect(() => {
        let isMounted = true;
        const initSdk = async () => {
            try {
                await sdkInstance.init();
                if (isMounted) {
                    setSdk(sdkInstance);
                    setIsReady(true);
                }
            } catch (err: any) {
                if (isMounted) {
                    setError(err.message || "Initialization failed.");
                }
            }
        };
        initSdk();
        return () => { isMounted = false; };
    }, [sdkInstance]);

    return { sdk, isReady, error };
}

/**
 * BUILDATHON HOOK: useEncrypt (The Translator)
 * Translates plaintext amounts into confidential structs.
 */
export function useEncrypt() {
    const { sdk, isReady, error } = useVeilPayCoFHE();

    const encrypt = async (value: any, type: 'uint128' | 'address') => {
        if (error) throw new Error(`FHE Offline: ${error}`);
        if (!sdk || !isReady) throw new Error("CoFHE Engine not ready yet...");

        if (type === 'uint128') return await sdk.encryptAmount(Number(value));
        if (type === 'address') return await sdk.encryptAddress(String(value));
        throw new Error("Unsupported encryption type");
    };

    return { encrypt, isReady, error };
}

/**
 * BUILDATHON HOOK: useWrite (The Messenger)
 * Handles the contract submission and MetaMask lifecycle.
 */
export function useWrite(contract: any) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const write = async (methodName: string, args: any[]) => {
        setIsSubmitting(true);
        setError(null);
        try {
            console.log(`[VeilPay SDK] Preparing transaction: ${methodName}...`);
            const tx = await contract[methodName](...args);
            const receipt = await tx.wait();
            return receipt;
        } catch (err: any) {
            setError(err.message);
            throw err;
        } finally {
            setIsSubmitting(false);
        }
    };

    return { write, isSubmitting, error };
}

/**
 * BUILDATHON HOOK: useDecrypt (The Observer)
 * Monitors the Fhenix Coprocessor for the async result.
 */
export function useDecrypt(veilPayContract: any) {
    const [isDecrypting, setIsDecrypting] = useState(false);

    const decrypt = async (requestId: string) => {
        setIsDecrypting(true);
        try {
            return await veilPayContract.waitForResolution(requestId);
        } finally {
            setIsDecrypting(false);
        }
    };

    return { decrypt, isDecrypting };
}
