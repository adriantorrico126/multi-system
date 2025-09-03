import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import AboutSection from "@/components/AboutSection";
import FeaturedDishes from "@/components/FeaturedDishes";
import TestimonialsSection from "@/components/TestimonialsSection";
import ReservationSection from "@/components/ReservationSection";
import LocationsSection from "@/components/LocationsSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background font-body">
      <Navbar />
      <HeroSection />
      <AboutSection />
      <FeaturedDishes />
      <TestimonialsSection />
      <ReservationSection />
      <LocationsSection />
      <Footer />
    </div>
  );
};

export default Index;
