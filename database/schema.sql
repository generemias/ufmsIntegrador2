-- ============================================================================
-- Ótica Smart IA — Esquema do Banco de Dados
-- SGBD: SQLite 3
-- Projeto de Extensão: Programa de Extensão UFMS Digital (95DX7.200525)
--
-- Modela o domínio do sistema Ótica Smart IA: clientes que passam por
-- triagens (manuais ou por câmera), recebem recomendações de armações do
-- catálogo, e podem realizar pedidos.
-- ============================================================================

PRAGMA foreign_keys = ON;

-- ----------------------------------------------------------------------------
-- clientes
-- ----------------------------------------------------------------------------
CREATE TABLE clientes (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  nome            TEXT NOT NULL,
  email           TEXT NOT NULL UNIQUE,
  telefone        TEXT,
  data_cadastro   TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ----------------------------------------------------------------------------
-- produtos (armações do catálogo da ótica)
-- ----------------------------------------------------------------------------
CREATE TABLE produtos (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  nome            TEXT NOT NULL,
  tipo_armacao    TEXT NOT NULL CHECK (
                    tipo_armacao IN ('quadrada', 'redonda', 'retangular', 'aviador', 'gatinho', 'oval')
                  ),
  faixa_preco     TEXT NOT NULL CHECK (faixa_preco IN ('$', '$$', '$$$')),
  preco           NUMERIC(10, 2) NOT NULL CHECK (preco > 0),
  descricao       TEXT
);

-- ----------------------------------------------------------------------------
-- triagens (sessões de triagem do assistente virtual)
-- ----------------------------------------------------------------------------
CREATE TABLE triagens (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_id        INTEGER NOT NULL,
  formato_rosto     TEXT NOT NULL CHECK (formato_rosto IN ('oval', 'redondo', 'quadrado', 'coracao')),
  estilo_vida       TEXT NOT NULL CHECK (estilo_vida IN ('dia-a-dia', 'esportivo', 'trabalho', 'leitura')),
  usa_grau          INTEGER NOT NULL CHECK (usa_grau IN (0, 1)), -- 0 = não, 1 = sim
  metodo_deteccao   TEXT NOT NULL CHECK (metodo_deteccao IN ('manual', 'scan_rapido', 'scan_completo')),
  data_triagem      TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (cliente_id) REFERENCES clientes (id)
);

-- ----------------------------------------------------------------------------
-- triagens_recomendacoes (N:N entre triagens e produtos recomendados)
-- ----------------------------------------------------------------------------
CREATE TABLE triagens_recomendacoes (
  triagem_id    INTEGER NOT NULL,
  produto_id    INTEGER NOT NULL,
  PRIMARY KEY (triagem_id, produto_id),
  FOREIGN KEY (triagem_id) REFERENCES triagens (id),
  FOREIGN KEY (produto_id) REFERENCES produtos (id)
);

-- ----------------------------------------------------------------------------
-- pedidos
-- ----------------------------------------------------------------------------
CREATE TABLE pedidos (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_id    INTEGER NOT NULL,
  data_pedido   TEXT NOT NULL DEFAULT (datetime('now')),
  status        TEXT NOT NULL DEFAULT 'pendente' CHECK (
                  status IN ('pendente', 'pago', 'enviado', 'entregue', 'cancelado')
                ),
  FOREIGN KEY (cliente_id) REFERENCES clientes (id)
);

-- ----------------------------------------------------------------------------
-- itens_pedido
-- ----------------------------------------------------------------------------
CREATE TABLE itens_pedido (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  pedido_id         INTEGER NOT NULL,
  produto_id        INTEGER NOT NULL,
  quantidade        INTEGER NOT NULL CHECK (quantidade > 0),
  preco_unitario    NUMERIC(10, 2) NOT NULL CHECK (preco_unitario > 0),
  FOREIGN KEY (pedido_id) REFERENCES pedidos (id),
  FOREIGN KEY (produto_id) REFERENCES produtos (id)
);

-- ----------------------------------------------------------------------------
-- Índices para acelerar as consultas mais comuns (buscas por FK)
-- ----------------------------------------------------------------------------
CREATE INDEX idx_triagens_cliente ON triagens (cliente_id);
CREATE INDEX idx_pedidos_cliente ON pedidos (cliente_id);
CREATE INDEX idx_itens_pedido_pedido ON itens_pedido (pedido_id);
CREATE INDEX idx_itens_pedido_produto ON itens_pedido (produto_id);
CREATE INDEX idx_triagens_rec_produto ON triagens_recomendacoes (produto_id);
