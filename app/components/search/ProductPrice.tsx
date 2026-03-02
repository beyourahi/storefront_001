import {formatShopifyMoney} from "~/lib/product/currency";

type Money = {
    amount: string;
    currencyCode: string;
};

type ProductPriceProps = {
    price: Money;
    maxPrice?: Money;
};

export function ProductPrice({price, maxPrice}: ProductPriceProps) {
    if (!maxPrice || maxPrice.amount === price.amount) {
        return <>{formatShopifyMoney(price)}</>;
    }

    return (
        <>
            {formatShopifyMoney(price)} - {formatShopifyMoney(maxPrice)}
        </>
    );
}
