import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useConversionTracker } from "@/hooks/useConversionTracker";
import { CheckCircle, Clock, Users, Building2, Mail, Phone } from "lucide-react";

interface ContactFormData {
  nombre: string;
  email: string;
  telefono: string;
  pais: string;
  restaurante: string;
  planInteres: string;
  tipoNegocio: string;
  mensaje: string;
  prefijoHorario: string;
}

const ReservationSection = () => {
  const { toast } = useToast();
  const { trackContactForm } = useConversionTracker();
  const [formData, setFormData] = useState<ContactFormData>({
    nombre: '',
    email: '',
    telefono: '',
    pais: '',
    restaurante: '',
    planInteres: '',
    tipoNegocio: '',
    mensaje: '',
    prefijoHorario: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: keyof ContactFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    console.log('🚀 Enviando formulario de demo...', formData);
    
    try {
      // Track conversion
      trackContactForm();
      
      // Mapear valores del frontend a valores válidos del backend
      const planMapping: Record<string, string> = {
        'basico': 'basico',
        'profesional': 'profesional',
        'avanzado': 'empresarial',
        'enterprise': 'empresarial',
        'no-seguro': 'personalizado'
      };

      const tipoNegocioMapping: Record<string, string> = {
        'restaurante': 'restaurante',
        'cafeteria': 'cafeteria',
        'food-truck': 'comida_rapida',
        'catering': 'otro',
        'bar': 'bar',
        'otro': 'otro'
      };

      const horarioMapping: Record<string, string> = {
        'manana': 'mañana',
        'tarde': 'tarde',
        'noche': 'noche',
        'cualquiera': 'cualquiera'
      };

      // Obtener IP real del usuario
      let userIP = '127.0.0.1'; // IP por defecto
      try {
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipResponse.json();
        userIP = ipData.ip;
      } catch (error) {
        console.warn('No se pudo obtener la IP real, usando IP por defecto:', error);
      }

      // Convertir formato del frontend al formato esperado por el backend
      const backendData = {
        nombre: formData.nombre,
        email: formData.email,
        telefono: formData.telefono,
        restaurante: formData.restaurante,
        plan_interes: planMapping[formData.planInteres] || 'personalizado',
        tipo_negocio: tipoNegocioMapping[formData.tipoNegocio] || 'otro',
        mensaje: formData.mensaje,
        horario_preferido: horarioMapping[formData.prefijoHorario] || 'cualquiera',
        ip_address: userIP,
        user_agent: navigator.userAgent
      };

      console.log('📤 Datos a enviar al backend:', backendData);

      // Enviar datos reales al backend
      const response = await fetch('http://localhost:4000/api/demo-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(backendData)
      });

      console.log('📥 Respuesta del backend:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error del backend:', errorText);
        throw new Error('Error al enviar la solicitud');
      }

      const result = await response.json();
      console.log('✅ Solicitud enviada exitosamente:', result);
      
      toast({
        title: "¡Solicitud Enviada!",
        description: "Te contactaremos en las próximas 24 horas para agendar tu demo personalizada.",
      });
      
      // Reset form
      setFormData({
        nombre: '',
        email: '',
        telefono: '',
        pais: '',
        planInteres: '',
        tipoNegocio: '',
        mensaje: '',
        prefijoHorario: ''
      });
      
      // Aquí podrías redirigir a una página de confirmación o enviar a CRM
      
    } catch (error) {
      console.error('❌ Error al enviar formulario:', error);
      toast({
        title: "Error",
        description: "Hubo un problema al enviar tu solicitud. Por favor intenta nuevamente.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const benefits = [
    {
      icon: Clock,
      title: "Demo Gratuita",
      description: "30 minutos de demostración completa del sistema"
    },
    {
      icon: Users,
      title: "Asesoría Especializada",
      description: "Consultor experto en restaurantes"
    },
    {
      icon: Building2,
      title: "Implementación Gratuita",
      description: "Configuración incluida en todos los planes"
    }
  ];

  return (
    <section id="contacto" className="py-24 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-impact opacity-5"></div>
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-slate-600 via-slate-700 to-slate-800"></div>
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-20 items-start">
          {/* Content */}
          <div className="space-y-10">
            <div className="space-y-6">
              <div className="inline-flex items-center bg-slate-800/50 text-white px-6 py-3 rounded-full text-sm font-bold shadow-lg">
                <Mail className="w-4 h-4 mr-2" />
                Solicita tu Demo Gratuita
              </div>
              <h2 className="text-5xl md:text-6xl font-bold text-white leading-tight">
                ¿Listo para
                <span className="text-shimmer block mt-2">Transformar tu Restaurante?</span>
              </h2>
              <p className="text-xl text-slate-300 leading-relaxed">
                Agenda una demo gratuita y descubre cómo nuestro sistema POS puede 
                optimizar las operaciones de tu restaurante. Sin compromisos, solo resultados.
              </p>
            </div>

            <div className="space-y-8">
              {benefits.map((benefit, index) => {
                const Icon = benefit.icon;
                return (
                  <div key={index} className="flex items-start space-x-6 p-6 bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 hover-card-lift">
                    <div className="w-16 h-16 bg-gradient-to-r from-slate-700 to-slate-800 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg border border-slate-600/50">
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-xl text-white mb-3">{benefit.title}</h3>
                      <p className="text-slate-300 leading-relaxed text-lg">
                        {benefit.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 rounded-2xl p-8 border border-slate-600/50 shadow-lg">
              <div className="flex items-center space-x-4 mb-4">
                <CheckCircle className="w-8 h-8 text-green-400" />
                <h3 className="font-bold text-xl text-white">Garantía de Satisfacción</h3>
              </div>
              <p className="text-slate-300 text-lg leading-relaxed">
                Si no estás completamente satisfecho con nuestro sistema en los primeros 30 días, 
                te devolvemos tu dinero sin preguntas.
              </p>
            </div>
          </div>

          {/* Form */}
          <Card className="shadow-impact border-2 border-red-500 bg-slate-800/50 backdrop-blur-md hover-card-lift relative z-20 shadow-red-500/20 hover:shadow-red-500/40 transition-all duration-300">
            <CardHeader className="p-8">
              <CardTitle className="text-3xl font-bold text-center text-white">Solicita tu Demo</CardTitle>
              <CardDescription className="text-center text-lg text-slate-300">
                Completa el formulario y te contactaremos en menos de 24 horas
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="nombre" className="text-base font-semibold text-white">Nombre Completo *</Label>
                    <Input
                      id="nombre"
                      value={formData.nombre}
                      onChange={(e) => handleInputChange('nombre', e.target.value)}
                      placeholder="Tu nombre completo"
                      required
                      className="h-12 text-base border-red-400 focus:border-red-500 focus:ring-red-500/50"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="email" className="text-base font-semibold text-white">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="tu@email.com"
                      required
                      className="h-12 text-base border-red-400 focus:border-red-500 focus:ring-red-500/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="telefono" className="text-base font-semibold text-white">Teléfono *</Label>
                    <Input
                      id="telefono"
                      value={formData.telefono}
                      onChange={(e) => handleInputChange('telefono', e.target.value)}
                      placeholder="Ej: +1 234 567 8900"
                      required
                      className="h-12 text-base border-red-400 focus:border-red-500 focus:ring-red-500/50"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="pais" className="text-base font-semibold text-white">País *</Label>
                    <Select
                      value={formData.pais}
                      onValueChange={(value) => handleInputChange('pais', value)}
                    >
                      <SelectTrigger className="h-12 text-base border-red-400 focus:border-red-500 focus:ring-red-500/50">
                        <SelectValue placeholder="Selecciona tu país" />
                      </SelectTrigger>
                      <SelectContent 
                        className="z-[9999] bg-white border border-gray-200 shadow-lg" 
                        position="popper" 
                        side="bottom" 
                        align="start"
                        sideOffset={4}
                      >
                        <SelectItem value="argentina">🇦🇷 Argentina (+54)</SelectItem>
                        <SelectItem value="bolivia">🇧🇴 Bolivia (+591)</SelectItem>
                        <SelectItem value="brasil">🇧🇷 Brasil (+55)</SelectItem>
                        <SelectItem value="chile">🇨🇱 Chile (+56)</SelectItem>
                        <SelectItem value="colombia">🇨🇴 Colombia (+57)</SelectItem>
                        <SelectItem value="ecuador">🇪🇨 Ecuador (+593)</SelectItem>
                        <SelectItem value="mexico">🇲🇽 México (+52)</SelectItem>
                        <SelectItem value="panama">🇵🇦 Panamá (+507)</SelectItem>
                        <SelectItem value="peru">🇵🇪 Perú (+51)</SelectItem>
                        <SelectItem value="uruguay">🇺🇾 Uruguay (+598)</SelectItem>
                        <SelectItem value="venezuela">🇻🇪 Venezuela (+58)</SelectItem>
                        <SelectItem value="usa">🇺🇸 Estados Unidos (+1)</SelectItem>
                        <SelectItem value="canada">🇨🇦 Canadá (+1)</SelectItem>
                        <SelectItem value="espana">🇪🇸 España (+34)</SelectItem>
                        <SelectItem value="otro">🌍 Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="restaurante" className="text-base font-semibold text-white">Nombre de la Empresa *</Label>
                    <Input
                      id="restaurante"
                      value={formData.restaurante}
                      onChange={(e) => handleInputChange('restaurante', e.target.value)}
                      placeholder="Nombre de tu empresa o negocio"
                      required
                      className="h-12 text-base border-red-400 focus:border-red-500 focus:ring-red-500/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
   {/* Plan de Interés */}
   <div className="space-y-3 relative">
     <Label htmlFor="planInteres" className="text-base font-semibold text-white">
       Plan de interés
     </Label>
     <Select
       value={formData.planInteres}
       onValueChange={(value) => handleInputChange('planInteres', value)}
     >
       <SelectTrigger className="h-12 text-base border-red-400 focus:border-red-500 focus:ring-red-500/50">
         <SelectValue placeholder="Selecciona un plan" />
       </SelectTrigger>
       <SelectContent 
         className="z-[9999] bg-white border border-gray-200 shadow-lg" 
         position="popper" 
         side="bottom" 
         align="start"
         sideOffset={4}
       >
         <SelectItem value="basico">Básico – $19 USD/mes</SelectItem>
         <SelectItem value="profesional">Profesional – $49 USD/mes</SelectItem>
         <SelectItem value="avanzado">Avanzado – $99 USD/mes</SelectItem>
         <SelectItem value="enterprise">Enterprise – $119 USD/mes</SelectItem>
         <SelectItem value="no-seguro">No estoy seguro</SelectItem>
       </SelectContent>
     </Select>
   </div>

  {/* Tipo de Negocio */}
  <div className="space-y-3 relative">
    <Label htmlFor="tipoNegocio" className="text-base font-semibold text-white">
      Tipo de negocio
    </Label>
    <Select
      value={formData.tipoNegocio}
      onValueChange={(value) => handleInputChange('tipoNegocio', value)}
    >
      <SelectTrigger className="h-12 text-base border-red-400 focus:border-red-500 focus:ring-red-500/50">
        <SelectValue placeholder="Selecciona el tipo de negocio" />
      </SelectTrigger>
      <SelectContent 
        className="z-[9999] bg-white border border-gray-200 shadow-lg" 
        position="popper"
        sideOffset={4}
      >
        <SelectItem value="restaurante">Restaurante</SelectItem>
        <SelectItem value="cafeteria">Cafetería</SelectItem>
        <SelectItem value="food-truck">Food Truck</SelectItem>
        <SelectItem value="catering">Catering</SelectItem>
        <SelectItem value="bar">Bar / Pub</SelectItem>
        <SelectItem value="otro">Otro</SelectItem>
      </SelectContent>
    </Select>
  </div>
</div>

{/* Horario Preferido para Contacto */}
<div className="space-y-3 mt-6 relative">
  <Label htmlFor="prefijoHorario" className="text-base font-semibold text-white">
    Horario preferido para contacto
  </Label>
  <Select
    value={formData.prefijoHorario}
    onValueChange={(value) => handleInputChange('prefijoHorario', value)}
  >
    <SelectTrigger className="h-12 text-base border-red-400 focus:border-red-500 focus:ring-red-500/50">
      <SelectValue placeholder="Selecciona un horario" />
    </SelectTrigger>
    <SelectContent 
      className="z-[9999] bg-white border border-gray-200 shadow-lg" 
      position="popper" 
      side="bottom" 
      align="start"
      sideOffset={4}
    >
      <SelectItem value="manana">Mañana (8:00 – 12:00)</SelectItem>
      <SelectItem value="tarde">Tarde (12:00 – 18:00)</SelectItem>
      <SelectItem value="noche">Noche (18:00 – 21:00)</SelectItem>
      <SelectItem value="cualquiera">Cualquier horario</SelectItem>
    </SelectContent>
  </Select>
</div>


                <div className="space-y-3">
                  <Label htmlFor="mensaje" className="text-base font-semibold text-white">Mensaje Adicional</Label>
                  <Textarea
                    id="mensaje"
                    value={formData.mensaje}
                    onChange={(e) => handleInputChange('mensaje', e.target.value)}
                    placeholder="Cuéntanos más sobre tu restaurante y necesidades específicas..."
                    rows={4}
                    className="text-base border-red-400 focus:border-red-500 focus:ring-red-500/50"
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-4 text-xl rounded-xl shadow-lg hover-button-glow border border-red-500 shadow-red-500/30 hover:shadow-red-500/50 transition-all duration-300"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Clock className="w-6 h-6 mr-3 animate-spin" />
                      Enviando Solicitud...
                    </>
                  ) : (
                    <>
                      <Mail className="w-6 h-6 mr-3" />
                      Solicitar Demo Gratuita
                    </>
                  )}
                </Button>

                <p className="text-sm text-muted-foreground text-center">
                  Al enviar este formulario, aceptas que te contactemos para agendar tu demo.
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default ReservationSection;