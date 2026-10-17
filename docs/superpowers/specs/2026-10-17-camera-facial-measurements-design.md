# Captura de Medidas Faciais Reais via Câmera — Design Spec

Data: 2026-10-17
Projeto: Ótica Smart IA — Projeto Integrador / Ação de Extensão UFMS Digital

## 1. Objetivo

A aplicação já possui um "Scan de Câmera" que simula a detecção do formato de rosto
(`analyzeFaceFromImage`, baseado em checksum, sem nenhuma análise real de imagem). Este spec
adiciona um **segundo fluxo de câmera** — "Scan Completo" — que extrai **medidas faciais reais
em milímetros** (distância pupilar, largura do rosto, altura do rosto, distância entre têmporas,
comprimento do nariz, largura da ponte nasal) a partir da foto capturada, usando bibliotecas de
visão computacional que rodam inteiramente no navegador (sem servidor, sem chave de API, nenhuma
imagem sai do dispositivo).

O "Scan Rápido" (simulado, já existente) permanece inalterado e disponível como alternativa mais
leve/rápida. O usuário escolhe entre os dois.

## 2. Bibliotecas

- **MediaPipe Face Landmarker** (`@mediapipe/tasks-vision`) — detecta 478 landmarks faciais
  (incluindo pontos da íris, essenciais para calcular a distância pupilar com precisão). Roda via
  WASM, 100% client-side, mantido pelo Google.
- **OpenCV.js** — detecção automática do contorno retangular do cartão de referência (crédito,
  débito ou RG — todos seguem o padrão ISO/IEC 7810 ID-1, 85,60mm × 53,98mm) via detecção de
  bordas/contornos + filtro por proporção esperada (~1,586:1). Usado exclusivamente para calcular
  a escala pixels-por-milímetro da foto.

Ambas as bibliotecas são **carregadas sob demanda** (`import()` dinâmico), apenas quando o usuário
escolhe "Scan Completo" pela primeira vez — o bundle principal da aplicação e o "Scan Rápido"
continuam leves, sem essas dependências pesadas (WASM + modelos, dezenas de MB somadas).

## 3. Por que calibração por cartão (e não suposição de média populacional)

Medidas em milímetros exigem uma referência de escala conhecida na foto — não é possível derivar
tamanho real só a partir de pixels. A alternativa mais simples (assumir uma largura média de rosto
humano, ~140mm) produziria uma "medida real" que na verdade é uma estimativa populacional, não uma
medição genuína da pessoa — pode ficar significativamente errada para rostos fora da média. Por
isso o fluxo completo exige que o usuário segure um cartão padrão ID-1 ao lado do rosto na foto; o
cartão fornece a referência de escala real para aquela foto específica.

A detecção do cartão é automática (sem marcação manual de cantos pelo usuário), usando OpenCV.js.
Essa escolha prioriza uma experiência mais fluida, com a contrapartida de que a detecção automática
de contornos retangulares é sensível a iluminação, fundo e enquadramento — por isso o tratamento de
erro (seção 7) nunca apresenta uma medida sem confiança suficiente na calibração.

## 4. Estrutura de arquivos

```
src/services/
  faceAnalysisService.js       (novo — pipeline de visão computacional)
  recommendationService.js     (inalterado — regras de recomendação + analyzeFaceFromImage simulado)
src/components/
  CameraCapture.jsx             (modificado — adiciona escolha de modo + novos estados de UI)
```

`faceAnalysisService.js` é um módulo isolado: carrega as bibliotecas sob demanda, expõe uma única
função pública, e não depende de nada do `recommendationService.js` nem do React. Essa separação
mantém `recommendationService.js` como está hoje (regras determinísticas + simulação), sem misturar
a lógica de visão computacional real com a lógica de recomendação.

## 5. Interface do serviço

```js
/**
 * @typedef {{
 *   pupillaryDistanceMm: number,
 *   faceWidthMm: number,
 *   faceHeightMm: number,
 *   templeToTempleMm: number,
 *   noseLengthMm: number,
 *   noseBridgeWidthMm: number,
 * }} FaceMeasurements
 *
 * @typedef {
 *   { success: true, faceShape: 'oval'|'redondo'|'quadrado'|'coracao', measurements: FaceMeasurements } |
 *   { success: false, errorReason: 'card-not-found'|'face-not-found'|'low-confidence'|'load-failed' }
 * } FaceAnalysisResult
 */

/**
 * @param {string} imageDataUrl
 * @returns {Promise<FaceAnalysisResult>}
 */
export function analyzeFaceWithCard(imageDataUrl)
```

### Pipeline interno

1. Carrega MediaPipe e OpenCV.js sob demanda (uma vez por sessão; falha aqui retorna
   `{ success: false, errorReason: 'load-failed' }`).
2. OpenCV.js localiza o contorno retangular do cartão na imagem (escala de cinza → detecção de
   bordas → busca de contornos → filtro por proporção ~1,586:1 e tamanho mínimo plausível). Se
   nenhum contorno adequado for encontrado, ou a confiança for baixa: `errorReason: 'card-not-found'`.
3. Calcula a razão pixels-por-milímetro usando a maior dimensão do cartão detectado (85,60mm).
4. MediaPipe Face Landmarker processa a mesma imagem e retorna os 478 landmarks + pontos de íris.
   Se nenhum rosto for detectado, ou a confiança for baixa: `errorReason: 'face-not-found'`.
5. Calcula as distâncias em pixel entre os landmarks relevantes e converte para mm usando a razão
   da etapa 3:
   - **Distância pupilar:** distância entre os centros das duas íris.
   - **Largura do rosto:** distância entre os pontos bizigomáticos (extremos laterais na altura das
     maçãs do rosto).
   - **Altura do rosto:** distância entre o ponto mais alto da testa (linha do cabelo aproximada
     pelos landmarks superiores) e o queixo.
   - **Distância entre têmporas:** distância entre os pontos de landmark das têmporas.
   - **Comprimento do nariz:** distância entre a base das sobrancelhas (raiz do nariz) e a ponta do
     nariz.
   - **Largura da ponte nasal:** distância entre os cantos internos dos olhos.
6. Classifica o formato do rosto a partir das proporções reais calculadas (não mais checksum):
   razão largura/altura do rosto, e comparação largura da testa vs. largura da mandíbula, seguindo
   a mesma lógica conceitual de visagismo já usada no texto do "Scan Rápido" (ex.: largura ≈ altura
   e contornos suaves → oval; largura da mandíbula marcadamente menor que a testa → coração).
7. Retorna `{ success: true, faceShape, measurements }`.

Esta função substitui `analyzeFaceFromImage` **apenas no fluxo "Scan Completo"**. O "Scan Rápido"
continua chamando `analyzeFaceFromImage` do `recommendationService.js`, sem nenhuma alteração.

## 6. Fluxo de UI (`CameraCapture.jsx`)

No estado `idle`, dois botões lado a lado:
- **"Scan Rápido"** — fluxo atual, inalterado.
- **"Scan Completo (medidas reais)"** — novo fluxo descrito abaixo.

Ao escolher "Scan Completo":
1. Pede permissão de câmera (mesmo mecanismo já existente).
2. Antes de capturar, mostra uma instrução fixa na tela: "Segure um cartão (crédito, débito ou RG)
   ao lado do rosto, bem visível, e capture a foto."
3. Captura a foto (mesmo mecanismo de `<canvas>` oculto já existente) e para o stream da câmera.
4. Processa em etapas visíveis, cada uma com seu próprio texto de status (`aria-live="polite"`,
   consistente com o padrão já usado no chat):
   - "Carregando modelos de análise..." (só na primeira vez que as bibliotecas são carregadas nessa
     sessão)
   - "Detectando cartão de referência..."
   - "Analisando proporções faciais..."
5. Em caso de sucesso: mostra a foto capturada + a lista de medidas (rótulo + valor em mm) + a
   mensagem com o formato de rosto detectado + os dois botões já existentes ("Usar este resultado"
   / "Tirar outra foto").
6. Em caso de erro: ver seção 7.

Ao confirmar ("Usar este resultado"), chama `onDetected(faceShape, displayText)` exatamente como o
fluxo atual — nenhuma mudança em `ChatAssistant.jsx`, `App.jsx` ou `ProductCatalog.jsx`. As medidas
em mm não são persistidas nem enviadas para o `recommendationService` — são apenas exibidas ao
usuário como o resultado "bruto" da análise; a recomendação de armação continua baseada no
`faceShape` detectado, como já acontece hoje.

## 7. Tratamento de erros

| Situação | `errorReason` | Mensagem ao usuário | Ação disponível |
|---|---|---|---|
| Bibliotecas não carregam (rede lenta, navegador sem suporte a WASM) | `load-failed` | "Não foi possível carregar o modelo de análise. Tente o Scan Rápido ou tente novamente mais tarde." | Voltar para escolha de modo (Scan Rápido continua disponível) |
| Cartão não encontrado na foto / confiança baixa | `card-not-found` | "Não conseguimos identificar o cartão na foto. Segure-o bem visível, sem reflexos, e tente novamente." | "Tirar outra foto" |
| Rosto não encontrado na foto / confiança baixa | `face-not-found` | "Não conseguimos identificar seu rosto na foto. Tente novamente com mais luz e o rosto centralizado." | "Tirar outra foto" |

Em nenhum caso uma medida é exibida sem confiança suficiente na detecção do cartão e do rosto — o
sistema falha de forma clara e permite nova tentativa, em vez de apresentar um número potencialmente
incorreto como se fosse exato. As opções manuais do chat (texto livre / botões de resposta rápida)
e o "Scan Rápido" permanecem sempre disponíveis como alternativa, independentemente do estado do
"Scan Completo".

## 8. Acessibilidade e responsividade

Segue os mesmos padrões já estabelecidos no projeto: `aria-live="polite"` nos textos de status,
`role="alert"` nas mensagens de erro, botões nativos com `aria-label` quando o texto visível não é
autoexplicativo, layout responsivo com Tailwind (mobile-first), sem overflow horizontal.

## 9. Verificação

Sem framework de testes automatizados (decisão já estabelecida no projeto). Verificação por:

- **Lógica pura de geometria/classificação** (conversão pixel→mm dado uma razão de calibração, e
  classificação de formato a partir de proporções): scripts `node` pontuais com landmarks
  sintéticos fixos, no mesmo padrão já usado para `buildRecommendation`.
- **Fluxo de UI e integração:** verificação manual no browser. Como o ambiente de teste não tem
  acesso a uma câmera real nem a um cartão físico, a verificação do pipeline completo de visão
  computacional (MediaPipe + OpenCV.js) usa um stream de câmera simulado (`canvas.captureStream()`
  desenhando um rosto/cartão sintéticos), no mesmo padrão usado para corrigir o bug do `srcObject`
  anteriormente. Os estados de erro (`card-not-found`, `face-not-found`) são verificáveis chamando
  `analyzeFaceWithCard` diretamente com imagens que não contêm cartão/rosto.
- O fluxo com câmera e cartão reais deve ser validado manualmente pelo usuário após a implementação,
  já que a fidelidade de detecção sob condições reais de iluminação/fundo não é totalmente
  reproduzível no ambiente de teste automatizado.

## 10. Fora de escopo (YAGNI)

- Persistência das medidas (não há backend; medidas existem só durante a sessão do navegador).
- Calibração manual (marcação de cantos do cartão) — ficou fora por decisão do usuário em favor da
  detecção automática.
- Suporte a outros objetos de referência além do padrão de cartão ID-1.
- Uso das medidas em mm para filtrar/ordenar o catálogo por tamanho de armação — o catálogo
  continua sendo filtrado por `frameType` como hoje; as medidas são informativas para o usuário.
- Qualquer envio de imagem ou medida a um servidor — tudo permanece 100% client-side.
