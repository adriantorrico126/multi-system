
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Settings, 
  Shield, 
  Bell, 
  Database, 
  Activity,
  Mail,
  Key,
  Server,
  Save,
  AlertTriangle,
  CheckCircle,
  Users,
  Lock
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiFetch } from '@/services/api';
import { useAuth } from '@/context/AuthContext';

export const SystemConfiguration: React.FC = () => {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  useEffect(() => {
    const fetchConfig = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await apiFetch<any>('/configuracion', {}, token || undefined);
        setConfig(data);
      } catch (err: any) {
        setError(err.message || 'Error al cargar configuración del sistema.');
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchConfig();
  }, [token]);

  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    smsAlerts: false,
    systemMaintenance: true,
    paymentReminders: true,
    securityAlerts: true
  });

  const [systemSettings, setSystemSettings] = useState({
    maxRestaurants: 1000,
    sessionTimeout: 30,
    autoBackup: true,
    maintenanceMode: false,
    debugMode: false
  });

  const systemStats = [
    { label: 'Versión del Sistema', value: 'v2.4.1', status: 'current' },
    { label: 'Base de Datos', value: '99.9% Uptime', status: 'healthy' },
    { label: 'Almacenamiento', value: '2.4 TB / 5 TB', status: 'good' },
    { label: 'CPU Promedio', value: '23%', status: 'good' },
    { label: 'Memoria RAM', value: '68%', status: 'good' },
    { label: 'Conexiones Activas', value: '2,847', status: 'normal' }
  ];

  const securityLogs = [
    { timestamp: '2024-07-16 14:30', event: 'Login fallido', details: 'IP: 192.168.1.100 - Usuario: admin@test.com', severity: 'warning' },
    { timestamp: '2024-07-16 13:45', event: 'Acceso administrativo', details: 'Usuario: admin@restaurant.com desde CDMX', severity: 'info' },
    { timestamp: '2024-07-16 12:20', event: 'Backup completado', details: 'Backup automático ejecutado exitosamente', severity: 'success' },
    { timestamp: '2024-07-16 11:15', event: 'API Key regenerada', details: 'Clave de API regenerada para el restaurante REST-045', severity: 'info' },
    { timestamp: '2024-07-16 10:30', event: 'Actualización de sistema', details: 'Patch de seguridad v2.4.1 aplicado', severity: 'success' }
  ];

  const handleNotificationChange = (key: string, value: boolean) => {
    setNotifications(prev => ({ ...prev, [key]: value }));
  };

  const handleSystemSettingChange = (key: string, value: any) => {
    setSystemSettings(prev => ({ ...prev, [key]: value }));
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'warning':
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Advertencia</Badge>;
      case 'success':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Éxito</Badge>;
      case 'info':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Info</Badge>;
      default:
        return <Badge variant="secondary">Normal</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'current':
      case 'good':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Óptimo</Badge>;
      case 'normal':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Normal</Badge>;
      case 'warning':
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Atención</Badge>;
      default:
        return <Badge variant="secondary">Desconocido</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {loading && <div className="text-center text-blue-600">Cargando configuración...</div>}
      {error && <div className="text-center text-red-600">{error}</div>}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Configuración del Sistema</h2>
          <p className="text-slate-600">Administra la configuración global y la seguridad</p>
        </div>
        <Button>
          <Save className="h-4 w-4 mr-2" />
          Guardar Cambios
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Notificaciones</TabsTrigger>
          <TabsTrigger value="security">Seguridad</TabsTrigger>
          <TabsTrigger value="system">Sistema</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

        {/* Configuración General */}
        <TabsContent value="general" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Configuración de la Empresa</CardTitle>
                <CardDescription>Información básica de la empresa desarrolladora</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Nombre de la Empresa</Label>
                  <Input id="companyName" defaultValue="POS Solutions Inc." />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Email de Contacto</Label>
                  <Input id="contactEmail" type="email" defaultValue="admin@possolutions.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supportPhone">Teléfono de Soporte</Label>
                  <Input id="supportPhone" defaultValue="+52 555 123 4567" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Sitio Web</Label>
                  <Input id="website" defaultValue="https://possolutions.com" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Estado del Sistema</CardTitle>
                <CardDescription>Métricas en tiempo real del sistema</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {systemStats.map((stat, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{stat.label}</span>
                        {getStatusBadge(stat.status)}
                      </div>
                      <p className="text-lg font-bold">{stat.value}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Configuración de Notificaciones */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Notificaciones</CardTitle>
              <CardDescription>Configura cómo y cuándo recibir alertas del sistema</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Alertas por Email</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="emailAlerts">Alertas Generales</Label>
                      <Switch
                        id="emailAlerts"
                        checked={notifications.emailAlerts}
                        onCheckedChange={(checked) => handleNotificationChange('emailAlerts', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="paymentReminders">Recordatorios de Pago</Label>
                      <Switch
                        id="paymentReminders"
                        checked={notifications.paymentReminders}
                        onCheckedChange={(checked) => handleNotificationChange('paymentReminders', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="systemMaintenance">Mantenimiento del Sistema</Label>
                      <Switch
                        id="systemMaintenance"
                        checked={notifications.systemMaintenance}
                        onCheckedChange={(checked) => handleNotificationChange('systemMaintenance', checked)}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Alertas de Seguridad</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="securityAlerts">Alertas de Seguridad</Label>
                      <Switch
                        id="securityAlerts"
                        checked={notifications.securityAlerts}
                        onCheckedChange={(checked) => handleNotificationChange('securityAlerts', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="smsAlerts">Alertas por SMS</Label>
                      <Switch
                        id="smsAlerts"
                        checked={notifications.smsAlerts}
                        onCheckedChange={(checked) => handleNotificationChange('smsAlerts', checked)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Configuración de Email</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="smtpServer">Servidor SMTP</Label>
                    <Input id="smtpServer" defaultValue="smtp.gmail.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtpPort">Puerto SMTP</Label>
                    <Input id="smtpPort" defaultValue="587" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuración de Seguridad */}
        <TabsContent value="security" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Configuración de Seguridad</CardTitle>
                <CardDescription>Parámetros de seguridad y acceso</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">Tiempo de Sesión (minutos)</Label>
                  <Input 
                    id="sessionTimeout" 
                    type="number" 
                    value={systemSettings.sessionTimeout}
                    onChange={(e) => handleSystemSettingChange('sessionTimeout', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxRestaurants">Máximo de Restaurantes</Label>
                  <Input 
                    id="maxRestaurants" 
                    type="number" 
                    value={systemSettings.maxRestaurants}
                    onChange={(e) => handleSystemSettingChange('maxRestaurants', parseInt(e.target.value))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="maintenanceMode">Modo Mantenimiento</Label>
                  <Switch
                    id="maintenanceMode"
                    checked={systemSettings.maintenanceMode}
                    onCheckedChange={(checked) => handleSystemSettingChange('maintenanceMode', checked)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Regenerar API Keys</Label>
                  <Button variant="outline" className="w-full">
                    <Key className="h-4 w-4 mr-2" />
                    Regenerar Claves de API
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Gestión de Usuarios Admin</CardTitle>
                <CardDescription>Administradores del sistema</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Users className="h-4 w-4" />
                      <div>
                        <p className="font-medium">Juan Pérez</p>
                        <p className="text-sm text-gray-500">admin@possolutions.com</p>
                      </div>
                    </div>
                    <Badge>Super Admin</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Users className="h-4 w-4" />
                      <div>
                        <p className="font-medium">María García</p>
                        <p className="text-sm text-gray-500">maria@possolutions.com</p>
                      </div>
                    </div>
                    <Badge variant="outline">Soporte</Badge>
                  </div>
                </div>
                <Button variant="outline" className="w-full">
                  <Users className="h-4 w-4 mr-2" />
                  Agregar Administrador
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Configuración del Sistema */}
        <TabsContent value="system" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Configuración del Sistema</CardTitle>
                <CardDescription>Parámetros técnicos y de rendimiento</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="autoBackup">Backup Automático</Label>
                  <Switch
                    id="autoBackup"
                    checked={systemSettings.autoBackup}
                    onCheckedChange={(checked) => handleSystemSettingChange('autoBackup', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="debugMode">Modo Debug</Label>
                  <Switch
                    id="debugMode"
                    checked={systemSettings.debugMode}
                    onCheckedChange={(checked) => handleSystemSettingChange('debugMode', checked)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Mantenimiento del Sistema</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline">
                      <Database className="h-4 w-4 mr-2" />
                      Limpiar Cache
                    </Button>
                    <Button variant="outline">
                      <Server className="h-4 w-4 mr-2" />
                      Reiniciar Servicios
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monitoreo del Sistema</CardTitle>
                <CardDescription>Estado actual del servidor</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Estado del Servidor</span>
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                      <Activity className="h-3 w-3 mr-1" />
                      Online
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Base de Datos</span>
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Conectada
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Servicios Externos</span>
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Operativos
                    </Badge>
                  </div>
                </div>
                <Button variant="outline" className="w-full">
                  <Activity className="h-4 w-4 mr-2" />
                  Ver Métricas Detalladas
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Logs del Sistema */}
        <TabsContent value="logs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Logs de Seguridad</CardTitle>
              <CardDescription>Registro de eventos y accesos al sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {securityLogs.map((log, index) => (
                  <div key={index} className="flex items-start justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{log.event}</span>
                        {getSeverityBadge(log.severity)}
                      </div>
                      <p className="text-sm text-gray-600">{log.details}</p>
                      <p className="text-xs text-gray-500">{log.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex justify-center">
                <Button variant="outline">Ver Más Logs</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
