/**
 * @fileoverview Server-Side Affinity Scoring
 * Re-ranks collection product nodes based on customer order history.
 * Gracefully degrades to original order for anonymous users.
 */

export type AffinitySignal = {
    productId: string;
    purchaseCount: number;
    lastPurchasedAt?: string;
};

export type ScoredProduct<T extends {id: string}> = T & {_affinityScore: number};

/**
 * Re-rank a product list by affinity score derived from purchase signals.
 * Products with no matching signal receive a score of 0 and fall to the bottom.
 * Products with more purchases (and a recent purchase date) score higher.
 */
export function scoreProducts<T extends {id: string}>(products: T[], signals: AffinitySignal[]): ScoredProduct<T>[] {
    const signalMap = new Map<string, AffinitySignal>(signals.map(s => [s.productId, s]));

    return products
        .map(p => {
            const signal = signalMap.get(p.id);
            const score = signal ? signal.purchaseCount + (signal.lastPurchasedAt ? 1 : 0) : 0;
            return {...p, _affinityScore: score};
        })
        .sort((a, b) => b._affinityScore - a._affinityScore);
}

/**
 * Aggregate raw order line items into per-product affinity signals.
 * Multiple lines for the same product are merged: quantities accumulate and
 * the most recent `processedAt` date is kept.
 */
export function extractAffinitySignals(
    orderLines: Array<{productId: string; quantity: number; processedAt?: string}>
): AffinitySignal[] {
    const byProduct = new Map<string, AffinitySignal>();
    for (const line of orderLines) {
        const existing = byProduct.get(line.productId);
        if (existing) {
            existing.purchaseCount += line.quantity;
            if (line.processedAt && (!existing.lastPurchasedAt || line.processedAt > existing.lastPurchasedAt)) {
                existing.lastPurchasedAt = line.processedAt;
            }
        } else {
            byProduct.set(line.productId, {
                productId: line.productId,
                purchaseCount: line.quantity,
                lastPurchasedAt: line.processedAt
            });
        }
    }
    return Array.from(byProduct.values());
}
