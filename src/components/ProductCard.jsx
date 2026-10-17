import { useState } from 'react'

const FRAME_ICONS = {
  quadrada: (
    <svg viewBox="0 0 64 32" className="h-12 w-24" aria-hidden="true">
      <rect x="4" y="6" width="22" height="20" rx="2" fill="none" stroke="currentColor" strokeWidth="3" />
      <rect x="38" y="6" width="22" height="20" rx="2" fill="none" stroke="currentColor" strokeWidth="3" />
      <line x1="26" y1="16" x2="38" y2="16" stroke="currentColor" strokeWidth="3" />
    </svg>
  ),
  redonda: (
    <svg viewBox="0 0 64 32" className="h-12 w-24" aria-hidden="true">
      <circle cx="16" cy="16" r="12" fill="none" stroke="currentColor" strokeWidth="3" />
      <circle cx="48" cy="16" r="12" fill="none" stroke="currentColor" strokeWidth="3" />
      <line x1="28" y1="16" x2="36" y2="16" stroke="currentColor" strokeWidth="3" />
    </svg>
  ),
  retangular: (
    <svg viewBox="0 0 64 32" className="h-12 w-24" aria-hidden="true">
      <rect x="2" y="9" width="24" height="14" rx="1" fill="none" stroke="currentColor" strokeWidth="3" />
      <rect x="38" y="9" width="24" height="14" rx="1" fill="none" stroke="currentColor" strokeWidth="3" />
      <line x1="26" y1="16" x2="38" y2="16" stroke="currentColor" strokeWidth="3" />
    </svg>
  ),
  aviador: (
    <svg viewBox="0 0 64 32" className="h-12 w-24" aria-hidden="true">
      <path d="M4 16 a12 10 0 1 0 24 0 a12 10 0 1 0 -24 0" fill="none" stroke="currentColor" strokeWidth="3" />
      <path d="M36 16 a12 10 0 1 0 24 0 a12 10 0 1 0 -24 0" fill="none" stroke="currentColor" strokeWidth="3" />
      <line x1="28" y1="14" x2="36" y2="14" stroke="currentColor" strokeWidth="3" />
    </svg>
  ),
  gatinho: (
    <svg viewBox="0 0 64 32" className="h-12 w-24" aria-hidden="true">
      <path d="M4 20 Q4 6 16 8 Q28 10 26 20 Q20 26 4 20 Z" fill="none" stroke="currentColor" strokeWidth="3" />
      <path d="M60 20 Q60 6 48 8 Q36 10 38 20 Q44 26 60 20 Z" fill="none" stroke="currentColor" strokeWidth="3" />
      <line x1="26" y1="16" x2="38" y2="16" stroke="currentColor" strokeWidth="3" />
    </svg>
  ),
  oval: (
    <svg viewBox="0 0 64 32" className="h-12 w-24" aria-hidden="true">
      <ellipse cx="16" cy="16" rx="12" ry="9" fill="none" stroke="currentColor" strokeWidth="3" />
      <ellipse cx="48" cy="16" rx="12" ry="9" fill="none" stroke="currentColor" strokeWidth="3" />
      <line x1="28" y1="16" x2="36" y2="16" stroke="currentColor" strokeWidth="3" />
    </svg>
  ),
}

function ProductCard({ product, isRecommended }) {
  const [showDetails, setShowDetails] = useState(false)

  return (
    <article
      className={`flex flex-col items-center rounded-xl border p-4 text-center shadow-sm ${
        isRecommended ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-white'
      }`}
    >
      {isRecommended && (
        <span className="mb-2 rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white">
          Recomendado pela IA
        </span>
      )}
      <div className="text-slate-700">{FRAME_ICONS[product.frameType]}</div>
      <h3 className="mt-2 font-semibold text-slate-900">{product.name}</h3>
      <p className="text-sm capitalize text-slate-500">{product.frameType}</p>
      <p className="mt-1 font-medium text-slate-700">{product.priceRange}</p>
      <button
        type="button"
        onClick={() => setShowDetails((prev) => !prev)}
        className="mt-3 text-sm font-semibold text-indigo-600 hover:underline"
      >
        {showDetails ? 'Ocultar detalhes' : 'Ver detalhes'}
      </button>
      {showDetails && <p className="mt-2 text-sm text-slate-600">{product.description}</p>}
    </article>
  )
}

export default ProductCard
