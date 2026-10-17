function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="mt-auto bg-slate-900 px-6 py-8 text-center text-sm text-slate-300">
      <p>
        Ótica Smart IA é um projeto desenvolvido no âmbito do Projeto Integrador / Ação de
        Extensão da UFMS Digital, com fins educacionais.
      </p>
      <p className="mt-2">© {year} Ótica Smart IA. Todos os direitos reservados.</p>
      <p className="mt-2 font-semibold">UFMS Digital</p>
    </footer>
  )
}

export default Footer
