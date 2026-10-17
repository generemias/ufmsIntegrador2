# Ótica Smart IA Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a single-page React app that simulates an AI-driven triage chat for an optical shop, recommending frames from a mock catalog based on face shape and lifestyle answers.

**Architecture:** Vite + React (JavaScript) SPA, no backend. A mock "AI" lives in `src/services/recommendationService.js` — a pure rule-based function wrapped in an async delay. `App.jsx` holds the lifted `recommendation` state; `ChatAssistant` writes to it, `ProductCatalog` reads it to highlight/filter cards.

**Tech Stack:** React 18, Vite, Tailwind CSS, lucide-react icons, inline SVG for frame-shape illustrations.

**Spec:** [docs/superpowers/specs/2026-10-17-otica-smart-ia-design.md](../specs/2026-10-17-otica-smart-ia-design.md)

## Global Constraints

- No backend, no authentication, no persistence (no localStorage) — everything lives in React state.
- No automated test framework (user decision) — verification is manual, via dev server + browser, plus one-off `node` sanity checks for pure logic.
- No real AI API calls — `recommendationService` is fully local/deterministic with a simulated 800–1500ms random delay.
- No external image/network assets — frame illustrations are inline SVG; icons from `lucide-react`.
- JavaScript only, no TypeScript, no `src/types/` folder (JSDoc only where it adds clarity).
- Tailwind CSS, mobile-first responsive layout (1 col mobile → 2 tablet → 3–4 desktop for the catalog grid).
- README author line must read exactly: "Andryw Alves — Tecnologia da Informação — UFMS Digital".

## Review Focus

- Empty or whitespace-only chat input submitted — the UI must show an inline hint and not crash or advance the step.
- Free-text input during a guided step that matches no known keyword — the AI must ask the user to pick an option or rephrase, not silently advance or break the flow.
- Face shape `oval`, whose recommended frame list overlaps several frame types — the catalog filter must still show the matching subset, never collapse to zero results.
- Restarting the chat mid-flow — previous preferences and the lifted `recommendation` must fully clear, so the catalog's highlight/filter also resets instead of showing stale results.
- Keyboard-only use of the chat (Tab between quick-reply buttons, Enter to submit text) — must work without a mouse.

---

## Task 1: Project scaffolding (Vite + React + Tailwind)

**Files:**
- Create: `package.json`, `vite.config.js`, `tailwind.config.js`, `postcss.config.js`, `index.html`
- Create: `src/main.jsx`, `src/index.css`, `src/App.jsx`

**Interfaces:**
- Produces: `App` default export (React component) rendered into `#root`; Tailwind utility classes available in all later components via `src/index.css` `@tailwind` directives.

- [ ] **Step 1: Scaffold the Vite React project**

Run: `npm create vite@latest . -- --template react` (JavaScript template, not TS). Accept overwriting the empty directory.

- [ ] **Step 2: Add Tailwind CSS**

Run: `npm install -D tailwindcss postcss autoprefixer` then `npx tailwindcss init -p`. Configure `tailwind.config.js` `content: ["./index.html", "./src/**/*.{js,jsx}"]`. Replace `src/index.css` contents with the three `@tailwind base; @tailwind components; @tailwind utilities;` directives.

- [ ] **Step 3: Add lucide-react**

Run: `npm install lucide-react`.

- [ ] **Step 4: Replace `src/App.jsx` with a placeholder**

`App` renders a single `<main>` with an `<h1>` reading "Ótica Smart IA" styled with a Tailwind utility class, to confirm the pipeline (Vite + React + Tailwind) works end to end.

- [ ] **Step 5: Run the dev server and verify in browser**

Run: `npm run dev`. Open the printed local URL in the browser. Expected: page renders "Ótica Smart IA" heading with Tailwind styling applied (not unstyled browser-default text).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: scaffold Vite+React+Tailwind project"
```

---

## Task 2: Mock product data

**Files:**
- Create: `src/data/products.js`

**Interfaces:**
- Produces: `export const PRODUCTS` — array of 8–10 objects shaped exactly as:
  ```js
  /** @typedef {{
    id: string,
    name: string,
    frameType: 'quadrada'|'redonda'|'retangular'|'aviador'|'gatinho'|'oval',
    recommendedFaceShapes: Array<'oval'|'redondo'|'quadrado'|'coracao'>,
    lifestyleTags: Array<'dia-a-dia'|'esportivo'|'trabalho'|'leitura'>,
    priceRange: '$'|'$$'|'$$$',
    description: string,
  }} Product */
  ```

- [ ] **Step 1: Write `src/data/products.js`**

Define and export `PRODUCTS`, an array of 8–10 products covering all six `frameType` values at least once and all four `recommendedFaceShapes` values at least once across the set, so every guided-chat answer has at least one matching product. Each `description` is a short (≤120 char) Portuguese sentence.

- [ ] **Step 2: Sanity-check the data shape**

Run: `node --input-type=module -e "import {PRODUCTS} from './src/data/products.js'; console.log(PRODUCTS.length, PRODUCTS.every(p => p.id && p.frameType && p.recommendedFaceShapes.length && p.priceRange))"`
Expected output: a number between 8 and 10, followed by `true`.

- [ ] **Step 3: Commit**

```bash
git add src/data/products.js
git commit -m "feat: add mock optical products catalog data"
```

---

## Task 3: Recommendation service (mock AI logic)

**Files:**
- Create: `src/services/recommendationService.js`

**Interfaces:**
- Consumes: nothing (pure module).
- Produces:
  - `buildRecommendation(preferences)` — sync, pure. `preferences: { faceShape: 'oval'|'redondo'|'quadrado'|'coracao', lifestyle: string }` → returns `{ faceShape, lifestyle, recommendedFrameTypes: string[], message: string }`.
  - `getRecommendation(preferences)` — async wrapper. Returns a `Promise` that resolves to the same shape as `buildRecommendation`, after a random delay between 800 and 1500ms.

- [ ] **Step 1: Write `buildRecommendation`**

Implement the face-shape → frame-type table exactly as specified:
- `redondo` → `['quadrada', 'retangular']`
- `quadrado` → `['redonda', 'oval']`
- `oval` → `['aviador', 'quadrada', 'retangular']`
- `coracao` → `['redonda', 'gatinho']`

`message` is a short Portuguese sentence summarizing the recommendation and referencing `lifestyle` when present (e.g., mentions "leve e resistente" if lifestyle contains "esportivo").

- [ ] **Step 2: Write `getRecommendation` as an async wrapper**

Wraps `buildRecommendation` in `new Promise(resolve => setTimeout(() => resolve(buildRecommendation(preferences)), delay))` where `delay` is `800 + Math.random() * 700`.

- [ ] **Step 3: Sanity-check all four face shapes**

Run: `node --input-type=module -e "import {buildRecommendation} from './src/services/recommendationService.js'; for (const fs of ['oval','redondo','quadrado','coracao']) console.log(fs, buildRecommendation({faceShape: fs, lifestyle: 'dia-a-dia'}).recommendedFrameTypes)"`
Expected: four lines, each listing the exact frame-type array from Step 1 for that face shape, in that order, never an empty array.

- [ ] **Step 4: Commit**

```bash
git add src/services/recommendationService.js
git commit -m "feat: add mock AI recommendation service"
```

---

## Task 4: Static layout (Header, Hero, Footer)

**Files:**
- Create: `src/components/Header.jsx`, `src/components/Hero.jsx`, `src/components/Footer.jsx`
- Modify: `src/App.jsx`

**Interfaces:**
- Produces: `Header` (no props), `Hero` (props: `{ onCtaClick: () => void }` — scrolls to the chat section), `Footer` (no props). All default exports.

- [ ] **Step 1: Write `Header.jsx`**

`<header>` with the "Ótica Smart IA" wordmark, a `<nav aria-label="Navegação principal">` with anchor links to `#assistente` and `#catalogo`, and a badge/span reading "Projeto de Extensão UFMS Digital".

- [ ] **Step 2: Write `Hero.jsx`**

`<section id="hero">` with a heading, a one-paragraph explanation of the AI triage, and a CTA `<button>` calling `onCtaClick`.

- [ ] **Step 3: Write `Footer.jsx`**

`<footer>` with project/extension info, current year copyright line, and "UFMS Digital" institutional text.

- [ ] **Step 4: Wire into `App.jsx`**

`App` renders `<Header />`, `<Hero onCtaClick={...} />` (scrolls to the `#assistente` section via `document.getElementById('assistente').scrollIntoView()`), placeholder `<section id="assistente">` and `<section id="catalogo">` (filled in later tasks), and `<Footer />`.

- [ ] **Step 5: Verify in browser**

Run `npm run dev`, open the app. Expected: header/nav/badge visible, hero CTA click smooth-scrolls to the (currently empty) assistant section, footer visible at the bottom.

- [ ] **Step 6: Commit**

```bash
git add src/components/Header.jsx src/components/Hero.jsx src/components/Footer.jsx src/App.jsx
git commit -m "feat: add header, hero and footer layout"
```

---

## Task 5: Product catalog (ProductCard + ProductCatalog)

**Files:**
- Create: `src/components/ProductCard.jsx`, `src/components/ProductCatalog.jsx`
- Modify: `src/App.jsx`

**Interfaces:**
- Consumes: `PRODUCTS` from `src/data/products.js` (Task 2); `recommendation` shape from Task 3 (`{ recommendedFrameTypes: string[] } | null`).
- Produces:
  - `ProductCard` props: `{ product: Product, isRecommended: boolean }`.
  - `ProductCatalog` props: `{ recommendation: { recommendedFrameTypes: string[] } | null }`.

- [ ] **Step 1: Write `ProductCard.jsx`**

`<article>` rendering an inline SVG icon chosen by a `frameType → svg` lookup (one simple distinct SVG shape per the six `frameType` values), `name`, `frameType`, `priceRange`, `description`, and a "Ver detalhes" button that toggles showing/hiding the description (local `useState`). When `isRecommended` is true, render a visible "Recomendado pela IA" badge and a distinct border/background utility class.

- [ ] **Step 2: Write `ProductCatalog.jsx`**

`<section id="catalogo" aria-label="Catálogo de armações">`. Reads `PRODUCTS`. Computes `recommendedIds` via `useMemo` keyed on `recommendation`: if `recommendation` is null, empty `Set`; else the set of `PRODUCTS` whose `frameType` is in `recommendation.recommendedFrameTypes`. Local `useState` `showOnlyRecommended` (boolean, default false); a toggle control is rendered only when `recommendation` is not null. Renders a responsive grid (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`) of `ProductCard`, filtered by `showOnlyRecommended` when active.

- [ ] **Step 3: Wire into `App.jsx`**

Replace the placeholder `#catalogo` section with `<ProductCatalog recommendation={recommendation} />`, where `recommendation` is `App`'s own state, initialized to `null` (lifted fully in Task 6).

- [ ] **Step 4: Verify in browser**

Run `npm run dev`. Expected: catalog section shows 8–10 cards in a responsive grid (resize the window to confirm column count changes), "Ver detalhes" expands/collapses the description, no recommendation badge or toggle shown yet (since `recommendation` is still `null`).

- [ ] **Step 5: Commit**

```bash
git add src/components/ProductCard.jsx src/components/ProductCatalog.jsx src/App.jsx
git commit -m "feat: add product catalog grid with recommendation highlighting"
```

---

## Task 6: Chat assistant (guided triage + free text)

**Files:**
- Create: `src/components/ChatAssistant.jsx`
- Modify: `src/App.jsx`

**Interfaces:**
- Consumes: `getRecommendation(preferences)` from `src/services/recommendationService.js` (Task 3).
- Produces: `ChatAssistant` props: `{ onRecommendation: (result) => void }` — called once with the resolved recommendation object when the guided flow completes. Also calls `onRecommendation(null)` when the user clicks "Recomeçar triagem".

- [ ] **Step 1: Define the guided step sequence and quick-reply options**

Three steps, each with a prompt and quick-reply labels:
- Step 0 (`faceShape`): "Qual é o formato do seu rosto?" → options `Oval`, `Redondo`, `Quadrado`, `Coração` (mapping to `oval`/`redondo`/`quadrado`/`coracao`).
- Step 1 (`lifestyle`): "Como é o seu estilo de vida no dia a dia?" → options `Dia a dia`, `Esportivo`, `Trabalho`, `Leitura` (mapping to the same tag values used in `products.js`).
- Step 2 (`prescription`): "Você usa grau ou receita médica?" → options `Sim, uso grau`, `Não uso grau` (free text accepted here too, not matched against `buildRecommendation` — stored only for the summary message).

- [ ] **Step 2: Implement state and message list**

`useState` for `messages` (array of `{id, role: 'ai'|'user', text}`), `step` (0–3, 3 = done), `preferences` (`{faceShape, lifestyle, prescription}`), `isLoading`, `inputValue`. On mount, seed `messages` with the step-0 AI prompt.

- [ ] **Step 3: Implement quick-reply buttons and free-text fallback**

Quick-reply buttons for the current step call a shared `handleAnswer(stepKey, value, displayText)`: appends a user message with `displayText`, updates `preferences[stepKey]`, advances `step`, appends the next AI prompt (or triggers Step 5 if `step` becomes 3). Free-text submit (Enter key or send button) trims the input; if empty, show an inline hint "Digite algo ou escolha uma opção" and do not advance; otherwise run a keyword match against the current step's option labels (case-insensitive substring match) — on match, call `handleAnswer` with the matched value; on no match, append an AI message asking the user to pick one of the listed options or rephrase, without advancing `step`.

- [ ] **Step 4: Trigger recommendation on completion**

When `step` reaches 3, set `isLoading` true, call `getRecommendation(preferences)`, append the loading AI message ("IA está analisando suas respostas...") while pending. On resolve: append an AI message with `result.message`, set `isLoading` false, call `props.onRecommendation(result)`.

- [ ] **Step 5: Implement "Recomeçar triagem" reset**

A button, visible once `step === 3`, that resets `messages` to the initial seed, `step` to 0, `preferences` to `{}`, and calls `props.onRecommendation(null)`.

- [ ] **Step 6: Accessibility wiring**

Message list is a `<ul>` inside a container with `aria-live="polite"`. Text input has `aria-label="Digite sua mensagem"`. Quick-reply buttons are real `<button>` elements (keyboard-focusable and Enter-activatable by default). Enter key in the text input submits (no modifier required).

- [ ] **Step 7: Wire into `App.jsx`**

`App` holds `recommendation` state (`useState(null)`). Replace the placeholder `#assistente` section with `<ChatAssistant onRecommendation={setRecommendation} />`. Pass `recommendation` to `<ProductCatalog recommendation={recommendation} />` (already wired in Task 5).

- [ ] **Step 8: Manual verification in browser — golden path**

Run `npm run dev`. Walk the full flow: answer "Redondo" → "Esportivo" → "Sim, uso grau" via quick-reply buttons. Expected: loading message appears, then an AI summary message, and the catalog section shows the "Recomendado pela IA" badge only on products with `frameType` `quadrada` or `retangular`.

- [ ] **Step 9: Manual verification — review-focus cases**

In the same running app, check each:
- Submit an empty/whitespace-only message → inline hint shown, step does not advance.
- At step 0, type free text "meu rosto é redondo" → recognized as `redondo`, advances as if the button were clicked.
- At step 0, type unrelated free text "oi" → AI asks to pick an option or rephrase, step stays at 0.
- Complete the flow with "Oval" → catalog shows recommended badges on products of type `aviador`, `quadrada`, and `retangular` (not zero results).
- After completing the flow, click "Recomeçar triagem" → chat resets to step 0 and the catalog's recommended badges/toggle disappear (confirms `recommendation` lifted back to `null`).
- Using only Tab and Enter (no mouse), complete one full guided step via a quick-reply button and submit one free-text message.

- [ ] **Step 10: Commit**

```bash
git add src/components/ChatAssistant.jsx src/App.jsx
git commit -m "feat: add guided chat assistant with mock AI recommendation flow"
```

---

## Task 7: Accessibility/responsiveness polish and README

**Files:**
- Modify: `src/components/Header.jsx`, `src/components/Hero.jsx`, `src/components/ChatAssistant.jsx`, `src/components/ProductCatalog.jsx`, `src/components/ProductCard.jsx`, `src/components/Footer.jsx` (only as needed for fixes found below)
- Create: `README.md`

- [ ] **Step 1: Responsive check across breakpoints**

Using the browser's responsive/resize tool, check mobile (~375px), tablet (~768px), and desktop (~1280px) widths for the Header, Hero, ChatAssistant, and ProductCatalog. Fix any overflow, unreadable text, or broken grid columns found, directly in the relevant component file.

- [ ] **Step 2: Keyboard and contrast check**

Tab through the entire page (Header nav → Hero CTA → chat quick-reply buttons/input → "Ver detalhes" buttons → footer links, if any) confirming every interactive element gets a visible focus ring and is reachable in a logical order. Visually check text/background color pairs against Tailwind's default palette for adequate contrast (dark text on light backgrounds, no light-gray-on-white body text). Fix any gaps found directly in the relevant component file.

- [ ] **Step 3: Write `README.md`**

Sections, in order: (1) title "Ótica Smart IA" + one-paragraph description referencing the UFMS Digital extension project; (2) Tecnologias Utilizadas with the stack from this plan's Tech Stack line and one sentence of justification for Vite+React+JS and for the mock-AI approach; (3) Instalação e Execução: `npm install` then `npm run dev`; (4) Principais Decisões de Projeto: a short paragraph each on accessibility (semantic HTML, aria-live chat log, keyboard support), responsive strategy (Tailwind mobile-first breakpoints), and the mock-AI recommendation logic (rule table + simulated delay, no real API); (5) Autoria: "Andryw Alves — Tecnologia da Informação — UFMS Digital".

- [ ] **Step 4: Final full-app walkthrough**

Run `npm run dev` one more time and repeat the golden-path flow from Task 6 Step 8 end to end to confirm no regression was introduced by the polish pass.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "docs: add README; polish accessibility and responsive layout"
```
