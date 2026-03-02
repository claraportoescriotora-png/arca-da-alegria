-- Script para permitir assinaturas de Push Notifications no PWA

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id text PRIMARY KEY, -- O endpoint do push_subscription funciona como um ID unico
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Politicas
CREATE POLICY "Users can insert their own subscriptions" ON public.push_subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions" ON public.push_subscriptions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own subscriptions" ON public.push_subscriptions
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Service roles can read subscriptions for sending pushes" ON public.push_subscriptions
    FOR SELECT USING (true);
