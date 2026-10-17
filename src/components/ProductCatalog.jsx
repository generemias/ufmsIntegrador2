import { useMemo, useState } from 'react'
import { PRODUCTS } from '../data/products'
import ProductCard from './ProductCard'

function ProductCatalog({ recommendation }) {
  const [showOnlyRecommended, setShowOnlyRecommended] = useState(false)

  const recommendedIds = useMemo(() => {
    if (!recommendation) return new Set()
    return new Set(
      PRODUCTS.filter((product) => recommendation.recommendedFrameTypes.includes(product.frameType)).map(
        (product) => product.id,
      ),
    )
  }, [recommendation])

  const visibleProducts =
    recommendation && showOnlyRecommended
      ? PRODUCTS.filter((product) => recommendedIds.has(product.id))
      : PRODUCTS

  return (
    <section id="catalogo" aria-label="Catálogo de armações" className="px-6 py-16">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-2xl font-bold text-slate-900">Catálogo de Armações</h2>
          {recommendation && (
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={showOnlyRecommended}
                onChange={(e) => setShowOnlyRecommended(e.target.checked)}
              />
              Mostrar só recomendados
            </label>
          )}
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visibleProducts.map((product) => (
            <ProductCard key={product.id} product={product} isRecommended={recommendedIds.has(product.id)} />
          ))}
        </div>
      </div>
    </section>
  )
}

export default ProductCatalog
