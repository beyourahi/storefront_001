import {useAnalytics} from "@shopify/hydrogen";
import {useEffect} from "react";

export const GoogleTagManager = () => {
    const {subscribe, register} = useAnalytics();
    const {ready} = register("Google Tag Manager");

    useEffect(() => {
        subscribe("page_viewed", data => {
            window.dataLayer?.push({
                event: "page_view",
                page_location: data.url,
                page_title: document.title
            });
        });

        subscribe("product_viewed", data => {
            window.dataLayer?.push({
                event: "view_item",
                ecommerce: {
                    items: data.products?.map((product: Record<string, unknown>) => ({
                        item_id: product.id,
                        item_name: product.title,
                        item_variant: product.variantTitle,
                        price: parseFloat(String(product.price || "0")),
                        quantity: product.quantity
                    }))
                }
            });
        });

        subscribe("collection_viewed", data => {
            window.dataLayer?.push({
                event: "view_item_list",
                ecommerce: {
                    item_list_id: data.collection?.id,
                    item_list_name: data.collection?.handle
                }
            });
        });

        subscribe("cart_viewed", data => {
            const cart = data.cart as Record<string, unknown> | undefined;
            const cost = cart?.cost as Record<string, unknown> | undefined;
            const totalAmount = cost?.totalAmount as Record<string, unknown> | undefined;
            const lines = cart?.lines as Record<string, unknown> | undefined;
            const nodes = lines?.nodes as Record<string, unknown>[] | undefined;

            window.dataLayer?.push({
                event: "view_cart",
                ecommerce: {
                    currency: totalAmount?.currencyCode,
                    value: parseFloat(String(totalAmount?.amount || "0")),
                    items: nodes?.map(line => {
                        const merchandise = line.merchandise as Record<string, unknown> | undefined;
                        const product = merchandise?.product as Record<string, unknown> | undefined;
                        const lineCost = line.cost as Record<string, unknown> | undefined;
                        const lineTotal = lineCost?.totalAmount as Record<string, unknown> | undefined;

                        return {
                            item_id: product?.id,
                            item_name: product?.title,
                            item_variant: merchandise?.title,
                            price: parseFloat(String(lineTotal?.amount || "0")),
                            quantity: line.quantity
                        };
                    })
                }
            });
        });

        subscribe("cart_updated", data => {
            const prevCart = data.prevCart as Record<string, unknown> | undefined;
            const cart = data.cart as Record<string, unknown> | undefined;

            const prevLines = prevCart?.lines as Record<string, unknown> | undefined;
            const prevNodes = (prevLines?.nodes as Record<string, unknown>[]) || [];

            const currLines = cart?.lines as Record<string, unknown> | undefined;
            const currNodes = (currLines?.nodes as Record<string, unknown>[]) || [];

            const prevTotal = prevNodes.reduce((sum, l) => sum + (Number(l.quantity) || 0), 0);
            const currTotal = currNodes.reduce((sum, l) => sum + (Number(l.quantity) || 0), 0);

            const eventName = currTotal > prevTotal ? "add_to_cart" : "remove_from_cart";

            const cost = cart?.cost as Record<string, unknown> | undefined;
            const totalAmount = cost?.totalAmount as Record<string, unknown> | undefined;

            window.dataLayer?.push({
                event: eventName,
                ecommerce: {
                    currency: totalAmount?.currencyCode,
                    value: parseFloat(String(totalAmount?.amount || "0")),
                    items: currNodes.map(line => {
                        const merchandise = line.merchandise as Record<string, unknown> | undefined;
                        const product = merchandise?.product as Record<string, unknown> | undefined;
                        const lineCost = line.cost as Record<string, unknown> | undefined;
                        const lineTotal = lineCost?.totalAmount as Record<string, unknown> | undefined;

                        return {
                            item_id: product?.id,
                            item_name: product?.title,
                            item_variant: merchandise?.title,
                            price: parseFloat(String(lineTotal?.amount || "0")),
                            quantity: line.quantity
                        };
                    })
                }
            });
        });

        subscribe("search_viewed", data => {
            const searchResults = data.searchResults as Record<string, unknown> | undefined;

            window.dataLayer?.push({
                event: "search",
                search_term: data.searchTerm,
                search_results: searchResults?.totalResults || 0
            });
        });

        subscribe("custom_*" as Parameters<typeof subscribe>[0], data => {
            window.dataLayer?.push({
                event: "custom_event",
                ...data
            });
        });

        ready();
    }, [ready, subscribe]);

    return null;
};
