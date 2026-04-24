import {Image} from "@shopify/hydrogen";
import {CommandGroup, CommandGroupHeading, CommandItem} from "~/components/ui/command";
import {formatShopifyMoney} from "~/lib/product/currency";
import {parseProductTitle} from "~/lib/product";

type ShopifyMoney = {
    amount: string;
    currencyCode: string;
};

type ShopifyImage = {
    url: string;
    altText: string | null;
};

type SearchProduct = {
    id: string;
    title: string;
    handle: string;
    priceRange?: {
        minVariantPrice: ShopifyMoney;
        maxVariantPrice?: ShopifyMoney;
    };
    variants?: {
        edges: {node: {compareAtPrice: ShopifyMoney | null}}[];
    };
    images?: {
        edges: {node: ShopifyImage}[];
    };
};

type SearchProductGroupProps = {
    products: SearchProduct[];
    onProductClick: (product: SearchProduct, event?: React.MouseEvent) => void;
};

const getProductMainImage = (product: SearchProduct): ShopifyImage | null => {
    return product.images?.edges?.[0]?.node ?? null;
};

export const SearchProductGroup = ({products, onProductClick}: SearchProductGroupProps) => {
    return (
        <CommandGroup>
            <CommandGroupHeading>Products</CommandGroupHeading>
            {products.map(product => {
                const productImage = getProductMainImage(product);
                return (
                    <CommandItem
                        key={product.id}
                        className="py-2"
                        onClick={e => onProductClick(product, e)}
                    >
                        <div className="flex w-full items-center justify-between">
                            <div className="flex min-w-0 flex-1 items-center gap-3">
                                {productImage ? (
                                    <div className="bg-muted relative h-10 w-10 shrink-0 overflow-hidden rounded-sm">
                                        <Image
                                            data={{url: productImage.url, altText: product.title}}
                                            sizes="40px"
                                            aspectRatio="1/1"
                                            loading="lazy"
                                            className="h-full w-full object-cover"
                                        />
                                    </div>
                                ) : (
                                    <div className="bg-muted flex h-10 w-10 shrink-0 items-center justify-center rounded-sm">
                                        <span className="text-muted-foreground pointer-events-none text-xs">
                                            &#128230;
                                        </span>
                                    </div>
                                )}
                                <div className="min-w-0 flex-1">
                                    {(() => {
                                        const {primary, secondary} = parseProductTitle(product.title);
                                        return (
                                            <div className="truncate text-left">
                                                <p className="text-sm font-medium">{primary}</p>
                                                {secondary && (
                                                    <p className="opacity-50 text-xs font-normal">{secondary}</p>
                                                )}
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>
                            {product.priceRange?.minVariantPrice && (
                                <div className="ml-2 shrink-0 text-right">
                                    <div className="text-primary font-mono text-xs font-medium lg:text-[11px]">
                                        <span className="sr-only">Price: </span>
                                        {formatShopifyMoney(product.priceRange.minVariantPrice)}
                                    </div>
                                    {product.priceRange?.maxVariantPrice &&
                                        product.variants?.edges?.[0]?.node?.compareAtPrice && (
                                            <div className="text-muted-foreground font-mono text-xs line-through lg:text-[11px]">
                                                <span className="sr-only">Was: </span>
                                                {formatShopifyMoney(product.variants.edges[0].node.compareAtPrice)}
                                            </div>
                                        )}
                                </div>
                            )}
                        </div>
                    </CommandItem>
                );
            })}
        </CommandGroup>
    );
};
