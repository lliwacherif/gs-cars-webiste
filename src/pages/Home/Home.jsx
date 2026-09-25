import Navbar from '../../components/Navbar/Navbar'
import AdminStrip from '../../components/AdminStrip/AdminStrip'
import Hero from '../../components/Hero/Hero'
import BookingForm from '../../components/BookingForm/BookingForm'
import Features from '../../components/Features/Features'
import CarCategories from '../../components/CarCategories/CarCategories'
import PromoBanner from '../../components/PromoBanner/PromoBanner'
import Footer from '../../components/Footer/Footer'

export default function Home() {
  return (
    <>
      <AdminStrip />
      <Navbar />
      <main>
        <Hero />
        <BookingForm />
        <Features />
        <CarCategories />
        <PromoBanner />
      </main>
      <Footer />
    </>
  )
}
