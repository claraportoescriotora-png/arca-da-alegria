DO $$
DECLARE
    new_mission_id UUID;
    day1_id UUID;
    day2_id UUID;
    day3_id UUID;
BEGIN
    -- 1. Inserir o pacote de missão (Mission Pack)
    INSERT INTO mission_packs (title, description, cover_url, total_days, unlock_delay_days, is_active) 
    VALUES (
        '3 dias para vencer a ansiedade', 
        'Descubra as armas de Deus para o seu filho recuperar o foco e a paz longe das telas.', 
        'https://gypzrzsmxgjtkidznstd.supabase.co/storage/v1/object/public/activities/vencer_ansiedade.png', -- Pode trocar a imagem depois no painel
        3, 
        14, 
        true
    ) RETURNING id INTO new_mission_id;

    -- ==========================================
    -- DIA 1
    -- ==========================================
    INSERT INTO missions (pack_id, day_number, title, description, xp_reward, icon) 
    VALUES (new_mission_id, 1, 'O Silêncio que Ouve Deus', 'Dia 1', 50, 'star') 
    RETURNING id INTO day1_id;
    
    INSERT INTO mission_tasks (mission_id, description, order_index, xp_reward) VALUES
    (day1_id, 'Oração para acalmar os pensamentos.', 1, 10), 
    (day1_id, 'História: "Elias e a voz suave de Deus".', 2, 10), 
    (day1_id, 'Exercício de Respiração: Inspirar por 4 segundos e expirar devagar pensando "Jesus é minha calma".', 3, 10);

    -- ==========================================
    -- DIA 2
    -- ==========================================
    INSERT INTO missions (pack_id, day_number, title, description, xp_reward, icon) 
    VALUES (new_mission_id, 2, 'O Superpoder da Calma', 'Dia 2', 50, 'star') 
    RETURNING id INTO day2_id;
    
    INSERT INTO mission_tasks (mission_id, description, order_index, xp_reward) VALUES
    (day2_id, 'Vídeo: "Jesus acalma a tempestade".', 1, 10), 
    (day2_id, 'Jogo: "No Ritmo do Céu".', 2, 10), 
    (day2_id, 'Atividade de Desenho: Desenhar o que causa estresse vs. como é a paz de Deus no coração.', 3, 10);

    -- ==========================================
    -- DIA 3
    -- ==========================================
    INSERT INTO missions (pack_id, day_number, title, description, xp_reward, icon) 
    VALUES (new_mission_id, 3, 'O Escudo do Descanso', 'Dia 3', 50, 'star') 
    RETURNING id INTO day3_id;
    
    INSERT INTO mission_tasks (mission_id, description, order_index, xp_reward) VALUES
    (day3_id, 'História: "Davi e a Harpa".', 1, 10), 
    (day3_id, 'Instrução para montar a "Harpa de Davi" usando o modelo da pág. 53 do PDF.', 2, 10), 
    (day3_id, 'Missão "Hora do Desligar": Ficar 1 hora sem telas antes de dormir para conversar com Deus.', 3, 10);

    RAISE NOTICE 'Missão vencendo a ansiedade inserida com sucesso!';
END $$;
