import { useState, useEffect } from "react";
import { Star, Quote, ChevronLeft, ChevronRight, User, Play, Pause } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

// Import customer images
import mariaImage from "@/assets/customer-maria.jpg";
import carlosImage from "@/assets/customer-carlos.jpg";
import anaImage from "@/assets/customer-ana.jpg";
import robertoImage from "@/assets/customer-roberto.jpg";
import isabellaImage from "@/assets/customer-isabella.jpg";

const TestimonialsSection = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const { toast } = useToast();

  const testimonials = [
    {
      id: 1,
      name: "María Elena Sánchez",
      role: "Empresaria",
      location: "La Paz", 
      rating: 5,
      comment: "La experiencia más increíble que he tenido. El sistema de reservas online funciona perfectamente y la comida es excepcional. El servicio en todas las sucursales es consistente y profesional.",
      image: mariaImage,
      date: "Hace 2 días"
    },
    {
      id: 2,
      name: "Carlos Mendoza",
      role: "Chef Profesional", 
      location: "Santa Cruz",
      rating: 5,
      comment: "Como chef, puedo reconocer la calidad excepcional. Los ingredientes son frescos, la presentación impecable y el sabor auténtico. Su tecnología POS hace que el pedido sea muy eficiente.",
      image: carlosImage,
      date: "Hace 1 semana"
    },
    {
      id: 3,
      name: "Ana Gabriela Torres",
      role: "Influencer Gastronómica",
      location: "Cochabamba",
      rating: 5,
      comment: "¡Simplemente perfecto! Cada sucursal mantiene la misma calidad excepcional. El menú digital es intuitivo y las fotos de los platos son exactamente como llegan a la mesa.",
      image: anaImage,
      date: "Hace 3 días"
    },
    {
      id: 4,
      name: "Roberto Vásquez",
      role: "Ejecutivo Corporativo",
      location: "La Paz",
      rating: 5,
      comment: "Organicé varios eventos corporativos aquí. El sistema de reservas grupales es excelente y el personal siempre está preparado. La tecnología que manejan es de primer nivel.",
      image: robertoImage,
      date: "Hace 5 días"
    },
    {
      id: 5,
      name: "Isabella Morales", 
      role: "Turista Internacional",
      location: "Sucre",
      rating: 5,
      comment: "Vine desde Argentina y superó todas mis expectativas. La fusión de sabores bolivianos con técnicas modernas es extraordinaria. Definitivamente regresaré en mi próxima visita.",
      image: isabellaImage,
      date: "Hace 4 días"
    }
  ];

  // Auto-rotate testimonials
  useEffect(() => {
    if (!isAutoPlay) return;
    
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex === testimonials.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000);

    return () => clearInterval(timer);
  }, [testimonials.length, isAutoPlay]);

  const nextTestimonial = () => {
    setCurrentIndex(currentIndex === testimonials.length - 1 ? 0 : currentIndex + 1);
    toast({
      title: "Siguiente testimonio",
      description: `Mostrando reseña de ${testimonials[currentIndex === testimonials.length - 1 ? 0 : currentIndex + 1].name}`,
    });
  };

  const prevTestimonial = () => {
    setCurrentIndex(currentIndex === 0 ? testimonials.length - 1 : currentIndex - 1);
    toast({
      title: "Testimonio anterior",
      description: `Mostrando reseña de ${testimonials[currentIndex === 0 ? testimonials.length - 1 : currentIndex - 1].name}`,
    });
  };

  const goToTestimonial = (index: number) => {
    setCurrentIndex(index);
    toast({
      title: "Testimonio seleccionado",
      description: `Mostrando reseña de ${testimonials[index].name}`,
    });
  };

  const toggleAutoPlay = () => {
    setIsAutoPlay(!isAutoPlay);
    toast({
      title: isAutoPlay ? "Auto-reproducción pausada" : "Auto-reproducción activada",
      description: isAutoPlay ? "Los testimonios ya no cambiarán automáticamente" : "Los testimonios cambiarán cada 5 segundos",
    });
  };

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center bg-blue-100 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
            Testimonios
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Lo que Dicen Nuestros
            <span className="text-primary block"> Clientes</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Miles de clientes satisfechos avalan nuestra calidad y servicio excepcional 
            en cada una de nuestras sucursales.
          </p>
        </div>

        {/* Main Testimonial Card */}
        <div className="max-w-4xl mx-auto mb-12">
          <Card className="relative overflow-hidden border shadow-lg">
            <div className="absolute top-6 left-6 opacity-10">
              <Quote className="w-16 h-16 text-primary" />
            </div>
            
            <CardContent className="p-8 md:p-12">
              <div className="grid md:grid-cols-4 gap-8 items-center">
                {/* Avatar & Info */}
                <div className="md:col-span-1 text-center md:text-left">
                  <div className="relative mb-4">
                    <div className="w-20 h-20 mx-auto md:mx-0 bg-primary rounded-full flex items-center justify-center overflow-hidden shadow-md">
                      <img 
                        src={testimonials[currentIndex].image} 
                        alt={testimonials[currentIndex].name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                      <User className="w-10 h-10 text-white hidden" />
                    </div>
                    <div className="absolute -top-1 -right-1 bg-success rounded-full p-1">
                      <Star className="w-3 h-3 text-white fill-current" />
                    </div>
                  </div>
                  
                  <h4 className="font-bold text-foreground text-lg mb-1">
                    {testimonials[currentIndex].name}
                  </h4>
                  <p className="text-primary font-medium text-sm mb-1">
                    {testimonials[currentIndex].role}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    📍 {testimonials[currentIndex].location}
                  </p>
                </div>

                {/* Content */}
                <div className="md:col-span-3">
                  {/* Rating */}
                  <div className="flex items-center justify-center md:justify-start space-x-1 mb-4">
                    {[...Array(testimonials[currentIndex].rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                    ))}
                    <span className="ml-2 text-sm text-muted-foreground">
                      {testimonials[currentIndex].date}
                    </span>
                  </div>

                  {/* Comment */}
                  <blockquote className="text-lg md:text-xl text-foreground leading-relaxed font-medium mb-4">
                    "{testimonials[currentIndex].comment}"
                  </blockquote>

                  {/* Navigation */}
                  <div className="flex items-center justify-center md:justify-start space-x-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={prevTestimonial}
                      className="rounded-full p-2 hover:bg-primary hover:text-white"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    
                    <div className="flex space-x-2">
                      {testimonials.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => goToTestimonial(index)}
                          className={`w-2 h-2 rounded-full transition-all duration-300 ${
                            index === currentIndex 
                              ? 'bg-primary w-8' 
                              : 'bg-muted-foreground/30 hover:bg-primary/50'
                          }`}
                        />
                      ))}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={nextTestimonial}
                      className="rounded-full p-2 hover:bg-primary hover:text-white"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={toggleAutoPlay}
                      className="ml-4"
                    >
                      {isAutoPlay ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div className="animate-fade-in">
            <div className="text-3xl md:text-4xl font-bold text-primary mb-2">4.9</div>
            <div className="text-muted-foreground">Calificación Promedio</div>
          </div>
          <div className="animate-fade-in" style={{ animationDelay: '100ms' }}>
            <div className="text-3xl md:text-4xl font-bold text-primary mb-2">2,547</div>
            <div className="text-muted-foreground">Reseñas Totales</div>
          </div>
          <div className="animate-fade-in" style={{ animationDelay: '200ms' }}>
            <div className="text-3xl md:text-4xl font-bold text-primary mb-2">98%</div>
            <div className="text-muted-foreground">Recomendación</div>
          </div>
          <div className="animate-fade-in" style={{ animationDelay: '300ms' }}>
            <div className="text-3xl md:text-4xl font-bold text-primary mb-2">15K+</div>
            <div className="text-muted-foreground">Clientes Felices</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;