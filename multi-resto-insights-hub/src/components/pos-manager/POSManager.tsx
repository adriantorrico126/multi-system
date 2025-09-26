import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Settings, LayoutGrid, Printer, Users, Database, Link as LinkIcon, Bell, RefreshCw, Activity, Monitor, Shield, Zap, AlertTriangle } from "lucide-react";
import { apiFetch } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from "@/components/ui/use-toast";

export const POSManager: React.FC = () => {
  const [overview, setOverview] = useState<any>(null);
  const [printers, setPrinters] = useState<any[]>([]);
  const [connections, setConnections] = useState<any>(null);
  const [layout, setLayout] = useState<any>(null);
  const [roles, setRoles] = useState<any[]>([]);
  const [dataStatus, setDataStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();
  const { toast } = useToast();

  // Cargar datos del resumen
  const loadOverview = async () => {
    try {
      const data = await apiFetch<any>('/pos-manager/overview', {}, token || undefined);
      setOverview(data.data);
    } catch (err: any) {
      console.error('Error cargando resumen POS:', err);
    }
  };

  // Cargar datos de impresoras
  const loadPrinters = async () => {
    try {
      const data = await apiFetch<any>('/pos-manager/printers', {}, token || undefined);
      setPrinters(data.data || []);
    } catch (err: any) {
      console.error('Error cargando impresoras:', err);
    }
  };

  // Cargar datos de conexiones
  const loadConnections = async () => {
    try {
      const data = await apiFetch<any>('/pos-manager/connections', {}, token || undefined);
      setConnections(data.data);
    } catch (err: any) {
      console.error('Error cargando conexiones:', err);
    }
  };

  // Cargar datos de layout
  const loadLayout = async () => {
    try {
      const data = await apiFetch<any>('/pos-manager/layout', {}, token || undefined);
      setLayout(data.data);
    } catch (err: any) {
      console.error('Error cargando layout:', err);
    }
  };

  // Cargar datos de roles
  const loadRoles = async () => {
    try {
      const data = await apiFetch<any>('/pos-manager/roles', {}, token || undefined);
      setRoles(data.data || []);
    } catch (err: any) {
      console.error('Error cargando roles:', err);
    }
  };

  // Cargar estado de datos
  const loadDataStatus = async () => {
    try {
      const data = await apiFetch<any>('/pos-manager/data', {}, token || undefined);
      setDataStatus(data.data);
    } catch (err: any) {
      console.error('Error cargando estado de datos:', err);
    }
  };

  // Cargar todos los datos
  const loadAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([
        loadOverview(),
        loadPrinters(),
        loadConnections(),
        loadLayout(),
        loadRoles(),
        loadDataStatus()
      ]);
    } catch (err: any) {
      setError(err.message || 'Error al cargar datos del POS Manager');
    } finally {
      setLoading(false);
    }
  };

  // Funciones de acción
  const handleTestPrinter = async (printerId: number) => {
    try {
      const data = await apiFetch<any>('/pos-manager/printers/test', {
        method: 'POST',
        body: JSON.stringify({ printerId })
      }, token || undefined);
      
      toast({
        title: "Prueba de impresión",
        description: data.data?.message || "Prueba completada exitosamente",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Error al probar impresora",
        variant: "destructive"
      });
    }
  };

  const handleTestConnection = async (connectionType: string) => {
    try {
      const data = await apiFetch<any>('/pos-manager/connections/test', {
        method: 'POST',
        body: JSON.stringify({ connectionType })
      }, token || undefined);
      
      toast({
        title: "Prueba de conexión",
        description: data.data?.message || "Conexión exitosa",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Error al probar conexión",
        variant: "destructive"
      });
    }
  };

  const handleSyncData = async () => {
    try {
      const data = await apiFetch<any>('/pos-manager/data/sync', {
        method: 'POST'
      }, token || undefined);
      
      toast({
        title: "Sincronización",
        description: data.message || "Sincronización iniciada",
      });
      
      // Recargar estado de datos después de sincronizar
      setTimeout(loadDataStatus, 2000);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Error al sincronizar datos",
        variant: "destructive"
      });
    }
  };

  const handleDiagnoseData = async () => {
    try {
      const data = await apiFetch<any>('/pos-manager/data/diagnose', {
        method: 'POST'
      }, token || undefined);
      
      toast({
        title: "Diagnóstico",
        description: data.message || "Diagnóstico completado",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Error al realizar diagnóstico",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (token) {
      loadAllData();
    }
  }, [token]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      {/* Header del Sistema POS Manager */}
      <div className="mb-8">
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              Centro de Gestión POS
            </h1>
            <p className="text-slate-300 text-lg">
              Herramientas avanzadas de administración y configuración del ecosistema POS
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm text-slate-400">Última actualización</p>
              <p className="text-white font-semibold">{new Date().toLocaleTimeString()}</p>
            </div>
            <Button
              onClick={loadAllData}
              disabled={loading}
              className="bg-slate-700 hover:bg-slate-600 text-white border-slate-600"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Cargando...' : 'Actualizar'}
            </Button>
          </div>
        </div>
      </div>

      {/* Estados de Carga y Error */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-blue-400 text-lg">Cargando configuración del POS...</p>
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

      {/* Panel de Navegación POS Manager */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-slate-800/50 to-slate-700/30 border-slate-600/50 backdrop-blur-md mb-8">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -translate-y-16 translate-x-16"></div>
        <CardContent className="relative z-10 p-6">
      <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-6 bg-slate-800/50 backdrop-blur-md p-1 shadow-lg rounded-xl border border-slate-700/50">
              <TabsTrigger 
                value="overview" 
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all duration-200"
              >
                <Activity className="h-4 w-4 mr-2" />
                Resumen
              </TabsTrigger>
              <TabsTrigger 
                value="printers" 
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all duration-200"
              >
                <Printer className="h-4 w-4 mr-2" />
                Impresoras
              </TabsTrigger>
              <TabsTrigger 
                value="channels" 
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all duration-200"
              >
                <LinkIcon className="h-4 w-4 mr-2" />
                Conexiones
              </TabsTrigger>
              <TabsTrigger 
                value="layouts" 
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all duration-200"
              >
                <LayoutGrid className="h-4 w-4 mr-2" />
                Layout POS
              </TabsTrigger>
              <TabsTrigger 
                value="roles" 
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all duration-200"
              >
                <Users className="h-4 w-4 mr-2" />
                Roles/Permisos
              </TabsTrigger>
              <TabsTrigger 
                value="data" 
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all duration-200"
              >
                <Database className="h-4 w-4 mr-2" />
                Datos
              </TabsTrigger>
        </TabsList>

            {/* Pestaña de Resumen */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Tarjeta de Configuración General */}
                <Card className="group relative overflow-hidden bg-gradient-to-br from-slate-800/50 to-slate-700/30 border-slate-600/50 backdrop-blur-md hover:border-blue-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full -translate-y-12 translate-x-12"></div>
                  <CardHeader className="relative z-10 pb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-3 bg-blue-500/20 rounded-xl group-hover:bg-blue-500/30 transition-colors duration-300">
                        <Settings className="h-8 w-8 text-blue-400" />
                      </div>
                      <div>
                        <CardTitle className="text-xl font-bold text-white">Configuración General</CardTitle>
                        <CardDescription className="text-slate-300">Parámetros globales del POS</CardDescription>
                      </div>
                    </div>
              </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-xl border border-slate-600/50">
                        <span className="text-sm font-medium text-slate-300">Estado del Sistema</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                          <span className="text-green-400 text-sm">{overview?.system?.status === 'active' ? 'Activo' : 'Inactivo'}</span>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-2 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
                      >
                        Abrir configuración
                      </Button>
                    </div>
              </CardContent>
            </Card>

                {/* Tarjeta de Impresión */}
                <Card className="group relative overflow-hidden bg-gradient-to-br from-slate-800/50 to-slate-700/30 border-slate-600/50 backdrop-blur-md hover:border-green-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/20">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/5 rounded-full -translate-y-12 translate-x-12"></div>
                  <CardHeader className="relative z-10 pb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-3 bg-green-500/20 rounded-xl group-hover:bg-green-500/30 transition-colors duration-300">
                        <Printer className="h-8 w-8 text-green-400" />
                      </div>
                      <div>
                        <CardTitle className="text-xl font-bold text-white">Impresión</CardTitle>
                        <CardDescription className="text-slate-300">Agentes, colas y pruebas</CardDescription>
                      </div>
                    </div>
              </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-xl border border-slate-600/50">
                        <span className="text-sm font-medium text-slate-300">Impresoras Conectadas</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                          <span className="text-green-400 text-sm">{overview?.printers?.active || 0} Activas</span>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-2 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
                      >
                        Gestionar impresoras
                      </Button>
                    </div>
              </CardContent>
            </Card>

                {/* Tarjeta de POS */}
                <Card className="group relative overflow-hidden bg-gradient-to-br from-slate-800/50 to-slate-700/30 border-slate-600/50 backdrop-blur-md hover:border-purple-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full -translate-y-12 translate-x-12"></div>
                  <CardHeader className="relative z-10 pb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-3 bg-purple-500/20 rounded-xl group-hover:bg-purple-500/30 transition-colors duration-300">
                        <LayoutGrid className="h-8 w-8 text-purple-400" />
                      </div>
                      <div>
                        <CardTitle className="text-xl font-bold text-white">POS</CardTitle>
                        <CardDescription className="text-slate-300">Plantillas y módulos</CardDescription>
                      </div>
                    </div>
              </CardHeader>
                  <CardContent className="relative z-10">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-xl border border-slate-600/50">
                        <span className="text-sm font-medium text-slate-300">Módulos Activos</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                          <span className="text-purple-400 text-sm">{overview?.modules?.loaded || 0} Cargados</span>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        className="w-full bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white font-semibold py-2 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
                      >
                        Editar layout
                      </Button>
                    </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

            {/* Pestaña de Impresoras */}
        <TabsContent value="printers">
              <Card className="relative overflow-hidden bg-gradient-to-br from-slate-800/50 to-slate-700/30 border-slate-600/50 backdrop-blur-md">
                <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full -translate-y-16 translate-x-16"></div>
                <CardHeader className="relative z-10 pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-500/20 rounded-lg">
                      <Printer className="h-6 w-6 text-green-400" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold text-white">Impresoras y Agentes</CardTitle>
                      <CardDescription className="text-slate-300">Registro, estado y pruebas de impresión</CardDescription>
                    </div>
                  </div>
            </CardHeader>
                <CardContent className="relative z-10">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {printers.map((printer) => (
                        <div key={printer.id} className="p-4 bg-slate-700/30 rounded-xl border border-slate-600/50">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-slate-300">{printer.name}</span>
                            <div className={`w-2 h-2 rounded-full animate-pulse ${
                              printer.status === 'connected' ? 'bg-green-400' : 'bg-red-400'
                            }`}></div>
                          </div>
                          <p className="text-white font-semibold">{printer.model}</p>
                          <p className="text-slate-400 text-sm">Estado: {printer.status === 'connected' ? 'Conectada' : 'Desconectada'}</p>
                          <p className="text-slate-400 text-sm">Ubicación: {printer.location}</p>
                          <p className="text-slate-400 text-xs">IP: {printer.ip}:{printer.port}</p>
                        </div>
                      ))}
                    </div>
                    <div className="flex space-x-3">
                      <Button 
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => handleTestPrinter(printers[0]?.id)}
                        disabled={printers.length === 0}
                      >
                        <Printer className="h-4 w-4 mr-2" />
                        Probar Impresión
                      </Button>
                      <Button variant="outline" className="bg-slate-700/50 hover:bg-slate-600 text-white border-slate-600/50">
                        <Settings className="h-4 w-4 mr-2" />
                        Configurar
                      </Button>
                    </div>
                  </div>
            </CardContent>
          </Card>
        </TabsContent>

            {/* Pestaña de Conexiones */}
        <TabsContent value="channels">
              <Card className="relative overflow-hidden bg-gradient-to-br from-slate-800/50 to-slate-700/30 border-slate-600/50 backdrop-blur-md">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -translate-y-16 translate-x-16"></div>
                <CardHeader className="relative z-10 pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <LinkIcon className="h-6 w-6 text-blue-400" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold text-white">Conexiones</CardTitle>
                      <CardDescription className="text-slate-300">WebSocket, HTTP, autenticación</CardDescription>
                    </div>
                  </div>
            </CardHeader>
                <CardContent className="relative z-10">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {connections?.websocket && (
                        <div className="p-4 bg-slate-700/30 rounded-xl border border-slate-600/50">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-slate-300">WebSocket</span>
                            <div className={`w-2 h-2 rounded-full animate-pulse ${
                              connections.websocket.status === 'connected' ? 'bg-green-400' : 'bg-red-400'
                            }`}></div>
                          </div>
                          <p className="text-white font-semibold">{connections.websocket.url}</p>
                          <p className="text-slate-400 text-sm">Estado: {connections.websocket.status === 'connected' ? 'Conectado' : 'Desconectado'}</p>
                          <p className="text-slate-400 text-xs">Respuesta: {connections.websocket.responseTime}ms</p>
                        </div>
                      )}
                      {connections?.http && (
                        <div className="p-4 bg-slate-700/30 rounded-xl border border-slate-600/50">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-slate-300">HTTP API</span>
                            <div className={`w-2 h-2 rounded-full animate-pulse ${
                              connections.http.status === 'active' ? 'bg-green-400' : 'bg-red-400'
                            }`}></div>
                          </div>
                          <p className="text-white font-semibold">{connections.http.url}</p>
                          <p className="text-slate-400 text-sm">Estado: {connections.http.status === 'active' ? 'Activo' : 'Inactivo'}</p>
                          <p className="text-slate-400 text-xs">Respuesta: {connections.http.responseTime}ms</p>
                        </div>
                      )}
                    </div>
                    <div className="flex space-x-3">
                      <Button 
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() => handleTestConnection('websocket')}
                      >
                        <LinkIcon className="h-4 w-4 mr-2" />
                        Probar Conexión
                      </Button>
                      <Button variant="outline" className="bg-slate-700/50 hover:bg-slate-600 text-white border-slate-600/50">
                        <Settings className="h-4 w-4 mr-2" />
                        Configurar
                      </Button>
                    </div>
                  </div>
            </CardContent>
          </Card>
        </TabsContent>

            {/* Pestaña de Layout POS */}
        <TabsContent value="layouts">
              <Card className="relative overflow-hidden bg-gradient-to-br from-slate-800/50 to-slate-700/30 border-slate-600/50 backdrop-blur-md">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full -translate-y-16 translate-x-16"></div>
                <CardHeader className="relative z-10 pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                      <LayoutGrid className="h-6 w-6 text-purple-400" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold text-white">Layout POS</CardTitle>
                      <CardDescription className="text-slate-300">Temas, breakpoints y módulos visibles</CardDescription>
                    </div>
                  </div>
            </CardHeader>
                <CardContent className="relative z-10">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {layout?.theme && (
                        <div className="p-4 bg-slate-700/30 rounded-xl border border-slate-600/50">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-slate-300">Tema Actual</span>
                            <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                          </div>
                          <p className="text-white font-semibold">{layout.theme.name}</p>
                          <p className="text-slate-400 text-sm">Tipo: {layout.theme.type === 'dark' ? 'Oscuro' : 'Claro'}</p>
                        </div>
                      )}
                      {layout?.modules && (
                        <div className="p-4 bg-slate-700/30 rounded-xl border border-slate-600/50">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-slate-300">Módulos Activos</span>
                            <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                          </div>
                          <p className="text-white font-semibold">{layout.modules.active} de {layout.modules.total} Módulos</p>
                          <p className="text-slate-400 text-sm">Estado: Cargados</p>
                        </div>
                      )}
                    </div>
                    <div className="flex space-x-3">
                      <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                        <LayoutGrid className="h-4 w-4 mr-2" />
                        Editar Layout
                      </Button>
                      <Button variant="outline" className="bg-slate-700/50 hover:bg-slate-600 text-white border-slate-600/50">
                        <Monitor className="h-4 w-4 mr-2" />
                        Previsualizar
                      </Button>
                    </div>
                  </div>
            </CardContent>
          </Card>
        </TabsContent>

            {/* Pestaña de Roles y Permisos */}
        <TabsContent value="roles">
              <Card className="relative overflow-hidden bg-gradient-to-br from-slate-800/50 to-slate-700/30 border-slate-600/50 backdrop-blur-md">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full -translate-y-16 translate-x-16"></div>
                <CardHeader className="relative z-10 pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-amber-500/20 rounded-lg">
                      <Users className="h-6 w-6 text-amber-400" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold text-white">Roles y Permisos</CardTitle>
                      <CardDescription className="text-slate-300">Accesos a módulos del POS</CardDescription>
                    </div>
                  </div>
            </CardHeader>
                <CardContent className="relative z-10">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {roles.map((role) => (
                        <div key={role.id} className="p-4 bg-slate-700/30 rounded-xl border border-slate-600/50">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-slate-300">{role.name}</span>
                            <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
                          </div>
                          <p className="text-white font-semibold">{role.description}</p>
                          <p className="text-slate-400 text-sm">Permisos: {role.permissions}/{role.totalPermissions}</p>
                          <p className="text-slate-400 text-xs">Usuarios: {role.users}</p>
                        </div>
                      ))}
                    </div>
                    <div className="flex space-x-3">
                      <Button className="bg-amber-600 hover:bg-amber-700 text-white">
                        <Users className="h-4 w-4 mr-2" />
                        Gestionar Roles
                      </Button>
                      <Button variant="outline" className="bg-slate-700/50 hover:bg-slate-600 text-white border-slate-600/50">
                        <Shield className="h-4 w-4 mr-2" />
                        Configurar Permisos
                      </Button>
                    </div>
                  </div>
            </CardContent>
          </Card>
        </TabsContent>

            {/* Pestaña de Datos */}
        <TabsContent value="data">
              <Card className="relative overflow-hidden bg-gradient-to-br from-slate-800/50 to-slate-700/30 border-slate-600/50 backdrop-blur-md">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -translate-y-16 translate-x-16"></div>
                <CardHeader className="relative z-10 pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-indigo-500/20 rounded-lg">
                      <Database className="h-6 w-6 text-indigo-400" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold text-white">Datos</CardTitle>
                      <CardDescription className="text-slate-300">Sincronización e integridad</CardDescription>
                    </div>
                  </div>
            </CardHeader>
                <CardContent className="relative z-10">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {dataStatus?.synchronization && (
                        <div className="p-4 bg-slate-700/30 rounded-xl border border-slate-600/50">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-slate-300">Sincronización</span>
                            <div className={`w-2 h-2 rounded-full animate-pulse ${
                              dataStatus.synchronization.status === 'active' ? 'bg-indigo-400' : 'bg-red-400'
                            }`}></div>
                          </div>
                          <p className="text-white font-semibold">
                            Última: {dataStatus.synchronization.lastSync ? 
                              new Date(dataStatus.synchronization.lastSync).toLocaleTimeString() : 
                              'N/A'
                            }
                          </p>
                          <p className="text-slate-400 text-sm">
                            Estado: {dataStatus.synchronization.status === 'active' ? 'Activo' : 'Inactivo'}
                          </p>
                        </div>
                      )}
                      {dataStatus?.integrity && (
                        <div className="p-4 bg-slate-700/30 rounded-xl border border-slate-600/50">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-slate-300">Integridad</span>
                            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></div>
                          </div>
                          <p className="text-white font-semibold">{dataStatus.integrity.percentage}% Integridad</p>
                          <p className="text-slate-400 text-sm">
                            Estado: {dataStatus.integrity.status === 'optimal' ? 'Óptimo' : 'Con problemas'}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="flex space-x-3">
                      <Button 
                        className="bg-indigo-600 hover:bg-indigo-700 text-white"
                        onClick={handleSyncData}
                      >
                        <Database className="h-4 w-4 mr-2" />
                        Sincronizar Ahora
                      </Button>
                      <Button 
                        variant="outline" 
                        className="bg-slate-700/50 hover:bg-slate-600 text-white border-slate-600/50"
                        onClick={handleDiagnoseData}
                      >
                        <Zap className="h-4 w-4 mr-2" />
                        Diagnóstico
                      </Button>
                    </div>
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


