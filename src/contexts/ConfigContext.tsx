import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface VideoBanner {
    id: string;
    image_url: string;
    link_url: string;
}

interface ConfigContextType {
    logoUrl: string;
    webhookToken: string;
    subscriptionWebhookSecret: string;
    videoBanners: VideoBanner[];
    loading: boolean;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export function ConfigProvider({ children }: { children: React.ReactNode }) {
    const [logoUrl, setLogoUrl] = useState<string>(''); // Start empty to prevent flicker
    const [faviconUrl, setFaviconUrl] = useState<string>(''); // Start empty
    const [webhookToken, setWebhookToken] = useState<string>('');
    const [subscriptionWebhookSecret, setSubscriptionWebhookSecret] = useState<string>('');
    const [videoBanners, setVideoBanners] = useState<VideoBanner[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchConfig();
    }, []);

    useEffect(() => {
        const link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
        if (link) {
            link.href = faviconUrl;
        } else {
            const newLink = document.createElement('link');
            newLink.rel = 'icon';
            newLink.href = faviconUrl;
            document.head.appendChild(newLink);
        }
    }, [faviconUrl]);

    const fetchConfig = async () => {
        try {
            const { data, error } = await supabase
                .from('app_config')
                .select('key, value')
                .in('key', ['logo_url', 'favicon_url', 'video_banners', 'webhook_token', 'subscription_webhook_secret']);

            if (data) {
                const logo = data.find(item => item.key === 'logo_url');
                const favicon = data.find(item => item.key === 'favicon_url');
                const banners = data.find(item => item.key === 'video_banners');

                if (logo) setLogoUrl(logo.value);
                if (favicon) setFaviconUrl(favicon.value);

                const webhook = data.find(item => item.key === 'webhook_token');
                const subSecret = data.find(item => item.key === 'subscription_webhook_secret');

                if (webhook) setWebhookToken(webhook.value);
                if (subSecret) setSubscriptionWebhookSecret(subSecret.value);

                if (banners && banners.value) {
                    try {
                        const parsedBanners = typeof banners.value === 'string' ? JSON.parse(banners.value) : banners.value;
                        setVideoBanners(Array.isArray(parsedBanners) ? parsedBanners : []);
                    } catch (e) {
                        console.error('Failed to parse video banners:', e);
                        setVideoBanners([]);
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching config:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ConfigContext.Provider value={{ logoUrl, webhookToken, subscriptionWebhookSecret, videoBanners, loading }}>
            {children}
        </ConfigContext.Provider>
    );
}

export const useConfig = () => {
    const context = useContext(ConfigContext);
    if (context === undefined) {
        throw new Error('useConfig must be used within a ConfigProvider');
    }
    return context;
};
