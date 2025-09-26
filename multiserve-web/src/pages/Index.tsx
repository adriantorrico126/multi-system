import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import AboutSection from "@/components/AboutSection";
import FeaturedDishes from "@/components/FeaturedDishes";
import AboutUsSection from "@/components/AboutUsSection";
import ReservationSection from "@/components/ReservationSection";
import LocationsSection from "@/components/LocationsSection";
import Footer from "@/components/Footer";
import VisualEffects from "@/components/VisualEffects";

const Index = () => {
  return (
    <div className="min-h-screen bg-background font-body relative overflow-hidden">
      <VisualEffects />
      <Navbar />
      <HeroSection />
      <AboutSection />
      <FeaturedDishes />
      <AboutUsSection />
      <ReservationSection />
      <LocationsSection />
      <Footer />
    </div>
  );
};

export default Index;
