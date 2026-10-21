-- ============================================================================
-- Ótica Smart IA — Exemplos de manipulação de dados (DML)
-- Deve ser executado após schema.sql e seed.sql.
-- Organizado em: INSERT, UPDATE, DELETE, SELECT (com JOINs e agregações).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) INSERT — novo cliente e uma nova triagem para ele
-- ----------------------------------------------------------------------------
INSERT INTO clientes (nome, email, telefone)
VALUES ('Mariana Costa', 'mariana.costa@example.com', '(67) 99555-6677');

INSERT INTO triagens (cliente_id, formato_rosto, estilo_vida, usa_grau, metodo_deteccao)
VALUES (
  (SELECT id FROM clientes WHERE email = 'mariana.costa@example.com'),
  'oval', 'dia-a-dia', 0, 'scan_rapido'
);

-- ----------------------------------------------------------------------------
-- 2) UPDATE — cliente atualiza telefone; pedido pendente é marcado como pago
-- ----------------------------------------------------------------------------
UPDATE clientes
SET telefone = '(67) 98888-0000'
WHERE email = 'fernanda.oliveira@example.com';

UPDATE pedidos
SET status = 'pago'
WHERE id = 2 AND status = 'pendente';

-- ----------------------------------------------------------------------------
-- 3) DELETE — remove uma recomendação específica de uma triagem
--    (ex.: cliente pediu para não considerar mais aquela opção)
-- ----------------------------------------------------------------------------
DELETE FROM triagens_recomendacoes
WHERE triagem_id = 3 AND produto_id = 4;

-- ----------------------------------------------------------------------------
-- 4) SELECT — consultas simples
-- ----------------------------------------------------------------------------

-- 4.1) Todos os produtos ordenados por preço
SELECT id, nome, tipo_armacao, preco
FROM produtos
ORDER BY preco ASC;

-- 4.2) Clientes cadastrados a partir de uma determinada data
SELECT nome, email, data_cadastro
FROM clientes
WHERE data_cadastro >= '2024-01-01';

-- ----------------------------------------------------------------------------
-- 5) SELECT com JOIN — consultas relacionando múltiplas tabelas
-- ----------------------------------------------------------------------------

-- 5.1) Histórico de triagens com o nome do cliente
SELECT
  t.id            AS triagem_id,
  c.nome          AS cliente,
  t.formato_rosto,
  t.estilo_vida,
  t.metodo_deteccao,
  t.data_triagem
FROM triagens t
JOIN clientes c ON c.id = t.cliente_id
ORDER BY t.data_triagem DESC;

-- 5.2) Para cada triagem, quais produtos foram recomendados
SELECT
  t.id          AS triagem_id,
  c.nome        AS cliente,
  t.formato_rosto,
  p.nome        AS produto_recomendado,
  p.tipo_armacao
FROM triagens t
JOIN clientes c ON c.id = t.cliente_id
JOIN triagens_recomendacoes tr ON tr.triagem_id = t.id
JOIN produtos p ON p.id = tr.produto_id
ORDER BY t.id, p.nome;

-- 5.3) Pedidos com valor total (join entre pedidos, itens_pedido e produtos)
SELECT
  ped.id                                   AS pedido_id,
  c.nome                                   AS cliente,
  ped.status,
  SUM(ip.quantidade * ip.preco_unitario)   AS valor_total
FROM pedidos ped
JOIN clientes c ON c.id = ped.cliente_id
JOIN itens_pedido ip ON ip.pedido_id = ped.id
GROUP BY ped.id, c.nome, ped.status
ORDER BY ped.id;

-- 5.4) Clientes que ainda não fizeram nenhum pedido (LEFT JOIN)
SELECT c.id, c.nome, c.email
FROM clientes c
LEFT JOIN pedidos ped ON ped.cliente_id = c.id
WHERE ped.id IS NULL;

-- 5.5) Produto mais recomendado pelo assistente (agregação + ordenação)
SELECT
  p.nome,
  COUNT(*) AS vezes_recomendado
FROM triagens_recomendacoes tr
JOIN produtos p ON p.id = tr.produto_id
GROUP BY p.id, p.nome
ORDER BY vezes_recomendado DESC
LIMIT 5;

-- 5.6) Produtos recomendados especificamente para rosto oval
SELECT DISTINCT p.nome, p.tipo_armacao, p.preco
FROM triagens t
JOIN triagens_recomendacoes tr ON tr.triagem_id = t.id
JOIN produtos p ON p.id = tr.produto_id
WHERE t.formato_rosto = 'oval';
