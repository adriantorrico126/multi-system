import { Star, Clock, Flame, Plus, Check, Users, Zap, Shield, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const FeaturedDishes = () => {
  const { toast } = useToast();

  const plans = [
    {
      id: 1,
      name: "Básico",
      category: "Restaurantes Pequeños",
      price: 99,
      originalPrice: null,
      rating: 4.8,
      reviews: 156,
      description: "Perfecto para restaurantes pequeños y medianos que buscan optimizar sus operaciones.",
      features: [
        "Gestión de pedidos",
        "Inventario básico", 
        "Reportes simples",
        "Soporte por email",
        "1 sucursal",
        "5 usuarios"
      ],
      isPopular: false,
      isNew: false,
      maxSucursales: 1,
      maxUsuarios: 5
    },
    {
      id: 2, 
      name: "Profesional",
      category: "Cadenas de Restaurantes",
      price: 199,
      originalPrice: null,
      rating: 4.9,
      reviews: 89,
      description: "Ideal para cadenas de restaurantes que necesitan gestión multi-sucursal avanzada.",
      features: [
        "Todo del plan Básico",
        "Múltiples sucursales",
        "Analytics avanzados",
        "Sistema de reservas",
        "Delivery integrado",
        "Soporte telefónico",
        "5 sucursales",
        "20 usuarios"
      ],
      isPopular: true,
      isNew: false,
      maxSucursales: 5,
      maxUsuarios: 20
    },
    {
      id: 3,
      name: "Enterprise",
      category: "Grandes Cadenas",
      price: 399,
      originalPrice: null,
      rating: 5.0,
      reviews: 34,
      description: "Para grandes cadenas y franquicias que requieren soluciones personalizadas.",
      features: [
        "Todo del plan Profesional",
        "Sucursales ilimitadas",
        "API personalizada",
        "Soporte 24/7",
        "Implementación personalizada",
        "Capacitación incluida",
        "Sucursales ilimitadas",
        "Usuarios ilimitados"
      ],
      isPopular: false,
      isNew: true,
      maxSucursales: 999999,
      maxUsuarios: 999999
    }
  ];

  const handleRequestDemo = (plan: any) => {
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
    <section id="planes" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center bg-blue-100 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
            Planes y Precios
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Elige el Plan
            <span className="text-primary"> Perfecto</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Planes flexibles diseñados para restaurantes de todos los tamaños. 
            Comienza con lo básico y escala según crezca tu negocio.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {plans.map((plan, index) => (
            <Card 
              key={plan.id}
              className={`group hover:shadow-lg transition-all duration-500 border hover:border-primary/20 overflow-hidden relative ${
                plan.isPopular ? 'ring-2 ring-primary shadow-lg' : ''
              }`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {plan.isPopular && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 bg-primary text-white px-4 py-1 rounded-b-lg text-sm font-semibold z-10">
                  Más Popular
                </div>
              )}
              
              <CardContent className="p-6">
                <div className="mb-6">
                  <span className="text-sm text-primary font-medium">{plan.category}</span>
                  <h3 className="text-2xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                    {plan.name}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                    {plan.description}
                  </p>
                  
                  {/* Price */}
                  <div className="mb-6">
                    <div className="text-3xl font-bold text-foreground">
                      Bs. {plan.price}
                      <span className="text-sm font-normal text-muted-foreground">/mes</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Bs. {plan.price * 10}/año (2 meses gratis)
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center space-x-1 mb-6">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="font-semibold text-foreground">{plan.rating}</span>
                    <span className="text-muted-foreground">({plan.reviews} reseñas)</span>
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-3 mb-6">
                  {plan.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center space-x-3">
                      <Check className="w-4 h-4 text-primary flex-shrink-0" />
                      <span className="text-sm text-foreground">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Plan Button */}
                <Button 
                  onClick={() => handleRequestDemo(plan)}
                  className={`w-full font-semibold transition-all duration-300 ${
                    plan.isPopular 
                      ? 'bg-primary text-white hover:shadow-lg' 
                      : 'bg-gray-100 text-foreground hover:bg-primary hover:text-white'
                  }`}
                  size="lg"
                >
                  Solicitar Demo
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Additional Info */}
        <div className="text-center space-y-6">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="flex items-center justify-center space-x-3">
              <Zap className="w-6 h-6 text-primary" />
              <span className="font-semibold">Implementación en 24h</span>
            </div>
            <div className="flex items-center justify-center space-x-3">
              <Shield className="w-6 h-6 text-primary" />
              <span className="font-semibold">Garantía de satisfacción</span>
            </div>
            <div className="flex items-center justify-center space-x-3">
              <TrendingUp className="w-6 h-6 text-primary" />
              <span className="font-semibold">Escalable sin límites</span>
            </div>
          </div>

          <Button 
            variant="outline" 
            size="lg"
            onClick={handleContactSales}
            className="text-primary border-primary hover:bg-primary hover:text-white px-8 py-3 font-semibold transition-all duration-300"
          >
            ¿Necesitas un Plan Personalizado?
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedDishes;