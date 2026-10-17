import { useRef, useState } from 'react'
import { getRecommendation } from '../services/recommendationService'

const STEPS = [
  {
    key: 'faceShape',
    prompt: 'Qual é o formato do seu rosto?',
    options: [
      { label: 'Oval', value: 'oval' },
      { label: 'Redondo', value: 'redondo' },
      { label: 'Quadrado', value: 'quadrado' },
      { label: 'Coração', value: 'coracao' },
    ],
  },
  {
    key: 'lifestyle',
    prompt: 'Como é o seu estilo de vida no dia a dia?',
    options: [
      { label: 'Dia a dia', value: 'dia-a-dia' },
      { label: 'Esportivo', value: 'esportivo' },
      { label: 'Trabalho', value: 'trabalho' },
      { label: 'Leitura', value: 'leitura' },
    ],
  },
  {
    key: 'prescription',
    prompt: 'Você usa grau ou receita médica?',
    options: [
      { label: 'Sim, uso grau', value: 'sim' },
      { label: 'Não uso grau', value: 'nao' },
    ],
  },
]

function matchOption(text, options) {
  const lower = text.toLowerCase()
  return options.find(
    (opt) => lower.includes(opt.label.toLowerCase()) || lower.includes(opt.value.toLowerCase()),
  )
}

function ChatAssistant({ onRecommendation }) {
  const nextId = useRef(2)
  const [messages, setMessages] = useState(() => [{ id: 1, role: 'ai', text: STEPS[0].prompt }])
  const [step, setStep] = useState(0)
  const [preferences, setPreferences] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [hint, setHint] = useState('')

  const isDone = step >= STEPS.length
  const currentStep = !isDone ? STEPS[step] : null

  const appendMessage = (role, text) => {
    setMessages((prev) => [...prev, { id: nextId.current++, role, text }])
  }

  const finishFlow = async (finalPreferences) => {
    setIsLoading(true)
    const result = await getRecommendation(finalPreferences)
    setIsLoading(false)
    appendMessage('ai', result.message)
    onRecommendation(result)
  }

  const handleAnswer = (stepKey, value, displayText) => {
    appendMessage('user', displayText)
    setHint('')
    const updatedPreferences = { ...preferences, [stepKey]: value }
    setPreferences(updatedPreferences)
    const nextStep = step + 1
    setStep(nextStep)
    if (nextStep < STEPS.length) {
      appendMessage('ai', STEPS[nextStep].prompt)
    } else {
      finishFlow(updatedPreferences)
    }
  }

  const handleSubmitText = () => {
    const trimmed = inputValue.trim()
    if (!trimmed) {
      setHint('Digite algo ou escolha uma opção.')
      return
    }
    setInputValue('')

    if (currentStep.key === 'prescription') {
      handleAnswer(currentStep.key, trimmed, trimmed)
      return
    }

    const matched = matchOption(trimmed, currentStep.options)
    if (matched) {
      handleAnswer(currentStep.key, matched.value, matched.label)
    } else {
      appendMessage('user', trimmed)
      appendMessage('ai', 'Não entendi. Escolha uma das opções acima ou reformule sua resposta.')
    }
  }

  const handleReset = () => {
    nextId.current = 2
    setMessages([{ id: 1, role: 'ai', text: STEPS[0].prompt }])
    setStep(0)
    setPreferences({})
    setHint('')
    setInputValue('')
    onRecommendation(null)
  }

  return (
    <section id="assistente" aria-label="Assistente virtual de triagem" className="px-6 py-16">
      <div className="mx-auto max-w-2xl">
        <h2 className="mb-6 text-center text-2xl font-bold text-slate-900">Assistente Virtual</h2>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <ul aria-live="polite" className="flex max-h-96 flex-col gap-3 overflow-y-auto">
            {messages.map((m) => (
              <li
                key={m.id}
                className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                  m.role === 'ai'
                    ? 'self-start bg-slate-100 text-slate-800'
                    : 'self-end bg-indigo-600 text-white'
                }`}
              >
                <span className="sr-only">{m.role === 'ai' ? 'IA: ' : 'Você: '}</span>
                {m.text}
              </li>
            ))}
            {isLoading && (
              <li
                aria-label="IA está analisando suas respostas"
                className="self-start rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-500"
              >
                <span className="sr-only">IA está analisando suas respostas</span>
                <span aria-hidden="true" className="inline-flex gap-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" />
                </span>
              </li>
            )}
          </ul>

          {!isDone && (
            <div className="mt-4 flex flex-wrap gap-2">
              {currentStep.options.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleAnswer(currentStep.key, opt.value, opt.label)}
                  className="rounded-full border border-indigo-600 px-3 py-1 text-sm font-medium text-indigo-600 hover:bg-indigo-50"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}

          {!isDone && (
            <div className="mt-4 flex gap-2">
              <input
                type="text"
                aria-label="Digite sua mensagem"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSubmitText()
                }}
                placeholder="Digite sua resposta..."
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={handleSubmitText}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Enviar
              </button>
            </div>
          )}

          {hint && <p className="mt-2 text-sm text-red-600">{hint}</p>}

          {isDone && !isLoading && (
            <button
              type="button"
              onClick={handleReset}
              className="mt-4 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Recomeçar triagem
            </button>
          )}
        </div>
      </div>
    </section>
  )
}

export default ChatAssistant
