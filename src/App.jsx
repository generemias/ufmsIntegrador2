import Header from './components/Header'
import Hero from './components/Hero'
import Footer from './components/Footer'

function App() {
  const scrollToAssistant = () => {
    document.getElementById('assistente')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Hero onCtaClick={scrollToAssistant} />
        <section id="assistente" aria-label="Assistente virtual de triagem" className="px-6 py-16" />
        <section id="catalogo" aria-label="Catálogo de armações" className="px-6 py-16" />
      </main>
      <Footer />
    </div>
  )
}

export default App
