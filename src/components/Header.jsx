function Header() {
  return (
    <header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-4 bg-white px-6 py-4 shadow-sm">
      <span className="text-xl font-bold text-slate-900">Ótica Smart IA</span>
      <nav aria-label="Navegação principal" className="flex items-center gap-6 text-sm font-medium text-slate-700">
        <a href="#assistente" className="hover:text-indigo-600">
          Assistente
        </a>
        <a href="#catalogo" className="hover:text-indigo-600">
          Catálogo
        </a>
      </nav>
      <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
        Projeto de Extensão UFMS Digital
      </span>
    </header>
  )
}

export default Header
