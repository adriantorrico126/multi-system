import { useState } from "react";
import { Menu, X, Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const handleCall = () => {
    toast({
      title: "Llamada Iniciada",
      description: "Contactando al +591 800-RESTAU (737-828)",
    });
    window.open('tel:+59180073782');
  };

  const handleRequestDemo = () => {
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
    <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <button 
            onClick={() => scrollToSection('inicio')}
            className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">R</span>
            </div>
            <span className="text-xl font-bold text-foreground">
              RestaurantPOS
            </span>
          </button>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <button 
              onClick={() => scrollToSection('inicio')}
              className="text-foreground hover:text-primary transition-colors font-medium"
            >
              Inicio
            </button>
            <button 
              onClick={() => scrollToSection('beneficios')}
              className="text-foreground hover:text-primary transition-colors font-medium"
            >
              Beneficios
            </button>
            <button 
              onClick={() => scrollToSection('planes')}
              className="text-foreground hover:text-primary transition-colors font-medium"
            >
              Planes
            </button>
            <button 
              onClick={() => scrollToSection('casos-exito')}
              className="text-foreground hover:text-primary transition-colors font-medium"
            >
              Casos de Éxito
            </button>
            <button 
              onClick={() => scrollToSection('contacto')}
              className="text-foreground hover:text-primary transition-colors font-medium"
            >
              Contacto
            </button>
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleCall}
              className="text-primary border-primary hover:bg-primary hover:text-white"
            >
              <Phone className="w-4 h-4 mr-2" />
              Llamar
            </Button>
            <Button 
              size="sm" 
              onClick={handleRequestDemo}
              className="bg-primary text-white shadow-md hover:shadow-lg transition-all"
            >
              <MapPin className="w-4 h-4 mr-2" />
              Solicitar Demo
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(!isOpen)}
              className="text-foreground"
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden bg-background border-b border-border animate-fade-in">
          <div className="px-4 py-4 space-y-4">
            <button
              onClick={() => scrollToSection('inicio')}
              className="block w-full text-left text-foreground hover:text-primary transition-colors font-medium"
            >
              Inicio
            </button>
            <button
              onClick={() => scrollToSection('beneficios')}
              className="block w-full text-left text-foreground hover:text-primary transition-colors font-medium"
            >
              Beneficios
            </button>
            <button
              onClick={() => scrollToSection('planes')}
              className="block w-full text-left text-foreground hover:text-primary transition-colors font-medium"
            >
              Planes
            </button>
            <button
              onClick={() => scrollToSection('casos-exito')}
              className="block w-full text-left text-foreground hover:text-primary transition-colors font-medium"
            >
              Casos de Éxito
            </button>
            <button
              onClick={() => scrollToSection('contacto')}
              className="block w-full text-left text-foreground hover:text-primary transition-colors font-medium"
            >
              Contacto
            </button>
            <div className="flex flex-col space-y-2 pt-4 border-t border-border">
              <Button 
                variant="outline" 
                onClick={handleCall}
                className="text-primary border-primary"
              >
                <Phone className="w-4 h-4 mr-2" />
                Llamar
              </Button>
              <Button 
                onClick={handleRequestDemo}
                className="bg-primary text-white"
              >
                <MapPin className="w-4 h-4 mr-2" />
                Solicitar Demo
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;