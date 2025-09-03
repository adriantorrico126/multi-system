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
      number: "15",
      label: "Años de Experiencia",
      description: "En el mercado boliviano"
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
    <section id="beneficios" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center bg-blue-100 text-primary px-4 py-2 rounded-full text-sm font-medium">
                Por Qué Elegirnos
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-foreground leading-tight">
                Sistema POS que
                <span className="text-primary block">Transforma tu Negocio</span>
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Más de 15 años ayudando a restaurantes a optimizar sus operaciones. 
                Nuestro sistema POS integral combina simplicidad de uso con funcionalidades 
                avanzadas para maximizar tu rentabilidad.
              </p>
            </div>

            <div className="space-y-6">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div key={index} className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center flex-shrink-0">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                      <p className="text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Statistics Grid */}
          <div className="grid grid-cols-2 gap-6">
            {achievements.map((achievement, index) => {
              const Icon = achievement.icon;
              return (
                <Card 
                  key={index} 
                  className="group hover:shadow-lg transition-all duration-300 border hover:border-primary/20 animate-pulse"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:shadow-lg transition-all duration-300">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-3xl font-bold text-foreground mb-2">
                      {achievement.number}
                    </div>
                    <div className="font-semibold text-foreground mb-2">
                      {achievement.label}
                    </div>
                    <div className="text-sm text-muted-foreground leading-relaxed">
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