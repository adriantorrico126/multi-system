
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
import { AdminUsers } from '@/components/admin/AdminUsers';

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
        return <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 hover:bg-amber-500/30">Advertencia</Badge>;
      case 'success':
        return <Badge className="bg-green-500/20 text-green-300 border-green-500/30 hover:bg-green-500/30">Éxito</Badge>;
      case 'info':
        return <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 hover:bg-blue-500/30">Info</Badge>;
      default:
        return <Badge className="bg-slate-500/20 text-slate-300 border-slate-500/30 hover:bg-slate-500/30">Normal</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'current':
      case 'good':
        return <Badge className="bg-green-500/20 text-green-300 border-green-500/30 hover:bg-green-500/30">Óptimo</Badge>;
      case 'normal':
        return <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 hover:bg-blue-500/30">Normal</Badge>;
      case 'warning':
        return <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 hover:bg-amber-500/30">Atención</Badge>;
      default:
        return <Badge className="bg-slate-500/20 text-slate-300 border-slate-500/30 hover:bg-slate-500/30">Desconocido</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      {/* Header del Sistema de Configuración */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              Centro de Configuración del Sistema
            </h1>
            <p className="text-slate-300 text-lg">
              Administración avanzada y configuración global del ecosistema POS
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm text-slate-400">Última actualización</p>
              <p className="text-white font-semibold">{new Date().toLocaleTimeString()}</p>
            </div>
            <Button
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              <Save className="h-5 w-5 mr-2" />
              Guardar Cambios
            </Button>
          </div>
        </div>
      </div>

      {/* Estados de Carga y Error */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-blue-400 text-lg">Cargando configuración del sistema...</p>
          </div>
        </div>
      )}
      
      {error && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-6 w-6 text-red-400" />
            <p className="text-red-300">{error}</p>
          </div>
        </div>
      )}

      {/* Panel de Navegación de Configuración */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-slate-800/50 to-slate-700/30 border-slate-600/50 backdrop-blur-md mb-8">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -translate-y-16 translate-x-16"></div>
        <CardContent className="relative z-10 p-6">
          <Tabs defaultValue="general" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5 bg-slate-800/50 backdrop-blur-md p-1 shadow-lg rounded-xl border border-slate-700/50">
              <TabsTrigger 
                value="general" 
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all duration-200"
              >
                <Settings className="h-4 w-4 mr-2" />
                General
              </TabsTrigger>
              <TabsTrigger 
                value="notifications" 
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all duration-200"
              >
                <Bell className="h-4 w-4 mr-2" />
                Notificaciones
              </TabsTrigger>
              <TabsTrigger 
                value="security" 
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all duration-200"
              >
                <Shield className="h-4 w-4 mr-2" />
                Seguridad
              </TabsTrigger>
              <TabsTrigger 
                value="system" 
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all duration-200"
              >
                <Server className="h-4 w-4 mr-2" />
                Sistema
              </TabsTrigger>
              <TabsTrigger 
                value="logs" 
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all duration-200"
              >
                <Activity className="h-4 w-4 mr-2" />
                Logs
              </TabsTrigger>
            </TabsList>

            {/* Configuración General */}
            <TabsContent value="general" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Panel de Configuración de la Empresa */}
                <Card className="relative overflow-hidden bg-gradient-to-br from-slate-800/50 to-slate-700/30 border-slate-600/50 backdrop-blur-md">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full -translate-y-12 translate-x-12"></div>
                  <CardHeader className="relative z-10 pb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-500/20 rounded-lg">
                        <Settings className="h-6 w-6 text-blue-400" />
                      </div>
                      <div>
                        <CardTitle className="text-xl font-bold text-white">Configuración de la Empresa</CardTitle>
                        <CardDescription className="text-slate-300">Información básica de la empresa desarrolladora</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="relative z-10 space-y-4">
                    <div className="space-y-3">
                      <Label htmlFor="companyName" className="text-slate-300 font-medium">Nombre de la Empresa</Label>
                      <Input 
                        id="companyName" 
                        defaultValue="POS Solutions Inc." 
                        className="bg-slate-700/50 border-slate-600/50 focus:border-blue-500 text-white placeholder-slate-400"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="contactEmail" className="text-slate-300 font-medium">Email de Contacto</Label>
                      <Input 
                        id="contactEmail" 
                        type="email" 
                        defaultValue="admin@possolutions.com" 
                        className="bg-slate-700/50 border-slate-600/50 focus:border-blue-500 text-white placeholder-slate-400"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="supportPhone" className="text-slate-300 font-medium">Teléfono de Soporte</Label>
                      <Input 
                        id="supportPhone" 
                        defaultValue="+52 555 123 4567" 
                        className="bg-slate-700/50 border-slate-600/50 focus:border-blue-500 text-white placeholder-slate-400"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="website" className="text-slate-300 font-medium">Sitio Web</Label>
                      <Input 
                        id="website" 
                        defaultValue="https://possolutions.com" 
                        className="bg-slate-700/50 border-slate-600/50 focus:border-blue-500 text-white placeholder-slate-400"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Panel de Estado del Sistema */}
                <Card className="relative overflow-hidden bg-gradient-to-br from-slate-800/50 to-slate-700/30 border-slate-600/50 backdrop-blur-md">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/5 rounded-full -translate-y-12 translate-x-12"></div>
                  <CardHeader className="relative z-10 pb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-green-500/20 rounded-lg">
                        <Activity className="h-6 w-6 text-green-400" />
                      </div>
                      <div>
                        <CardTitle className="text-xl font-bold text-white">Estado del Sistema</CardTitle>
                        <CardDescription className="text-slate-300">Métricas en tiempo real del sistema</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="grid grid-cols-2 gap-4">
                      {systemStats.map((stat, index) => (
                        <div key={index} className="group p-4 bg-slate-700/30 rounded-xl border border-slate-600/50 hover:bg-slate-700/50 transition-all duration-300">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-slate-300">{stat.label}</span>
                            {getStatusBadge(stat.status)}
                          </div>
                          <p className="text-lg font-bold text-white">{stat.value}</p>
                          <div className="mt-2 w-full bg-slate-700 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                stat.status === 'healthy' || stat.status === 'current' || stat.status === 'good' 
                                  ? 'bg-green-500' 
                                  : stat.status === 'normal' 
                                    ? 'bg-blue-500' 
                                    : 'bg-slate-500'
                              }`} 
                              style={{width: `${Math.min(100, Math.random() * 100)}%`}}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Configuración de Notificaciones */}
            <TabsContent value="notifications" className="space-y-6">
              <Card className="relative overflow-hidden bg-gradient-to-br from-slate-800/50 to-slate-700/30 border-slate-600/50 backdrop-blur-md">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full -translate-y-16 translate-x-16"></div>
                <CardHeader className="relative z-10 pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-amber-500/20 rounded-lg">
                      <Bell className="h-6 w-6 text-amber-400" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold text-white">Configuración de Notificaciones</CardTitle>
                      <CardDescription className="text-slate-300">Configura cómo y cuándo recibir alertas del sistema</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="relative z-10 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-medium text-white flex items-center space-x-2">
                        <Mail className="h-5 w-5 text-blue-400" />
                        <span>Alertas por Email</span>
                      </h4>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-xl border border-slate-600/50">
                          <Label htmlFor="emailAlerts" className="text-slate-300">Alertas Generales</Label>
                          <Switch
                            id="emailAlerts"
                            checked={notifications.emailAlerts}
                            onCheckedChange={(checked) => handleNotificationChange('emailAlerts', checked)}
                          />
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-xl border border-slate-600/50">
                          <Label htmlFor="paymentReminders" className="text-slate-300">Recordatorios de Pago</Label>
                          <Switch
                            id="paymentReminders"
                            checked={notifications.paymentReminders}
                            onCheckedChange={(checked) => handleNotificationChange('paymentReminders', checked)}
                          />
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-xl border border-slate-600/50">
                          <Label htmlFor="systemMaintenance" className="text-slate-300">Mantenimiento del Sistema</Label>
                          <Switch
                            id="systemMaintenance"
                            checked={notifications.systemMaintenance}
                            onCheckedChange={(checked) => handleNotificationChange('systemMaintenance', checked)}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-medium text-white flex items-center space-x-2">
                        <Shield className="h-5 w-5 text-red-400" />
                        <span>Alertas de Seguridad</span>
                      </h4>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-xl border border-slate-600/50">
                          <Label htmlFor="securityAlerts" className="text-slate-300">Alertas de Seguridad</Label>
                          <Switch
                            id="securityAlerts"
                            checked={notifications.securityAlerts}
                            onCheckedChange={(checked) => handleNotificationChange('securityAlerts', checked)}
                          />
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-xl border border-slate-600/50">
                          <Label htmlFor="smsAlerts" className="text-slate-300">Alertas por SMS</Label>
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
                    <h4 className="font-medium text-white flex items-center space-x-2">
                      <Settings className="h-5 w-5 text-purple-400" />
                      <span>Configuración de Email</span>
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <Label htmlFor="smtpServer" className="text-slate-300 font-medium">Servidor SMTP</Label>
                        <Input 
                          id="smtpServer" 
                          defaultValue="smtp.gmail.com" 
                          className="bg-slate-700/50 border-slate-600/50 focus:border-purple-500 text-white placeholder-slate-400"
                        />
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor="smtpPort" className="text-slate-300 font-medium">Puerto SMTP</Label>
                        <Input 
                          id="smtpPort" 
                          defaultValue="587" 
                          className="bg-slate-700/50 border-slate-600/50 focus:border-purple-500 text-white placeholder-slate-400"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Configuración de Seguridad */}
            <TabsContent value="security" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Panel de Configuración de Seguridad */}
                <Card className="relative overflow-hidden bg-gradient-to-br from-slate-800/50 to-slate-700/30 border-slate-600/50 backdrop-blur-md">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full -translate-y-12 translate-x-12"></div>
                  <CardHeader className="relative z-10 pb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-red-500/20 rounded-lg">
                        <Shield className="h-6 w-6 text-red-400" />
                      </div>
                      <div>
                        <CardTitle className="text-xl font-bold text-white">Configuración de Seguridad</CardTitle>
                        <CardDescription className="text-slate-300">Parámetros de seguridad y acceso</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="relative z-10 space-y-4">
                    <div className="space-y-3">
                      <Label htmlFor="sessionTimeout" className="text-slate-300 font-medium">Tiempo de Sesión (minutos)</Label>
                      <Input 
                        id="sessionTimeout" 
                        type="number" 
                        value={systemSettings.sessionTimeout}
                        onChange={(e) => handleSystemSettingChange('sessionTimeout', parseInt(e.target.value))}
                        className="bg-slate-700/50 border-slate-600/50 focus:border-red-500 text-white placeholder-slate-400"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="maxRestaurants" className="text-slate-300 font-medium">Máximo de Restaurantes</Label>
                      <Input 
                        id="maxRestaurants" 
                        type="number" 
                        value={systemSettings.maxRestaurants}
                        onChange={(e) => handleSystemSettingChange('maxRestaurants', parseInt(e.target.value))}
                        className="bg-slate-700/50 border-slate-600/50 focus:border-red-500 text-white placeholder-slate-400"
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-xl border border-slate-600/50">
                      <Label htmlFor="maintenanceMode" className="text-slate-300">Modo Mantenimiento</Label>
                      <Switch
                        id="maintenanceMode"
                        checked={systemSettings.maintenanceMode}
                        onCheckedChange={(checked) => handleSystemSettingChange('maintenanceMode', checked)}
                      />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-slate-300 font-medium">Regenerar API Keys</Label>
                      <Button 
                        variant="outline" 
                        className="w-full bg-slate-700/50 hover:bg-slate-600 text-white border-slate-600/50"
                      >
                        <Key className="h-4 w-4 mr-2" />
                        Regenerar Claves de API
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Panel de Usuarios Administrativos */}
                <div className="relative overflow-hidden bg-gradient-to-br from-slate-800/50 to-slate-700/30 border-slate-600/50 backdrop-blur-md rounded-xl">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full -translate-y-12 translate-x-12"></div>
                  <div className="relative z-10 p-6">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="p-2 bg-blue-500/20 rounded-lg">
                        <Users className="h-6 w-6 text-blue-400" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">Usuarios Administrativos</h3>
                        <p className="text-slate-300">Gestión de usuarios del sistema</p>
                      </div>
                    </div>
                    <AdminUsers />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Configuración del Sistema */}
            <TabsContent value="system" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Panel de Configuración del Sistema */}
                <Card className="relative overflow-hidden bg-gradient-to-br from-slate-800/50 to-slate-700/30 border-slate-600/50 backdrop-blur-md">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full -translate-y-12 translate-x-12"></div>
                  <CardHeader className="relative z-10 pb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-purple-500/20 rounded-lg">
                        <Server className="h-6 w-6 text-purple-400" />
                      </div>
                      <div>
                        <CardTitle className="text-xl font-bold text-white">Configuración del Sistema</CardTitle>
                        <CardDescription className="text-slate-300">Parámetros técnicos y de rendimiento</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="relative z-10 space-y-4">
                    <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-xl border border-slate-600/50">
                      <Label htmlFor="autoBackup" className="text-slate-300">Backup Automático</Label>
                      <Switch
                        id="autoBackup"
                        checked={systemSettings.autoBackup}
                        onCheckedChange={(checked) => handleSystemSettingChange('autoBackup', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-xl border border-slate-600/50">
                      <Label htmlFor="debugMode" className="text-slate-300">Modo Debug</Label>
                      <Switch
                        id="debugMode"
                        checked={systemSettings.debugMode}
                        onCheckedChange={(checked) => handleSystemSettingChange('debugMode', checked)}
                      />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-slate-300 font-medium">Mantenimiento del Sistema</Label>
                      <div className="grid grid-cols-2 gap-3">
                        <Button 
                          variant="outline"
                          className="bg-slate-700/50 hover:bg-slate-600 text-white border-slate-600/50"
                        >
                          <Database className="h-4 w-4 mr-2" />
                          Limpiar Cache
                        </Button>
                        <Button 
                          variant="outline"
                          className="bg-slate-700/50 hover:bg-slate-600 text-white border-slate-600/50"
                        >
                          <Server className="h-4 w-4 mr-2" />
                          Reiniciar Servicios
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Panel de Monitoreo del Sistema */}
                <Card className="relative overflow-hidden bg-gradient-to-br from-slate-800/50 to-slate-700/30 border-slate-600/50 backdrop-blur-md">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/5 rounded-full -translate-y-12 translate-x-12"></div>
                  <CardHeader className="relative z-10 pb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-green-500/20 rounded-lg">
                        <Activity className="h-6 w-6 text-green-400" />
                      </div>
                      <div>
                        <CardTitle className="text-xl font-bold text-white">Monitoreo del Sistema</CardTitle>
                        <CardDescription className="text-slate-300">Estado actual del servidor</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="relative z-10 space-y-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-xl border border-slate-600/50">
                        <span className="text-sm font-medium text-slate-300">Estado del Servidor</span>
                        <Badge className="bg-green-500/20 text-green-300 border-green-500/30 hover:bg-green-500/30">
                          <Activity className="h-3 w-3 mr-1" />
                          Online
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-xl border border-slate-600/50">
                        <span className="text-sm font-medium text-slate-300">Base de Datos</span>
                        <Badge className="bg-green-500/20 text-green-300 border-green-500/30 hover:bg-green-500/30">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Conectada
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-xl border border-slate-600/50">
                        <span className="text-sm font-medium text-slate-300">Servicios Externos</span>
                        <Badge className="bg-green-500/20 text-green-300 border-green-500/30 hover:bg-green-500/30">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Operativos
                        </Badge>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      className="w-full bg-slate-700/50 hover:bg-slate-600 text-white border-slate-600/50"
                    >
                      <Activity className="h-4 w-4 mr-2" />
                      Ver Métricas Detalladas
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Logs del Sistema */}
            <TabsContent value="logs" className="space-y-6">
              <Card className="relative overflow-hidden bg-gradient-to-br from-slate-800/50 to-slate-700/30 border-slate-600/50 backdrop-blur-md">
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full -translate-y-16 translate-x-16"></div>
                <CardHeader className="relative z-10 pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-orange-500/20 rounded-lg">
                      <Activity className="h-6 w-6 text-orange-400" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold text-white">Logs de Seguridad</CardTitle>
                      <CardDescription className="text-slate-300">Registro de eventos y accesos al sistema</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="space-y-4">
                    {securityLogs.map((log, index) => (
                      <div key={index} className="group flex items-start justify-between p-4 bg-slate-700/30 rounded-xl border border-slate-600/50 hover:bg-slate-700/50 transition-all duration-300">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-3">
                            <span className="font-semibold text-white group-hover:text-orange-300 transition-colors">{log.event}</span>
                            {getSeverityBadge(log.severity)}
                          </div>
                          <p className="text-sm text-slate-300">{log.details}</p>
                          <p className="text-xs text-slate-400">{log.timestamp}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 flex justify-center">
                    <Button 
                      variant="outline"
                      className="bg-slate-700/50 hover:bg-slate-600 text-white border-slate-600/50"
                    >
                      Ver Más Logs
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
