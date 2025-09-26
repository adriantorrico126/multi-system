import { useState, useEffect } from "react";
import { 
  Brain, 
  Database, 
  BarChart3, 
  Cpu, 
  Code, 
  Cloud, 
  Zap, 
  Shield, 
  Award, 
  TrendingUp,
  CheckCircle,
  Star,
  GraduationCap,
  Target,
  Lightbulb,
  Rocket
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useConversionTracker } from "@/hooks/useConversionTracker";

const AboutUsSection = () => {
  const { toast } = useToast();
  const { trackDemoRequest } = useConversionTracker();

  const handleRequestDemo = () => {
    trackDemoRequest('about_us');
    toast({
      title: "Demo Solicitada",
      description: "Redirigiendo al formulario para agendar tu demo gratuita...",
    });
    document.getElementById('contacto')?.scrollIntoView({ behavior: 'smooth' });
  };



  const achievements = [
    { icon: Award, title: "95% Precisión IA", description: "Sistemas de predicción con precisión superior al 95%" },
    { icon: Target, title: "Impacto Medible", description: "Reconocido por generar resultados a través de tecnologías emergentes" },
    { icon: GraduationCap, title: "Formación Continua", description: "Licenciatura en Ingeniería en Ciencia de Datos e Inteligencia de Negocios" },
    { icon: Lightbulb, title: "Innovación", description: "Experto en transformación digital empresarial" }
  ];

  return (
    <section className="py-24 bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-impact opacity-10"></div>
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-slate-600 via-gray-500 to-slate-600"></div>
      <div className="absolute top-1/4 right-0 w-96 h-96 bg-slate-600/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 left-0 w-80 h-80 bg-gray-500/10 rounded-full blur-3xl"></div>
      
      <div className="container mx-auto px-6 relative z-10">
        {/* Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center bg-white/10 text-white px-6 py-3 rounded-full text-sm font-bold shadow-lg animate-fade-in-up">
            <Brain className="w-4 h-4 mr-2" />
            Sobre Nosotros
          </div>
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-8 animate-slide-in-up">
            Ingenieros en Ciencia de Datos
            <span className="text-shimmer block mt-4">e Inteligencia de Negocios</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed animate-fade-in-up delay-200">
            Científico de datos y desarrollador full stack especializado en la implementación de soluciones integrales basadas en inteligencia artificial, análisis predictivo y desarrollo web avanzado.
          </p>
        </div>

        {/* Achievements */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
          {achievements.map((achievement, index) => (
            <Card key={index} className="bg-white/5 backdrop-blur-xl border-white/10 hover:border-white/20 hover-card-lift animate-fade-in-up shadow-xl hover:shadow-2xl transition-all duration-300" style={{ animationDelay: `${index * 100}ms` }}>
              <CardContent className="p-8 text-center">
                <div className={`w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-white/20 via-white/15 to-white/10 rounded-2xl flex items-center justify-center shadow-lg relative`}>
                  <achievement.icon className="w-8 h-8 text-white relative z-10" />
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 rounded-2xl blur-lg opacity-50"></div>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{achievement.title}</h3>
                <p className="text-gray-300 text-sm leading-relaxed">{achievement.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>



        {/* Call to Action */}
        <div className="text-center">
          <Card className="max-w-4xl mx-auto bg-white/5 backdrop-blur-xl border-2 border-white/10 shadow-2xl relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-white/3 to-white/5"></div>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-white/30 via-white/20 to-white/30"></div>
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-white/5 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-white/5 rounded-full blur-3xl"></div>
            
            <CardContent className="p-12 relative z-10">
              <div className="flex items-center justify-center mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-white/20 via-white/15 to-white/10 rounded-2xl flex items-center justify-center shadow-lg relative">
                  <Rocket className="w-10 h-10 text-white" />
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 rounded-2xl blur-lg opacity-50"></div>
                </div>
              </div>
              <h3 className="text-3xl md:text-4xl font-bold text-white mb-6">
                ¿Listo para Transformar tu Negocio?
              </h3>
              <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
                Conecta con nuestro equipo de expertos en ciencia de datos e inteligencia artificial 
                para implementar soluciones que impulsen el crecimiento de tu empresa.
              </p>
              <Button
                onClick={handleRequestDemo}
                className="relative bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-xl hover:shadow-red-500/50 transition-all duration-300 transform hover:scale-105 border border-red-500 overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-red-400/20 to-orange-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                <Zap className="w-5 h-5 mr-2 relative z-10" />
                <span className="relative z-10">Solicitar Demo Gratuita</span>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center mt-20">
          <div className="animate-fade-in p-6 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 hover-card-lift">
            <div className="text-4xl md:text-5xl font-bold text-white mb-3">95%</div>
            <div className="text-gray-300 font-semibold">Precisión en Predicciones</div>
          </div>
          <div className="animate-fade-in delay-100 p-6 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 hover-card-lift">
            <div className="text-4xl md:text-5xl font-bold text-white mb-3">50+</div>
            <div className="text-gray-300 font-semibold">Tecnologías Dominadas</div>
          </div>
          <div className="animate-fade-in delay-200 p-6 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 hover-card-lift">
            <div className="text-4xl md:text-5xl font-bold text-white mb-3">100%</div>
            <div className="text-gray-300 font-semibold">Compromiso</div>
          </div>
          <div className="animate-fade-in delay-300 p-6 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 hover-card-lift">
            <div className="text-4xl md:text-5xl font-bold text-white mb-3">24/7</div>
            <div className="text-gray-300 font-semibold">Soporte Técnico</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutUsSection;
