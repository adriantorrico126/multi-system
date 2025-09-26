import { Phone, Mail, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

const Footer = () => {
  const [email, setEmail] = useState("");
  const { toast } = useToast();
  const currentYear = new Date().getFullYear();

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


  const scrollToSection = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <footer id="contacto" className="bg-slate-900 text-white">
      {/* Newsletter Section */}
      <div className="bg-slate-800 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h3 className="text-2xl md:text-3xl font-bold mb-4">
              ¡No te pierdas nuestras novedades!
            </h3>
            <p className="text-slate-300 mb-6 text-lg">
              Suscríbete y recibe promociones exclusivas, nuevos platos y eventos especiales
            </p>
            <form onSubmit={handleNewsletterSubscription} className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto">
              <Input 
                placeholder="Tu correo electrónico"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-slate-700/50 border-slate-600/50 text-white placeholder:text-slate-400 focus:ring-slate-500/50"
              />
              <Button type="submit" className="bg-slate-700 text-white hover:bg-slate-600 font-semibold px-8 border border-slate-600/50">
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
                <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center border border-slate-600/50">
                  <span className="text-white font-bold text-xl">F</span>
                </div>
                <span className="text-2xl font-bold">ForkastBI</span>
              </button>
              
              <p className="text-slate-300 leading-relaxed">
                Especialistas en Business Intelligence y Data Science. 
                Transformamos datos en decisiones inteligentes para tu negocio.
              </p>

              <div className="space-y-3">
                <button
                  onClick={() => window.open('tel:+59169512310')}
                  className="flex items-center space-x-3 text-slate-300 hover:text-white transition-colors"
                >
                  <Phone className="w-4 h-4 text-slate-300" />
                  <span>+591 69512310</span>
                </button>
                <button
                  onClick={() => window.open('mailto:bibforkast@gmail.com')}
                  className="flex items-center space-x-3 text-slate-300 hover:text-white transition-colors"
                >
                  <Mail className="w-4 h-4 text-slate-300" />
                  <span>bibforkast@gmail.com</span>
                </button>
                <div className="flex items-center space-x-3 text-slate-300">
                  <Clock className="w-4 h-4 text-slate-300" />
                  <span>Lun - Vie: 09:00 - 18:00</span>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-lg font-semibold mb-6 text-white">Enlaces Rápidos</h4>
              <ul className="space-y-3">
                {[
                  { name: "Solicitar Demo", action: () => scrollToSection('contacto') },
                  { name: "Ver Planes", action: () => scrollToSection('planes') },
                  { name: "Casos de Éxito", action: () => scrollToSection('casos-exito') },
                  { name: "Beneficios", action: () => scrollToSection('beneficios') },
                  { name: "Blog", action: () => toast({ title: "Blog", description: "Contenido educativo próximamente" }) },
                  { name: "Soporte Técnico", action: () => toast({ title: "Soporte", description: "Contacta a bibforkast@gmail.com" }) }
                ].map((link, index) => (
                  <li key={index}>
                    <button
                      onClick={link.action}
                      className="text-slate-300 hover:text-white transition-colors duration-200 flex items-center w-full text-left"
                    >
                      <span className="w-1 h-1 bg-slate-300 rounded-full mr-3"></span>
                      {link.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h4 className="text-lg font-semibold mb-6 text-white">Contacto</h4>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-start space-x-3">
                    <Phone className="w-4 h-4 text-slate-300 mt-1 flex-shrink-0" />
                    <div>
                      <div className="font-medium text-white">Teléfono Principal</div>
                      <div className="text-slate-300 text-sm">+591 69512310</div>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-start space-x-3">
                    <Mail className="w-4 h-4 text-slate-300 mt-1 flex-shrink-0" />
                    <div>
                      <div className="font-medium text-white">Email</div>
                      <div className="text-slate-300 text-sm">bibforkast@gmail.com</div>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-start space-x-3">
                    <Clock className="w-4 h-4 text-slate-300 mt-1 flex-shrink-0" />
                    <div>
                      <div className="font-medium text-white">Horario de Atención</div>
                      <div className="text-slate-300 text-sm">Lun - Vie: 09:00 - 18:00</div>
                    </div>
                  </div>
                </div>
              </div>
              <Button 
                variant="outline" 
                onClick={() => scrollToSection('contacto')}
                className="relative mt-4 border-red-500 text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-red-400/20 to-orange-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                <span className="relative z-10">Solicitar Demo</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-slate-700/50">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-slate-300 text-sm">
              © {currentYear} ForkastBI. Todos los derechos reservados.
            </div>
            <div className="flex space-x-6 text-sm">
              <a 
                href="/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-300 hover:text-white transition-colors"
              >
                Política de Privacidad
              </a>
              <a 
                href="/terms-of-service"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-300 hover:text-white transition-colors"
              >
                Términos de Servicio
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;