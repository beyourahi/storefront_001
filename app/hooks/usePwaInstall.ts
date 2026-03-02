import {useState, useEffect, useRef} from "react";
import {isAppMarkedAsInstalled, setAppInstalled} from "~/lib/pwa-storage";

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{outcome: "accepted" | "dismissed"}>;
}

interface ManifestData {
    name?: string;
    short_name?: string;
    icons?: Array<{src: string; sizes: string; type?: string}>;
}

interface UsePwaInstallReturn {
    canInstall: boolean;
    isIOS: boolean;
    isDesktop: boolean;
    isStandalone: boolean;
    isAppDetectedAsInstalled: boolean;
    isInstalling: boolean;
    appName: string | null;
    appIcon: string | null;
    triggerInstall: () => Promise<void>;
}

declare global {
    interface Window {
        __pwaInstallPromptEvent?: BeforeInstallPromptEvent;
        dataLayer?: Array<Record<string, unknown>>;
    }
    interface Navigator {
        standalone?: boolean;
        getInstalledRelatedApps?: () => Promise<Array<{platform: string}>>;
    }
}

const trackEvent = (event: string, data?: Record<string, unknown>): void => {
    if (typeof window !== "undefined" && window.dataLayer) {
        window.dataLayer.push({event, ...data});
    }
};

const detectIOSDevice = (): boolean => {
    if (typeof window === "undefined") return false;
    const ua = navigator.userAgent;
    return /iPad|iPhone|iPod/.test(ua) && !("MSStream" in window);
};

const detectStandaloneMode = (): boolean => {
    if (typeof window === "undefined") return false;
    const matchesStandalone = window.matchMedia("(display-mode: standalone)").matches;
    const iosStandalone = navigator.standalone === true;
    return matchesStandalone || iosStandalone;
};

const getPlatform = (): "ios" | "android" | "desktop" => {
    if (typeof window === "undefined") return "desktop";
    const ua = navigator.userAgent;
    if (/iPad|iPhone|iPod/.test(ua)) return "ios";
    if (/Android/.test(ua)) return "android";
    return "desktop";
};

export const usePwaInstall = (): UsePwaInstallReturn => {
    const [canInstall, setCanInstall] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [isDesktop, setIsDesktop] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);
    const [isAppDetectedAsInstalled, setIsAppDetectedAsInstalled] = useState(false);
    const [isInstalling, setIsInstalling] = useState(false);
    const [appName, setAppName] = useState<string | null>(null);
    const [appIcon, setAppIcon] = useState<string | null>(null);

    const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);

    useEffect(() => {
        if (typeof window === "undefined") return;

        const iosDevice = detectIOSDevice();
        const standalone = detectStandaloneMode();
        const desktop = getPlatform() === "desktop";

        setIsIOS(iosDevice);
        setIsDesktop(desktop);
        setIsStandalone(standalone);

        if (standalone) {
            trackEvent("pwa_launched_standalone");
        }

        if (standalone) return;

        const wasInstalledBefore = isAppMarkedAsInstalled();
        if (wasInstalledBefore) {
            setIsAppDetectedAsInstalled(true);
        }

        if (navigator.getInstalledRelatedApps) {
            navigator
                .getInstalledRelatedApps()
                .then(apps => {
                    const isInstalled = apps.some(app => app.platform === "webapp");
                    if (isInstalled) {
                        setIsAppDetectedAsInstalled(true);
                        setAppInstalled();
                    }
                })
                .catch(() => {
                    //
                });
        }

        fetch("/manifest.webmanifest")
            .then(res => {
                if (!res.ok) throw new Error("Manifest not found");
                return res.json() as Promise<ManifestData>;
            })
            .then(manifest => {
                setAppName(manifest.name || manifest.short_name || null);
                const icon = manifest.icons?.find(i => i.sizes === "192x192");
                if (icon) {
                    setAppIcon(icon.src);
                }
            })
            .catch(() => {
                //
            });

        const handleBeforeInstall = (e: Event) => {
            e.preventDefault();
            deferredPromptRef.current = e as BeforeInstallPromptEvent;
            setCanInstall(true);
        };

        if (window.__pwaInstallPromptEvent) {
            deferredPromptRef.current = window.__pwaInstallPromptEvent;
            setCanInstall(true);
            delete window.__pwaInstallPromptEvent;
        }

        window.addEventListener("beforeinstallprompt", handleBeforeInstall);

        const handleAppInstalled = () => {
            const platform = getPlatform();
            setAppInstalled();
            setCanInstall(false);
            setIsStandalone(true);
            setIsAppDetectedAsInstalled(true);
            trackEvent("pwa_app_installed", {
                platform,
                source: "appinstalled_event"
            });
        };

        window.addEventListener("appinstalled", handleAppInstalled);

        return () => {
            window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
            window.removeEventListener("appinstalled", handleAppInstalled);
        };
    }, []);

    const triggerInstall = async () => {
        if (!deferredPromptRef.current) {
            return;
        }

        setIsInstalling(true);

        try {
            await deferredPromptRef.current.prompt();
            const {outcome} = await deferredPromptRef.current.userChoice;
            const platform = getPlatform();

            if (outcome === "accepted") {
                trackEvent("pwa_installed", {platform});
            } else {
                trackEvent("pwa_install_prompt_dismissed", {platform});
            }
        } catch (err) {
            console.error("[PWA] Install prompt error:", err);
        } finally {
            deferredPromptRef.current = null;
            setCanInstall(false);
            setIsInstalling(false);
        }
    };

    return {
        canInstall,
        isIOS,
        isDesktop,
        isStandalone,
        isAppDetectedAsInstalled,
        isInstalling,
        appName,
        appIcon,
        triggerInstall
    };
};
