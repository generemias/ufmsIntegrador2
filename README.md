# Ótica Smart IA

Aplicação web desenvolvida como parte do **Projeto Integrador / Ação de Extensão UFMS Digital**,
que simula o uso de Inteligência Artificial para realizar a triagem inicial de clientes de um
comércio ótico local: o assistente virtual coleta formato de rosto (manualmente ou via escaneamento
por câmera), estilo de vida e informações sobre receita/grau, e recomenda armações do catálogo da
loja com base nessas respostas.

## Tecnologias Utilizadas

- **React 18 + Vite (JavaScript)** — build e dev server rápidos, sem a complexidade de SSR do
  Next.js, que não é necessária aqui já que a aplicação não tem rotas de servidor nem requisitos
  de SEO.
- **Tailwind CSS** (v4) — estilização utilitária responsiva, mobile-first.
- **SVG inline** — ícones de interface e ilustrações dos tipos de armação no catálogo, sem depender de imagens externas.
- **MediaPipe Face Landmarker** (`@mediapipe/tasks-vision`) e **OpenCV.js** (`@techstark/opencv-js`) — usados apenas no modo "Scan Completo" da câmera, carregados sob demanda, para extrair medidas faciais reais a partir da foto capturada.

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

**Captura e análise facial por câmera:** além de responder manualmente, o usuário pode usar a
câmera do dispositivo (`CameraCapture.jsx`) para "escanear" o rosto — a aplicação solicita
permissão via `getUserMedia`, exibe o feed de vídeo em tempo real e, ao capturar a foto, desenha o
frame num `<canvas>` oculto para gerar uma imagem estática e liberar a câmera imediatamente. A
análise de formato de rosto (`analyzeFaceFromImage`) é simulada no navegador — nenhuma imagem é
enviada a servidores externos — com um delay de 1,5s e um resultado determinístico por foto
(a mesma imagem sempre gera o mesmo formato detectado), que se integra automaticamente ao fluxo de
recomendação já existente. Caso o navegador não suporte câmera ou a permissão seja negada, a
aplicação exibe uma mensagem amigável e mantém as opções manuais do chat sempre disponíveis como
alternativa.

**Scan Completo — medidas faciais reais via câmera:** além do "Scan Rápido" (simulado), o usuário
pode escolher o "Scan Completo", que segura um cartão de referência (crédito, débito ou RG —
padrão ISO/IEC 7810 ID-1, 85,6mm de largura) ao lado do rosto na foto para calibrar a escala da
imagem. A partir daí, o **MediaPipe Face Landmarker** detecta os pontos faciais (incluindo a íris,
para a distância pupilar) e o **OpenCV.js** localiza automaticamente o contorno do cartão por
detecção de bordas/contornos, calculando a razão pixels-por-milímetro. Com essa calibração, a
aplicação extrai medidas reais em milímetros (distância pupilar, largura e altura do rosto,
distância entre as têmporas, comprimento do nariz e largura da ponte nasal) e classifica o formato
do rosto a partir das proporções reais — tudo rodando inteiramente no navegador (bibliotecas
carregadas sob demanda via `import()` dinâmico), sem que nenhuma imagem ou medida saia do
dispositivo. Caso o cartão ou o rosto não sejam identificados com confiança suficiente, a
aplicação nunca exibe uma medida "inventada": mostra uma mensagem de erro clara e permite nova
tentativa, mantendo o "Scan Rápido" sempre disponível como alternativa mais leve.

## Autoria

Andryw Alves — Tecnologia da Informação — UFMS Digital
