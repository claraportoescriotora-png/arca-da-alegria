
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env from project root
dotenv.config({ path: path.join(__dirname, '../.env') });

const email = 'pabidix294@agoalz.com';
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const resendApiKey = process.env.RESEND_API_KEY || '';

if (!supabaseUrl || !supabaseServiceKey || !resendApiKey) {
    console.error('❌ Faltando variáveis de ambiente no .env (SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, VITE_SUPABASE_URL)');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const resend = new Resend(resendApiKey);

function generateSecurePassword(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = 'AMIG-';
    for (let i = 0; i < 4; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

const PWA_INSTRUCTIONS = `
  <div style="margin-top: 24px; padding: 16px; background-color: #f0f4ff; border-radius: 8px; font-size: 14px; border: 1px dashed #4f46e5;">
    <p style="margin: 0 0 8px 0; font-weight: bold; color: #4338ca;">💡 Dica: Instale o App no seu telemóvel!</p>
    <p style="margin: 0;">Para uma experiência completa, abra este link no seu iPhone (Safari) ou Android (Chrome), clique no botão de <strong>Compartilhar</strong> e selecione <strong>"Adicionar à Tela de Início"</strong>.</p>
  </div>
`;

async function run() {
    console.log(`🚀 Iniciando criação de usuário de teste para: ${email}`);
    const password = generateSecurePassword();

    // 1. Create/Get User
    let userId: string;
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: 'Usuário Teste' }
    });

    if (authError) {
        if (authError.message.includes('already registered')) {
            console.log('ℹ️ Usuário já existe. Resetando senha...');
            const { data: users, error: listError } = await supabase.auth.admin.listUsers();
            const existingUser = users?.users.find(u => u.email === email);
            if (!existingUser) throw new Error('Usuário não encontrado na listagem.');
            userId = existingUser.id;
            await supabase.auth.admin.updateUserById(userId, { password });
        } else {
            console.error('❌ Erro ao criar usuário auth:', authError.message);
            return;
        }
    } else {
        userId = authUser.user.id;
        console.log('✅ Usuário Auth criado com sucesso.');
    }

    // 2. Upsert Profile
    const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
            id: userId,
            email,
            full_name: 'Usuário Teste',
            status: 'active',
            updated_at: new Date().toISOString()
        });

    if (profileError) {
        console.error('❌ Erro ao atualizar perfil:', profileError.message);
        return;
    }
    console.log('✅ Perfil atualizado para status "active".');

    // 3. Generate Magic Link
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email,
        options: { redirectTo: 'https://www.meuamiguito.com.br/home' }
    });

    if (linkError) {
        console.error('❌ Erro ao gerar link mágico:', linkError.message);
        return;
    }

    const magicLink = linkData.properties.action_link;
    console.log('✅ Link Mágico gerado.');

    // 4. Send Welcome Email
    console.log('📧 Enviando e-mail de boas-vindas via Resend...');
    const emailResult = await resend.emails.send({
        from: 'Meu Amiguito <nao-responda@meuamiguito.com.br>',
        to: email,
        subject: 'Bem-vindo ao Meu Amiguito! ✨',
        html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e7ff; border-radius: 12px; overflow: hidden;">
                <div style="background-color: #4f46e5; padding: 24px; text-align: center;">
                    <img src="https://www.meuamiguito.com.br/logo.png" alt="Meu Amiguito" style="max-height: 80px;" />
                </div>
                <div style="padding: 24px; color: #1e1e1e; line-height: 1.6;">
                    <h2 style="color: #4338ca;">Seu acesso chegou! 🚀</h2>
                    <p>Ficamos muito felizes em ter você e sua família conosco no <strong>Meu Amiguito</strong>!</p>
                    
                    <div style="background-color: #f3f4f6; padding: 20px; border-radius: 12px; margin: 24px 0; border: 1px solid #e5e7eb;">
                        <p style="margin: 0 0 10px 0; font-weight: bold; color: #374151;">Seus dados de acesso:</p>
                        <p style="margin: 5px 0;"><strong>E-mail:</strong> \${email}</p>
                        <p style="margin: 5px 0;"><strong>Senha:</strong> <code style="background: #fff; padding: 2px 6px; border-radius: 4px; font-size: 1.1em; color: #4f46e5;">\${password}</code></p>
                    </div>

                    <p>Você pode acessar o aplicativo de duas formas:</p>
                    <ol>
                        <li><strong>Acesso Direto</strong>: Clique no botão abaixo para entrar automaticamente.</li>
                        <li><strong>Acesso Manual</strong>: Use seu e-mail e a senha acima no aplicativo instalado.</li>
                    </ol>

                    <div style="text-align: center; margin: 32px 0;">
                        <a href="\${magicLink}" style="display: inline-block; background-color: #eab308; color: #1e1b4b; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 18px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">Entrar no Aplicativo ➔</a>
                    </div>
                    
                    \${PWA_INSTRUCTIONS}
                    
                    <p style="font-size: 13px; color: #6b7280; margin-top: 24px;">
                        * Recomendamos que você troque esta senha temporária na área de "Perfil" dentro do aplicativo.
                    </p>
                </div>
                <div style="background-color: #f9fafb; padding: 16px; text-align: center; font-size: 12px; color: #9ca3af;">
                    &copy; 2026 Meu Amiguito - Arca da Alegria
                </div>
            </div>
        `
    });

    if (emailResult.error) {
        console.error('❌ Erro ao enviar e-mail:', emailResult.error);
    } else {
        console.log('🎉 SUCESSO! Usuário criado e e-mail enviado.');
        console.log(`🔑 Senha gerada: \${password}`);
    }
}

run().catch(console.error);
