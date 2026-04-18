import {defineConfig} from "vite";
import {hydrogen} from "@shopify/hydrogen/vite";
import {oxygen} from "@shopify/mini-oxygen/vite";
import {reactRouter} from "@react-router/dev/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
    plugins: [tailwindcss(), hydrogen(), oxygen(), reactRouter(), tsconfigPaths()],

    // -------------------------------------------------------------------------
    // DEPENDENCY RESOLUTION
    // -------------------------------------------------------------------------
    resolve: {
        // Force a single copy of React and React Router across all nested deps.
        // Without this, Vite's optimizer can produce multiple pre-bundled chunks
        // for the same package (different v= hashes), breaking hook invariants.
        dedupe: ["react", "react-dom", "react-router"]
    },

    // -------------------------------------------------------------------------
    // DEP OPTIMIZER
    // -------------------------------------------------------------------------
    optimizeDeps: {
        // Pre-bundle React once so Radix UI (CJS) and the app (ESM) share the
        // same chunk. Without this, Vite creates separate CJS-wrapped copies of
        // React for every package that uses require('react'), causing the
        // "Invalid hook call / two React copies" error in dev.
        include: ["react", "react-dom", "react/jsx-runtime"]
    },

    // -------------------------------------------------------------------------
    // BUILD OPTIONS
    // -------------------------------------------------------------------------
    build: {
        // Don't inline assets as base64 - this allows strict CSP headers
        // All assets are served as separate files with proper caching
        assetsInlineLimit: 0
    },

    // -------------------------------------------------------------------------
    // SSR OPTIONS
    // -------------------------------------------------------------------------
    ssr: {
        optimizeDeps: {
            /**
             * Include dependencies here if they throw CJS<>ESM errors.
             * For example, for the following error:
             *
             * > ReferenceError: module is not defined
             * >   at /Users/.../node_modules/example-dep/index.js:1:1
             *
             * Include 'example-dep' in the array below.
             * @see https://vitejs.dev/config/dep-optimization-options
             */
            include: [
                "set-cookie-parser",
                "cookie",
                "react-router",
                "use-sync-external-store/shim",
                "@radix-ui/react-use-is-hydrated"
            ]
        }
    },
    // -------------------------------------------------------------------------
    // DEV SERVER OPTIONS
    // -------------------------------------------------------------------------
    server: {
        // Allowed hosts for development server
        // - tryhydrogen.dev: Shopify's development environment
        // - ngrok: Required for Customer Account API OAuth flow
        allowedHosts: [".tryhydrogen.dev", "hermelinda-nonsegmentary-hettie.ngrok-free.dev"],
        // Dedicated HMR port avoids WebSocket conflicts with Hydrogen's dev server proxy
        hmr: {
            port: 24678
        }
    }
});
