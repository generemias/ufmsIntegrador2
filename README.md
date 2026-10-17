# Ótica Smart IA

Aplicação web desenvolvida como parte do **Projeto Integrador / Ação de Extensão UFMS Digital**,
que simula o uso de Inteligência Artificial para realizar a triagem inicial de clientes de um
comércio ótico local: o assistente virtual coleta formato de rosto, estilo de vida e informações
sobre receita/grau, e recomenda armações do catálogo da loja com base nessas respostas.

## Tecnologias Utilizadas

- **React 18 + Vite (JavaScript)** — build e dev server rápidos, sem a complexidade de SSR do
  Next.js, que não é necessária aqui já que a aplicação não tem rotas de servidor nem requisitos
  de SEO.
- **Tailwind CSS** (v4) — estilização utilitária responsiva, mobile-first.
- **lucide-react** — ícones de interface.
- **SVG inline** — ilustrações dos tipos de armação no catálogo, sem depender de imagens externas.

A "IA" é simulada por um módulo local de regras determinísticas
(`src/services/recommendationService.js`), com um delay assíncrono (800–1500ms) que imita uma
chamada de API real, evitando custos e dependência de chave de API para fins de demonstração
acadêmica.

## Instalação e Execução

```bash
npm install
npm run dev
```

Acesse a URL impressa no terminal (por padrão `http://localhost:5173`).

## Principais Decisões de Projeto

**Acessibilidade:** a aplicação usa HTML semântico completo (`header`, `main`, `section`,
`article`, `footer`, `nav`), com `aria-label` nos inputs, botões de resposta rápida e áreas de
navegação. A lista de mensagens do chat tem `aria-live="polite"` para que leitores de tela
anunciem novas respostas da IA automaticamente. Todos os controles interativos são elementos
nativos (`<button>`, `<input>`, `<a>`), garantindo navegação e ativação via teclado (Tab/Enter)
sem necessidade de JavaScript adicional.

**Estratégia de responsividade:** o layout é mobile-first com Tailwind CSS — o grid do catálogo
usa `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`, passando de uma coluna no celular
a quatro colunas em telas grandes, e o cabeçalho/conteúdo do chat se ajustam com `flex-wrap` para
evitar overflow horizontal em qualquer largura.

**Lógica de integração/simulação da IA:** `recommendationService.js` expõe `buildRecommendation`
(função pura e síncrona) e `getRecommendation` (wrapper assíncrono com delay aleatório). As regras
de recomendação mapeiam formato de rosto para tipos de armação prioritários (ex.: rosto redondo →
armações quadradas/retangulares; rosto oval → aviador, quadrada e retangular), e o estilo de vida
informado pelo usuário é incorporado à mensagem de resposta da IA. Essa abordagem evita custos e
dependência de uma chave de API externa, mantendo a demonstração 100% funcional offline.

## Autoria

Andryw Alves — Tecnologia da Informação — UFMS Digital
