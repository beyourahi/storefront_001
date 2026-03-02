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
