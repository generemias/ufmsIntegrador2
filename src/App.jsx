import { useState } from 'react'
import Header from './components/Header'
import Hero from './components/Hero'
import Footer from './components/Footer'
import ProductCatalog from './components/ProductCatalog'
import ChatAssistant from './components/ChatAssistant'

function App() {
  const [recommendation, setRecommendation] = useState(null)

  const scrollToAssistant = () => {
    document.getElementById('assistente')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Hero onCtaClick={scrollToAssistant} />
        <ChatAssistant onRecommendation={setRecommendation} />
        <ProductCatalog recommendation={recommendation} />
      </main>
      <Footer />
    </div>
  )
}

export default App
