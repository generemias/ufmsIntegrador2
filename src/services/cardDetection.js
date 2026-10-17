const CARD_ASPECT_RATIO = 85.6 / 53.98 // ≈ 1.586
const ASPECT_RATIO_TOLERANCE = 0.15
const MIN_AREA_FRACTION = 0.02

async function loadCv() {
  const cvModule = (await import('@techstark/opencv-js')).default
  if (cvModule instanceof Promise) {
    return cvModule
  }
  if (cvModule.Mat) {
    return cvModule
  }
  await new Promise((resolve) => {
    cvModule.onRuntimeInitialized = resolve
  })
  return cvModule
}

function pointsFromMat(mat) {
  const points = []
  for (let i = 0; i < mat.rows; i++) {
    points.push({ x: mat.data32S[i * 2], y: mat.data32S[i * 2 + 1] })
  }
  return points
}

function edgeLengths(points) {
  return points.map((p, i) => {
    const next = points[(i + 1) % points.length]
    return Math.hypot(next.x - p.x, next.y - p.y)
  })
}

function polygonArea(points) {
  let area = 0
  for (let i = 0; i < points.length; i++) {
    const a = points[i]
    const b = points[(i + 1) % points.length]
    area += a.x * b.y - b.x * a.y
  }
  return Math.abs(area / 2)
}

/**
 * @param {HTMLImageElement|HTMLCanvasElement} imageElement
 * @returns {Promise<{ cornersPx: Array<{x: number, y: number}> } | null>}
 */
export async function detectCardCorners(imageElement) {
  const cv = await loadCv()

  const src = cv.imread(imageElement)
  const imageArea = src.rows * src.cols
  const gray = new cv.Mat()
  const blurred = new cv.Mat()
  const edges = new cv.Mat()
  const contours = new cv.MatVector()
  const hierarchy = new cv.Mat()

  let best = null
  let bestRatioDelta = Infinity

  try {
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY)
    cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0)
    cv.Canny(blurred, edges, 50, 150)
    cv.findContours(edges, contours, hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE)

    for (let i = 0; i < contours.size(); i++) {
      const contour = contours.get(i)
      const approx = new cv.Mat()
      const perimeter = cv.arcLength(contour, true)
      cv.approxPolyDP(contour, approx, 0.02 * perimeter, true)

      if (approx.rows === 4) {
        const points = pointsFromMat(approx)
        const lengths = edgeLengths(points)
        const longest = Math.max(...lengths)
        const shortestAdjacent = Math.min(...lengths)
        const ratio = longest / shortestAdjacent
        const ratioDelta = Math.abs(ratio - CARD_ASPECT_RATIO)
        const area = polygonArea(points)

        if (
          ratioDelta <= CARD_ASPECT_RATIO * ASPECT_RATIO_TOLERANCE &&
          area >= imageArea * MIN_AREA_FRACTION &&
          ratioDelta < bestRatioDelta
        ) {
          best = points
          bestRatioDelta = ratioDelta
        }
      }

      approx.delete()
      contour.delete()
    }
  } finally {
    src.delete()
    gray.delete()
    blurred.delete()
    edges.delete()
    contours.delete()
    hierarchy.delete()
  }

  return best ? { cornersPx: best } : null
}
