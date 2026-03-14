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

        const cacheKey = `${contentType}:${contentId}:${user?.id ?? 'anon'}:${isAdmin}`;
        if (cache.has(cacheKey)) {
            setResult(cache.get(cacheKey)!);
            setLoading(false);
            return;
        }

        const check = async () => {
            setLoading(true);

            // ─── ADMIN BYPASS ──────────────────────────────────────────────
            if (isAdmin) {
                const r = { isProductGated: false, hasAccess: true, product: null };
                cache.set(cacheKey, r);
                setResult(r);
                setLoading(false);
                return;
            }
            try {
                // 1. Find any product containing this content item
                const { data: allProducts } = await supabase
                    .from('products')
                    .select('id, title, payment_url, price_label, cover_url, content, requires_separate_purchase')
                    .eq('is_active', true);

                if (!allProducts || allProducts.length === 0) {
                    const r = { isProductGated: false, hasAccess: true, product: null };
                    cache.set(cacheKey, r);
                    setResult(r);
                    return;
                }

                const matchingProduct = allProducts.find((p) => {
                    const items: { type: string; id: string }[] = Array.isArray(p.content) ? p.content : [];
                    return items.some((item) => item.type === contentType && item.id === contentId);
                });

                // Content is not in any product → no extra gating
                if (!matchingProduct) {
                    const r = { isProductGated: false, hasAccess: true, product: null };
                    cache.set(cacheKey, r);
                    setResult(r);
                    return;
                }

                const productInfo: ProductInfo = {
                    id: matchingProduct.id,
                    title: matchingProduct.title,
                    payment_url: matchingProduct.payment_url,
                    price_label: matchingProduct.price_label,
                    cover_url: matchingProduct.cover_url,
                    requires_separate_purchase: matchingProduct.requires_separate_purchase ?? false,
                };

                // ─── Key fix: requires_separate_purchase = false ───────────────────
                // Product doesn't require a separate purchase from subscribers.
                // Active subscribers get access automatically — prevents contradiction
                // when existing subscription content is accidentally added to a product.
                if (!productInfo.requires_separate_purchase && profile?.subscription_status === 'active') {
                    const r = { isProductGated: false, hasAccess: true, product: null };
                    cache.set(cacheKey, r);
                    setResult(r);
                    return;
                }

                // At this point either:
                //   a) requires_separate_purchase = true (exclusive creator content), OR
                //   b) user is not an active subscriber (trial/pending)
                // → Check if user has purchased this specific product

                if (!user) {
                    const r = { isProductGated: true, hasAccess: false, product: productInfo };
                    cache.set(cacheKey, r);
                    setResult(r);
                    return;
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
                setResult(r);
            } catch (e) {
                console.error('useProductAccess error:', e);
                // Fail open — never block content on error
                setResult({ isProductGated: false, hasAccess: true, product: null });
            } finally {
                setLoading(false);
            }
        };

        check();
    }, [contentType, contentId, user?.id, profile?.subscription_status, isAdmin]);

    return { loading, ...result };
}

/** Call after a product purchase is confirmed to refresh access state */
export function clearProductAccessCache() {
    cache.clear();
}
