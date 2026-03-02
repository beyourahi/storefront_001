import {SkeletonGrid} from "~/components/common/SkeletonGrid";

type ProductSkeletonsProps = {
    count?: number;
    itemType?: "product" | "collection";
};

export const ProductSkeletons = ({count = 8, itemType = "product"}: ProductSkeletonsProps) => {
    return <SkeletonGrid layout="product-grid" count={count} itemType={itemType} />;
};
