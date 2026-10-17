import { computeMeasurementsMm, classifyFaceShape } from './faceGeometry.js'
import { detectCardCorners } from './cardDetection.js'
import { extractNamedLandmarks } from './faceLandmarks.js'

/**
 * @typedef {
 *   { success: true, faceShape: 'oval'|'redondo'|'quadrado'|'coracao', measurements: import('./faceGeometry.js').FaceMeasurements } |
 *   { success: false, errorReason: 'card-not-found'|'face-not-found'|'low-confidence'|'load-failed' }
 * } FaceAnalysisResult
 */

/**
 * @param {string} imageDataUrl
 * @returns {Promise<FaceAnalysisResult>}
 */
export async function analyzeFaceWithCard(imageDataUrl) {
  const img = new Image()
  img.src = imageDataUrl
  await new Promise((resolve) => {
    img.onload = resolve
  })

  let cardResult
  let points
  try {
    cardResult = await detectCardCorners(img)
    if (!cardResult) {
      return { success: false, errorReason: 'card-not-found' }
    }

    points = await extractNamedLandmarks(img)
    if (!points) {
      return { success: false, errorReason: 'face-not-found' }
    }
  } catch {
    return { success: false, errorReason: 'load-failed' }
  }

  const measurements = computeMeasurementsMm(points, cardResult.cornersPx)
  const faceShape = classifyFaceShape(measurements)

  return { success: true, faceShape, measurements }
}
