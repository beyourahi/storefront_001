import {useMemo} from "react";
import {Link} from "react-router";
import {CartForm} from "@shopify/hydrogen";
import type {CurrencyCode} from "@shopify/hydrogen/customer-account-api-types";
import {ArrowRight} from "lucide-react";
import {Button} from "~/components/ui/button";
import {Carousel, CarouselContent, CarouselItem} from "~/components/ui/carousel";
import {WheelGesturesPlugin} from "embla-carousel-wheel-gestures";
import {ProductCard} from "~/components/display/ProductCard";
import {fromOrderHistoryProduct} from "~/lib/product/product-card-normalizers";
import {STORE_FORMAT_LOCALE} from "~/lib/store-locale";

type OrderLineItem = {
    id: string;
    title: string;
    quantity: number;
    image?: {
        url: string;
        altText?: string | null;
    } | null;
    variant?: {
        id: string;
        availableForSale: boolean;
    } | null;
    price?: {
        amount: string;
        currencyCode: CurrencyCode;
    } | null;
};

type Order = {
    id: string;
    name: string;
    number: number;
    processedAt: string;
    lineItems?: {
        nodes: OrderLineItem[];
    };
};

type ExtractedProduct = {
    id: string;
    title?: string;
    name?: string;
    handle?: string | null;
    image: {
        url: string;
        altText?: string | null;
    } | null;
    variantId: string | null;
    price: {
        amount: string;
        currencyCode: CurrencyCode;
    } | null;
    orderNumber: string | number;
    orderDate: string;
};

type OrderHistorySectionProps =
    | {
          orders: Order[];
          products?: never;
      }
    | {
          orders?: never;
          products: ExtractedProduct[];
      };

export const OrderHistorySection = ({orders, products}: OrderHistorySectionProps) => {
    let productsFromOrders: Array<{
        id: string;
        handle: string;
        title: string;
        image: {
            url: string;
            altText?: string | null;
        };
        variant: {
            id: string;
            availableForSale: boolean;
        };
        price?: {
            amount: string;
            currencyCode: CurrencyCode;
        } | null;
        orderNumber: number;
        orderDate: string;
    }>;

    if (products) {
        productsFromOrders = products
            .filter(p => p.image?.url && p.variantId && p.handle)
            .map(p => ({
                id: p.id,
                handle: p.handle!,
                title: p.title || p.name || "Product",
                image: {
                    url: p.image!.url,
                    altText: p.image!.altText
                },
                variant: {
                    id: p.variantId!,
                    availableForSale: true
                },
                price: p.price,
                orderNumber: typeof p.orderNumber === "number" ? p.orderNumber : parseInt(p.orderNumber, 10) || 0,
                orderDate: p.orderDate
            }));
    } else if (orders) {
        if (!orders || orders.length === 0) return null;

        productsFromOrders = orders.flatMap(order => {
            const lineItems = order.lineItems?.nodes ?? [];
            return lineItems
                .filter(item => item.image?.url && item.variant?.id)
                .map(item => ({
                    id: item.id,
                    handle: "",
                    title: item.title,
                    image: item.image!,
                    variant: item.variant!,
                    price: item.price,
                    orderNumber: order.number,
                    orderDate: order.processedAt
                }));
        });
    } else {
        return null;
    }

    productsFromOrders = productsFromOrders.filter(product => Boolean(product.handle));

    if (productsFromOrders.length === 0) return null;

    return (
        <section className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="mb-0 font-serif text-2xl font-medium text-foreground md:text-3xl lg:text-4xl">
                    Order History
                </h2>
                <Button variant="link" asChild className="group hidden text-primary sm:inline-flex">
                    <Link viewTransition to="/account/orders" className="flex items-center gap-1.5">
                        View All Orders
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                </Button>
            </div>

            <Carousel
                opts={{
                    align: "start",
                    loop: true,
                    dragFree: true
                }}
                plugins={[WheelGesturesPlugin()]}
                className="w-full"
            >
                <CarouselContent className="-ml-2 md:-ml-3">
                    {productsFromOrders.slice(0, 16).map((product, index) => (
                        <CarouselItem
                            key={`${product.id}-${product.orderNumber}-${product.orderDate}-${product.variant.id}`}
                            className="basis-[80%] pl-2 sm:basis-[45%] md:pl-3 lg:basis-[32%] xl:basis-[27%] 2xl:basis-[22%]"
                        >
                            <OrderProductCard product={product} index={index} />
                        </CarouselItem>
                    ))}
                </CarouselContent>
            </Carousel>

            <div className="flex justify-center sm:hidden">
                <Button variant="outline" asChild>
                    <Link viewTransition to="/account/orders">View All Orders</Link>
                </Button>
            </div>
        </section>
    );
};

type OrderProduct = {
    id: string;
    handle: string;
    title: string;
    image: {
        url: string;
        altText?: string | null;
    };
    variant: {
        id: string;
        availableForSale: boolean;
    };
    price?: {
        amount: string;
        currencyCode: CurrencyCode;
    } | null;
    orderNumber: number;
    orderDate: string;
};

const OrderProductCard = ({product, index}: {product: OrderProduct; index: number}) => {
    const normalizedProduct = useMemo(() => fromOrderHistoryProduct(product), [product]);
    const formattedPrice = useMemo(() => {
        const amount = Number(normalizedProduct.priceRange.minVariantPrice.amount || 0);
        const currencyCode = normalizedProduct.priceRange.minVariantPrice.currencyCode || "USD";

        try {
            return new Intl.NumberFormat(STORE_FORMAT_LOCALE, {
                style: "currency",
                currency: currencyCode
            }).format(amount);
        } catch {
            return normalizedProduct.priceRange.minVariantPrice.amount;
        }
    }, [normalizedProduct]);

    const formattedDate = new Date(product.orderDate).toLocaleDateString(STORE_FORMAT_LOCALE, {
        month: "short",
        day: "numeric",
        year: "numeric"
    });

    return (
        <div className="space-y-3" style={{animationDelay: `${index * 50}ms`}}>
            <ProductCard product={normalizedProduct} />

            <div className="space-y-2 px-0.5">
                <div className="flex items-baseline justify-between gap-2">
                    <p className="text-sm font-semibold text-foreground">{formattedPrice}</p>
                    <p className="text-xs text-muted-foreground">#{product.orderNumber}</p>
                </div>
                <p className="text-xs text-muted-foreground">{formattedDate}</p>

                <CartForm
                    route="/cart"
                    action={CartForm.ACTIONS.LinesAdd}
                    inputs={{
                        lines: [
                            {
                                merchandiseId: product.variant.id,
                                quantity: 1
                            }
                        ]
                    }}
                >
                    {fetcher => (
                        <Button
                            type="submit"
                            variant="outline"
                            size="sm"
                            className="w-full"
                            disabled={!product.variant.availableForSale || fetcher.state !== "idle"}
                        >
                            {fetcher.state !== "idle" ? "Adding..." : "Buy Again"}
                        </Button>
                    )}
                </CartForm>
            </div>
        </div>
    );
};
