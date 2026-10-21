-- ============================================================================
-- Ótica Smart IA — Dados de exemplo (DML: INSERT)
-- Deve ser executado após schema.sql.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- produtos (reaproveita o catálogo mock do front-end: src/data/products.js)
-- ----------------------------------------------------------------------------
INSERT INTO produtos (nome, tipo_armacao, faixa_preco, preco, descricao) VALUES
  ('Clássica Retrô Quadrada',  'quadrada',   '$$',  279.90, 'Armação quadrada em acetato, equilibra rostos redondos e ovais.'),
  ('Executiva Retangular',     'retangular', '$$$', 459.90, 'Linhas retas e sofisticadas, ideal para o ambiente de trabalho.'),
  ('Charme Redondo Vintage',   'redonda',    '$',   149.90, 'Estilo retrô arredondado que suaviza rostos quadrados e coração.'),
  ('Essencial Oval',           'oval',       '$$',  279.90, 'Formato oval discreto que arredonda ângulos de rostos quadrados.'),
  ('Aviador Clássico',         'aviador',    '$$$', 459.90, 'O icônico aviador, versátil para rostos ovais e uso casual.'),
  ('Gatinho Elegante',         'gatinho',    '$$',  279.90, 'Armação gatinho leve na parte inferior, favorece rostos coração.'),
  ('Quadrada Moderna Slim',    'quadrada',   '$',   149.90, 'Versão slim e leve da quadrada clássica, ótima para o dia a dia ativo.'),
  ('Retangular Leitura Leve',  'retangular', '$',   149.90, 'Armação leve e confortável, pensada para longas sessões de leitura.'),
  ('Redonda Minimalista',      'redonda',    '$$',  279.90, 'Design minimalista arredondado, elegante para o escritório.'),
  ('Aviador Esportivo',        'aviador',    '$$',  279.90, 'Aviador resistente e leve, feito para rotinas esportivas.');

-- ----------------------------------------------------------------------------
-- clientes
-- ----------------------------------------------------------------------------
INSERT INTO clientes (nome, email, telefone) VALUES
  ('Ana Beatriz Souza',   'ana.souza@example.com',    '(67) 99111-2233'),
  ('Carlos Eduardo Lima', 'carlos.lima@example.com',  '(67) 99222-3344'),
  ('Fernanda Oliveira',   'fernanda.oliveira@example.com', '(67) 99333-4455'),
  ('João Pedro Alves',    'joao.alves@example.com',   '(67) 99444-5566');

-- ----------------------------------------------------------------------------
-- triagens
-- (formato_rosto: oval|redondo|quadrado|coracao — igual ao app)
-- (regra de recomendação replicada de src/services/recommendationService.js:
--    redondo  -> quadrada, retangular
--    quadrado -> redonda, oval
--    oval     -> aviador, quadrada, retangular
--    coracao  -> redonda, gatinho)
-- ----------------------------------------------------------------------------
INSERT INTO triagens (cliente_id, formato_rosto, estilo_vida, usa_grau, metodo_deteccao) VALUES
  (1, 'redondo',  'esportivo', 1, 'scan_completo'), -- triagem 1: Ana
  (2, 'oval',     'trabalho',  0, 'scan_rapido'),   -- triagem 2: Carlos
  (3, 'quadrado', 'leitura',   1, 'manual'),        -- triagem 3: Fernanda
  (4, 'coracao',  'dia-a-dia', 0, 'scan_completo'); -- triagem 4: João

-- Recomendações geradas por cada triagem (produtos cujo tipo_armacao combina
-- com o formato_rosto detectado)
INSERT INTO triagens_recomendacoes (triagem_id, produto_id) VALUES
  (1, 1), (1, 7),   -- redondo -> quadrada (Clássica Retrô, Quadrada Moderna Slim)
  (1, 2), (1, 8),   -- redondo -> retangular (Executiva, Retangular Leitura Leve)
  (2, 5), (2, 10),  -- oval -> aviador (Aviador Clássico, Aviador Esportivo)
  (2, 1), (2, 7),   -- oval -> quadrada
  (2, 2), (2, 8),   -- oval -> retangular
  (3, 3), (3, 9),   -- quadrado -> redonda (Charme Redondo Vintage, Redonda Minimalista)
  (3, 4),           -- quadrado -> oval (Essencial Oval)
  (4, 3), (4, 9),   -- coracao -> redonda
  (4, 6);           -- coracao -> gatinho (Gatinho Elegante)

-- ----------------------------------------------------------------------------
-- pedidos e itens_pedido
-- (exemplo: Ana e Fernanda decidiram comprar após a triagem)
-- ----------------------------------------------------------------------------
INSERT INTO pedidos (cliente_id, status) VALUES
  (1, 'pago'),       -- pedido 1: Ana
  (3, 'pendente');   -- pedido 2: Fernanda

INSERT INTO itens_pedido (pedido_id, produto_id, quantidade, preco_unitario) VALUES
  (1, 7, 1, 149.90),  -- Ana comprou a Quadrada Moderna Slim
  (2, 9, 1, 279.90);  -- Fernanda comprou a Redonda Minimalista
