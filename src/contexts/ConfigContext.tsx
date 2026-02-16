import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface ConfigContextType {
    logoUrl: string;
    loading: boolean;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export function ConfigProvider({ children }: { children: React.ReactNode }) {
    const [logoUrl, setLogoUrl] = useState<string>(''); // Start empty to prevent flicker
    const [faviconUrl, setFaviconUrl] = useState<string>(''); // Start empty
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
                .in('key', ['logo_url', 'favicon_url']);

            if (data) {
                const logo = data.find(item => item.key === 'logo_url');
                const favicon = data.find(item => item.key === 'favicon_url');

                if (logo) setLogoUrl(logo.value);
                if (favicon) setFaviconUrl(favicon.value);
            }
        } catch (error) {
            console.error('Error fetching config:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ConfigContext.Provider value={{ logoUrl, loading }}>
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
