import {useEffect, useState} from "react";

export interface NetworkStatus {
    isOnline: boolean;
}

const isBrowser = typeof window !== "undefined";

export const useNetworkStatus = (): NetworkStatus => {
    const [isOnline, setIsOnline] = useState(() => {
        if (!isBrowser) return true;
        return navigator.onLine;
    });

    useEffect(() => {
        if (!isBrowser) return;

        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    return {isOnline};
};
