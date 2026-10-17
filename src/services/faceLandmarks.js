const WASM_BASE_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
const MODEL_ASSET_PATH =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task'

const LANDMARK_INDICES = {
  rightIrisPx: 468,
  leftIrisPx: 473,
  foreheadTopPx: 10,
  chinPx: 152,
  rightCheekPx: 234,
  leftCheekPx: 454,
  rightTemplePx: 71,
  leftTemplePx: 301,
  noseRootPx: 6,
  noseTipPx: 1,
  rightEyeInnerPx: 133,
  leftEyeInnerPx: 362,
}

let landmarkerPromise = null

async function getLandmarker() {
  if (!landmarkerPromise) {
    landmarkerPromise = (async () => {
      const { FilesetResolver, FaceLandmarker } = await import('@mediapipe/tasks-vision')
      const filesetResolver = await FilesetResolver.forVisionTasks(WASM_BASE_URL)
      return FaceLandmarker.createFromOptions(filesetResolver, {
        baseOptions: { modelAssetPath: MODEL_ASSET_PATH },
        runningMode: 'IMAGE',
        numFaces: 1,
      })
    })().catch((error) => {
      // Don't cache a failed load — a later retry (e.g. after the network
      // recovers) must be able to try again instead of replaying this
      // same rejection forever.
      landmarkerPromise = null
      throw error
    })
  }
  return landmarkerPromise
}

/**
 * @param {HTMLImageElement} imageElement
 * @returns {Promise<import('./faceGeometry.js').NamedPoints | null>}
 */
export async function extractNamedLandmarks(imageElement) {
  const landmarker = await getLandmarker()
  const result = landmarker.detect(imageElement)

  if (!result.faceLandmarks || result.faceLandmarks.length === 0) {
    return null
  }

  const landmarks = result.faceLandmarks[0]
  const width = imageElement.naturalWidth
  const height = imageElement.naturalHeight

  const points = {}
  for (const [name, index] of Object.entries(LANDMARK_INDICES)) {
    const landmark = landmarks[index]
    points[name] = { x: landmark.x * width, y: landmark.y * height }
  }
  return points
}
