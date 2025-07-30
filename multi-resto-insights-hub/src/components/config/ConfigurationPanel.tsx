
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Settings, 
  Palette, 
  Bell, 
  Shield, 
  HelpCircle, 
  MessageSquare, 
  Phone,
  Mail,
  Video,
  Download,
  Upload,
  Save
} from "lucide-react";

export const ConfigurationPanel: React.FC = () => {
  const [config, setConfig] = useState({
    companyName: 'Mi Restaurante',
    primaryColor: '#3B82F6',
    secondaryColor: '#10B981',
    logo: '',
    notifications: {
      email: true,
      push: true,
      sms: false,
      lowStock: true,
      newOrders: true,
      dailyReports: true
    },
    security: {
      twoFactor: false,
      sessionTimeout: 30,
      passwordComplexity: true
    },
    reports: {
      frequency: 'daily',
      recipients: 'admin@restaurant.com',
      includeGraphs: true
    }
  });

  const updateConfig = (section: string, key: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  const saveConfig = () => {
    console.log('Guardando configuración:', config);
    // Aquí iría la lógica para guardar la configuración
  };

  const exportConfig = () => {
    const dataStr = JSON.stringify(config, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'restaurant-config.json';
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Configuración del Sistema</h2>
          <p className="text-slate-600">Personaliza la configuración de tu sistema POS</p>
        </div>
        
        <div className="flex space-x-2">
          <Button variant="outline" onClick={exportConfig}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button onClick={saveConfig}>
            <Save className="h-4 w-4 mr-2" />
            Guardar Cambios
          </Button>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>General</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center space-x-2">
            <Palette className="h-4 w-4" />
            <span>Apariencia</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center space-x-2">
            <Bell className="h-4 w-4" />
            <span>Notificaciones</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center space-x-2">
            <Shield className="h-4 w-4" />
            <span>Seguridad</span>
          </TabsTrigger>
          <TabsTrigger value="support" className="flex items-center space-x-2">
            <HelpCircle className="h-4 w-4" />
            <span>Soporte</span>
          </TabsTrigger>
        </TabsList>

        {/* Configuración General */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Información de la Empresa</CardTitle>
              <CardDescription>Configura los datos básicos de tu empresa</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Nombre de la Empresa</Label>
                  <Input
                    id="companyName"
                    value={config.companyName}
                    onChange={(e) => setConfig({...config, companyName: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="logo">Logo de la Empresa</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="logo"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setConfig({...config, logo: e.target.value})}
                    />
                    <Button variant="outline" size="sm">
                      <Upload className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Configuración de Reportes</CardTitle>
              <CardDescription>Personaliza la generación automática de reportes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="frequency">Frecuencia de Reportes</Label>
                  <Select 
                    value={config.reports.frequency} 
                    onValueChange={(value) => updateConfig('reports', 'frequency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar frecuencia" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Diario</SelectItem>
                      <SelectItem value="weekly">Semanal</SelectItem>
                      <SelectItem value="monthly">Mensual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="recipients">Destinatarios</Label>
                  <Input
                    id="recipients"
                    value={config.reports.recipients}
                    onChange={(e) => updateConfig('reports', 'recipients', e.target.value)}
                    placeholder="email1@example.com, email2@example.com"
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="includeGraphs"
                  checked={config.reports.includeGraphs}
                  onCheckedChange={(checked) => updateConfig('reports', 'includeGraphs', checked)}
                />
                <Label htmlFor="includeGraphs">Incluir gráficos en reportes</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuración de Apariencia */}
        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Colores del Sistema</CardTitle>
              <CardDescription>Personaliza la paleta de colores de la interfaz</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Color Primario</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="primaryColor"
                      type="color"
                      value={config.primaryColor}
                      onChange={(e) => setConfig({...config, primaryColor: e.target.value})}
                      className="w-16"
                    />
                    <Input
                      value={config.primaryColor}
                      onChange={(e) => setConfig({...config, primaryColor: e.target.value})}
                      placeholder="#3B82F6"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="secondaryColor">Color Secundario</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="secondaryColor"
                      type="color"
                      value={config.secondaryColor}
                      onChange={(e) => setConfig({...config, secondaryColor: e.target.value})}
                      className="w-16"
                    />
                    <Input
                      value={config.secondaryColor}
                      onChange={(e) => setConfig({...config, secondaryColor: e.target.value})}
                      placeholder="#10B981"
                    />
                  </div>
                </div>
              </div>
              
              <div className="p-4 rounded-lg border" style={{ 
                background: `linear-gradient(135deg, ${config.primaryColor}20, ${config.secondaryColor}20)` 
              }}>
                <h3 className="font-medium" style={{ color: config.primaryColor }}>
                  Vista Previa del Tema
                </h3>
                <p className="text-sm text-slate-600 mt-2">
                  Así se verán los elementos con los colores seleccionados
                </p>
                <div className="mt-3 space-x-2">
                  <Button size="sm" style={{ backgroundColor: config.primaryColor }}>
                    Botón Primario
                  </Button>
                  <Button size="sm" variant="outline" style={{ 
                    borderColor: config.secondaryColor,
                    color: config.secondaryColor 
                  }}>
                    Botón Secundario
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuración de Notificaciones */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Preferencias de Notificaciones</CardTitle>
              <CardDescription>Configura cómo y cuándo recibir notificaciones</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notificaciones por Email</Label>
                    <p className="text-sm text-slate-500">Recibir notificaciones en tu correo electrónico</p>
                  </div>
                  <Switch
                    checked={config.notifications.email}
                    onCheckedChange={(checked) => updateConfig('notifications', 'email', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notificaciones Push</Label>
                    <p className="text-sm text-slate-500">Notificaciones en tiempo real en el navegador</p>
                  </div>
                  <Switch
                    checked={config.notifications.push}
                    onCheckedChange={(checked) => updateConfig('notifications', 'push', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notificaciones SMS</Label>
                    <p className="text-sm text-slate-500">Alertas críticas por mensaje de texto</p>
                  </div>
                  <Switch
                    checked={config.notifications.sms}
                    onCheckedChange={(checked) => updateConfig('notifications', 'sms', checked)}
                  />
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h4 className="font-medium mb-4">Tipos de Notificaciones</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Stock bajo</Label>
                    <Switch
                      checked={config.notifications.lowStock}
                      onCheckedChange={(checked) => updateConfig('notifications', 'lowStock', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label>Nuevos pedidos</Label>
                    <Switch
                      checked={config.notifications.newOrders}
                      onCheckedChange={(checked) => updateConfig('notifications', 'newOrders', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label>Reportes diarios</Label>
                    <Switch
                      checked={config.notifications.dailyReports}
                      onCheckedChange={(checked) => updateConfig('notifications', 'dailyReports', checked)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuración de Seguridad */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Seguridad</CardTitle>
              <CardDescription>Ajusta las configuraciones de seguridad del sistema</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Autenticación de Dos Factores</Label>
                    <p className="text-sm text-slate-500">Añade una capa extra de seguridad</p>
                  </div>
                  <Switch
                    checked={config.security.twoFactor}
                    onCheckedChange={(checked) => updateConfig('security', 'twoFactor', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Complejidad de Contraseñas</Label>
                    <p className="text-sm text-slate-500">Requerir contraseñas seguras</p>
                  </div>
                  <Switch
                    checked={config.security.passwordComplexity}
                    onCheckedChange={(checked) => updateConfig('security', 'passwordComplexity', checked)}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="sessionTimeout">Tiempo de Sesión (minutos)</Label>
                <Select 
                  value={config.security.sessionTimeout.toString()} 
                  onValueChange={(value) => updateConfig('security', 'sessionTimeout', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tiempo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutos</SelectItem>
                    <SelectItem value="30">30 minutos</SelectItem>
                    <SelectItem value="60">1 hora</SelectItem>
                    <SelectItem value="120">2 horas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Soporte */}
        <TabsContent value="support" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Centro de Soporte</CardTitle>
              <CardDescription>Accede a recursos de ayuda y contacta con soporte</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
                  <MessageSquare className="h-6 w-6 text-blue-500" />
                  <span className="font-medium">Chat en Línea</span>
                  <span className="text-xs text-slate-500">Soporte instantáneo</span>
                </Button>
                
                <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
                  <Phone className="h-6 w-6 text-green-500" />
                  <span className="font-medium">Llamada</span>
                  <span className="text-xs text-slate-500">+52 55 1234-5678</span>
                </Button>
                
                <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
                  <Mail className="h-6 w-6 text-purple-500" />
                  <span className="font-medium">Email</span>
                  <span className="text-xs text-slate-500">soporte@pos.com</span>
                </Button>
                
                <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
                  <Video className="h-6 w-6 text-red-500" />
                  <span className="font-medium">Videotutoriales</span>
                  <span className="text-xs text-slate-500">Guías paso a paso</span>
                </Button>
              </div>
              
              <div className="border-t pt-4">
                <h4 className="font-medium mb-4">Recursos Útiles</h4>
                <div className="space-y-2">
                  <Button variant="ghost" className="w-full justify-start">
                    📚 Manual de Usuario
                  </Button>
                  <Button variant="ghost" className="w-full justify-start">
                    🎥 Videos de Capacitación
                  </Button>
                  <Button variant="ghost" className="w-full justify-start">
                    💡 Preguntas Frecuentes
                  </Button>
                  <Button variant="ghost" className="w-full justify-start">
                    🔧 Guía de Solución de Problemas
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
