# Guia de Testes: Trial e Loja de Produtos

Este documento detalha todos os cenários que você precisa testar para garantir que o sistema de Trial e Loja de Produtos está funcionando perfeitamente para todos os tipos de usuários.

---

## 🏗️ Preparação Inicial

1. Acesse o painel **Admin → Trial Gratuito** (`/admin/settings`).
2. Defina os dias (ex: 7).
3. Selecione 2 vídeos para fazerem parte do trial.
4. Salve.

5. Acesse o painel **Admin → Loja de Produtos** (`/admin/products`).
6. Crie **Produto A (Complementar / Padrão)**:
   - Título: "Pacote Histórias Bíblicas"
   - Adicione 1 vídeo que NÃO estava no trial.
   - Deixe o toggle "Tipo de acesso" em "Complementar" (desligado).
7. Crie **Produto B (Exclusivo)**:
   - Título: "Especial Criador Externo"
   - Adicione 1 vídeo que NÃO estava em nenhum outro lugar.
   - Ligue o toggle "Tipo de acesso" para "🔒 Compra obrigatória".

---

## 🧪 Cenário 1: Usuário em Trial

**Objetivo:** Verificar se o trial restringe corretamente.

1. Crie uma nova conta no app (cadastre um email novo).
2. O botão de "Trial Banner" deve aparecer no topo indicando os dias restantes.
3. **Teste de Sucesso:** Tente abrir um dos 2 vídeos que você selecionou no "Trial Gratuito". O vídeo deve abrir normalmente.
4. **Teste de Bloqueio 1:** Tente abrir um vídeo que não está no trial. A tela de bloqueio roxa "Assinar o App Completo" deve aparecer.
5. **Teste de Bloqueio 2:** Tente abrir o vídeo do "Produto A" (Complementar). A tela de bloqueio do produto deve aparecer com o botão de compra.
6. **Teste de Bloqueio 3:** Tente abrir o vídeo do "Produto B" (Exclusivo). A tela de bloqueio do produto deve aparecer.

---

## 🧪 Cenário 2: Usuário Assinante Padrão

**Objetivo:** Verificar se assinantes mantêm acesso ao conteúdo base, mas são bloqueados no exclusivo.

1. Faça login na sua conta oficial de testes que **já é assinante** ativa.
2. O banner de trial NÃO deve aparecer (pois a conta é pagante).
3. **Teste de Sucesso (Plano Base):** Abra qualquer vídeo normal. Deve funcionar.
4. **Teste de Sucesso (Produto Complementar):** Tente abrir o vídeo que está dentro do "Produto A". **DEVE FUNCIONAR NORMALMENTE**, sem pedir para comprar, pois a flag é Complementar.
5. **Teste de Bloqueio Exclusivo:** Tente abrir o vídeo que está dentro do "Produto B" (Exclusivo). A tela de bloqueio do produto **DEVE APARECER**.

---

## 🧪 Cenário 3: Comprando um Produto Exclusivo

**Objetivo:** Verificar se a concessão de acesso funciona e libera o conteúdo.

1. Com a sua conta oficial de assinante, tente abrir o vídeo do "Produto B". Ele estará bloqueado.
2. Anote o email desta sua conta de assinante.
3. Vá no painel **Admin → Loja de Produtos**, clique em "Acessos" no "Produto B".
4. Digite o email da sua conta de assinante e clique no `+` (Isso simula a aprovação do webhook de pagamento).
5. Volte para a parte de vídeos do app.
6. Tente abrir o vídeo do "Produto B" novamente. Agora ele **DEVE ABRIR NORMALMENTE**.

---

## 🧪 Cenário 4: Usuário com Trial Expirado ou Sem Plano

**Objetivo:** Garantir que quem não paga o plano mensal seja reencaminhado para o paywall geral, exceto para produtos avulsos.

1. Você precisará forçar o "status" de uma conta (via painel do Supabase) para ver como o app reage a alguém cujo trial acabou e não assinou.
2. Se a pessoa clicar em algo normal, ela deve ir para o `/paywall`.

---

## 🔗 Testando o Webhook Real

Se quiser testar a integração real da Kiwify sem precisar fazer uma compra de verdade:

1. Pegue a "URL do Webhook" do Produto B no painel Admin (Ex: `https://[seu-projeto].supabase.co/functions/v1/product-webhook?key=ABCxyz`).
2. Abra um terminal de comando no seu computador e faça um teste enviando um email falso. Ou faça apenas o teste de adicionar o acesso diretamente no painel Admin.

**Bons testes!** Se algum passo não se comportar conforme descrito, me avise que ajustamos.
