
import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const PWA_INSTRUCTIONS = `
  <div style="margin-top: 24px; padding: 16px; background-color: #f0f4ff; border-radius: 8px; font-size: 14px; border: 1px dashed #4f46e5;">
    <p style="margin: 0 0 8px 0; font-weight: bold; color: #4338ca;">💡 Dica: Instale o App no seu telemóvel!</p>
    <p style="margin: 0;">Para uma experiência completa, abra este link no seu iPhone (Safari) ou Android (Chrome), clique no botão de <strong>Compartilhar</strong> e selecione <strong>"Adicionar à Tela de Início"</strong>.</p>
  </div>
`;

export const sendWelcomeEmail = async (email: string, magicLink: string) => {
  return await resend.emails.send({
    from: 'Meu Amiguito <nao-responda@meuamiguito.com.br>',
    to: email,
    subject: 'Bem-vindo ao Meu Amiguito! ✨',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e7ff; border-radius: 12px; overflow: hidden;">
        <div style="background-color: #4f46e5; padding: 24px; text-align: center;">
          <h1 style="color: white; margin: 0;">Meu Amiguito</h1>
        </div>
        <div style="padding: 24px; color: #1e1e1e; line-height: 1.6;">
          <h2 style="color: #4338ca;">Olá!</h2>
          <p>Sua assinatura foi confirmada com sucesso. Estamos muito felizes em ter você e sua família conosco!</p>
          <p>Para confirmar seu e-mail e entrar no app pela primeira vez, clique no botão abaixo:</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${magicLink}" style="background-color: #eab308; color: #1e1b4b; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 18px;">Confirmar E-mail e Entrar</a>
          </div>
          ${PWA_INSTRUCTIONS}
          <p style="font-size: 14px; color: #6b7280; margin-top: 24px;">Este link é válido por 24 horas. Se você não solicitou este acesso, por favor ignore este e-mail.</p>
        </div>
        <div style="background-color: #f9fafb; padding: 16px; text-align: center; font-size: 12px; color: #9ca3af;">
          &copy; 2026 Arca da Alegria - Meu Amiguito
        </div>
      </div>
    `
  });
};

export const sendMagicLinkEmail = async (email: string, magicLink: string) => {
  return await resend.emails.send({
    from: 'Meu Amiguito <nao-responda@meuamiguito.com.br>',
    to: email,
    subject: 'Seu link de acesso - Meu Amiguito',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e7ff; border-radius: 12px; overflow: hidden;">
        <div style="background-color: #4f46e5; padding: 24px; text-align: center;">
          <h1 style="color: white; margin: 0;">Meu Amiguito</h1>
        </div>
        <div style="padding: 24px; color: #1e1e1e; line-height: 1.6;">
          <p>Aqui está o seu link mágico para entrar no app:</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${magicLink}" style="background-color: #4f46e5; color: white; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 18px;">Entrar no App</a>
          </div>
          ${PWA_INSTRUCTIONS}
          <p style="font-size: 14px; color: #6b7280; margin-top: 24px;">Se você não solicitou este link, pode ignorar este e-mail com segurança.</p>
        </div>
        <div style="background-color: #f9fafb; padding: 16px; text-align: center; font-size: 12px; color: #9ca3af;">
          &copy; 2026 Arca da Alegria - Meu Amiguito
        </div>
      </div>
    `
  });
};
