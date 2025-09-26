import { Star, TrendingUp, Users, MapPin, Building, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const LocationsSection = () => {
  const { toast } = useToast();

  const successCases = [
    {
      id: 1,
      restaurantName: "Restaurante La Paz Gourmet",
      type: "Restaurante de Lujo",
      city: "La Paz",
      branches: 3,
      monthsUsing: 18,
      improvement: "45%",
      testimonial: "El sistema POS transformó completamente nuestras operaciones. Ahora tenemos control total sobre inventario y ventas.",
      contactName: "María Elena Sánchez",
      position: "Gerente General",
      plan: "Profesional",
      logo: "🍽️"
    },
    {
      id: 2,
      restaurantName: "Pizza Express Bolivia",
      type: "Comida Rápida",
      city: "Santa Cruz",
      branches: 8,
      monthsUsing: 24,
      improvement: "60%",
      testimonial: "La gestión multi-sucursal nos permitió expandirnos de 2 a 8 locales en solo 2 años.",
      contactName: "Carlos Mendoza",
      position: "Director de Operaciones",
      plan: "Enterprise",
      logo: "🍕"
    },
    {
      id: 3,
      restaurantName: "Café del Titicaca",
      type: "Café & Bar",
      city: "Cochabamba",
      branches: 2,
      monthsUsing: 12,
      improvement: "35%",
      testimonial: "La integración con delivery y reservas aumentó nuestras ventas significativamente.",
      contactName: "Ana Gabriela Torres",
      position: "Propietaria",
      plan: "Profesional",
      logo: "☕"
    }
  ];

  const handleViewCase = (caseData: any) => {
    toast({
      title: `Caso de Éxito: ${caseData.restaurantName}`,
      description: `Mejora del ${caseData.improvement} en eficiencia operativa`,
    });
  };

  const handleRequestDemo = () => {
    toast({
      title: "Demo Solicitada",
      description: "Redirigiendo al formulario para agendar tu demo gratuita...",
    });
    document.getElementById('contacto')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="casos-exito" className="py-20 bg-slate-900">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <div className="inline-flex items-center bg-slate-800/50 text-white px-4 py-2 rounded-full text-sm font-medium mb-4">
            Casos de Éxito
          </div>
          <h2 className="text-4xl font-bold text-white mb-6">
            Restaurantes que <span className="text-slate-300">Transformaron</span> su Negocio
          </h2>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto">
            Descubre cómo nuestros clientes han logrado resultados extraordinarios 
            implementando nuestro sistema POS.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 mb-12">
          {successCases.map((caseData, index) => (
            <Card 
              key={caseData.id} 
              className="hover:shadow-lg transition-all duration-300 group cursor-pointer bg-slate-800/50 backdrop-blur-sm border border-slate-700/50"
              onClick={() => handleViewCase(caseData)}
            >
              <CardContent className="p-6 space-y-4">
                {/* Header */}
                <div className="flex items-center space-x-3 mb-4">
                  <div className="text-3xl">{caseData.logo}</div>
                  <div>
                    <h3 className="text-xl font-bold text-white group-hover:text-slate-300 transition-colors">
                      {caseData.restaurantName}
                    </h3>
                    <p className="text-sm text-slate-300">{caseData.type}</p>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center p-3 bg-slate-700/50 rounded-lg">
                    <div className="text-2xl font-bold text-white">{caseData.branches}</div>
                    <div className="text-xs text-slate-300">Sucursales</div>
                  </div>
                  <div className="text-center p-3 bg-slate-700/50 rounded-lg">
                    <div className="text-2xl font-bold text-green-400">{caseData.improvement}</div>
                    <div className="text-xs text-slate-300">Mejora</div>
                  </div>
                </div>

                {/* Location & Time */}
                <div className="flex items-center justify-between text-sm text-slate-300 mb-4">
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-4 h-4" />
                    <span>{caseData.city}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>{caseData.monthsUsing} meses</span>
                  </div>
                </div>

                {/* Testimonial */}
                <blockquote className="text-sm text-slate-200 italic mb-4">
                  "{caseData.testimonial}"
                </blockquote>

                {/* Contact */}
                <div className="border-t border-slate-700/50 pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-white text-sm">
                        {caseData.contactName}
                      </div>
                      <div className="text-xs text-slate-300">
                        {caseData.position}
                      </div>
                    </div>
                    <div className="text-xs bg-slate-700/50 text-white px-2 py-1 rounded">
                      Plan {caseData.plan}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA Section */}
        <div className="text-center space-y-6">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="animate-fade-in">
              <div className="text-3xl md:text-4xl font-bold text-white mb-2">500+</div>
              <div className="text-slate-300">Restaurantes Activos</div>
            </div>
            <div className="animate-fade-in" style={{ animationDelay: '100ms' }}>
              <div className="text-3xl md:text-4xl font-bold text-white mb-2">40%</div>
              <div className="text-slate-300">Mejora Promedio</div>
            </div>
            <div className="animate-fade-in" style={{ animationDelay: '200ms' }}>
              <div className="text-3xl md:text-4xl font-bold text-white mb-2">98%</div>
              <div className="text-slate-300">Satisfacción</div>
            </div>
          </div>

          <Button 
            size="lg"
            onClick={handleRequestDemo}
            className="bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 text-white hover:shadow-lg px-8 py-3 font-semibold transition-all duration-300 border border-slate-600/50"
          >
            <TrendingUp className="w-5 h-5 mr-2" />
            Únete a Nuestros Casos de Éxito
          </Button>
        </div>
      </div>
    </section>
  );
};

export default LocationsSection;