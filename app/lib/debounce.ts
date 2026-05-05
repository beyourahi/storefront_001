/**
 * Creates a debounced version of a function that delays invocation until after
 * `delay` ms have elapsed since the last call. Cancels any pending invocation on
 * each new call, so only the final call in a burst is executed.
 *
 * @param fn - Function to debounce
 * @param delay - Debounce delay in milliseconds
 * @returns Debounced function with the same signature as `fn`
 */
export const debounce = <T extends unknown[]>(fn: (...args: T) => void, delay: number): ((...args: T) => void) => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    return (...args: T) => {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }

        timeoutId = setTimeout(() => {
            fn(...args);
            timeoutId = null;
        }, delay);
    };
};
