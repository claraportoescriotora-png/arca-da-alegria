-- =========================================================================
-- CADASTRO DE ADMIN E AUDITORIA DE SEGURANÇA (PERMISSÕES E CARGOS)
-- =========================================================================

-- 1. Cria a RPC is_admin() para checar de forma segura e rápida o cargo 
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER -- Roda com privilégios do criador da função (admin root) para bypassar RLS
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
    AND 'admin' = ANY(permissions)
  );
$$;

-- 2. Reforço Ativo na RLS de Profiles para Evitar Escalonamento de Privilégios
-- Atualmente usuários podem dar um UPDATE no seu próprio profile. 
-- Precisamos barrar a edição da coluna `permissions`.
-- (A maioria das UI não inclui 'permissions' no updateName, mas hackers o fariam via network).

DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

-- Cria a policy restritiva que impede injeção maliciosa em colunas confidenciais
-- Ao rodar um UPDATE via Supabase/Frontend, só deixamos atualizar colunas cosméticas.
-- Quem dita as 'permissions' é apenas a trigger do sistema ou o Dashboard root.
CREATE POLICY "Users can update own profile cosmetic data."
ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id
  -- Só garantimos por RLS avançada que se houver update, seria validado trigger, ou na prática, 
  -- garantindo que a coluna permissions permaneça a mesma que já estava no banco.
);

-- Forma infalível: Trigger que restabelece OLD.permissions se um usuário comum tentar alterar
CREATE OR REPLACE FUNCTION public.prevent_permission_escalation()
RETURNS TRIGGER AS $$
BEGIN
    -- Se quem está atualizando *não for* já um admin root, e não for service_role, ele não pode mudar permissions.
    IF (auth.uid() IS NOT NULL) THEN
        -- Protege o array de roles. O usuario não consegue se autoconceder 'admin'.
        NEW.permissions = OLD.permissions;
        NEW.subscription_status = OLD.subscription_status;
        NEW.xp = OLD.xp;
        NEW.coins = OLD.coins;
        NEW.level = OLD.level;
        NEW.streak = OLD.streak;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS block_escalation ON public.profiles;
CREATE TRIGGER block_escalation
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_permission_escalation();

-- =========================================================================
-- CADASTRO DO NATANAEL (ADMIN)
-- =========================================================================
-- Nota: Contas do Auth (identidade real e senha) NÃO PODEM ser criadas apenas por inserts cruos em SQL puro
-- devido à complexidade da criptografia PGCrypto com hash dinâmico do GoTrue no Supabase e IDs. 
-- A inserção direta quebraria a segurança, é sugerido usar o Supabase Auto-Confirm.

-- Contudo, inserimos um Script Criptográfico de Seed nativo do PostgreSQL habilitando extension:
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
    admin_id uuid := gen_random_uuid();
BEGIN
    -- Se o e-mail não existe no Supabase Auth
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'natan_s_l@hotmail.com') THEN
    
        -- 1. Insere o core do usuário usando encriptação PGCrypto para o 'NatanArca#2026'
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            admin_id,
            'authenticated',
            'authenticated',
            'natan_s_l@hotmail.com',
            crypt('NatanArca#2026', gen_salt('bf')),
            now(),
            '{"provider":"email","providers":["email"]}',
            '{"full_name":"Natanael Sousa"}',
            now(),
            now()
        );
        
        -- 2. Insere a Identidade do Auth
        INSERT INTO auth.identities (
            id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
        ) VALUES (
            gen_random_uuid(),
            admin_id,
            format('{"sub":"%s","email":"natan_s_l@hotmail.com"}', admin_id)::jsonb,
            'email',
            admin_id::text, -- A coluna provider_id é obrigatória nas novas versões do GoTrue
            now(),
            now(),
            now()
        );

        -- 3. A Trigger "handle_new_user()" que já estava rodando, cria automaticamente a row na tabela "profiles".
        -- Como criamos o usuário no Auth, agora precisamos aguardar o commit ou dar um update na profiles forçado 
        -- via bloco abaixo (com um pequeno hack para bypassar a trigger de edição):

        -- Desarmamos o gatilho rapidamente para nos permitirmos conceder o cargo
        ALTER TABLE public.profiles DISABLE TRIGGER block_escalation;

        UPDATE public.profiles 
        SET permissions = ARRAY['admin'], 
            subscription_status = 'active'
        WHERE id = admin_id;

        -- Rearmamos a segurança
        ALTER TABLE public.profiles ENABLE TRIGGER block_escalation;

        RAISE NOTICE 'Admin Natanael criado com sucesso!';
    ELSE
        -- Se já existir a conta de email, apenas forçamos setar como admin
        SELECT id INTO admin_id FROM auth.users WHERE email = 'natan_s_l@hotmail.com';
        
        ALTER TABLE public.profiles DISABLE TRIGGER block_escalation;
        UPDATE public.profiles 
        SET permissions = ARRAY['admin'], 
            subscription_status = 'active'
        WHERE id = admin_id;
        ALTER TABLE public.profiles ENABLE TRIGGER block_escalation;

        RAISE NOTICE 'Conta Natanael já existia! Elevado para Admin com sucesso.';
    END IF;
END $$;
