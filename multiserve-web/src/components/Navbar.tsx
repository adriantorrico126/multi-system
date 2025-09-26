import { useState, useEffect } from "react";
import { Menu, X, Phone, MapPin, ChevronDown, Star, Award, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useConversionTracker } from "@/hooks/useConversionTracker";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { toast } = useToast();
  const { trackDemoRequest } = useConversionTracker();

  // Track scroll for navbar background change
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleCall = () => {
    toast({
      title: "Llamada Iniciada",
      description: "Contactando al +591 69512310",
    });
    window.open('tel:+59169512310');
  };

  const handleRequestDemo = () => {
    trackDemoRequest('navbar');
    toast({
      title: "Demo Solicitada",
      description: "Redirigiendo al formulario para agendar tu demo gratuita...",
    });
    document.getElementById('contacto')?.scrollIntoView({ behavior: 'smooth' });
    setIsOpen(false);
  };

  const scrollToSection = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
    setIsOpen(false);
  };

  return (
    <>
      {/* Top Banner */}
      <div className="fixed top-0 w-full z-50 bg-slate-900/80 backdrop-blur-xl text-white text-center py-2 text-sm font-medium border-b border-slate-800/50">
        <div className="flex items-center justify-center space-x-2">
          <Star className="w-4 h-4 text-yellow-400" />
          <span>Business Intelligence #1 en Bolivia</span>
          <span className="hidden sm:inline">•</span>
          <span className="hidden sm:inline">500+ Empresas Confían en Nosotros</span>
        </div>
      </div>

      {/* Main Navbar */}
      <nav className={`fixed top-10 w-full z-40 transition-all duration-300 ${
        isScrolled 
          ? 'bg-slate-900/80 backdrop-blur-xl shadow-lg border-b border-slate-800/50' 
          : 'bg-transparent'
      }`}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <button 
              onClick={() => scrollToSection('inicio')}
              className="flex items-center space-x-3 hover:opacity-80 transition-all duration-300 group"
            >
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 border border-slate-700/50">
                  <span className="text-white font-bold text-xl">S</span>
                </div>
              </div>
              <div className="text-left">
                <span className={`text-xl font-bold transition-colors duration-300 ${
                  isScrolled ? 'text-white' : 'text-white'
                }`}>
                  ForkastBI
                </span>
                <div className={`text-xs font-medium transition-colors duration-300 ${
                  isScrolled ? 'text-slate-300' : 'text-white/80'
                }`}>
                  Business Intelligence
                </div>
              </div>
            </button>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-8">
              <button 
                onClick={() => scrollToSection('inicio')}
                className={`font-medium transition-all duration-300 hover:scale-105 ${
                  isScrolled 
                    ? 'text-white hover:text-slate-300' 
                    : 'text-white hover:text-slate-300'
                }`}
              >
                Inicio
              </button>
              <button 
                onClick={() => scrollToSection('beneficios')}
                className={`font-medium transition-all duration-300 hover:scale-105 ${
                  isScrolled 
                    ? 'text-white hover:text-slate-300' 
                    : 'text-white hover:text-slate-300'
                }`}
              >
                Beneficios
              </button>
              <button 
                onClick={() => scrollToSection('planes')}
                className={`font-medium transition-all duration-300 hover:scale-105 ${
                  isScrolled 
                    ? 'text-white hover:text-slate-300' 
                    : 'text-white hover:text-slate-300'
                }`}
              >
                Planes
              </button>
              <button 
                onClick={() => scrollToSection('casos-exito')}
                className={`font-medium transition-all duration-300 hover:scale-105 ${
                  isScrolled 
                    ? 'text-white hover:text-slate-300' 
                    : 'text-white hover:text-slate-300'
                }`}
              >
                Casos de Éxito
              </button>
              <button 
                onClick={() => scrollToSection('contacto')}
                className={`font-medium transition-all duration-300 hover:scale-105 ${
                  isScrolled 
                    ? 'text-white hover:text-slate-300' 
                    : 'text-white hover:text-slate-300'
                }`}
              >
                Contacto
              </button>
            </div>

            {/* CTA Buttons */}
            <div className="hidden md:flex items-center space-x-3">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleCall}
                className={`transition-all duration-300 hover:scale-105 bg-slate-800/50 ${
                  isScrolled 
                    ? 'border-slate-600 text-white hover:bg-slate-700 hover:text-white' 
                    : 'border-slate-600 text-white hover:bg-slate-700 hover:text-white'
                }`}
              >
                <Phone className="w-4 h-4 mr-2" />
                Llamar
              </Button>
              <Button 
                size="sm" 
                onClick={handleRequestDemo}
                className="relative bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white shadow-lg hover:shadow-red-500/50 transition-all duration-300 hover:scale-105 border border-red-500 overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-red-400/20 to-orange-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                <MapPin className="w-4 h-4 mr-2 relative z-10" />
                <span className="relative z-10">Solicitar Demo</span>
              </Button>
            </div>

            {/* Mobile menu button */}
            <div className="lg:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(!isOpen)}
                className={`transition-colors duration-300 ${
                  isScrolled ? 'text-gray-700' : 'text-white'
                }`}
              >
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="lg:hidden bg-slate-900/95 backdrop-blur-xl border-b border-slate-800/50 animate-fade-in shadow-lg">
            <div className="px-4 py-6 space-y-4">
              <button
                onClick={() => scrollToSection('inicio')}
                className="block w-full text-left text-white hover:text-slate-300 transition-colors font-medium py-2"
              >
                Inicio
              </button>
              <button
                onClick={() => scrollToSection('beneficios')}
                className="block w-full text-left text-white hover:text-slate-300 transition-colors font-medium py-2"
              >
                Beneficios
              </button>
              <button
                onClick={() => scrollToSection('planes')}
                className="block w-full text-left text-white hover:text-slate-300 transition-colors font-medium py-2"
              >
                Planes
              </button>
              <button
                onClick={() => scrollToSection('casos-exito')}
                className="block w-full text-left text-white hover:text-slate-300 transition-colors font-medium py-2"
              >
                Casos de Éxito
              </button>
              <button
                onClick={() => scrollToSection('contacto')}
                className="block w-full text-left text-white hover:text-slate-300 transition-colors font-medium py-2"
              >
                Contacto
              </button>
              <div className="flex flex-col space-y-3 pt-4 border-t border-slate-800/50">
                <Button 
                  variant="outline" 
                  onClick={handleCall}
                  className="border-slate-600 text-white bg-slate-800/50 hover:bg-slate-700 hover:text-white"
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Llamar
                </Button>
                <Button 
                  onClick={handleRequestDemo}
                  className="relative bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white border border-red-500 overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-red-400/20 to-orange-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                  <MapPin className="w-4 h-4 mr-2 relative z-10" />
                  <span className="relative z-10">Solicitar Demo</span>
                </Button>
              </div>
            </div>
          </div>
        )}
      </nav>
    </>
  );
};

export default Navbar;