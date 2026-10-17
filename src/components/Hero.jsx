function Hero({ onCtaClick }) {
  return (
    <section id="hero" className="bg-indigo-50 px-6 py-16 text-center">
      <h1 className="text-4xl font-bold text-slate-900">Encontre a armação ideal para você</h1>
      <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
        Nosso assistente virtual com Inteligência Artificial analisa o formato do seu rosto,
        seu estilo de vida e sua receita para recomendar as melhores armações do nosso catálogo.
      </p>
      <button
        type="button"
        onClick={onCtaClick}
        className="mt-8 rounded-full bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700"
      >
        Iniciar triagem inteligente
      </button>
    </section>
  )
}

export default Hero
