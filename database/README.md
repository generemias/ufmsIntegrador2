# Banco de Dados — Ótica Smart IA

Modelagem relacional do domínio do sistema Ótica Smart IA (clientes, triagens do
assistente virtual, catálogo de produtos, recomendações e pedidos), desenvolvida para a
Avaliação do Módulo 3 (Banco de Dados e Controle de Versão) do Programa de Extensão
UFMS Digital.

SGBD: **SQLite 3**.

## Arquivos

- [`schema.sql`](schema.sql) — DDL: criação das tabelas, chaves primárias/estrangeiras,
  restrições (`CHECK`, `UNIQUE`, `NOT NULL`) e índices.
- [`seed.sql`](seed.sql) — DML: dados de exemplo (clientes, catálogo de produtos
  reaproveitado de `src/data/products.js`, triagens, recomendações e pedidos).
- [`queries.sql`](queries.sql) — DML: exemplos comentados de `INSERT`, `UPDATE`,
  `DELETE` e `SELECT` (incluindo `JOIN`s entre múltiplas tabelas e agregações).

## Modelo de dados

- `clientes` **1—N** `triagens` — um cliente pode realizar várias triagens.
- `triagens` **N—N** `produtos`, via `triagens_recomendacoes` — cada triagem pode
  recomendar vários produtos; um produto pode ser recomendado em várias triagens.
- `clientes` **1—N** `pedidos` — um cliente pode fazer vários pedidos.
- `pedidos` **1—N** `itens_pedido` **N—1** `produtos` — um pedido tem vários itens,
  cada item referencia um produto.

## Como executar

Requer o CLI `sqlite3` ou qualquer cliente SQLite (ex.: DB Browser for SQLite).

```bash
sqlite3 otica.db < database/schema.sql
sqlite3 otica.db < database/seed.sql
sqlite3 otica.db < database/queries.sql
```

Alternativamente, com Node.js 22.5+ (módulo nativo `node:sqlite`, sem dependências
extras):

```bash
node -e "
const { DatabaseSync } = require('node:sqlite');
const fs = require('fs');
const db = new DatabaseSync('otica.db');
db.exec(fs.readFileSync('database/schema.sql', 'utf8'));
db.exec(fs.readFileSync('database/seed.sql', 'utf8'));
db.exec(fs.readFileSync('database/queries.sql', 'utf8'));
console.log('OK');
"
```

Os três scripts foram executados e verificados (incluindo que as restrições `FOREIGN
KEY` e `CHECK` de fato rejeitam dados inválidos) antes de serem versionados neste
repositório.
