/**
 * @typedef {{x: number, y: number}} PointPx
 *
 * @typedef {{
 *   leftIrisPx: PointPx, rightIrisPx: PointPx,
 *   foreheadTopPx: PointPx, chinPx: PointPx,
 *   leftCheekPx: PointPx, rightCheekPx: PointPx,
 *   leftTemplePx: PointPx, rightTemplePx: PointPx,
 *   noseRootPx: PointPx, noseTipPx: PointPx,
 *   leftEyeInnerPx: PointPx, rightEyeInnerPx: PointPx,
 * }} NamedPoints
 *
 * @typedef {{
 *   pupillaryDistanceMm: number,
 *   faceWidthMm: number,
 *   faceHeightMm: number,
 *   templeToTempleMm: number,
 *   noseLengthMm: number,
 *   noseBridgeWidthMm: number,
 * }} FaceMeasurements
 */

export const CARD_WIDTH_MM = 85.6

function distancePx(a, b) {
  return Math.hypot(b.x - a.x, b.y - a.y)
}

/**
 * @param {NamedPoints} points
 * @param {PointPx[]} cardCornersPx - 4 points in perimeter order
 * @param {number} [cardWidthMm]
 * @returns {FaceMeasurements}
 */
export function computeMeasurementsMm(points, cardCornersPx, cardWidthMm = CARD_WIDTH_MM) {
  const edgeLengths = cardCornersPx.map((corner, i) =>
    distancePx(corner, cardCornersPx[(i + 1) % cardCornersPx.length]),
  )
  const pixelWidth = Math.max(...edgeLengths)
  const scale = cardWidthMm / pixelWidth

  return {
    pupillaryDistanceMm: distancePx(points.leftIrisPx, points.rightIrisPx) * scale,
    faceWidthMm: distancePx(points.leftCheekPx, points.rightCheekPx) * scale,
    faceHeightMm: distancePx(points.foreheadTopPx, points.chinPx) * scale,
    templeToTempleMm: distancePx(points.leftTemplePx, points.rightTemplePx) * scale,
    noseLengthMm: distancePx(points.noseRootPx, points.noseTipPx) * scale,
    noseBridgeWidthMm: distancePx(points.leftEyeInnerPx, points.rightEyeInnerPx) * scale,
  }
}

/**
 * @param {FaceMeasurements} measurements
 * @returns {'oval'|'redondo'|'quadrado'|'coracao'}
 */
export function classifyFaceShape({ faceWidthMm, faceHeightMm, templeToTempleMm }) {
  const ratio = faceWidthMm / faceHeightMm
  const templeRatio = templeToTempleMm / faceWidthMm

  if (templeRatio >= 0.95 && ratio < 0.85) return 'coracao'
  if (ratio >= 0.85 && templeRatio >= 0.9) return 'quadrado'
  if (ratio >= 0.85) return 'redondo'
  return 'oval'
}
