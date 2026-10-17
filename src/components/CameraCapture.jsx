import { useEffect, useRef, useState } from 'react'
import { analyzeFaceFromImage } from '../services/recommendationService'
import { analyzeFaceWithCard } from '../services/faceAnalysisService'

const FULL_SCAN_ERROR_MESSAGES = {
  'card-not-found':
    'Não conseguimos identificar o cartão na foto. Segure-o bem visível, sem reflexos, e tente novamente.',
  'face-not-found':
    'Não conseguimos identificar seu rosto na foto. Tente novamente com mais luz e o rosto centralizado.',
  'load-failed': 'Não foi possível carregar o modelo de análise. Tente o Scan Rápido ou tente novamente mais tarde.',
}

// Module-level (not component state) so the "loading models" message only
// shows once per browser session, even if CameraCapture remounts.
let hasLoadedFullScanModels = false

/**
 * @param {{ options: Array<{label: string, value: string}>, onDetected: (value: string, displayText: string) => void }} props
 */
function CameraCapture({ options, onDetected }) {
  const [phase, setPhase] = useState('idle') // idle | requesting | streaming | analyzing | result | error
  const [mode, setMode] = useState(null) // null | 'quick' | 'full'
  const [errorMessage, setErrorMessage] = useState('')
  const [errorRecovery, setErrorRecovery] = useState('camera') // 'camera' | 'retake' | 'idle'
  const [analyzingMessage, setAnalyzingMessage] = useState('Analisando proporções faciais com IA...')
  const [capturedImage, setCapturedImage] = useState(null)
  const [detected, setDetected] = useState(null)

  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
  }

  useEffect(() => stopStream, [])

  // The <video> element only exists in the DOM once `phase` becomes
  // 'streaming', so the srcObject must be assigned after that render
  // commits, not synchronously in the click handler.
  useEffect(() => {
    if (phase === 'streaming' && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current
    }
  }, [phase])

  const startCamera = async () => {
    setErrorMessage('')
    if (!navigator.mediaDevices?.getUserMedia) {
      setErrorMessage('Seu navegador não suporta acesso à câmera. Use as opções manuais abaixo.')
      setErrorRecovery('camera')
      setPhase('error')
      return
    }

    setPhase('requesting')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      streamRef.current = stream
      setPhase('streaming')
    } catch {
      setErrorMessage(
        'Não foi possível acessar a câmera (permissão negada ou nenhuma câmera encontrada). Use as opções manuais abaixo.',
      )
      setErrorRecovery('camera')
      setPhase('error')
    }
  }

  const startQuickScan = () => {
    setMode('quick')
    startCamera()
  }

  const startFullScan = () => {
    setMode('full')
    startCamera()
  }

  const capturePhoto = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0)
    const dataUrl = canvas.toDataURL('image/png')

    stopStream()
    setCapturedImage(dataUrl)
    setPhase('analyzing')

    if (mode === 'quick') {
      setAnalyzingMessage('Analisando proporções faciais com IA...')
      analyzeFaceFromImage(dataUrl).then((result) => {
        setDetected(result)
        setPhase('result')
      })
      return
    }

    setAnalyzingMessage(
      hasLoadedFullScanModels ? 'Analisando foto (cartão e proporções faciais)...' : 'Carregando modelos de análise...',
    )
    hasLoadedFullScanModels = true

    analyzeFaceWithCard(dataUrl).then((result) => {
      if (result.success) {
        setDetected(result)
        setPhase('result')
      } else {
        setErrorMessage(
          FULL_SCAN_ERROR_MESSAGES[result.errorReason] ?? 'Ocorreu um erro ao analisar a foto. Tente novamente.',
        )
        setErrorRecovery(result.errorReason === 'load-failed' ? 'idle' : 'retake')
        setPhase('error')
      }
    })
  }

  const retakePhoto = () => {
    setCapturedImage(null)
    setDetected(null)
    startCamera()
  }

  const resetToIdle = () => {
    setCapturedImage(null)
    setDetected(null)
    setMode(null)
    setErrorMessage('')
    setPhase('idle')
  }

  const confirmResult = () => {
    const option = options.find((opt) => opt.value === detected.faceShape)
    onDetected(detected.faceShape, `${option?.label ?? detected.faceShape} (detectado por câmera)`)
  }

  const resultMessage =
    detected?.message ??
    (detected
      ? `Detectamos o formato de rosto: ${options.find((opt) => opt.value === detected.faceShape)?.label ?? detected.faceShape}.`
      : '')

  const errorButton = {
    camera: { label: 'Tentar novamente', onClick: startCamera },
    retake: { label: 'Tirar outra foto', onClick: retakePhoto },
    idle: { label: 'Voltar', onClick: resetToIdle },
  }[errorRecovery]

  return (
    <div className="mb-4 rounded-lg border border-dashed border-indigo-300 bg-indigo-50/50 p-4">
      <canvas ref={canvasRef} className="hidden" />

      {phase === 'idle' && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            aria-label="Usar câmera para escanear o formato do rosto (scan rápido)"
            onClick={startQuickScan}
            className="rounded-full border border-indigo-600 bg-white px-3 py-1 text-sm font-medium text-indigo-600 hover:bg-indigo-50"
          >
            Scan Rápido
          </button>
          <button
            type="button"
            aria-label="Usar câmera com cartão de referência para medidas faciais reais (scan completo)"
            onClick={startFullScan}
            className="rounded-full border border-indigo-600 bg-white px-3 py-1 text-sm font-medium text-indigo-600 hover:bg-indigo-50"
          >
            Scan Completo (medidas reais)
          </button>
        </div>
      )}

      {phase === 'requesting' && <p className="text-sm text-slate-600">Solicitando acesso à câmera...</p>}

      {phase === 'streaming' && (
        <div className="flex flex-col items-center gap-3">
          {mode === 'full' && (
            <p className="text-sm font-medium text-indigo-700">
              Segure um cartão (crédito, débito ou RG) ao lado do rosto, bem visível, e capture a foto.
            </p>
          )}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            aria-label="Pré-visualização da câmera"
            className="w-full max-w-sm rounded-lg bg-black"
          />
          <button
            type="button"
            aria-label="Capturar foto para análise facial"
            onClick={capturePhoto}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Capturar Foto
          </button>
        </div>
      )}

      {phase === 'analyzing' && (
        <div className="flex flex-col items-center gap-3" aria-live="polite">
          <img src={capturedImage} alt="Foto capturada para análise" className="w-full max-w-sm rounded-lg opacity-70" />
          <p className="text-sm font-medium text-indigo-700">{analyzingMessage}</p>
        </div>
      )}

      {phase === 'result' && detected && (
        <div className="flex flex-col items-center gap-3">
          <img src={capturedImage} alt="Foto capturada para análise" className="w-full max-w-sm rounded-lg" />
          <p className="text-sm font-medium text-slate-800">{resultMessage}</p>
          {detected.measurements && (
            <ul className="w-full max-w-sm text-sm text-slate-700">
              <li>Distância pupilar: {detected.measurements.pupillaryDistanceMm.toFixed(1)} mm</li>
              <li>Largura do rosto: {detected.measurements.faceWidthMm.toFixed(1)} mm</li>
              <li>Altura do rosto: {detected.measurements.faceHeightMm.toFixed(1)} mm</li>
              <li>Distância entre as têmporas: {detected.measurements.templeToTempleMm.toFixed(1)} mm</li>
              <li>Comprimento do nariz: {detected.measurements.noseLengthMm.toFixed(1)} mm</li>
              <li>Largura da ponte nasal: {detected.measurements.noseBridgeWidthMm.toFixed(1)} mm</li>
            </ul>
          )}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={confirmResult}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Usar este resultado
            </button>
            <button
              type="button"
              onClick={retakePhoto}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Tirar outra foto
            </button>
          </div>
        </div>
      )}

      {phase === 'error' && (
        <div role="alert" className="flex flex-col gap-2">
          <p className="text-sm text-red-700">{errorMessage}</p>
          <button
            type="button"
            onClick={errorButton.onClick}
            className="self-start rounded-lg border border-slate-300 px-3 py-1 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            {errorButton.label}
          </button>
        </div>
      )}
    </div>
  )
}

export default CameraCapture
