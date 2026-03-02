-- Adicionando suporte para links de conteúdo nas tarefas (Sub-missões)

-- 1. Adicionar as novas colunas à tabela mission_tasks
ALTER TABLE public.mission_tasks
ADD COLUMN IF NOT EXISTS linked_content_type text CHECK (linked_content_type IN ('story', 'video', 'game', 'movie', 'series')),
ADD COLUMN IF NOT EXISTS linked_content_id uuid;

-- 2. Atualizar a cache do Schema do Supabase (para evitar aquele erro PGRST204)
NOTIFY pgrst, 'reload schema';
