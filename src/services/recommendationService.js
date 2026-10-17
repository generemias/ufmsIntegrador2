/**
 * @typedef {{
 *   faceShape: 'oval'|'redondo'|'quadrado'|'coracao',
 *   lifestyle: string,
 *   prescription: string,
 * }} Preferences
 *
 * @typedef {{
 *   faceShape: string,
 *   lifestyle: string,
 *   recommendedFrameTypes: string[],
 *   message: string,
 * }} Recommendation
 */

const FRAME_TYPES_BY_FACE_SHAPE = {
  redondo: ['quadrada', 'retangular'],
  quadrado: ['redonda', 'oval'],
  oval: ['aviador', 'quadrada', 'retangular'],
  coracao: ['redonda', 'gatinho'],
}

const FACE_SHAPE_LABELS = {
  oval: 'oval',
  redondo: 'redondo',
  quadrado: 'quadrado',
  coracao: 'coração',
}

const DETECTABLE_FACE_SHAPES = Object.keys(FACE_SHAPE_LABELS)

/**
 * @param {Preferences} preferences
 * @returns {Recommendation}
 */
export function buildRecommendation({ faceShape, lifestyle, prescription }) {
  const recommendedFrameTypes = FRAME_TYPES_BY_FACE_SHAPE[faceShape] ?? []
  const frameList = recommendedFrameTypes.join(', ')

  let message = `Com base no formato de rosto ${faceShape}, recomendamos armações ${frameList}.`
  if (lifestyle?.includes('esportivo')) {
    message += ' Priorizamos opções leves e resistentes para o seu estilo de vida ativo.'
  } else if (lifestyle) {
    message += ` Levamos em conta também o seu estilo de vida: ${lifestyle}.`
  }
  if (prescription === 'sim') {
    message += ' Como você usa grau, nossa equipe pode preparar as lentes com sua receita nessas armações.'
  } else if (prescription && prescription !== 'nao') {
    message += ` Também anotamos sua resposta sobre receita: "${prescription}".`
  }

  return { faceShape, lifestyle, recommendedFrameTypes, message }
}

/**
 * @param {Preferences} preferences
 * @returns {Promise<Recommendation>}
 */
export function getRecommendation(preferences) {
  const delay = 800 + Math.random() * 700
  return new Promise((resolve) => {
    setTimeout(() => resolve(buildRecommendation(preferences)), delay)
  })
}

/**
 * Simulates AI-based face-shape detection from a captured photo. Deterministic
 * per image (same photo always yields the same shape) so retaking the photo
 * with a different frame produces a different reading.
 * @param {string} imageDataUrl
 * @returns {Promise<{ faceShape: 'oval'|'redondo'|'quadrado'|'coracao', message: string }>}
 */
export function analyzeFaceFromImage(imageDataUrl) {
  let checksum = 0
  const stride = Math.max(1, Math.floor(imageDataUrl.length / 500))
  for (let i = 0; i < imageDataUrl.length; i += stride) {
    checksum = (checksum + imageDataUrl.charCodeAt(i)) % 997
  }
  const faceShape = DETECTABLE_FACE_SHAPES[checksum % DETECTABLE_FACE_SHAPES.length]
  const label = FACE_SHAPE_LABELS[faceShape]

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        faceShape,
        message: `Analisamos as proporções do seu rosto na foto e detectamos o formato ${label}.`,
      })
    }, 1500)
  })
}
