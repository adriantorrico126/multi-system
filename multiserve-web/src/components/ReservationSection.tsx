import { useState } from "react";
import { Calendar, Users, Clock, MapPin, Check, Phone, Mail, Building, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const ReservationSection = () => {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    restaurante: '',
    tipo_restaurante: '',
    num_sucursales: '1',
    num_empleados: '',
    ciudad: '',
    interes_plan: '',
    mensaje: '',
  });

  const { toast } = useToast();

  const restaurantTypes = [
    "Restaurante", "Comida Rápida", "Bar/Café", "Pizzería", 
    "Sushi", "Carnes", "Vegetariano", "Otro"
  ];

  const plans = ["Básico", "Profesional", "Enterprise", "No estoy seguro"];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nombre || !formData.email || !formData.telefono) {
      toast({
        title: "Campos requeridos",
        description: "Por favor completa los campos obligatorios",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "¡Solicitud enviada! ✅",
      description: `Gracias ${formData.nombre}. Te contactaremos en las próximas 24 horas para agendar tu demo gratuita.`,
    });

    setFormData({
      nombre: '',
      email: '',
      telefono: '',
      restaurante: '',
      tipo_restaurante: '',
      num_sucursales: '1',
      num_empleados: '',
      ciudad: '',
      interes_plan: '',
      mensaje: '',
    });
  };

  return (
    <section id="contacto" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-6">
            Solicita tu <span className="text-primary">Demo Gratuita</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Descubre cómo nuestro sistema POS puede transformar tu restaurante. 
            Agenda una demostración personalizada sin costo.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Contact Form */}
          <Card className="max-w-lg mx-auto lg:mx-0">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                <span>Formulario de Contacto</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="nombre">Nombre *</Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => handleInputChange('nombre', e.target.value)}
                    placeholder="Tu nombre completo"
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="tu@email.com"
                  />
                </div>

                <div>
                  <Label htmlFor="telefono">Teléfono *</Label>
                  <Input
                    id="telefono"
                    value={formData.telefono}
                    onChange={(e) => handleInputChange('telefono', e.target.value)}
                    placeholder="+591 12345678"
                  />
                </div>

                <div>
                  <Label htmlFor="restaurante">Nombre del Restaurante</Label>
                  <Input
                    id="restaurante"
                    value={formData.restaurante}
                    onChange={(e) => handleInputChange('restaurante', e.target.value)}
                    placeholder="Nombre de tu restaurante"
                  />
                </div>

                <div>
                  <Label>Tipo de Restaurante</Label>
                  <select
                    value={formData.tipo_restaurante}
                    onChange={(e) => handleInputChange('tipo_restaurante', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="">Selecciona el tipo</option>
                    {restaurantTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="num_sucursales">Número de Sucursales</Label>
                    <select
                      id="num_sucursales"
                      value={formData.num_sucursales}
                      onChange={(e) => handleInputChange('num_sucursales', e.target.value)}
                      className="w-full px-3 py-2 border rounded-md"
                    >
                      {[...Array(10)].map((_, i) => (
                        <option key={i + 1} value={i + 1}>{i + 1}</option>
                      ))}
                      <option value="10+">10+</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="num_empleados">Empleados</Label>
                    <Input
                      id="num_empleados"
                      value={formData.num_empleados}
                      onChange={(e) => handleInputChange('num_empleados', e.target.value)}
                      placeholder="Aproximado"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="ciudad">Ciudad</Label>
                  <Input
                    id="ciudad"
                    value={formData.ciudad}
                    onChange={(e) => handleInputChange('ciudad', e.target.value)}
                    placeholder="Tu ciudad"
                  />
                </div>

                <div>
                  <Label>Plan de Interés</Label>
                  <select
                    value={formData.interes_plan}
                    onChange={(e) => handleInputChange('interes_plan', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="">Selecciona un plan</option>
                    {plans.map((plan) => (
                      <option key={plan} value={plan}>{plan}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="mensaje">Mensaje</Label>
                  <textarea
                    id="mensaje"
                    value={formData.mensaje}
                    onChange={(e) => handleInputChange('mensaje', e.target.value)}
                    placeholder="Cuéntanos sobre tu negocio y necesidades específicas..."
                    className="w-full px-3 py-2 border rounded-md h-24 resize-none"
                  />
                </div>

                <Button type="submit" className="w-full bg-primary text-white">
                  <Check className="w-4 h-4 mr-2" />
                  Solicitar Demo Gratuita
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Contact Info */}
          <div className="space-y-8">
            <div>
              <h3 className="text-2xl font-bold text-foreground mb-6">Información de Contacto</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-primary" />
                  <div>
                    <div className="font-semibold">Teléfono</div>
                    <div className="text-muted-foreground">+591 800-RESTAU (737-828)</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-primary" />
                  <div>
                    <div className="font-semibold">Email</div>
                    <div className="text-muted-foreground">ventas@restaurantpos.bo</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Building className="w-5 h-5 text-primary" />
                  <div>
                    <div className="font-semibold">Oficina</div>
                    <div className="text-muted-foreground">Av. 16 de Julio #1234, La Paz</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Clock className="w-5 h-5 text-primary" />
                  <div>
                    <div className="font-semibold">Horario</div>
                    <div className="text-muted-foreground">Lun - Vie: 9:00 - 18:00</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-primary/5 p-6 rounded-lg">
              <h4 className="font-semibold text-foreground mb-3">¿Por qué solicitar una demo?</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Demostración personalizada de 30 minutos</li>
                <li>• Sin compromiso de compra</li>
                <li>• Respuesta en menos de 24 horas</li>
                <li>• Evaluación gratuita de tu negocio</li>
                <li>• Propuesta personalizada</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ReservationSection;