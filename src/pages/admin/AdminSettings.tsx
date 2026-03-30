import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save, Image as ImageIcon, Plus, Trash2, Link as LinkIcon, Images, Check, Clock } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { useConfig } from "@/contexts/ConfigContext";



export function AdminSettings() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [trialDays, setTrialDays] = useState<number>(7);
    const [savingTrial, setSavingTrial] = useState(false);
    const { toast } = useToast();
    const [formData, setFormData] = useState({
        logo_url: '',
        favicon_url: '',
        webhook_token: '',
        subscription_webhook_secret: '',
        google_tag_manager_id: ''
    });
    const [videoBanners, setVideoBanners] = useState<{ id: string, image_url: string, link_url: string }[]>([]);

    useEffect(() => {
        fetchConfigs();
    }, []);

    const fetchConfigs = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('app_config')
                .select('key, value')
                .in('key', ['logo_url', 'favicon_url', 'video_banners', 'webhook_token', 'subscription_webhook_secret', 'google_tag_manager_id']);

            if (error) throw error;

            const initialForm = {
                logo_url: '',
                favicon_url: '',
                webhook_token: '',
                subscription_webhook_secret: '',
                google_tag_manager_id: ''
            };
            if (data) {
                const logo = data.find(item => item.key === 'logo_url');
                const favicon = data.find(item => item.key === 'favicon_url');
                const webhook = data.find(item => item.key === 'webhook_token');
                const subSecret = data.find(item => item.key === 'subscription_webhook_secret');
                const gtm = data.find(item => item.key === 'google_tag_manager_id');
                const banners = data.find(item => item.key === 'video_banners');

                if (logo) initialForm.logo_url = logo.value;
                if (favicon) initialForm.favicon_url = favicon.value;
                if (webhook) initialForm.webhook_token = webhook.value;
                if (subSecret) initialForm.subscription_webhook_secret = subSecret.value;
                if (gtm) initialForm.google_tag_manager_id = gtm.value;
                if (banners && banners.value) {
                    try {
                        const parsed = typeof banners.value === 'string' ? JSON.parse(banners.value) : banners.value;
                        setVideoBanners(Array.isArray(parsed) ? parsed : []);
                    } catch (e) { console.error(e) }
                }
            }

            setFormData(initialForm);

            // Fetch trial config
            const { data: trialData } = await supabase
                .from('trial_config')
                .select('trial_days')
                .limit(1)
                .single();
            if (trialData?.trial_days) setTrialDays(trialData.trial_days);
        } catch (error: any) {
            console.error('Error fetching settings:', error);
            toast({ variant: "destructive", title: "Erro ao carregar configurações" });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Upsert logo_url
            const { error: logoError } = await supabase
                .from('app_config')
                .upsert(
                    { key: 'logo_url', value: formData.logo_url },
                    { onConflict: 'key' }
                );
            if (logoError) throw logoError;

            // Upsert favicon_url
            const { error: faviconError } = await supabase
                .from('app_config')
                .upsert(
                    { key: 'favicon_url', value: formData.favicon_url },
                    { onConflict: 'key' }
                );
            if (faviconError) throw faviconError;

            // Upsert webhook_token
            const { error: webhookError } = await supabase
                .from('app_config')
                .upsert(
                    { key: 'webhook_token', value: (formData as any).webhook_token },
                    { onConflict: 'key' }
                );
            if (webhookError) throw webhookError;

            // Upsert subscription_webhook_secret
            const { error: subSecretError } = await supabase
                .from('app_config')
                .upsert(
                    { key: 'subscription_webhook_secret', value: (formData as any).subscription_webhook_secret },
                    { onConflict: 'key' }
                );
            if (subSecretError) throw subSecretError;

            // Upsert google_tag_manager_id
            const { error: gtmError } = await supabase
                .from('app_config')
                .upsert(
                    { key: 'google_tag_manager_id', value: formData.google_tag_manager_id },
                    { onConflict: 'key' }
                );
            if (gtmError) throw gtmError;

            // Upsert video_banners
            const { error: bannersError } = await supabase
                .from('app_config')
                .upsert(
                    { key: 'video_banners', value: JSON.stringify(videoBanners) },
                    { onConflict: 'key' }
                );
            if (bannersError) throw bannersError;

            toast({ title: "Configurações salvas com sucesso!" });

            // Force a reload so ConfigContext updates everywhere (it only fetches on mount)
            setTimeout(() => {
                window.location.reload();
            }, 1000);

        } catch (error: any) {
            console.error('Error saving settings:', error);
            toast({ variant: "destructive", title: "Erro ao salvar", description: error.message });
        } finally {
            setSaving(false);
        }
    };

    const handleSaveTrial = async () => {
        const days = Number(trialDays);
        if (isNaN(days) || days < 1 || days > 365) {
            toast({ variant: 'destructive', title: 'Valor inválido', description: 'Digite um número entre 1 e 365.' });
            return;
        }
        setSavingTrial(true);
        try {
            const { error } = await supabase
                .from('trial_config')
                .update({ trial_days: days })
                .eq('id', 1);
            if (error) throw error;
            toast({ title: 'Dias de trial atualizados!' });
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Erro ao salvar', description: e.message });
        } finally {
            setSavingTrial(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl">
            <div className="mb-8">
                <h2 className="text-2xl font-bold font-fredoka text-slate-800">Configurações Globais</h2>
                <p className="text-slate-500">Ajuste as marcas visuais e preferências gerais do aplicativo.</p>
            </div>

            <div className="space-y-8">
                {/* Trial Config Section */}
                <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex items-center gap-3 bg-amber-50/50">
                        <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
                            <Clock className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-slate-800">Período de Acesso Gratuito</h3>
                            <p className="text-slate-500 text-sm">Configure quantos dias o usuário tem de trial grátis ao se cadastrar.</p>
                        </div>
                    </div>
                    <div className="p-6 flex items-end gap-4">
                        <div className="flex-1 max-w-xs">
                            <Label htmlFor="trial_days" className="text-sm font-medium text-slate-700 mb-2 block">
                                Dias de acesso gratuito
                            </Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    id="trial_days"
                                    type="number"
                                    min={1}
                                    max={365}
                                    value={trialDays}
                                    onChange={(e) => setTrialDays(Number(e.target.value))}
                                    className="w-28 text-center text-lg font-bold"
                                />
                                <span className="text-slate-500 text-sm">dias</span>
                            </div>
                        </div>
                        <Button onClick={handleSaveTrial} disabled={savingTrial} className="bg-amber-500 hover:bg-amber-600 text-white">
                            {savingTrial ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                            Salvar
                        </Button>
                    </div>
                </section>

                {/* Branding Section */}

                <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
                        <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                            <ImageIcon className="w-5 h-5" />
                        </div>
                        <h3 className="font-bold text-lg text-slate-800">Identidade Visual</h3>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Logo Link */}
                        <div className="space-y-4">
                            <Label className="text-base text-slate-700 font-semibold">URL da Logo (Home e Login)</Label>
                            <p className="text-sm text-slate-500">Insira o link direto para a imagem (PNG transparente recomendado).</p>

                            <div className="flex gap-6 items-start">
                                <div className="flex-1">
                                    <Input
                                        placeholder="https://..."
                                        value={formData.logo_url}
                                        onChange={e => setFormData({ ...formData, logo_url: e.target.value })}
                                        className="bg-slate-50"
                                    />
                                </div>
                                <div className="w-32 h-32 bg-slate-100 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center p-2">
                                    {formData.logo_url ? (
                                        <img src={formData.logo_url} alt="Logo Preview" className="w-full h-full object-contain" onError={(e) => (e.currentTarget.style.display = 'none')} />
                                    ) : (
                                        <span className="text-xs text-slate-400 text-center">Pré-visualização da Logo</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <hr className="border-slate-100" />

                        {/* Favicon Link */}
                        <div className="space-y-4">
                            <Label className="text-base text-slate-700 font-semibold">URL do Favicon (Ícone do Navegador)</Label>

                            <div className="flex gap-6 items-start">
                                <div className="flex-1">
                                    <Input
                                        placeholder="https://..."
                                        value={formData.favicon_url}
                                        onChange={e => setFormData({ ...formData, favicon_url: e.target.value })}
                                        className="bg-slate-50"
                                    />
                                </div>
                                <div className="w-16 h-16 bg-slate-100 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center">
                                    {formData.favicon_url ? (
                                        <img src={formData.favicon_url} alt="Favicon Preview" className="w-8 h-8 object-contain" onError={(e) => (e.currentTarget.style.display = 'none')} />
                                    ) : (
                                        <span className="text-[10px] text-slate-400 text-center">Favicon</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
                        <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white min-w-32">
                            {saving ? (
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : (
                                <Save className="w-4 h-4 mr-2" />
                            )}
                            Salvar Alterações
                        </Button>
                    </div>
                </section>

                {/* Banners Section */}
                <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-fuchsia-100 rounded-lg text-fuchsia-600">
                                <Images className="w-5 h-5" />
                            </div>
                            <h3 className="font-bold text-lg text-slate-800">Banners de Vídeos</h3>
                        </div>
                        <Button
                            onClick={() => setVideoBanners([...videoBanners, { id: Date.now().toString(), image_url: '', link_url: '' }])}
                            variant="outline" size="sm" className="text-blue-600 border-blue-200 hover:bg-blue-50"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Adicionar Banner
                        </Button>
                    </div>

                    <div className="p-6 space-y-6">
                        {videoBanners.length === 0 ? (
                            <div className="text-center py-8 text-slate-500 text-sm border-2 border-dashed border-slate-200 rounded-xl">
                                Nenhum banner configurado. Clique em "Adicionar Banner" para começar.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {videoBanners.map((banner, index) => (
                                    <div key={banner.id} className="p-4 border border-slate-200 rounded-xl bg-slate-50 relative flex gap-4">
                                        <div className="w-32 h-16 bg-slate-200 rounded-lg overflow-hidden flex-shrink-0 relative">
                                            {banner.image_url ? (
                                                <img src={banner.image_url} alt="Banner" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                                            ) : (
                                                <div className="absolute inset-0 flex items-center justify-center text-[10px] text-slate-400">Sem Capa</div>
                                            )}
                                        </div>
                                        <div className="flex-1 space-y-3">
                                            <div className="flex items-center gap-2">
                                                <ImageIcon className="w-4 h-4 text-slate-400" />
                                                <Input
                                                    placeholder="URL da Imagem (Ex: https://.../banner.png)"
                                                    value={banner.image_url}
                                                    onChange={e => {
                                                        const newBanners = [...videoBanners];
                                                        newBanners[index].image_url = e.target.value;
                                                        setVideoBanners(newBanners);
                                                    }}
                                                    className="h-8 text-sm"
                                                />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <LinkIcon className="w-4 h-4 text-slate-400" />
                                                <Input
                                                    placeholder="Link de Destino (Ex: /movies/123)"
                                                    value={banner.link_url}
                                                    onChange={e => {
                                                        const newBanners = [...videoBanners];
                                                        newBanners[index].link_url = e.target.value;
                                                        setVideoBanners(newBanners);
                                                    }}
                                                    className="h-8 text-sm"
                                                />
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => {
                                                const newBanners = [...videoBanners];
                                                newBanners.splice(index, 1);
                                                setVideoBanners(newBanners);
                                            }}
                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg h-fit self-center"
                                            title="Remover Banner"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
                        <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white min-w-32">
                            {saving ? (
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : (
                                <Save className="w-4 h-4 mr-2" />
                            )}
                            Salvar Alterações
                        </Button>
                    </div>
                </section>


                {/* GTM / Google Analytics Section */}
                <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex items-center gap-3 bg-green-50/50">
                        <div className="p-2 bg-green-100 rounded-lg text-green-600">
                            <Plus className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-slate-800">Rastreamento e Tags</h3>
                            <p className="text-slate-500 text-sm">Configure os IDs de acompanhamento do Google Tag Manager e Analytics.</p>
                        </div>
                    </div>
                    <div className="p-6 space-y-6">
                        {/* GTM ID */}
                        <div className="space-y-2">
                            <Label htmlFor="gtm_id" className="text-sm font-medium text-slate-700">Google Tag Manager ID (GTM-XXXXX)</Label>
                            <Input
                                id="gtm_id"
                                placeholder="Ex: GTM-5LSCVTNJ"
                                value={formData.google_tag_manager_id}
                                onChange={e => setFormData({ ...formData, google_tag_manager_id: e.target.value })}
                                className="bg-slate-50 font-mono"
                            />
                            <p className="text-[11px] text-slate-500 italic">
                                * Este ID será usado para carregar os scripts do GTM em todo o site.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Integration Section */}
                <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex items-center gap-3 bg-indigo-50/50">
                        <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                            <LinkIcon className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-slate-800">Integração Kiwify / Hotmart</h3>
                            <p className="text-slate-500 text-sm">Configurações de segurança para os webhooks de vendas.</p>
                        </div>
                    </div>
                    <div className="p-6 space-y-6">
                        {/* URL Token */}
                        <div className="space-y-2">
                            <Label htmlFor="webhook_token" className="text-sm font-medium text-slate-700">Token de Acesso à URL (Proteção Extra)</Label>
                            <Input
                                id="webhook_token"
                                placeholder="Ex: 7p9u8wegntp"
                                value={formData.webhook_token}
                                onChange={e => setFormData({ ...formData, webhook_token: e.target.value })}
                                className="bg-slate-50 font-mono"
                            />
                            <p className="text-[11px] text-slate-500 italic uppercase">
                                * Este token deve ser incluído na URL do webhook (ex: ?token=7p9u8...) para o app aceitar o sinal.
                            </p>
                        </div>

                        <hr className="border-slate-100" />

                        {/* Subscription Signature Secret */}
                        <div className="space-y-2">
                            <Label htmlFor="subscription_webhook_secret" className="text-sm font-medium text-slate-700">Segredo da Assinatura (Kiwify Token)</Label>
                            <Input
                                id="subscription_webhook_secret"
                                placeholder="Ex: a4spwioc187"
                                value={formData.subscription_webhook_secret}
                                onChange={e => setFormData({ ...formData, subscription_webhook_secret: e.target.value })}
                                className="bg-slate-50 font-mono"
                            />
                            <p className="text-[11px] text-slate-500 italic">
                                * Este é o "Token" que a Kiwify fornece na aba de Webhooks para a sua **Assinatura Principal**.
                            </p>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}
