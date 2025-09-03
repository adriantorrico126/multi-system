import { Play, Star, Users, Clock, ArrowDown, CheckCircle, Zap, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import heroBackground from "@/assets/hero-background.jpg";

const HeroSection = () => {
  const { toast } = useToast();

  const handleRequestDemo = () => {
    toast({
      title: "Demo Solicitada",
      description: "Redirigiendo al formulario para agendar tu demo gratuita...",
    });
    document.getElementById('contacto')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleViewPlans = () => {
    toast({
      title: "Planes y Precios",
      description: "Mostrando nuestros planes para restaurantes...",
    });
    document.getElementById('planes')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleVideoPlay = () => {
    toast({
      title: "Video Demo del Sistema",
      description: "Reproduciendo demostración del sistema POS",
    });
  };

  const scrollToNext = () => {
    document.getElementById('beneficios')?.scrollIntoView({ behavior: 'smooth' });
  };

  const benefits = [
    { icon: Zap, text: "Implementación en 24h" },
    { icon: Shield, text: "Soporte 24/7" },
    { icon: CheckCircle, text: "Garantía de satisfacción" }
  ];

  return (
    <section id="inicio" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Video/Image */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary/85 to-primary/80 z-10"></div>
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroBackground})` }}
      ></div>
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0 z-20">
        <div className="absolute top-20 left-10 w-2 h-2 bg-white/30 rounded-full animate-pulse"></div>
        <div className="absolute top-40 right-20 w-3 h-3 bg-white/20 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-32 left-20 w-1 h-1 bg-white/40 rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-20 right-32 w-2 h-2 bg-white/25 rounded-full animate-pulse" style={{ animationDelay: '3s' }}></div>
      </div>

      {/* Content */}
      <div className="relative z-30 container mx-auto px-4 text-center text-white">
        <div className="max-w-4xl mx-auto animate-fade-in">
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-6 py-2 mb-8">
            <Star className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-medium">Sistema POS #1 en Bolivia</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Sistema POS que 
            <span className="bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">
              {" "}Revoluciona
            </span>
            <br />
            tu Restaurante
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-white/90 mb-8 leading-relaxed font-light">
            Gestión completa de pedidos, inventario, múltiples sucursales y analytics avanzados. 
            Optimiza tu negocio con la tecnología más avanzada del mercado.
          </p>

          {/* Benefits */}
          <div className="flex flex-wrap justify-center items-center gap-6 mb-12">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <div key={index} className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2">
                  <Icon className="w-5 h-5 text-white/80" />
                  <span className="text-white font-semibold text-sm">{benefit.text}</span>
                </div>
              );
            })}
          </div>

          {/* Stats */}
          <div className="flex flex-wrap justify-center items-center gap-8 mb-12">
            <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2">
              <Users className="w-5 h-5 text-white/80" />
              <span className="text-white font-semibold">500+ Restaurantes</span>
            </div>
            <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2">
              <Clock className="w-5 h-5 text-white/80" />
              <span className="text-white font-semibold">15 Años</span>
            </div>
            <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2">
              <Star className="w-5 h-5 text-yellow-400" />
              <span className="text-white font-semibold">4.9/5 ⭐</span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-8">
            <Button 
              size="lg" 
              onClick={handleRequestDemo}
              className="bg-white text-primary hover:bg-gray-100 font-semibold px-8 py-4 shadow-lg hover:shadow-xl transition-all duration-300 text-lg"
            >
              Solicitar Demo Gratuita
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              onClick={handleViewPlans}
              className="border-white text-white hover:bg-white hover:text-primary font-semibold px-8 py-4 transition-all duration-300 text-lg backdrop-blur-sm"
            >
              Ver Planes y Precios
            </Button>
          </div>

          {/* Video Play Button */}
          <div className="mt-16">
            <button onClick={handleVideoPlay} className="group relative">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:bg-white/30 transition-all duration-300 animate-pulse">
                <Play className="w-8 h-8 text-white ml-1" />
              </div>
              <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-white/80 text-sm font-medium">
                Ver Demo del Sistema
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-30">
        <button onClick={scrollToNext} className="group">
          <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center group-hover:border-white/80 transition-colors">
            <ArrowDown className="w-1 h-3 text-white/70 mt-2 animate-bounce" />
          </div>
        </button>
      </div>
    </section>
  );
};

export default HeroSection;