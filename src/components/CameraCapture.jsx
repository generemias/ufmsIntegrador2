import { useEffect, useRef, useState } from 'react'
import { analyzeFaceFromImage } from '../services/recommendationService'

/**
 * @param {{ options: Array<{label: string, value: string}>, onDetected: (value: string, displayText: string) => void }} props
 */
function CameraCapture({ options, onDetected }) {
  const [phase, setPhase] = useState('idle') // idle | requesting | streaming | analyzing | result | error
  const [errorMessage, setErrorMessage] = useState('')
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

  const startCamera = async () => {
    setErrorMessage('')
    if (!navigator.mediaDevices?.getUserMedia) {
      setErrorMessage('Seu navegador não suporta acesso à câmera. Use as opções manuais abaixo.')
      setPhase('error')
      return
    }

    setPhase('requesting')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      streamRef.current = stream
      setPhase('streaming')
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch {
      setErrorMessage(
        'Não foi possível acessar a câmera (permissão negada ou nenhuma câmera encontrada). Use as opções manuais abaixo.',
      )
      setPhase('error')
    }
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

    analyzeFaceFromImage(dataUrl).then((result) => {
      setDetected(result)
      setPhase('result')
    })
  }

  const retakePhoto = () => {
    setCapturedImage(null)
    setDetected(null)
    startCamera()
  }

  const confirmResult = () => {
    const option = options.find((opt) => opt.value === detected.faceShape)
    onDetected(detected.faceShape, `${option?.label ?? detected.faceShape} (detectado por câmera)`)
  }

  return (
    <div className="mb-4 rounded-lg border border-dashed border-indigo-300 bg-indigo-50/50 p-4">
      <canvas ref={canvasRef} className="hidden" />

      {phase === 'idle' && (
        <button
          type="button"
          aria-label="Usar câmera para escanear o formato do rosto"
          onClick={startCamera}
          className="rounded-full border border-indigo-600 bg-white px-3 py-1 text-sm font-medium text-indigo-600 hover:bg-indigo-50"
        >
          Usar Câmera / Escanear Rosto
        </button>
      )}

      {phase === 'requesting' && <p className="text-sm text-slate-600">Solicitando acesso à câmera...</p>}

      {phase === 'streaming' && (
        <div className="flex flex-col items-center gap-3">
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
          <p className="text-sm font-medium text-indigo-700">Analisando proporções faciais com IA...</p>
        </div>
      )}

      {phase === 'result' && detected && (
        <div className="flex flex-col items-center gap-3">
          <img src={capturedImage} alt="Foto capturada para análise" className="w-full max-w-sm rounded-lg" />
          <p className="text-sm font-medium text-slate-800">{detected.message}</p>
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
            onClick={startCamera}
            className="self-start rounded-lg border border-slate-300 px-3 py-1 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Tentar novamente
          </button>
        </div>
      )}
    </div>
  )
}

export default CameraCapture
