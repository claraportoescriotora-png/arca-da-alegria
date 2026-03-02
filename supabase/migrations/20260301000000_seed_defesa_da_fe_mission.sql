-- Arquivo de inserção rápida da Missão: Como defender a sua fé em 18 passos
-- Execute este arquivo no SQL Editor do Supabase

DO $$
DECLARE
    new_mission_id UUID;
    day1_id UUID;
    day2_id UUID;
    day3_id UUID;
BEGIN
    -- 1. Inserir a Missão Principal
    INSERT INTO mission_packs (
        title, 
        description, 
        cover_url, 
        total_days, 
        unlock_delay_days, 
        is_active
    ) VALUES (
        '18 passos para defender sua Fé',
        'O guia prático para dar ao seu filho as respostas para as perguntas mais difíceis da escola sem ele parecer o "chato" da turma.',
        'https://gypzrzsmxgjtkidznstd.supabase.co/storage/v1/object/public/activities/defenda_sua_fe.png',
        3,
        0,
        true
    ) RETURNING id INTO new_mission_id;

    -- 2. Inserir o Dia 1
    INSERT INTO missions (pack_id, day_number, title, description, xp_reward, icon) VALUES (new_mission_id, 1, 'O Plano do Relojoeiro', 'Dia 1', 50, 'star') RETURNING id INTO day1_id;
    INSERT INTO mission_tasks (mission_id, description, order_index, xp_reward) VALUES
    (day1_id, 'Oração de Abertura: Pedir sabedoria para entender que o mundo tem um Criador.', 1, 10), 
    (day1_id, 'Vídeo: "A Criação do Mundo" (Série Midinho).', 2, 10), 
    (day1_id, 'História: "Bernardo e o Relógio do Professor" (A prova lógica do Criador).', 3, 10), 
    (day1_id, 'Atividade: Colorir o cenário do Éden (PDF 60 Atividades, pág. 31).', 4, 10), 
    (day1_id, 'Documentário: "O Gênesis é História".', 5, 10), 
    (day1_id, 'Oração de Encerramento.', 6, 10);

    -- 3. Inserir o Dia 2
    INSERT INTO missions (pack_id, day_number, title, description, xp_reward, icon) VALUES (new_mission_id, 2, 'A Chave Mestra', 'Dia 2', 50, 'star') RETURNING id INTO day2_id;
    INSERT INTO mission_tasks (mission_id, description, order_index, xp_reward) VALUES
    (day2_id, 'Oração de Abertura.', 1, 10), 
    (day2_id, 'História: "Bernardo e o Caminho Único" (Por que Jesus é o único caminho).', 2, 10), 
    (day2_id, 'Jogo: "Encontre Jesus".', 3, 10), 
    (day2_id, 'Música: Ouvir "Ninguém Explica Deus".', 4, 10), 
    (day2_id, 'Sugestão Pais: Filme "Deus Não Está Morto".', 5, 10), 
    (day2_id, 'Oração de Encerramento.', 6, 10);

    -- 4. Inserir o Dia 3
    INSERT INTO missions (pack_id, day_number, title, description, xp_reward, icon) VALUES (new_mission_id, 3, 'O Escudo do Respeito', 'Dia 3', 50, 'star') RETURNING id INTO day3_id;
    INSERT INTO mission_tasks (mission_id, description, order_index, xp_reward) VALUES
    (day3_id, 'Oração de Abertura.', 1, 10), 
    (day3_id, 'História: "Hugo o Sabichão" (Respondendo críticas com amor).', 2, 10), 
    (day3_id, 'Atividade: Recortar a "Armadura de Deus" (PDF 60 Atividades, pág. 21).', 3, 10), 
    (day3_id, 'Música: Ouvir "Nada é Igual ao Seu Redor".', 4, 10), 
    (day3_id, 'Sugestão Pais: Filme "Em Defesa de Cristo".', 5, 10), 
    (day3_id, 'Oração Final: Pedir coragem para falar da verdade com doçura.', 6, 10);

    RAISE NOTICE 'Missão "18 passos para defender sua Fé" inserida com sucesso (ID: %)', new_mission_id;
END $$;
