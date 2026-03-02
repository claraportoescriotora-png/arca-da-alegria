-- ========================================================
-- SYSTEM ERROR LOGS
-- Tabela oculta para capturar telemetria e reports de erro do ErrorBoundary
-- ========================================================

CREATE TABLE IF NOT EXISTS public.system_error_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) DEFAULT NULL,
    error_message TEXT NOT NULL,
    error_stack TEXT,
    component_stack TEXT,
    url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS: Apenas admins podem ler os logs, mas qualquer usuário autenticado pode inserir.
ALTER TABLE public.system_error_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert error logs" 
ON public.system_error_logs FOR INSERT 
WITH CHECK (true); -- Permitimos inserção livre para capturar erros (inclusive deslogado se quisermos)

CREATE POLICY "Only admins can view error logs" 
ON public.system_error_logs FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND 'admin' = ANY(permissions)
    )
);
