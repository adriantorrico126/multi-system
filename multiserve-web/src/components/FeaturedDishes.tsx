import { Star, Clock, Flame, Plus, Check, Users, Zap, Shield, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useConversionTracker } from "@/hooks/useConversionTracker";

const FeaturedDishes = () => {
  const { toast } = useToast();
  const { trackPlanView, trackDemoRequest } = useConversionTracker();

  const plans = [
    {
      id: 1,
      name: "Básico",
      category: "Restaurantes Pequeños",
      price: 19,
      originalPrice: null,
      rating: 4.8,
      reviews: 156,
      description: "Plan ideal para pequeños restaurantes y food trucks que buscan optimizar sus operaciones básicas.",
      features: [
        "Gestión básica de ventas",
        "Inventario básico (100 productos)", 
        "Reportes simples",
        "Soporte por email",
        "1 sucursal",
        "2 usuarios"
      ],
      isPopular: false,
      isNew: false,
      maxSucursales: 1,
      maxUsuarios: 2
    },
    {
      id: 2, 
      name: "Profesional",
      category: "Cadenas Pequeñas",
      price: 49,
      originalPrice: null,
      rating: 4.9,
      reviews: 89,
      description: "Perfecto para restaurantes medianos y cadenas pequeñas que necesitan más funcionalidades.",
      features: [
        "Todo del plan Básico",
        "Gestión de mesas",
        "Sistema de lotes",
        "Arqueo de caja",
        "Vista de cocina",
        "Egresos básicos",
        "2 sucursales",
        "7 usuarios",
        "500 productos"
      ],
      isPopular: true,
      isNew: false,
      maxSucursales: 2,
      maxUsuarios: 7
    },
    {
      id: 3,
      name: "Avanzado",
      category: "Restaurantes Grandes",
      price: 99,
      originalPrice: null,
      rating: 4.9,
      reviews: 67,
      description: "Ideal para restaurantes grandes y cadenas medianas que requieren funcionalidades avanzadas.",
      features: [
        "Todo del plan Profesional",
        "Funciones avanzadas de ventas",
        "Sistema de delivery",
        "Reservas de mesas",
        "Analytics avanzados",
        "Egresos avanzados",
        "Promociones",
        "3 sucursales",
        "Usuarios ilimitados",
        "2000 productos"
      ],
      isPopular: false,
      isNew: false,
      maxSucursales: 3,
      maxUsuarios: 999999
    },
    {
      id: 4,
      name: "Enterprise",
      category: "Grandes Cadenas",
      price: 119,
      originalPrice: null,
      rating: 5.0,
      reviews: 34,
      description: "Solución completa para grandes cadenas y franquicias que requieren máxima flexibilidad.",
      features: [
        "Todo del plan Avanzado",
        "API externa",
        "White label",
        "Soporte 24/7",
        "Implementación personalizada",
        "Capacitación incluida",
        "Sucursales ilimitadas",
        "Usuarios ilimitados",
        "Productos ilimitados"
      ],
      isPopular: false,
      isNew: true,
      maxSucursales: 999999,
      maxUsuarios: 999999
    }
  ];

  const handleRequestDemo = (plan: any) => {
    trackDemoRequest(plan.name);
    toast({
      title: "Demo Solicitada",
      description: `Te contactaremos para agendar una demo del plan ${plan.name}`,
    });
    document.getElementById('contacto')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleContactSales = () => {
    toast({
      title: "Contacto de Ventas",
      description: "Redirigiendo al formulario de contacto...",
    });
    document.getElementById('contacto')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="planes" className="py-24 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-impact opacity-5"></div>
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-slate-600 via-slate-700 to-slate-800"></div>
      
      <div className="container mx-auto px-6 relative z-10">
        {/* Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center bg-slate-800/50 text-white px-6 py-3 rounded-full text-sm font-semibold mb-6 shadow-lg animate-fade-in-up">
            <Zap className="w-4 h-4 mr-2" />
            Planes y Precios
          </div>
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-8 animate-slide-in-up">
            Elige el Plan
            <span className="text-shimmer block mt-2">Perfecto para tu Negocio</span>
          </h2>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed animate-fade-in-up delay-200">
            Planes flexibles diseñados para restaurantes de todos los tamaños. 
            Comienza con lo básico y escala según crezca tu negocio con nuestra tecnología de vanguardia.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {plans.map((plan, index) => (
            <Card 
              key={plan.id}
              className={`group hover-card-lift hover-glow transition-all duration-500 border-2 overflow-hidden relative bg-slate-800/50 backdrop-blur-sm ${
                plan.isPopular 
                  ? 'ring-2 ring-slate-500 shadow-impact border-slate-600' 
                  : 'border-slate-700/50 hover:border-slate-600'
              }`}
              style={{ 
                animationDelay: `${index * 150}ms`,
                animation: 'slideInUp 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards'
              }}
              onMouseEnter={() => trackPlanView(plan.name)}
            >
              {plan.isPopular && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-slate-700 to-slate-800 text-white px-6 py-2 rounded-b-xl text-sm font-bold z-10 shadow-lg animate-pulse-glow">
                  ⭐ Más Popular
                </div>
              )}
              
              {plan.isNew && (
                <div className="absolute top-0 right-0 bg-gradient-to-r from-slate-700 to-slate-800 text-white px-4 py-2 rounded-bl-xl text-xs font-bold z-10 shadow-lg">
                  ✨ Nuevo
                </div>
              )}
              
              <CardContent className="p-8">
                <div className="mb-8">
                  <span className="text-sm font-semibold text-slate-300 bg-slate-700/50 px-3 py-1 rounded-full">{plan.category}</span>
                  <h3 className="text-3xl font-bold text-white mb-3 group-hover:text-slate-300 transition-colors">
                    {plan.name}
                  </h3>
                  <p className="text-slate-300 text-sm leading-relaxed mb-6">
                    {plan.description}
                  </p>
                  
                  {/* Price */}
                  <div className="mb-8 p-4 bg-gradient-to-r from-slate-700/50 to-slate-800/50 rounded-xl border border-slate-600/50">
                    <div className="text-4xl font-bold text-white mb-1">
                      ${plan.price}
                      <span className="text-lg font-normal text-slate-300"> USD/mes</span>
                    </div>
                    <div className="text-sm text-slate-300 font-medium">
                      ${plan.price * 10} USD/año (2 meses gratis)
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center justify-center space-x-2 mb-6 p-3 bg-slate-700/50 rounded-lg border border-slate-600/50">
                    <Star className="w-5 h-5 text-yellow-500 fill-current" />
                    <span className="font-bold text-white">{plan.rating}</span>
                    <span className="text-slate-300 text-sm">({plan.reviews} reseñas)</span>
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center space-x-3 group/feature">
                      <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center flex-shrink-0 group-hover/feature:scale-110 transition-transform duration-200">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-sm text-slate-300 font-medium group-hover/feature:text-green-400 transition-colors">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Plan Button */}
                <Button 
                  onClick={() => handleRequestDemo(plan)}
                  className="relative w-full font-bold py-4 text-lg rounded-xl transition-all duration-300 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white shadow-lg hover:shadow-red-500/50 border border-red-500 overflow-hidden group hover:scale-105"
                  size="lg"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-red-400/20 to-orange-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                  <Zap className="w-5 h-5 mr-2 relative z-10" />
                  <span className="relative z-10">Solicitar Demo</span>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Additional Info */}
        <div className="text-center space-y-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="flex items-center justify-center space-x-4 p-6 bg-gradient-to-r from-slate-800/50 to-slate-700/50 rounded-2xl border border-slate-600/50 hover-card-lift">
              <div className="w-12 h-12 bg-gradient-to-r from-slate-700 to-slate-800 rounded-xl flex items-center justify-center border border-slate-600/50">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <span className="font-bold text-lg text-white">Implementación en 24h</span>
            </div>
            <div className="flex items-center justify-center space-x-4 p-6 bg-gradient-to-r from-slate-800/50 to-slate-700/50 rounded-2xl border border-slate-600/50 hover-card-lift">
              <div className="w-12 h-12 bg-gradient-to-r from-slate-700 to-slate-800 rounded-xl flex items-center justify-center border border-slate-600/50">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <span className="font-bold text-lg text-white">Garantía de satisfacción</span>
            </div>
            <div className="flex items-center justify-center space-x-4 p-6 bg-gradient-to-r from-slate-800/50 to-slate-700/50 rounded-2xl border border-slate-600/50 hover-card-lift">
              <div className="w-12 h-12 bg-gradient-to-r from-slate-700 to-slate-800 rounded-xl flex items-center justify-center border border-slate-600/50">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <span className="font-bold text-lg text-white">Escalable sin límites</span>
            </div>
          </div>

          <Button 
            variant="outline" 
            size="lg"
            onClick={handleContactSales}
            className="text-white border-2 border-slate-600 bg-slate-800/50 hover:bg-gradient-to-r hover:from-slate-700 hover:to-slate-800 hover:text-white hover:border-transparent px-12 py-4 font-bold text-lg transition-all duration-300 hover-button-glow rounded-xl"
          >
            <Users className="w-5 h-5 mr-2" />
            ¿Necesitas un Plan Personalizado?
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedDishes;