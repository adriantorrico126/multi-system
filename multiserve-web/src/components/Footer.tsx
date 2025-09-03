import { MapPin, Phone, Mail, Clock, Instagram, Facebook, Twitter, Youtube } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

const Footer = () => {
  const [email, setEmail] = useState("");
  const { toast } = useToast();
  const currentYear = new Date().getFullYear();

  const locations = [
    { name: "La Paz Centro", address: "Av. 16 de Julio #1234", phone: "+591 2 234-5678" },
    { name: "Santa Cruz Mall", address: "C. Monseñor Rivero #567", phone: "+591 3 345-6789" },
    { name: "Cochabamba Norte", address: "Av. América #890", phone: "+591 4 456-7890" }
  ];

  const socialLinks = [
    { icon: Instagram, href: "#", followers: "45K", name: "Instagram" },
    { icon: Facebook, href: "#", followers: "78K", name: "Facebook" },
    { icon: Twitter, href: "#", followers: "23K", name: "Twitter" },
    { icon: Youtube, href: "#", followers: "12K", name: "YouTube" }
  ];

  const handleNewsletterSubscription = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({
        title: "Email requerido",
        description: "Por favor ingresa tu correo electrónico",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "¡Suscripción exitosa!",
      description: `Gracias por suscribirte con ${email}. Recibirás nuestras promociones exclusivas.`,
    });
    setEmail("");
  };

  const handleSocialClick = (social: typeof socialLinks[0]) => {
    toast({
      title: `Visitando ${social.name}`,
      description: `Redirigiendo a nuestro perfil de ${social.name} con ${social.followers} seguidores`,
    });
  };

  const handleLocationCall = (location: typeof locations[0]) => {
    toast({
      title: `Llamando a ${location.name}`,
      description: `Contactando al ${location.phone}`,
    });
    window.open(`tel:${location.phone.replace(/\s/g, '')}`);
  };

  const handleAppDownload = (platform: string) => {
    toast({
      title: `Descarga para ${platform}`,
      description: "Redirigiendo a la tienda de aplicaciones...",
    });
  };

  const scrollToSection = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <footer id="contacto" className="bg-foreground text-white">
      {/* Newsletter Section */}
      <div className="bg-primary py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h3 className="text-2xl md:text-3xl font-bold mb-4">
              ¡No te pierdas nuestras novedades!
            </h3>
            <p className="text-white/80 mb-6 text-lg">
              Suscríbete y recibe promociones exclusivas, nuevos platos y eventos especiales
            </p>
            <form onSubmit={handleNewsletterSubscription} className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto">
              <Input 
                placeholder="Tu correo electrónico"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:ring-white/50"
              />
              <Button type="submit" className="bg-white text-primary hover:bg-white/90 font-semibold px-8">
                Suscribirse
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-8">
            {/* Company Info */}
            <div className="space-y-6">
              <button 
                onClick={() => scrollToSection('inicio')}
                className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
              >
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">R</span>
                </div>
                <span className="text-2xl font-bold">RestaurantPOS</span>
              </button>
              
              <p className="text-white/70 leading-relaxed">
                Líder en experiencias gastronómicas con tecnología POS avanzada. 
                Sabores auténticos bolivianos en cada una de nuestras sucursales.
              </p>

              <div className="space-y-3">
                <button
                  onClick={() => window.open('tel:+59180073782')}
                  className="flex items-center space-x-3 text-white/70 hover:text-primary transition-colors"
                >
                  <Phone className="w-4 h-4 text-primary" />
                  <span>+591 800-RESTAU (737-828)</span>
                </button>
                <button
                  onClick={() => window.open('mailto:info@restaurantpos.bo')}
                  className="flex items-center space-x-3 text-white/70 hover:text-primary transition-colors"
                >
                  <Mail className="w-4 h-4 text-primary" />
                  <span>info@restaurantpos.bo</span>
                </button>
                <div className="flex items-center space-x-3 text-white/70">
                  <Clock className="w-4 h-4 text-primary" />
                  <span>Lun - Dom: 11:00 - 23:00</span>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-lg font-semibold mb-6">Enlaces Rápidos</h4>
              <ul className="space-y-3">
                {[
                  { name: "Solicitar Demo", action: () => scrollToSection('contacto') },
                  { name: "Ver Planes", action: () => scrollToSection('planes') },
                  { name: "Casos de Éxito", action: () => scrollToSection('casos-exito') },
                  { name: "Beneficios", action: () => scrollToSection('beneficios') },
                  { name: "Blog", action: () => toast({ title: "Blog", description: "Contenido educativo próximamente" }) },
                  { name: "Soporte Técnico", action: () => toast({ title: "Soporte", description: "Contacta a soporte@restaurantpos.bo" }) }
                ].map((link, index) => (
                  <li key={index}>
                    <button
                      onClick={link.action}
                      className="text-white/70 hover:text-primary transition-colors duration-200 flex items-center w-full text-left"
                    >
                      <span className="w-1 h-1 bg-primary rounded-full mr-3"></span>
                      {link.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Locations */}
            <div>
              <h4 className="text-lg font-semibold mb-6">Oficinas</h4>
              <div className="space-y-4">
                {locations.map((location, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-start space-x-3">
                      <MapPin className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                      <div>
                        <div className="font-medium text-white">{location.name}</div>
                        <div className="text-white/70 text-sm">{location.address}</div>
                        <button
                          onClick={() => handleLocationCall(location)}
                          className="text-primary text-sm hover:underline"
                        >
                          {location.phone}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Button 
                variant="outline" 
                onClick={() => scrollToSection('contacto')}
                className="mt-4 border-primary text-primary hover:bg-primary hover:text-white"
              >
                Contactar Ventas
              </Button>
            </div>

            {/* Social Media */}
            <div>
              <h4 className="text-lg font-semibold mb-6">Síguenos</h4>
              <div className="grid grid-cols-2 gap-3">
                {socialLinks.map((social, index) => {
                  const Icon = social.icon;
                  return (
                    <button 
                      key={index}
                      onClick={() => handleSocialClick(social)}
                      className="flex items-center space-x-3 p-3 bg-white/5 hover:bg-primary/20 rounded-lg transition-all duration-300 group w-full text-left"
                    >
                      <Icon className="w-5 h-5 text-primary group-hover:text-white" />
                      <div>
                        <div className="text-white text-sm font-medium">{social.followers}</div>
                        <div className="text-white/60 text-xs">seguidores</div>
                      </div>
                    </button>
                  );
                })}
              </div>
              
              <div className="mt-6 p-4 bg-white/5 rounded-lg">
                <div className="text-sm text-white/70 mb-2">App Móvil</div>
                <div className="flex flex-col space-y-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => handleAppDownload('iOS')}
                    className="border-primary text-primary hover:bg-primary hover:text-white justify-start"
                  >
                    📱 Descargar para iOS
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => handleAppDownload('Android')}
                    className="border-primary text-primary hover:bg-primary hover:text-white justify-start"
                  >
                    🤖 Descargar para Android
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-white/60 text-sm">
              © {currentYear} RestaurantPOS. Todos los derechos reservados.
            </div>
            <div className="flex space-x-6 text-sm">
              <button 
                onClick={() => toast({ title: "Política de Privacidad", description: "Ver términos de privacidad y datos" })}
                className="text-white/60 hover:text-primary transition-colors"
              >
                Política de Privacidad
              </button>
              <button 
                onClick={() => toast({ title: "Términos de Servicio", description: "Ver condiciones de uso" })}
                className="text-white/60 hover:text-primary transition-colors"
              >
                Términos de Servicio
              </button>
              <button 
                onClick={() => toast({ title: "Cookies", description: "Ver política de cookies" })}
                className="text-white/60 hover:text-primary transition-colors"
              >
                Cookies
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;