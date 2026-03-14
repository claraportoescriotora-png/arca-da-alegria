import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save, Image as ImageIcon, Plus, Trash2, Link as LinkIcon, Images, Clock, Check } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { useConfig } from "@/contexts/ConfigContext";

const TRIAL_CONTENT_TYPES = [
    { value: 'video', label: 'Vídeos', table: 'videos' },
    { value: 'movie', label: 'Filmes', table: 'movies' },
    { value: 'story', label: 'Histórias', table: 'stories' },
    { value: 'episode', label: 'Episódios', table: 'episodes' },
];

export function AdminSettings() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { toast } = useToast();
    const [formData, setFormData] = useState({
        logo_url: '',
        favicon_url: ''
    });
    const [videoBanners, setVideoBanners] = useState<{ id: string, image_url: string, link_url: string }[]>([]);

    // Trial config state
    const [trialDays, setTrialDays] = useState(7);
    const [trialContent, setTrialContent] = useState<{ type: string; id: string }[]>([]);
    const [trialTab, setTrialTab] = useState('video');
    const [trialContentList, setTrialContentList] = useState<{ id: string; title: string }[]>([]);
    const [loadingTrialContent, setLoadingTrialContent] = useState(false);
    const [savingTrial, setSavingTrial] = useState(false);

    useEffect(() => {
        fetchConfigs();
        fetchTrialConfig();
    }, []);

    const fetchTrialConfig = async () => {
        try {
            const { data } = await supabase
                .from('trial_config')
                .select('trial_days, trial_content')
                .limit(1)
                .single();
            if (data) {
                setTrialDays(data.trial_days);
                setTrialContent(Array.isArray(data.trial_content) ? data.trial_content : []);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const fetchTrialContentList = async (type: string) => {
        const def = TRIAL_CONTENT_TYPES.find(t => t.value === type);
        if (!def) return;
        setLoadingTrialContent(true);
        const { data } = await supabase.from(def.table).select('id, title').limit(100);
        setTrialContentList(data || []);
        setLoadingTrialContent(false);
    };

    useEffect(() => {
        fetchTrialContentList(trialTab);
    }, [trialTab]);

    const toggleTrialContent = (id: string, type: string) => {
        const exists = trialContent.some(c => c.id === id && c.type === type);
        if (exists) {
            setTrialContent(trialContent.filter(c => !(c.id === id && c.type === type)));
        } else {
            setTrialContent([...trialContent, { type, id }]);
        }
    };

    const handleSaveTrial = async () => {
        setSavingTrial(true);
        try {
            await supabase.from('trial_config').upsert(
                { id: 1, trial_days: trialDays, trial_content: trialContent, updated_at: new Date().toISOString() },
                { onConflict: 'id' }
            );
            toast({ title: 'Configuração de trial salva!' });
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Erro ao salvar trial', description: e.message });
        } finally {
            setSavingTrial(false);
        }
    };

    const fetchConfigs = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('app_config')
                .select('key, value')
                .in('key', ['logo_url', 'favicon_url', 'video_banners']);

            if (error) throw error;

            const initialForm = { logo_url: '', favicon_url: '' };
            if (data) {
                const logo = data.find(item => item.key === 'logo_url');
                const favicon = data.find(item => item.key === 'favicon_url');
                const banners = data.find(item => item.key === 'video_banners');

                if (logo) initialForm.logo_url = logo.value;
                if (favicon) initialForm.favicon_url = favicon.value;
                if (banners && banners.value) {
                    try {
                        const parsed = typeof banners.value === 'string' ? JSON.parse(banners.value) : banners.value;
                        setVideoBanners(Array.isArray(parsed) ? parsed : []);
                    } catch (e) { console.error(e) }
                }
            }

            setFormData(initialForm);
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

                {/* Trial Config Section */}
                <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
                        <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
                            <Clock className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-slate-800">Trial Gratuito</h3>
                            <p className="text-sm text-slate-500">Configure o período e os conteúdos do acesso gratuito.</p>
                        </div>
                    </div>

                    <div className="p-6 space-y-6">
                        <div className="space-y-2">
                            <Label className="text-base font-semibold text-slate-700">Duração do trial (dias)</Label>
                            <Input
                                type="number"
                                min={0}
                                max={365}
                                value={trialDays}
                                onChange={e => setTrialDays(Number(e.target.value))}
                                className="w-32"
                            />
                            <p className="text-xs text-slate-400">Defina 0 para desativar o acesso trial.</p>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-base font-semibold text-slate-700">Conteúdos liberados no trial ({trialContent.length} selecionados)</Label>
                            <div className="flex gap-2 flex-wrap">
                                {TRIAL_CONTENT_TYPES.map(t => (
                                    <button
                                        key={t.value}
                                        onClick={() => setTrialTab(t.value)}
                                        className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${trialTab === t.value
                                                ? 'bg-amber-500 text-white'
                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                            }`}
                                    >
                                        {t.label}
                                    </button>
                                ))}
                            </div>

                            <div className="border border-slate-200 rounded-xl max-h-64 overflow-y-auto">
                                {loadingTrialContent ? (
                                    <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-amber-500" /></div>
                                ) : trialContentList.length === 0 ? (
                                    <p className="text-center text-slate-400 text-sm py-6">Nenhum conteúdo deste tipo encontrado.</p>
                                ) : (
                                    trialContentList.map(item => {
                                        const selected = trialContent.some(c => c.id === item.id && c.type === trialTab);
                                        return (
                                            <button
                                                key={item.id}
                                                onClick={() => toggleTrialContent(item.id, trialTab)}
                                                className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm border-b border-slate-100 last:border-0 transition-colors ${selected ? 'bg-amber-50 text-amber-800' : 'hover:bg-slate-50 text-slate-700'
                                                    }`}
                                            >
                                                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${selected ? 'bg-amber-500 border-amber-500' : 'border-slate-300'
                                                    }`}>
                                                    {selected && <Check className="w-2.5 h-2.5 text-white" />}
                                                </div>
                                                <span className="truncate">{item.title}</span>
                                            </button>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
                        <Button onClick={handleSaveTrial} disabled={savingTrial} className="bg-amber-500 hover:bg-amber-600 text-white min-w-32">
                            {savingTrial ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                            Salvar Trial
                        </Button>
                    </div>
                </section>
            </div>
        </div>
    );
}
