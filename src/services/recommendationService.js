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
