import { Award, Users, Clock, MapPin, Zap, Shield, TrendingUp, Smartphone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const AboutSection = () => {
  const achievements = [
    {
      icon: Users,
      number: "500+",
      label: "Restaurantes Activos",
      description: "Usando nuestro sistema POS"
    },
    {
      icon: Clock,
      number: "24/7",
      label: "Soporte Disponible",
      description: "Asistencia técnica especializada"
    },
    {
      icon: MapPin,
      number: "95%",
      label: "Precisión IA",
      description: "En predicciones empresariales"
    },
    {
      icon: TrendingUp,
      number: "40%",
      label: "Mejora Promedio",
      description: "En eficiencia operativa"
    }
  ];

  const features = [
    {
      icon: Zap,
      title: "Implementación Rápida",
      description: "Tu sistema funcionando en menos de 24 horas con nuestra implementación express."
    },
    {
      icon: Shield,
      title: "Seguridad Garantizada",
      description: "Datos protegidos con encriptación de nivel bancario y backups automáticos."
    },
    {
      icon: Smartphone,
      title: "Multiplataforma",
      description: "Accede desde cualquier dispositivo: tablets, smartphones, computadoras."
    },
    {
      icon: TrendingUp,
      title: "Analytics Avanzados",
      description: "Reportes detallados para tomar decisiones informadas sobre tu negocio."
    }
  ];

  return (
    <section id="beneficios" className="py-24 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-impact opacity-3"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-slate-700/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-slate-600/10 rounded-full blur-3xl"></div>
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          {/* Content */}
          <div className="space-y-10">
            <div className="space-y-6">
              <div className="inline-flex items-center bg-slate-800/50 text-white px-6 py-3 rounded-full text-sm font-bold shadow-lg animate-fade-in-up">
                <Award className="w-4 h-4 mr-2" />
                Por Qué Elegirnos
              </div>
              <h2 className="text-5xl md:text-6xl font-bold text-white leading-tight animate-slide-in-left">
                Sistema POS que
                <span className="text-shimmer block mt-2">Transforma tu Negocio</span>
              </h2>
              <p className="text-xl text-slate-300 leading-relaxed animate-fade-in-up delay-200">
                Especialistas en Business Intelligence con sistemas de predicción de 95% de precisión. 
                Nuestras soluciones integrales combinan inteligencia artificial con análisis avanzado 
                para maximizar tu rentabilidad y crecimiento empresarial.
              </p>
            </div>

            <div className="space-y-8">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div key={index} className="flex items-start space-x-6 p-6 bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 hover-card-lift group" style={{ animationDelay: `${index * 150}ms` }}>
                    <div className="w-16 h-16 bg-gradient-to-r from-slate-700 to-slate-800 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-lg border border-slate-600/50">
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-xl text-white mb-3 group-hover:text-slate-300 transition-colors">{feature.title}</h3>
                      <p className="text-slate-300 leading-relaxed text-lg">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Statistics Grid */}
          <div className="grid grid-cols-2 gap-8">
            {achievements.map((achievement, index) => {
              const Icon = achievement.icon;
              return (
                <Card 
                  key={index} 
                  className="group hover-card-lift hover-glow transition-all duration-500 border-2 border-slate-700/50 bg-slate-800/50 backdrop-blur-sm overflow-hidden relative"
                  style={{ 
                    animationDelay: `${index * 200}ms`,
                    animation: 'slideInUp 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards'
                  }}
                >
                  <CardContent className="p-8 text-center">
                    <div className="w-20 h-20 bg-gradient-to-r from-slate-700 to-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg border border-slate-600/50">
                      <Icon className="w-10 h-10 text-white" />
                    </div>
                    <div className="text-4xl font-bold text-white mb-3 group-hover:text-slate-300 transition-colors">
                      {achievement.number}
                    </div>
                    <div className="font-bold text-lg text-white mb-3">
                      {achievement.label}
                    </div>
                    <div className="text-sm text-slate-300 leading-relaxed">
                      {achievement.description}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;