/// <reference types="vite/client" />
/// <reference types="react-router" />
/// <reference types="@shopify/oxygen-workers-types" />
/// <reference types="@shopify/hydrogen/react-router-types" />

declare global {
    interface Env {
        PUBLIC_GTM_CONTAINER_ID?: string;
    }

    interface Window {
        dataLayer?: Array<Record<string, unknown>>;
    }
}

export {};
