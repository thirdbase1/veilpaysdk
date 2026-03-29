import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { VeilPayCoFHE, VeilPayConfig } from './core';

export interface UseVeilPayResult {
    sdk: VeilPayCoFHE | null;
    isReady: boolean;
    error: string | null;
}

// ------------------------------------------------------------------
// GLOBAL CONTEXT FOR THE SDK
// ------------------------------------------------------------------
const VeilPayContext = createContext<UseVeilPayResult | undefined>(undefined);

/**
 * THE VEILPAY PROVIDER (The "Master Wrapper")
 * Wrap your entire app in this to handle ALL heavy lifting automatically.
 */
export function VeilPayProvider({ children, config }: { children: React.ReactNode, config?: VeilPayConfig }) {
    const sdkInstance = useMemo(() => new VeilPayCoFHE(config || 'sepolia'), [config]);
    const [state, setState] = useState<UseVeilPayResult>({ sdk: sdkInstance, isReady: false, error: null });

    useEffect(() => {
        let isMounted = true;
        const autoInit = async () => {
            try {
                await sdkInstance.init();
                if (isMounted) setState(prev => ({ ...prev, isReady: true }));
            } catch (err: any) {
                if (isMounted) setState(prev => ({ ...prev, error: err.message || "Boot failed" }));
            }
        };
        autoInit();
        return () => { isMounted = false; };
    }, [sdkInstance]);

    return (
        <VeilPayContext.Provider value={state}>
            {children}
        </VeilPayContext.Provider>
    );
}

/**
 * THE MASTER HOOK: useVeilPay
 * Your site just calls this one hook to get EVERYTHING.
 */
export function useVeilPay() {
    const context = useContext(VeilPayContext);
    if (!context) throw new Error("useVeilPay must be used within a VeilPayProvider");
    return context;
}

/**
 * LEGACY COMPATIBILITY HOOK: useVeilPayCoFHE
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
                if (isMounted) { setSdk(sdkInstance); setIsReady(true); }
            } catch (err: any) {
                if (isMounted) setError(err.message || "Initialization failed.");
            }
        };
        initSdk();
        return () => { isMounted = false; };
    }, [sdkInstance]);

    return { sdk, isReady, error };
}

/**
 * BUILDATHON HOOK: useEncrypt (The Translator)
 */
export function useEncrypt() {
    const { sdk, isReady, error } = useVeilPay();

    const encrypt = async (value: any, type: 'uint128' | 'address') => {
        if (error) throw new Error(`FHE Offline: ${error}`);
        if (!sdk || !isReady) throw new Error("SDK Warming Up...");

        if (type === 'uint128') return await sdk.encryptAmount(Number(value));
        if (type === 'address') return await sdk.encryptAddress(String(value));
        throw new Error("Unsupported type");
    };

    return { encrypt, isReady, error };
}

/**
 * BUILDATHON HOOK: useWrite (The Messenger)
 */
export function useWrite(contract: any) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const write = async (methodName: string, args: any[]) => {
        setIsSubmitting(true);
        setError(null);
        try {
            const tx = await contract[methodName](...args);
            return await tx.wait();
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
