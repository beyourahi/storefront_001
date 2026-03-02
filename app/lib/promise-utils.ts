export class TimeoutError extends Error {
    constructor(
        message: string,
        public readonly timeoutMs: number
    ) {
        super(message);
        this.name = "TimeoutError";
    }
}

export function withTimeout<T>(promise: Promise<T>, timeoutMs: number = 10000, errorMessage?: string): Promise<T> {
    return Promise.race([
        promise,
        new Promise<never>((_, reject) => {
            setTimeout(() => {
                reject(new TimeoutError(errorMessage || `Promise timed out after ${timeoutMs}ms`, timeoutMs));
            }, timeoutMs);
        })
    ]);
}

export function withTimeoutAndFallback<T, F>(
    promise: Promise<T>,
    fallback: F,
    timeoutMs: number = 10000
): Promise<T | F> {
    return withTimeout(promise, timeoutMs).catch(error => {
        if (error instanceof TimeoutError) {
            console.warn(`[Promise Timeout] ${error.message}`);
        } else {
            console.warn("[Promise Error]", error);
        }
        return fallback;
    });
}

export const TIMEOUT_DEFAULTS = {
    CART: 10000,
    AUTH: 5000,
    STORE_CREDIT: 5000,
    API: 8000
} as const;
