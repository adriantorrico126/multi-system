import { Play, Star, Users, Clock, ArrowDown, CheckCircle, Zap, Shield, Award, TrendingUp, BarChart3, Smartphone, Globe, Cpu, Database, Network, Code } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useConversionTracker } from "@/hooks/useConversionTracker";
import heroBackground from "@/assets/hero-background.jpg";
import ScrollEffect from "@/components/ScrollEffect";
import HologramEffect from "@/components/HologramEffect";
import DataStream from "@/components/DataStream";

const HeroSection = () => {
  const { toast } = useToast();
  const { trackDemoRequest, trackVideoPlay, trackPricingView } = useConversionTracker();

  const handleRequestDemo = () => {
    trackDemoRequest('general');
    toast({
      title: "Demo Solicitada",
      description: "Redirigiendo al formulario para agendar tu demo gratuita...",
    });
    document.getElementById('contacto')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleViewPlans = () => {
    trackPricingView();
    toast({
      title: "Planes y Precios",
      description: "Mostrando nuestros planes para restaurantes...",
    });
    document.getElementById('planes')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleVideoPlay = () => {
    trackVideoPlay();
    toast({
      title: "Video Demo del Sistema",
      description: "Reproduciendo demostración del sistema POS",
    });
  };

  const scrollToNext = () => {
    document.getElementById('beneficios')?.scrollIntoView({ behavior: 'smooth' });
  };

  const benefits = [
    { icon: Zap, text: "Implementación en 24h", color: "text-tech-warning", effect: "tech" },
    { icon: Shield, text: "Soporte 24/7", color: "text-tech-success", effect: "cyber" },
    { icon: CheckCircle, text: "Garantía de satisfacción", color: "text-tech-primary", effect: "hologram" }
  ];

  const stats = [
    { icon: Users, text: "500+ Restaurantes", value: "500+", effect: "tech" },
    { icon: Clock, text: "Tiempo Real", value: "24/7", effect: "cyber" },
    { icon: Star, text: "4.9/5", value: "4.9", effect: "hologram" },
    { icon: TrendingUp, text: "98% Satisfacción", value: "98%", effect: "data" }
  ];

  const features = [
    { icon: BarChart3, text: "Analytics Avanzados", effect: "tech" },
    { icon: Smartphone, text: "Multiplataforma", effect: "cyber" },
    { icon: Globe, text: "En la Nube", effect: "hologram" },
    { icon: Cpu, text: "IA Integrada", effect: "data" },
    { icon: Database, text: "Big Data", effect: "tech" },
    { icon: Network, text: "API REST", effect: "cyber" }
  ];

  const techData = [
    "SITEMM v2.0.1",
    "Node.js 18.x",
    "React 18.x",
    "PostgreSQL 15",
    "Redis Cache",
    "Docker Ready",
    "Kubernetes",
    "Microservices",
    "GraphQL API",
    "WebSocket RT",
    "JWT Auth",
    "OAuth 2.0"
  ];

  return (
    <section id="inicio" className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Background Tecnológico */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 z-10"></div>
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
        style={{ 
          backgroundImage: `url(${heroBackground})`,
          backgroundAttachment: 'fixed'
        }}
      ></div>
      
      {/* Efectos de Partículas Avanzadas */}
      <div className="absolute inset-0 z-20">
        {/* Partículas Tech */}
        <div className="absolute top-20 left-10 w-3 h-3 bg-tech-primary rounded-full animate-tech-float shadow-tech"></div>
        <div className="absolute top-40 right-20 w-2 h-2 bg-tech-accent rounded-full animate-cyber-rotate shadow-cyber"></div>
        <div className="absolute bottom-32 left-20 w-4 h-4 bg-tech-success rounded-full animate-hologram-flicker shadow-hologram"></div>
        <div className="absolute bottom-20 right-32 w-2 h-2 bg-tech-warning rounded-full animate-data-flow shadow-data"></div>
        
        {/* Efectos de Gradiente Animado */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-tech-primary/10 rounded-full blur-3xl animate-tech-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-tech-accent/10 rounded-full blur-3xl animate-cyber-glow"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-tech-success/10 rounded-full blur-3xl animate-hologram-distort"></div>
      </div>

      {/* Stream de Datos Tecnológicos - Oculto por ahora */}
      {/* <div className="absolute top-10 right-10 z-30 hidden lg:block">
        <DataStream data={techData} speed={800} color="tech" direction="down" />
      </div> */}

      {/* Content */}
      <div className="relative z-30 container mx-auto px-6 py-20 text-center text-white">
        <div className="max-w-6xl mx-auto">
          {/* Badge Tecnológico */}
          <ScrollEffect effect="tech-reveal" delay={200}>
            <div className="inline-flex items-center space-x-3 bg-slate-800/50 backdrop-blur-md rounded-full px-8 py-3 mb-12 border border-slate-700/50 shadow-lg">
              <Award className="w-5 h-5 text-yellow-400" />
              <span className="text-sm font-semibold text-white">Sistema POS #1 en Bolivia</span>
            </div>
          </ScrollEffect>

          {/* Main Heading Tecnológico */}
          <ScrollEffect effect="hologram-reveal" delay={400}>
            <h1 className="text-5xl md:text-7xl font-bold mb-12 leading-tight">
              <span className="bg-gradient-to-r from-white via-slate-200 to-white bg-clip-text text-transparent">
                Sistema POS
              </span>
              <br />
              <span className="text-white">
                que Revoluciona
              </span>
              <br />
              <span className="bg-gradient-to-r from-slate-300 via-white to-slate-300 bg-clip-text text-transparent">
                tu Restaurante
              </span>
            </h1>
          </ScrollEffect>

          {/* Subtitle */}
          <ScrollEffect effect="data-stream" delay={600}>
            <p className="text-lg md:text-xl text-slate-200 mb-16 leading-relaxed font-light max-w-3xl mx-auto">
              Gestión completa de pedidos, inventario, múltiples sucursales y analytics avanzados. 
              <span className="text-slate-300 font-medium"> Optimiza tu negocio</span> con la tecnología más avanzada del mercado.
            </p>
          </ScrollEffect>

          {/* Benefits */}
          <ScrollEffect effect="cyber-reveal" delay={800}>
            <div className="flex flex-wrap justify-center items-center gap-6 mb-16">
              {benefits.map((benefit, index) => {
                const Icon = benefit.icon;
                return (
                  <div key={index} className="flex items-center space-x-3 bg-slate-800/50 backdrop-blur-md rounded-xl px-6 py-3 border border-slate-700/50 shadow-lg hover:bg-slate-800/70 transition-all duration-300">
                    <Icon className="w-5 h-5 text-white/80" />
                    <span className="font-semibold text-sm text-white">{benefit.text}</span>
                  </div>
                );
              })}
            </div>
          </ScrollEffect>

          {/* Stats Grid */}
          <ScrollEffect effect="matrix-fall" delay={1000}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16 max-w-4xl mx-auto">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div key={index} className="bg-slate-800/50 backdrop-blur-md rounded-2xl p-6 border border-slate-700/50 shadow-lg hover:bg-slate-800/70 transition-all duration-300">
                    <div className="flex items-center justify-center mb-3">
                      <Icon className="w-8 h-8 text-slate-300" />
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                    <div className="text-sm text-slate-300 font-medium">{stat.text}</div>
                  </div>
                );
              })}
            </div>
          </ScrollEffect>

          {/* Features */}
          <ScrollEffect effect="data-stream" delay={1200}>
            <div className="flex flex-wrap justify-center items-center gap-8 mb-16">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div key={index} className="flex items-center space-x-2 text-slate-300">
                    <Icon className="w-5 h-5 text-slate-300" />
                    <span className="text-sm font-medium">{feature.text}</span>
                  </div>
                );
              })}
            </div>
          </ScrollEffect>

          {/* CTA Buttons */}
          <ScrollEffect effect="tech-reveal" delay={1400}>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-6 mb-20">
              <Button 
                size="lg" 
                onClick={handleRequestDemo}
                className="relative bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold px-10 py-4 text-lg shadow-2xl hover:shadow-red-500/50 transition-all duration-300 hover:scale-105 rounded-xl border border-red-500 overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-red-400/20 to-orange-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                <Zap className="w-5 h-5 mr-2 relative z-10" />
                <span className="relative z-10">Solicitar Demo Gratuita</span>
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                onClick={handleViewPlans}
                className="border-2 border-slate-600 text-white bg-slate-800/50 hover:bg-slate-700 hover:text-white font-bold px-10 py-4 text-lg backdrop-blur-md transition-all duration-300 hover:scale-105 rounded-xl"
              >
                Ver Planes y Precios
              </Button>
            </div>
          </ScrollEffect>

          {/* Video Play Button */}
          <ScrollEffect effect="hologram-reveal" delay={1600}>
            <div className="mt-16 flex flex-col items-center space-y-6">
              <button onClick={handleVideoPlay} className="group relative">
                <div className="w-24 h-24 bg-slate-800/50 backdrop-blur-md rounded-full flex items-center justify-center group-hover:bg-slate-800/70 transition-all duration-300 border border-slate-700/50 shadow-lg">
                  <Play className="w-8 h-8 text-white ml-1" />
                </div>
                <div className="absolute inset-0 rounded-full border-2 border-white/30 animate-ping"></div>
              </button>
              <div className="text-center">
                <span className="text-slate-200 text-lg font-semibold block">
                  Ver Demo del Sistema
                </span>
                <span className="text-slate-400 text-sm block mt-1">
                  Descubre cómo funciona nuestro POS
                </span>
              </div>
            </div>
          </ScrollEffect>
        </div>
      </div>

      {/* Scroll Indicator */}
      <ScrollEffect effect="tech-reveal" delay={1800}>
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-30">
          <button onClick={scrollToNext} className="group">
            <div className="w-8 h-12 border-2 border-white/50 rounded-full flex justify-center group-hover:border-white/80 transition-colors bg-white/10 backdrop-blur-md">
              <ArrowDown className="w-1 h-4 text-white/70 mt-3 animate-bounce" />
            </div>
          </button>
        </div>
      </ScrollEffect>
    </section>
  );
};

export default HeroSection;