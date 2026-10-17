# Ótica Smart IA — Design Spec

Data: 2026-10-17
Projeto: Projeto Integrador / Ação de Extensão UFMS Digital — Módulo 2

## 1. Objetivo

Construir uma aplicação web (SPA) para um comércio ótico local que simula o uso
de Inteligência Artificial para fazer a triagem inicial de clientes, coletar
preferências (formato de rosto, estilo de vida, grau/receita) e recomendar
armações do catálogo da loja com base em regras determinísticas que imitam uma
resposta de IA.

Não há backend nem persistência de dados — tudo roda no navegador, estado em
memória (React state), sem autenticação e sem chamadas de rede reais para IA.

## 2. Stack

- **Front-end:** React 18 + Vite, JavaScript (sem TypeScript).
- **Estilização:** Tailwind CSS, mobile-first.
- **Ícones:** lucide-react (ícones de interface) + formas SVG inline próprias
  para representar os tipos de armação no catálogo (sem imagens externas).
- **IA:** módulo mock em `src/services/recommendationService.js` com regras
  determinísticas + delay assíncrono (`Promise` + `setTimeout`, 800–1500ms
  aleatório) para simular uma chamada de API real.

Justificativa: Vite dá build/dev rápido sem a complexidade de SSR do Next.js,
que não é necessária aqui (sem rotas de servidor, sem SEO crítico). JavaScript
puro foi escolhido para reduzir fricção de setup, já que o projeto é de porte
pequeno/médio e acadêmico.

## 3. Estrutura de arquivos

```
src/
  components/
    Header.jsx
    Hero.jsx
    ChatAssistant.jsx
    ProductCatalog.jsx
    ProductCard.jsx
    Footer.jsx
  services/
    recommendationService.js
  data/
    products.js
  App.jsx
  main.jsx
  index.css
README.md
```

Não há pasta `src/types/` porque o projeto usa JavaScript puro (sem TS);
requisito de tipagem é atendido via JSDoc leve nos módulos de dados/serviço
onde agregar clareza (ex. shape de produto, shape de preferências).

## 4. Componentes

### Header
- Logo/nome "Ótica Smart IA" (texto estilizado, sem imagem externa).
- Nav com âncoras para seções (Início, Assistente, Catálogo).
- Badge/indicador "Projeto de Extensão UFMS Digital".
- `<header>` semântico, `<nav aria-label="Navegação principal">`.

### Hero
- `<section>` com título, subtítulo explicando a triagem inteligente, CTA que
  rola até o ChatAssistant.

### ChatAssistant
- Estado interno: `messages` (array `{id, role: 'user'|'ai', text}`),
  `step` (índice da etapa guiada: 0=formato de rosto, 1=estilo de vida,
  2=grau/receita, 3=concluído), `isLoading`, `preferences` (objeto acumulado).
- Fluxo guiado por padrão: a cada etapa a IA pergunta algo e oferece botões de
  resposta rápida (ex. etapa 0: Oval / Redondo / Quadrado / Coração). O
  usuário também pode digitar livremente no campo de texto em qualquer etapa;
  um parser simples de palavras-chave tenta mapear o texto livre para a opção
  da etapa atual (ex. contém "redondo" → formato redondo). Se não reconhecer
  nada, a IA responde pedindo para escolher uma das opções ou reformular.
- Ao concluir as 3 etapas, chama `recommendationService.getRecommendation(preferences)`
  (assíncrono), mostra indicador de "digitando/analisando" (`isLoading`),
  e ao resolver exibe mensagem da IA com o resumo da recomendação e eleva o
  resultado via prop callback `onRecommendation(result)` para `App`.
- Botão "Recomeçar triagem" reseta o estado.
- Acessibilidade: `<section aria-label="Assistente virtual de triagem">`,
  lista de mensagens como `<ul>`/`<li>` com `aria-live="polite"` na área de
  mensagens para leitores de tela anunciarem novas respostas, inputs com
  `aria-label`, Enter envia mensagem, botões de resposta rápida focáveis via
  Tab.

### ProductCatalog
- Recebe `recommendation` (ou null) de `App`.
- Grid responsivo (1 coluna mobile, 2 tablet, 3–4 desktop) de `ProductCard`.
- Toggle "Mostrar só recomendados" quando há recomendação ativa.
- Produtos recomendados: calculados via `useMemo` comparando
  `product.recommendedFaceShapes` / `product.frameType` com o resultado da IA.

### ProductCard
- `<article>` com nome, SVG ilustrativo do tipo de armação, tipo, faixa de
  preço, selo "Recomendado pela IA" (condicional), botão "Ver detalhes" (abre
  modal/expansão simples com descrição — sem rota separada).

### Footer
- `<footer>` com texto sobre o projeto de extensão UFMS Digital, ano,
  direitos autorais, e link institucional (texto, sem URL externa real
  obrigatória — pode ser texto "UFMS Digital").

## 5. Dados mock (`src/data/products.js`)

8–10 produtos, cada um com:
```js
{
  id: string,
  name: string,
  frameType: 'quadrada' | 'redonda' | 'retangular' | 'aviador' | 'gatinho' | 'oval',
  recommendedFaceShapes: Array<'oval'|'redondo'|'quadrado'|'coracao'>,
  lifestyleTags: Array<'dia-a-dia'|'esportivo'|'trabalho'|'leitura'>,
  priceRange: '$' | '$$' | '$$$',
  description: string,
}
```

## 6. Lógica de recomendação (`src/services/recommendationService.js`)

Função pura `buildRecommendation(preferences)` (sincrônica, testável em
princípio, mas sem suíte de testes neste momento) + wrapper assíncrono
`getRecommendation(preferences)` que resolve após delay simulado.

Regras base (formato de rosto → tipos de armação prioritários):
- `redondo` → `quadrada`, `retangular`
- `quadrado` → `redonda`, `oval`
- `oval` → `aviador`, `quadrada`, `retangular` (quase tudo funciona)
- `coracao` → `redonda`, `gatinho` (leve na parte inferior)

Estilo de vida ajusta texto de recomendação (ex. "esportivo" sugere menção a
armações leves/resistentes) mas não filtra o catálogo — é só contexto textual
retornado pela IA mock.

Retorno: `{ faceShape, lifestyle, recommendedFrameTypes: string[], message: string }`.
`ProductCatalog` usa `recommendedFrameTypes` para destacar/filtrar produtos
cujo `frameType` esteja na lista.

## 7. Estados de loading/erro

- `isLoading` no ChatAssistant mostra "IA está analisando suas respostas..."
  com indicador animado (dots) enquanto a Promise do recommendationService
  não resolve.
- Erro simples: se o usuário envia mensagem vazia, a IA não processa e exibe
  dica inline (sem crash). Não há chamadas de rede reais, então não há tratamento
  de erro de rede.

## 8. Acessibilidade (resumo)

- HTML semântico completo (`header`, `main`, `section`, `article`, `footer`, `nav`).
- `aria-label` em inputs, botões de ação rápida e áreas de navegação.
- `aria-live="polite"` na lista de mensagens do chat.
- Navegação via teclado: Tab percorre controles, Enter envia mensagem/ativa botão.
- Contraste de cores AA (texto sobre fundo) verificado visualmente nas paletas Tailwind escolhidas.

## 9. Responsividade

Mobile-first com Tailwind: grid do catálogo e layout do chat colapsam para
coluna única em telas pequenas; nav do header colapsa (menu simples, sem
necessidade de hambúrguer complexo dado o número reduzido de itens).

## 10. Fora de escopo (YAGNI)

- Sem backend, sem autenticação, sem persistência (localStorage não é
  necessário para o objetivo acadêmico).
- Sem testes automatizados (decisão explícita do usuário).
- Sem integração real com Gemini/OpenAI (mock apenas, por decisão do usuário).
- Sem imagens externas/assets de rede — só SVG inline e ícones de biblioteca.

## 11. Documentação (README.md)

Conforme requisito, o README deve conter: título/descrição, tecnologias e
justificativas, instruções de instalação/execução (`npm install`, `npm run dev`),
decisões de projeto (acessibilidade, responsividade, estratégia de mock de IA),
e autoria: **Andryw Alves — Tecnologia da Informação — UFMS Digital**.
