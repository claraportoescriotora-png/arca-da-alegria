import { Component, ReactNode, ErrorInfo } from 'react';
import { supabase } from '@/lib/supabase';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);

        // Log silently to Supabase Telemetry
        this.logErrorToSupabase(error, errorInfo);
    }

    private async logErrorToSupabase(error: Error, errorInfo: ErrorInfo) {
        try {
            let userId = null;
            const sessionStr = localStorage.getItem('sb-gypzrzsmxgjtkidznstd-auth-token');
            if (sessionStr) {
                try {
                    const sessionData = JSON.parse(sessionStr);
                    userId = sessionData?.user?.id || null;
                } catch (e) { }
            }

            const browser_info = {
                userAgent: navigator.userAgent,
                language: navigator.language,
                platform: (navigator as any).platform,
                vendor: navigator.vendor,
                screenSize: `${window.innerWidth}x${window.innerHeight}`,
            };

            await supabase.from('system_error_logs').insert([{
                user_id: userId,
                error_message: error.message || error.toString(),
                error_stack: error.stack || null,
                component_stack: errorInfo.componentStack || null,
                url: window.location.href,
                browser_info
            }]);
        } catch (postError) {
            console.error('Failed to report telemetry:', postError);
        }
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-white font-sans">
                    <div className="max-w-md w-full bg-slate-800 rounded-3xl p-8 shadow-2xl border border-white/10 text-center animate-in zoom-in-95 duration-300">
                        <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertCircle className="w-10 h-10 text-red-500" />
                        </div>
                        
                        <h1 className="text-2xl font-bold mb-2">Ops! Algo deu errado</h1>
                        <p className="text-slate-400 mb-8 font-medium">
                            Ocorreu um erro inesperado no aplicativo. Mas não se preocupe, já anotamos tudo para o Tio Natan consertar!
                        </p>

                        <div className="space-y-4">
                            <button
                                onClick={() => window.location.reload()}
                                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 group"
                            >
                                <RefreshCw className="w-5 h-5 group-active:rotate-180 transition-transform" />
                                Recarregar Página
                            </button>

                            <button
                                onClick={() => window.location.href = '/'}
                                className="w-full py-4 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2"
                            >
                                <Home className="w-5 h-5" />
                                Voltar ao Início
                            </button>
                        </div>

                        {import.meta.env.DEV && (
                            <div className="mt-8 text-left">
                                <p className="text-xs text-slate-500 uppercase font-black mb-2 tracked-widest">Detalhes do Erro (Dev Only)</p>
                                <pre className="text-[10px] text-red-400 bg-black/40 p-4 rounded-xl overflow-auto max-h-40 leading-relaxed">
                                    {this.state.error?.toString()}
                                    {"\n\nStack:\n"}
                                    {this.state.error?.stack}
                                </pre>
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
