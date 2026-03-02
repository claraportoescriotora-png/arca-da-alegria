import { Component, ReactNode, ErrorInfo } from 'react';
import { supabase } from '@/lib/supabase';

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
            // Tentamos pegar o user logado atual via LocalStorage da sessão do Supabase, ou via auth
            let userId = null;
            const sessionStr = localStorage.getItem('sb-gypzrzsmxgjtkidznstd-auth-token');
            if (sessionStr) {
                try {
                    const sessionData = JSON.parse(sessionStr);
                    userId = sessionData?.user?.id || null;
                } catch (e) { }
            }

            await supabase.from('system_error_logs').insert([{
                user_id: userId,
                error_message: error.message || error.toString(),
                error_stack: error.stack || null,
                component_stack: errorInfo.componentStack || null,
                url: window.location.href
            }]);
        } catch (postError) {
            console.error('Failed to report telemetry:', postError);
        }
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '20px', fontFamily: 'sans-serif', textAlign: 'center' }}>
                    <h1>Algo deu errado 😔</h1>
                    <p>Ocorreu um erro inesperado.</p>
                    <pre style={{ textAlign: 'left', background: '#f1f1f1', padding: '10px', borderRadius: '5px', overflow: 'auto' }}>
                        {this.state.error?.toString()}
                    </pre>
                    <button
                        onClick={() => window.location.reload()}
                        style={{ marginTop: '20px', padding: '10px 20px', fontSize: '16px', cursor: 'pointer' }}
                    >
                        Recarregar Página
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
