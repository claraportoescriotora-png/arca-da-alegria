/**
 * useProductAccess
 *
 * Rules:
 * 1. Content NOT in any product → freely accessible (no gating applied here)
 * 2. Content in a product with requires_separate_purchase = false:
 *    → Active subscribers get access automatically (no issue if content already in subscription)
 *    → Non-subscribers/trial users need to buy the product
 * 3. Content in a product with requires_separate_purchase = true:
 *    → EVERYONE must buy this product (exclusive creator content, even for subscribers)
 *    → Active subscriber still bypasses if they own the product
 *
 * This design prevents contradiction when admin accidentally
 * puts existing subscription content into a product:
 * since requires_separate_purchase defaults to false, active subscribers
 * are NEVER blocked on it.
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthProvider';

export interface ProductInfo {
    id: string;
    title: string;
    payment_url: string;
    price_label: string | null;
    cover_url: string | null;
    requires_separate_purchase: boolean;
}

interface ProductAccessResult {
    loading: boolean;
    /** True if this content belongs to a product AND has requires_separate_purchase = true */
    isProductGated: boolean;
    /** True if the user can access the content (owns product, or gate doesn't apply to them) */
    hasAccess: boolean;
    /** The product info for CTA display (only set when actually gated) */
    product: ProductInfo | null;
}

// Runtime cache: content-key → cached result
const cache = new Map<string, Omit<ProductAccessResult, 'loading'>>();

export async function getProductAccess(
    contentType: string,
    contentId: string,
    user: any,
    profile: any,
    isAdmin: boolean
): Promise<Omit<ProductAccessResult, 'loading'>> {
    const cacheKey = `${contentType}:${contentId}:${user?.id ?? 'anon'}:${isAdmin}`;
    if (cache.has(cacheKey)) {
        return cache.get(cacheKey)!;
    }

    if (isAdmin) {
        const r = { isProductGated: false, hasAccess: true, product: null };
        cache.set(cacheKey, r);
        return r;
    }

    try {
        const { data: allProducts } = await supabase
            .from('products')
            .select('id, title, payment_url, price_label, cover_url, content, requires_separate_purchase')
            .eq('is_active', true);

        if (!allProducts || allProducts.length === 0) {
            const r = { isProductGated: false, hasAccess: true, product: null };
            cache.set(cacheKey, r);
            return r;
        }

        const matchingProduct = allProducts.find((p) => {
            const items: { type: string; id: string }[] = Array.isArray(p.content) ? p.content : [];
            return items.some((item) => item.type === contentType && item.id === contentId);
        });

        if (!matchingProduct) {
            const r = { isProductGated: false, hasAccess: true, product: null };
            cache.set(cacheKey, r);
            return r;
        }

        const productInfo: ProductInfo = {
            id: matchingProduct.id,
            title: matchingProduct.title,
            payment_url: matchingProduct.payment_url,
            price_label: matchingProduct.price_label,
            cover_url: matchingProduct.cover_url,
            requires_separate_purchase: matchingProduct.requires_separate_purchase ?? false,
        };

        if (!productInfo.requires_separate_purchase && profile?.subscription_status === 'active') {
            const r = { isProductGated: false, hasAccess: true, product: null };
            cache.set(cacheKey, r);
            return r;
        }

        if (!user) {
            const r = { isProductGated: true, hasAccess: false, product: productInfo };
            cache.set(cacheKey, r);
            return r;
        }

        const { data: ownership } = await supabase
            .from('user_products')
            .select('id')
            .eq('user_id', user.id)
            .eq('product_id', matchingProduct.id)
            .maybeSingle();

        const r = {
            isProductGated: true,
            hasAccess: !!ownership,
            product: productInfo,
        };
        cache.set(cacheKey, r);
        return r;
    } catch (e) {
        console.error('getProductAccess error:', e);
        return { isProductGated: false, hasAccess: true, product: null };
    }
}

import { isContentLocked, DripRequirement } from '@/lib/drip';

/**
 * Utility to asynchronously determine if an item is locked by either drip or premium gating.
 */
export async function checkIsItemLocked(
    contentType: string,
    contentId: string,
    user: any,
    profile: any,
    isAdmin: boolean,
    dripReq: DripRequirement
): Promise<boolean> {
    const pAccess = await getProductAccess(contentType, contentId, user, profile, isAdmin);
    const isPremiumLocked = pAccess.isProductGated && !pAccess.hasAccess;
    const { isLocked: isDripLocked } = isContentLocked(profile?.created_at, dripReq);
    return isPremiumLocked || isDripLocked;
}

export function useProductAccess(contentType: string, contentId: string): ProductAccessResult {
    const { user, profile, isAdmin } = useAuth();
    const [loading, setLoading] = useState(true);
    const [result, setResult] = useState<Omit<ProductAccessResult, 'loading'>>({
        isProductGated: false,
        hasAccess: true,
        product: null,
    });

    useEffect(() => {
        if (!contentId || !contentType) {
            setLoading(false);
            return;
        }

        let mounted = true;
        setLoading(true);

        getProductAccess(contentType, contentId, user, profile, isAdmin).then((r) => {
            if (mounted) {
                setResult(r);
                setLoading(false);
            }
        });

        return () => { mounted = false; };
    }, [contentType, contentId, user?.id, profile?.subscription_status, isAdmin]);

    return { loading, ...result };
}

/** Call after a product purchase is confirmed to refresh access state */
export function clearProductAccessCache() {
    cache.clear();
}
