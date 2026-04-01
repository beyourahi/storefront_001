import {useEffect, useState} from "react";
import {Script, useNonce} from "@shopify/hydrogen";

interface GtmScriptProps {
    gtmContainerId: string;
}

export const GtmScript = ({gtmContainerId}: GtmScriptProps) => {
    const nonce = useNonce();
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    // Validate container ID format to prevent script injection via malicious env values
    if (!gtmContainerId || !isClient || !/^GTM-[A-Z0-9]+$/.test(gtmContainerId)) return null;

    return (
        <>
            <Script
                nonce={nonce}
                dangerouslySetInnerHTML={{
                    __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','${gtmContainerId}');`
                }}
            />
            <noscript>
                <iframe
                    title="Google Tag Manager"
                    src={`https://www.googletagmanager.com/ns.html?id=${gtmContainerId}`}
                    height="0"
                    width="0"
                    style={{display: "none", visibility: "hidden"}}
                />
            </noscript>
        </>
    );
};
