# Captura de Medidas Faciais Reais via Câmera Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Scan Completo" camera mode that extracts real facial measurements in millimeters (pupillary distance, face width/height, temple-to-temple, nose length/bridge width) using a credit-card-style reference object for scale calibration, alongside the existing simulated "Scan Rápido".

**Architecture:** A pure geometry/classification module (no library deps, node-testable) is consumed by two independent browser-only detection wrappers — one for the reference card (OpenCV.js contour detection) and one for facial landmarks (MediaPipe Face Landmarker) — which an orchestration function combines into a single public result. `CameraCapture.jsx` gains a mode-selection step and new UI states for the full-scan pipeline; the existing simulated flow (`analyzeFaceFromImage`, `recommendationService.js`) is untouched.

**Tech Stack:** `@mediapipe/tasks-vision` (FaceLandmarker), `@techstark/opencv-js` (OpenCV.js ESM build), both dynamically `import()`-ed only when "Scan Completo" is first used.

**Spec:** [docs/superpowers/specs/2026-10-17-camera-facial-measurements-design.md](../specs/2026-10-17-camera-facial-measurements-design.md)

## Plan-level refinements to the spec

Two small gaps in the spec are resolved here, both because the spec's own approved measurement set doesn't include fields it later references:

- **Classification logic** (spec §5 step 6) mentions "largura da testa vs. mandíbula", but the approved `FaceMeasurements` fields don't include a separate forehead/jaw width. Task 1 below defines classification using only the approved fields (`faceWidthMm`, `faceHeightMm`, `templeToTempleMm`) with exact thresholds.
- **File structure** (spec §4) names only `faceAnalysisService.js` as new. This plan splits the pure math (`faceGeometry.js`), the card detector (`cardDetection.js`), and the landmark extractor (`faceLandmarks.js`) into their own files, with `faceAnalysisService.js` as the single orchestration/public-interface file the spec describes — each piece is independently focused and, for `faceGeometry.js`, independently node-testable without any browser/WASM dependency.
- **Staged status text** (spec §6 step 4) describes three sequential captions ("Carregando modelos...", "Detectando cartão...", "Analisando proporções..."). `analyzeFaceWithCard` is a single `Promise` with no progress callback (adding one purely for cosmetic staging would be overengineering here), so Task 5 shows two real stages instead: "Carregando modelos de análise..." (shown only on the first full-scan of the session) and "Analisando foto (cartão e proporções faciais)..." for the detection call itself.

## Global Constraints

- Reference card: ISO/IEC 7810 ID-1, 85.60mm × 53.98mm (`CARD_WIDTH_MM = 85.6` is always the longer side).
- Card detection is fully automatic (no manual corner marking).
- Both CV libraries are dynamically `import()`-ed, never top-level imports — they must not appear in the main Vite bundle.
- Never return or display a measurement without a confident card + face detection; a failed detection returns a typed error, not a fabricated number.
- "Scan Rápido" (`analyzeFaceFromImage` in `src/services/recommendationService.js`) is not modified.
- Confirming a "Scan Completo" result still calls `onDetected(faceShape, displayText)` exactly as today — no changes to `ChatAssistant.jsx`, `App.jsx`, or `ProductCatalog.jsx`.
- No automated test framework (established project decision). Verification is one-off `node` scripts for pure logic and manual/scripted browser checks via `javascript_tool`, matching the pattern already used in this repo (see `docs/superpowers/plans/2026-10-17-otica-smart-ia.md`).
- 100% client-side: no image or measurement is ever sent to a server.

## Review Focus

- Photo has no card visible at all → `card-not-found`, not a crash or a fabricated measurement (Task 2, Task 4).
- Photo has no face in frame → `face-not-found`, not a crash (Task 3, Task 4).
- A rectangle is detected but at the wrong aspect ratio (e.g. a square object, not an ID-1 card) → must be rejected as not-a-card, not accepted with a wrong mm scale (Task 2).
- MediaPipe's model/WASM fails to load (e.g. CDN unreachable) → `load-failed`, with a path back to "Scan Rápido", not an infinite spinner (Task 4; verified by code review of the try/catch, not an executable test — see Task 4's note).
- Retaking a photo or switching modes mid-flow must not leak a stale captured image, measurements, or camera stream from a previous attempt (Task 5; mirrors the `srcObject` and reset bugs already fixed once in this codebase).

---

## Task 1: Pure geometry and face-shape classification

**Files:**
- Create: `src/services/faceGeometry.js`

**Interfaces:**
- Consumes: nothing (pure module, no library deps).
- Produces:
  - `export const CARD_WIDTH_MM = 85.6`
  - `computeMeasurementsMm(points, cardCornersPx, cardWidthMm = CARD_WIDTH_MM) -> FaceMeasurements`
    - `points`: `{ leftIrisPx, rightIrisPx, foreheadTopPx, chinPx, leftCheekPx, rightCheekPx, leftTemplePx, rightTemplePx, noseRootPx, noseTipPx, leftEyeInnerPx, rightEyeInnerPx }`, each value `{x: number, y: number}` in pixels.
    - `cardCornersPx`: array of 4 `{x, y}` points, in perimeter order (consecutive points are adjacent corners).
    - Returns `{ pupillaryDistanceMm, faceWidthMm, faceHeightMm, templeToTempleMm, noseLengthMm, noseBridgeWidthMm }` (all numbers).
  - `classifyFaceShape(measurements) -> 'oval'|'redondo'|'quadrado'|'coracao'`

- [ ] **Step 1: Implement `computeMeasurementsMm`**

Algorithm: compute the 4 edge lengths of the quadrilateral formed by `cardCornersPx` (distance between consecutive points, wrapping around); `pixelWidth` is the longest edge; `scale = cardWidthMm / pixelWidth`. For each measurement, compute the Euclidean pixel distance between its point pair (`Math.hypot(dx, dy)`) and multiply by `scale`:
- `pupillaryDistanceMm` ← `leftIrisPx` ↔ `rightIrisPx`
- `faceWidthMm` ← `leftCheekPx` ↔ `rightCheekPx`
- `faceHeightMm` ← `foreheadTopPx` ↔ `chinPx`
- `templeToTempleMm` ← `leftTemplePx` ↔ `rightTemplePx`
- `noseLengthMm` ← `noseRootPx` ↔ `noseTipPx`
- `noseBridgeWidthMm` ← `leftEyeInnerPx` ↔ `rightEyeInnerPx`

- [ ] **Step 2: Implement `classifyFaceShape`**

```
ratio = faceWidthMm / faceHeightMm
templeRatio = templeToTempleMm / faceWidthMm

if templeRatio >= 0.95 and ratio < 0.85: return 'coracao'
if ratio >= 0.85 and templeRatio >= 0.90: return 'quadrado'
if ratio >= 0.85: return 'redondo'
return 'oval'
```

- [ ] **Step 3: Verify with a node script**

Run:
```bash
node --input-type=module -e "
import { computeMeasurementsMm, classifyFaceShape, CARD_WIDTH_MM } from './src/services/faceGeometry.js';

const cardCornersPx = [{x:0,y:0},{x:200,y:0},{x:200,y:80},{x:0,y:80}];
const points = {
  leftIrisPx: {x:160,y:50}, rightIrisPx: {x:20,y:50},
  foreheadTopPx: {x:90,y:10}, chinPx: {x:90,y:180},
  leftCheekPx: {x:170,y:100}, rightCheekPx: {x:10,y:100},
  leftTemplePx: {x:165,y:60}, rightTemplePx: {x:15,y:60},
  noseRootPx: {x:90,y:60}, noseTipPx: {x:90,y:90},
  leftEyeInnerPx: {x:100,y:50}, rightEyeInnerPx: {x:80,y:50},
};
const m = computeMeasurementsMm(points, cardCornersPx);
console.log('CARD_WIDTH_MM', CARD_WIDTH_MM);
console.log('measurements', m);
console.log('pupillaryDistanceMm close to 59.92', Math.abs(m.pupillaryDistanceMm - 59.92) < 0.5);

console.log('oval', classifyFaceShape({faceWidthMm:100, faceHeightMm:130, templeToTempleMm:80}));
console.log('coracao', classifyFaceShape({faceWidthMm:110, faceHeightMm:130, templeToTempleMm:108}));
console.log('quadrado', classifyFaceShape({faceWidthMm:120, faceHeightMm:125, templeToTempleMm:112}));
console.log('redondo', classifyFaceShape({faceWidthMm:120, faceHeightMm:122, templeToTempleMm:95}));
"
```
Expected: `pupillaryDistanceMm close to 59.92` → `true`; the four classify lines print `oval`, `coracao`, `quadrado`, `redondo` respectively.

- [ ] **Step 4: Commit**

```bash
git add src/services/faceGeometry.js
git commit -m "feat: add pure facial measurement geometry and shape classification"
```

---

## Task 2: Reference-card detection (OpenCV.js)

**Files:**
- Create: `src/services/cardDetection.js`
- Modify: `package.json` (new dependency)

**Interfaces:**
- Consumes: `@techstark/opencv-js` (dynamically imported inside the function, never at module top level).
- Produces: `detectCardCorners(imageElement) -> Promise<{ cornersPx: Array<{x,y}> } | null>` — `cornersPx` has exactly 4 points in perimeter order (matches Task 1's `cardCornersPx` input); `null` when no card-shaped contour is found.

- [ ] **Step 1: Install the dependency**

Run: `npm install @techstark/opencv-js`

- [ ] **Step 2: Implement `detectCardCorners`**

Algorithm:
1. `const cv = await (await import('@techstark/opencv-js')).default` (confirm against the installed package's actual export shape — it resolves to the `cv` namespace once its WASM is ready).
2. `const src = cv.imread(imageElement)`; convert to grayscale (`cv.cvtColor(..., cv.COLOR_RGBA2GRAY)`); blur (`cv.GaussianBlur`, kernel `new cv.Size(5,5)`); edge-detect (`cv.Canny(..., 50, 150)`); find contours (`cv.findContours(..., cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE)`).
3. For each contour: approximate to a polygon with `cv.approxPolyDP` (epsilon ≈ 2% of the contour's perimeter via `cv.arcLength`); keep only 4-vertex results.
4. For each 4-vertex candidate: compute its 4 edge lengths; compute the ratio of the longest edge to the shortest *adjacent* edge; accept the candidate only if that ratio is within ±15% of `85.6/53.98 ≈ 1.586`, and its enclosed area is at least 2% of the full image area. Among accepted candidates, keep the one whose ratio is closest to 1.586.
5. If one was accepted: return `{ cornersPx: [the 4 points from approxPolyDP] }`. Otherwise return `null`.
6. Call `.delete()` on every `cv.Mat`/`MatVector` created (`src`, `gray`, `blurred`, `edges`, `contours`, `hierarchy`, and any per-contour approx mats) before returning, in both the success and `null` paths.

- [ ] **Step 3: Verify in browser — card-shaped rectangle is accepted**

With the dev server running and the app open, run via `javascript_tool`:
```js
(async () => {
  const canvas = document.createElement('canvas');
  canvas.width = 500; canvas.height = 350;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'black'; ctx.fillRect(0, 0, 500, 350);
  ctx.fillStyle = 'white'; ctx.fillRect(100, 100, 272, 171); // 272/171 ≈ 1.590
  const img = new Image();
  img.src = canvas.toDataURL();
  await new Promise(r => { img.onload = r });
  const { detectCardCorners } = await import('/src/services/cardDetection.js');
  const result = await detectCardCorners(img);
  return JSON.stringify({ found: !!result, cornerCount: result?.cornersPx.length });
})();
```
Expected: `{"found":true,"cornerCount":4}`.

- [ ] **Step 4: Verify in browser — no rectangle is rejected**

Same setup, but `ctx.fillRect` is skipped (canvas stays solid black). Run `detectCardCorners(img)`.
Expected: `null`.

- [ ] **Step 5: Verify in browser — wrong-aspect-ratio rectangle is rejected**

Same setup, but draw a square instead (`ctx.fillRect(100, 100, 200, 200)`, aspect ratio 1.0, well outside the ±15% band around 1.586).
Expected: `null`.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json src/services/cardDetection.js
git commit -m "feat: add automatic reference-card detection via OpenCV.js"
```

---

## Task 3: Facial landmark extraction (MediaPipe)

**Files:**
- Create: `src/services/faceLandmarks.js`
- Modify: `package.json` (new dependency)

**Interfaces:**
- Consumes: `@mediapipe/tasks-vision` (dynamically imported inside the function).
- Produces: `extractNamedLandmarks(imageElement) -> Promise<NamedPoints | null>` — `NamedPoints` is exactly the `points` shape Task 1's `computeMeasurementsMm` consumes (`leftIrisPx`, `rightIrisPx`, `foreheadTopPx`, `chinPx`, `leftCheekPx`, `rightCheekPx`, `leftTemplePx`, `rightTemplePx`, `noseRootPx`, `noseTipPx`, `leftEyeInnerPx`, `rightEyeInnerPx`); `null` when no face is detected.

- [ ] **Step 1: Install the dependency**

Run: `npm install @mediapipe/tasks-vision`

- [ ] **Step 2: Implement `extractNamedLandmarks`**

Algorithm:
1. Dynamically import `{ FilesetResolver, FaceLandmarker }` from `@mediapipe/tasks-vision`.
2. Lazily create and cache a single `FaceLandmarker` instance at module scope (so repeated calls in the same session reuse it instead of reloading the model):
   ```js
   const filesetResolver = await FilesetResolver.forVisionTasks(
     'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm',
   )
   const landmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
     baseOptions: {
       modelAssetPath:
         'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
     },
     runningMode: 'IMAGE',
     numFaces: 1,
   })
   ```
   Confirm these URLs still resolve at implementation time (a quick manual fetch check); update them from MediaPipe's current docs if not.
3. `const result = landmarker.detect(imageElement)`. If `result.faceLandmarks.length === 0`, return `null`.
4. Take `result.faceLandmarks[0]` (478 normalized `{x, y, z}` points in `0..1`). Denormalize with `imageElement.naturalWidth` / `imageElement.naturalHeight`: `{ x: landmark.x * width, y: landmark.y * height }`.
5. Map these indices into the named points (commonly-cited MediaPipe Face Mesh topology indices — **do not trust blindly**; Step 3 below requires visually verifying them against a real face before this task is done):
   - `rightIrisPx` ← index 468, `leftIrisPx` ← index 473
   - `foreheadTopPx` ← index 10, `chinPx` ← index 152
   - `rightCheekPx` ← index 234, `leftCheekPx` ← index 454
   - `rightTemplePx` ← index 127, `leftTemplePx` ← index 356
   - `noseRootPx` ← index 6, `noseTipPx` ← index 1
   - `rightEyeInnerPx` ← index 133, `leftEyeInnerPx` ← index 362
6. Return the assembled `NamedPoints` object.

- [ ] **Step 3: Verify in browser — no face is rejected**

```js
(async () => {
  const canvas = document.createElement('canvas');
  canvas.width = 300; canvas.height = 300;
  canvas.getContext('2d').fillRect(0, 0, 300, 300); // solid black, no face
  const img = new Image();
  img.src = canvas.toDataURL();
  await new Promise(r => { img.onload = r });
  const { extractNamedLandmarks } = await import('/src/services/faceLandmarks.js');
  const result = await extractNamedLandmarks(img);
  return JSON.stringify({ result });
})();
```
Expected: `{"result":null}`.

- [ ] **Step 4: Verify in browser — landmark indices land on the right features (REQUIRED, not optional)**

Using a real photo of a face (e.g. one captured through the app's own camera, or any face image reachable in the browser as a data URL), call `extractNamedLandmarks(img)` and draw small colored dots at each returned point on a `<canvas>` overlay positioned over the source image; visually confirm each dot lands on its named feature (iris centers on the pupils, `chinPx` on the chin, `foreheadTopPx` near the hairline, cheek points at the cheekbones, temple points at the temples, nose root/tip on the nose, eye-inner points at the inner eye corners). If any point is clearly on the wrong feature, correct that index in Step 2 using MediaPipe's official face mesh topology reference and re-run this check.
Expected: every dot visibly lands on its named feature.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json src/services/faceLandmarks.js
git commit -m "feat: add facial landmark extraction via MediaPipe Face Landmarker"
```

---

## Task 4: Orchestration (`analyzeFaceWithCard`)

**Files:**
- Create: `src/services/faceAnalysisService.js`

**Interfaces:**
- Consumes: `computeMeasurementsMm`, `classifyFaceShape` from `./faceGeometry.js` (Task 1); `detectCardCorners` from `./cardDetection.js` (Task 2); `extractNamedLandmarks` from `./faceLandmarks.js` (Task 3).
- Produces: `analyzeFaceWithCard(imageDataUrl) -> Promise<FaceAnalysisResult>`, where `FaceAnalysisResult` is
  `{ success: true, faceShape: 'oval'|'redondo'|'quadrado'|'coracao', measurements: FaceMeasurements } | { success: false, errorReason: 'card-not-found'|'face-not-found'|'low-confidence'|'load-failed' }`.

- [ ] **Step 1: Implement `analyzeFaceWithCard`**

Algorithm:
1. Load `imageDataUrl` into an `HTMLImageElement` (`new Image(); img.src = imageDataUrl; await new Promise(resolve => { img.onload = resolve })`).
2. Wrap the two detection calls in a `try`; any thrown exception (e.g. from the dynamic `import()` or model fetch inside `detectCardCorners`/`extractNamedLandmarks`) is caught and returns `{ success: false, errorReason: 'load-failed' }`.
3. `const cardResult = await detectCardCorners(img)`. If `null`, return `{ success: false, errorReason: 'card-not-found' }`.
4. `const points = await extractNamedLandmarks(img)`. If `null`, return `{ success: false, errorReason: 'face-not-found' }`.
5. `const measurements = computeMeasurementsMm(points, cardResult.cornersPx)`.
6. `const faceShape = classifyFaceShape(measurements)`.
7. Return `{ success: true, faceShape, measurements }`.

(`low-confidence` is part of the type for forward compatibility with the spec's error table but is not produced by this implementation — `detectCardCorners`/`extractNamedLandmarks` already fold low-confidence detections into their `null` return, which maps to `card-not-found`/`face-not-found`.)

- [ ] **Step 2: Verify in browser — card-not-found branch (real libraries, synthetic blank image)**

```js
(async () => {
  const canvas = document.createElement('canvas');
  canvas.width = 300; canvas.height = 300;
  canvas.getContext('2d').fillRect(0, 0, 300, 300);
  const dataUrl = canvas.toDataURL();
  const { analyzeFaceWithCard } = await import('/src/services/faceAnalysisService.js');
  const result = await analyzeFaceWithCard(dataUrl);
  return JSON.stringify(result);
})();
```
Expected: `{"success":false,"errorReason":"card-not-found"}`.

- [ ] **Step 3: Verify in browser — face-not-found branch (card present, no face)**

```js
(async () => {
  const canvas = document.createElement('canvas');
  canvas.width = 500; canvas.height = 350;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'black'; ctx.fillRect(0, 0, 500, 350);
  ctx.fillStyle = 'white'; ctx.fillRect(100, 100, 272, 171);
  const dataUrl = canvas.toDataURL();
  const { analyzeFaceWithCard } = await import('/src/services/faceAnalysisService.js');
  const result = await analyzeFaceWithCard(dataUrl);
  return JSON.stringify(result);
})();
```
Expected: `{"success":false,"errorReason":"face-not-found"}`.

- [ ] **Step 4: Note on the success and `load-failed` paths**

The full success path (real card + real face in one photo) and the `load-failed` path (forcing a genuine network failure of the MediaPipe model fetch) are not reliably reproducible in this sandboxed environment. Confirm by code review that Step 1's `try`/`catch` wraps both detection calls and returns `load-failed` correctly; the success path is validated manually by the end user with a real camera and card after this plan's tasks are merged (already noted in the spec, §9).

- [ ] **Step 5: Commit**

```bash
git add src/services/faceAnalysisService.js
git commit -m "feat: add analyzeFaceWithCard orchestration for the full facial scan"
```

---

## Task 5: `CameraCapture.jsx` UI integration and README

**Files:**
- Modify: `src/components/CameraCapture.jsx`
- Modify: `README.md`

**Interfaces:**
- Consumes: `analyzeFaceWithCard` from `../services/faceAnalysisService.js` (Task 4); existing `onDetected` prop contract (unchanged); existing `analyzeFaceFromImage` from `../services/recommendationService.js` (Scan Rápido, untouched).
- Produces: no new exports from `CameraCapture.jsx`.

- [ ] **Step 1: Add mode selection to the `idle` phase**

Add a `mode` state (`null | 'quick' | 'full'`). In the `idle` phase, render both the existing "Usar Câmera / Escanear Rosto" button (rename its visible label to "Scan Rápido", keep its existing `onClick` behavior, set `mode = 'quick'`) and a new "Scan Completo (medidas reais)" button that sets `mode = 'full'` and then calls the existing `startCamera`.

- [ ] **Step 2: Add the card instruction for `mode === 'full'`**

In the `streaming` phase, when `mode === 'full'`, render the text "Segure um cartão (crédito, débito ou RG) ao lado do rosto, bem visível, e capture a foto." above the existing video/"Capturar Foto" button. No change for `mode === 'quick'`.

- [ ] **Step 3: Branch `capturePhoto` on `mode`**

When `mode === 'quick'`: unchanged — call `analyzeFaceFromImage` as today.
When `mode === 'full'`: after drawing the frame and stopping the stream (unchanged), set phase to `analyzing` and track whether this is the session's first full scan (module-level flag, e.g. `let hasLoadedFullScanModels = false` in `CameraCapture.jsx`, set `true` right before the first call). While that flag is still `false`, show "Carregando modelos de análise..."; once the first call starts, always show "Analisando foto (cartão e proporções faciais)...". Call `analyzeFaceWithCard(dataUrl)`.

- [ ] **Step 4: Render the success and error states for `mode === 'full'`**

On `result.success === true`: set `phase = 'result'` with `detected = result` (now also carrying `measurements`); in the `result` phase JSX, when `measurements` is present, render a list with these exact Portuguese labels: "Distância pupilar", "Largura do rosto", "Altura do rosto", "Distância entre as têmporas", "Comprimento do nariz", "Largura da ponte nasal" — each as `${label}: ${value.toFixed(1)} mm`. Keep the existing "Usar este resultado"/"Tirar outra foto" buttons and `confirmResult`/`retakePhoto` handlers (they already work off `detected.faceShape` and `options`, unchanged).

On `result.success === false`: set `phase = 'error'` with a message selected by `errorReason` from this exact table (matches spec §7):
- `card-not-found` → "Não conseguimos identificar o cartão na foto. Segure-o bem visível, sem reflexos, e tente novamente." — recovery: existing "Tirar outra foto" / `retakePhoto` button.
- `face-not-found` → "Não conseguimos identificar seu rosto na foto. Tente novamente com mais luz e o rosto centralizado." — recovery: existing "Tirar outra foto" / `retakePhoto` button.
- `load-failed` → "Não foi possível carregar o modelo de análise. Tente o Scan Rápido ou tente novamente mais tarde." — recovery: a button that resets `phase`/`mode` back to `idle` (mode selection), not `retakePhoto` (the problem isn't the photo).

Reuse the existing `phase === 'error'` JSX block (already wrapped in `role="alert"`) for all three messages above — only the message text and recovery button differ per `errorReason`, no new accessibility surface is introduced. Reusing `retakePhoto` for the `card-not-found`/`face-not-found` recovery also reuses its existing `setCapturedImage(null)`/`setDetected(null)` reset, which is what keeps a retry from showing a stale photo or measurements.

- [ ] **Step 5: Verify in browser — Scan Completo card-not-found path end to end**

With the dev server running, mock `getUserMedia` with a fake stream from a solid-color `canvas.captureStream()` (same technique used for the earlier `srcObject` fix), click "Scan Completo", confirm the card instruction text appears, click "Capturar Foto", and read the DOM after the (real, unmocked) `analyzeFaceWithCard` call resolves.
Expected: the `card-not-found` message and a "Tirar outra foto" button are present; clicking it returns to the `streaming` phase with the camera re-requested.

- [ ] **Step 6: Verify in browser — Scan Rápido is unaffected (regression check)**

Repeat the existing Scan Rápido flow (golden path from the original plan: pick a face shape via the simulated camera path) and confirm messages/behavior are unchanged from before this feature.

- [ ] **Step 7: Update `README.md`**

Add a short paragraph under "Principais Decisões de Projeto" describing the "Scan Completo" mode: real facial measurements in mm via MediaPipe Face Landmarker + OpenCV.js card-based calibration, both loaded on demand and running 100% client-side, with no image or measurement ever leaving the browser; note that it exists alongside the lighter, card-free "Scan Rápido".

- [ ] **Step 8: Commit**

```bash
git add src/components/CameraCapture.jsx README.md
git commit -m "feat: add Scan Completo mode with real facial measurements to CameraCapture"
```
