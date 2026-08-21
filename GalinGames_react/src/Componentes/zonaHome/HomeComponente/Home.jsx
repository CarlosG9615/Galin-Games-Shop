import Navbar from '../../compGlobales/NavbarComponente/Navbar'
import HeroSection from '../HeroSectionComponente/HeroSection'
import GamesGrid from '../GamesGridComponente/GamesGrid'
import './Home.scss'

function Home() {
  return (
    <>
      <Navbar />
      <main className="home">
        <HeroSection />
        <GamesGrid />
      </main>
    </>
  )
}

export default Home
