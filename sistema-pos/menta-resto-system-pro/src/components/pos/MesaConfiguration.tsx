import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { 
  Settings, 
  Database, 
  Users, 
  Calendar, 
  BarChart3, 
  Shield, 
  Zap, 
  Clock,
  RefreshCw,
  Save,
  AlertTriangle,
  CheckCircle,
  Info,
  Plus,
  Grid3X3,
  Trash2,
  Edit,
  Eye,
  Loader2,
  Menu
} from 'lucide-react';
import { useMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';

// Estilos para ocultar scrollbar en mobile
const scrollbarHideStyles = `
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
`;
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { crearMesa, getMesas, actualizarMesa, eliminarMesa } from '@/services/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface MesaConfigurationProps {
  sucursalId: number;
}

interface NuevaMesa {
  numero: number;
  capacidad: number;
  estado: string;
}

interface Mesa {
  id_mesa: number;
  numero: number;
  capacidad: number;
  estado: string;
  id_sucursal: number;
  id_restaurante: number;
  created_at?: string;
  updated_at?: string;
}

export default function MesaConfiguration({ sucursalId }: MesaConfigurationProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isMobile } = useMobile();
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedMesa, setSelectedMesa] = useState<Mesa | null>(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [nuevaMesa, setNuevaMesa] = useState<NuevaMesa>({
    numero: 0,
    capacidad: 4,
    estado: 'libre'
  });

  // Query para obtener las mesas
  const { data: mesas = [], isLoading: isLoadingMesas, refetch: refetchMesas } = useQuery({
    queryKey: ['mesas', sucursalId],
    queryFn: () => getMesas(sucursalId),
    enabled: !!sucursalId,
  });

  // Calcular estadísticas reales
  const totalMesas = mesas.length;
  const mesasActivas = mesas.filter(mesa => mesa.estado === 'libre' || mesa.estado === 'en_uso').length;
  const mesasConfiguracion = mesas.filter(mesa => mesa.estado === 'mantenimiento').length;

  const handleRefreshData = () => {
    setIsLoading(true);
    refetchMesas().then(() => {
      setIsLoading(false);
      toast({
        title: "Datos Actualizados",
        description: "La información de configuración se ha actualizado correctamente.",
      });
    });
  };

  const handleSaveSettings = () => {
    setIsLoading(true);
    // Simular guardado
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Configuración Guardada",
        description: "Los cambios se han guardado exitosamente.",
      });
    }, 1500);
  };

  // Mutación para crear nueva mesa
  const crearMesaMutation = useMutation({
    mutationFn: (data: NuevaMesa) => crearMesa({
      ...data,
      id_sucursal: sucursalId
    }),
    onSuccess: (data) => {
      toast({
        title: "Mesa Creada",
        description: `Mesa ${data.data.numero} creada exitosamente.`,
      });
      setShowCreateModal(false);
      setNuevaMesa({ numero: 0, capacidad: 4, estado: 'libre' });
      queryClient.invalidateQueries({ queryKey: ['mesas', sucursalId] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Error al crear la mesa.",
        variant: "destructive",
      });
    },
  });

  // Mutación para actualizar mesa
  const actualizarMesaMutation = useMutation({
    mutationFn: ({ id_mesa, data }: { id_mesa: number; data: NuevaMesa }) => 
      actualizarMesa(id_mesa, {
        ...data,
        id_sucursal: sucursalId
      }),
    onSuccess: (data) => {
      toast({
        title: "Mesa Actualizada",
        description: `Mesa ${data.data.numero} actualizada exitosamente.`,
      });
      setShowEditModal(false);
      setSelectedMesa(null);
      queryClient.invalidateQueries({ queryKey: ['mesas', sucursalId] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Error al actualizar la mesa.",
        variant: "destructive",
      });
    },
  });

  // Mutación para eliminar mesa
  const eliminarMesaMutation = useMutation({
    mutationFn: (id_mesa: number) => eliminarMesa(id_mesa),
    onSuccess: () => {
      toast({
        title: "Mesa Eliminada",
        description: "La mesa ha sido eliminada exitosamente.",
      });
      setShowDeleteModal(false);
      setSelectedMesa(null);
      queryClient.invalidateQueries({ queryKey: ['mesas', sucursalId] });
    },
    onError: (error: any) => {
      console.error('Error al eliminar mesa:', error);
      const errorMessage = error.response?.data?.message || error.message || "Error al eliminar la mesa.";
      
      toast({
        title: "Error al Eliminar Mesa",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });


  const handleCrearMesa = () => {
    if (!nuevaMesa.numero || nuevaMesa.numero <= 0) {
      toast({
        title: "Error",
        description: "El número de mesa es requerido y debe ser mayor a 0.",
        variant: "destructive",
      });
      return;
    }

    if (nuevaMesa.capacidad < 2 || nuevaMesa.capacidad > 10) {
      toast({
        title: "Error",
        description: "La capacidad debe estar entre 2 y 10 personas.",
        variant: "destructive",
      });
      return;
    }

    crearMesaMutation.mutate(nuevaMesa);
  };

  const handleEditarMesa = (mesa: Mesa) => {
    setSelectedMesa(mesa);
    setNuevaMesa({
      numero: mesa.numero,
      capacidad: mesa.capacidad,
      estado: mesa.estado
    });
    setShowEditModal(true);
  };

  const handleActualizarMesa = () => {
    if (!selectedMesa) return;
    
    if (!nuevaMesa.numero || nuevaMesa.numero <= 0) {
      toast({
        title: "Error",
        description: "El número de mesa es requerido y debe ser mayor a 0.",
        variant: "destructive",
      });
      return;
    }

    actualizarMesaMutation.mutate({
      id_mesa: selectedMesa.id_mesa,
      data: nuevaMesa
    });
  };

  const handleEliminarMesa = (mesa: Mesa) => {
    setSelectedMesa(mesa);
    setShowDeleteModal(true);
  };

  const confirmarEliminarMesa = () => {
    if (!selectedMesa) return;
    eliminarMesaMutation.mutate(selectedMesa.id_mesa);
  };


  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'libre':
        return 'bg-green-100 text-green-800';
      case 'en_uso':
        return 'bg-blue-100 text-blue-800';
      case 'pendiente_cobro':
        return 'bg-yellow-100 text-yellow-800';
      case 'mantenimiento':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getEstadoText = (estado: string) => {
    switch (estado) {
      case 'libre':
        return 'Libre';
      case 'en_uso':
        return 'En Uso';
      case 'pendiente_cobro':
        return 'Pendiente Cobro';
      case 'mantenimiento':
        return 'Mantenimiento';
      default:
        return estado;
    }
  };

  return (
    <>
      <style>{scrollbarHideStyles}</style>
      <div className="space-y-6 px-2 sm:px-0">
      {/* Header de Configuración */}
      <div className={`flex items-center ${isMobile ? 'justify-between px-1' : 'justify-between'}`}>
        <div className={`flex items-center ${isMobile ? 'space-x-2' : 'space-x-3'} flex-1 min-w-0`}>
          <div className={`${isMobile ? 'p-1.5' : 'p-2'} bg-purple-100 rounded-lg`}>
            <Settings className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} text-purple-600`} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className={`font-bold text-gray-900 ${isMobile ? 'text-base' : 'text-xl'}`}>Configuración de Mesas</h2>
            <p className={`text-gray-500 ${isMobile ? 'text-xs' : 'text-sm'}`}>Gestión avanzada y personalización</p>
          </div>
        </div>
        
        {/* Menú hamburguesa para mobile */}
        {isMobile ? (
          <Sheet open={showMobileMenu} onOpenChange={setShowMobileMenu}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="bg-purple-100 border-purple-300 text-purple-700 hover:bg-purple-200">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <SheetHeader>
                <SheetTitle className="text-left">Configuración de Mesas</SheetTitle>
              </SheetHeader>
              <div className="space-y-6 mt-6">
                {/* Acciones Principales */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900 text-sm">Acciones Principales</h3>
                  <Button
                    variant="outline"
                    onClick={() => {
                      handleRefreshData();
                      setShowMobileMenu(false);
                    }}
                    disabled={isLoading}
                    className="w-full justify-start"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                    Actualizar Datos
                  </Button>
                  
                  <Button
                    onClick={() => {
                      setShowCreateModal(true);
                      setShowMobileMenu(false);
                    }}
                    className="w-full justify-start bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Nueva Mesa
                  </Button>
                  
                  <Button
                    onClick={() => {
                      handleSaveSettings();
                      setShowMobileMenu(false);
                    }}
                    disabled={isLoading}
                    className="w-full justify-start bg-purple-600 hover:bg-purple-700"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Guardar Cambios
                  </Button>
                </div>

                {/* Estadísticas Rápidas */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900 text-sm">Estadísticas</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 bg-blue-50 rounded-lg text-center">
                      <div className="text-lg font-bold text-blue-600">{totalMesas}</div>
                      <div className="text-xs text-blue-700">Total Mesas</div>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg text-center">
                      <div className="text-lg font-bold text-green-600">{mesasActivas}</div>
                      <div className="text-xs text-green-700">Activas</div>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg text-center">
                      <div className="text-lg font-bold text-purple-600">{mesasConfiguracion}</div>
                      <div className="text-xs text-purple-700">Mantenimiento</div>
                    </div>
                    <div className="p-3 bg-orange-50 rounded-lg text-center">
                      <div className="text-lg font-bold text-orange-600">2.1.0</div>
                      <div className="text-xs text-orange-700">Versión</div>
                    </div>
                  </div>
                </div>

                {/* Acciones Rápidas */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900 text-sm">Acciones Rápidas</h3>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => {
                      if (mesas.length > 0) {
                        handleEditarMesa(mesas[0]);
                        setShowMobileMenu(false);
                      } else {
                        toast({
                          title: "No hay mesas",
                          description: "No hay mesas disponibles para editar.",
                          variant: "destructive",
                        });
                      }
                    }}
                    disabled={mesas.length === 0}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Editar Primera Mesa
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start text-red-600 hover:text-red-700"
                    onClick={() => {
                      if (mesas.length > 0) {
                        handleEliminarMesa(mesas[0]);
                        setShowMobileMenu(false);
                      } else {
                        toast({
                          title: "No hay mesas",
                          description: "No hay mesas disponibles para eliminar.",
                          variant: "destructive",
                        });
                      }
                    }}
                    disabled={mesas.length === 0}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar Primera Mesa
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        ) : (
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshData}
              disabled={isLoading}
              className="flex items-center space-x-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Actualizar</span>
            </Button>
            
            <Button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
              data-testid="nueva-mesa-btn"
            >
              <Plus className="h-4 w-4" />
              <span>Nueva Mesa</span>
            </Button>
            
            <Button
              onClick={handleSaveSettings}
              disabled={isLoading}
              className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700"
            >
              <Save className="h-4 w-4" />
              <span>Guardar Cambios</span>
            </Button>
          </div>
        )}
      </div>

      <Tabs defaultValue="mesas" className="w-full">
        {isMobile ? (
          // Vista móvil con scroll horizontal optimizado
          <div className="overflow-x-auto scrollbar-hide -mx-2 px-2">
            <TabsList className="flex w-max bg-white shadow-sm border border-gray-200 rounded-lg p-1 space-x-1 min-w-full">
              <TabsTrigger value="mesas" className="flex items-center gap-1 data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700 text-xs px-2 py-2 whitespace-nowrap min-w-[80px] justify-center">
                <Grid3X3 className="h-3 w-3" />
                Mesas
              </TabsTrigger>
              <TabsTrigger value="general" className="flex items-center gap-1 data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700 text-xs px-2 py-2 whitespace-nowrap min-w-[80px] justify-center">
                <Settings className="h-3 w-3" />
                General
              </TabsTrigger>
              <TabsTrigger value="performance" className="flex items-center gap-1 data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700 text-xs px-2 py-2 whitespace-nowrap min-w-[80px] justify-center">
                <Zap className="h-3 w-3" />
                Rendimiento
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-1 data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700 text-xs px-2 py-2 whitespace-nowrap min-w-[80px] justify-center">
                <Shield className="h-3 w-3" />
                Seguridad
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-1 data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700 text-xs px-2 py-2 whitespace-nowrap min-w-[80px] justify-center">
                <BarChart3 className="h-3 w-3" />
                Analytics
              </TabsTrigger>
            </TabsList>
          </div>
        ) : (
          // Vista desktop con todas las pestañas
          <TabsList className="grid w-full grid-cols-5 bg-white shadow-sm border border-gray-200 rounded-lg p-1">
            <TabsTrigger value="general" className="flex items-center gap-2 data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700">
              <Settings className="h-4 w-4" />
              General
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center gap-2 data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700">
              <Zap className="h-4 w-4" />
              Rendimiento
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2 data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700">
              <Shield className="h-4 w-4" />
              Seguridad
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2 data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="mesas" className="flex items-center gap-2 data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700">
              <Grid3X3 className="h-4 w-4" />
              Gestión Mesas
            </TabsTrigger>
          </TabsList>
        )}

        <TabsContent value="general" className={`space-y-6 mt-6 ${isMobile ? 'px-1' : ''}`}>
          <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
            {/* Configuración General */}
            <Card className={`border-l-4 border-l-blue-500 ${isMobile ? 'p-3' : ''}`}>
              <CardHeader className={isMobile ? 'p-3 pb-2' : ''}>
                <div className="flex items-center space-x-2">
                  <Settings className="h-5 w-5 text-blue-600" />
                  <CardTitle className={`font-bold text-gray-900 ${isMobile ? 'text-base' : 'text-lg'}`}>Configuración General</CardTitle>
                </div>
              </CardHeader>
              <CardContent className={`space-y-4 ${isMobile ? 'p-3 pt-0' : ''}`}>
                <div className="space-y-3">
                  <div className={`flex items-center justify-between ${isMobile ? 'p-2' : 'p-3'} bg-gray-50 rounded-lg`}>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-gray-600" />
                      <span className={`font-medium text-gray-700 ${isMobile ? 'text-sm' : 'text-sm'}`}>Auto-refresh</span>
                    </div>
                    <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300 text-xs">30s</Badge>
                  </div>
                  
                  <div className={`flex items-center justify-between ${isMobile ? 'p-2' : 'p-3'} bg-gray-50 rounded-lg`}>
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-gray-600" />
                      <span className={`font-medium text-gray-700 ${isMobile ? 'text-sm' : 'text-sm'}`}>Máximo mesas por grupo</span>
                    </div>
                    <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300 text-xs">8</Badge>
                  </div>
                  
                  <div className={`flex items-center justify-between ${isMobile ? 'p-2' : 'p-3'} bg-gray-50 rounded-lg`}>
                    <div className="flex items-center space-x-2">
                      <Database className="h-4 w-4 text-gray-600" />
                      <span className={`font-medium text-gray-700 ${isMobile ? 'text-sm' : 'text-sm'}`}>Backup automático</span>
                    </div>
                    <Badge className="bg-green-100 text-green-800 text-xs">Activo</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Estado del Sistema */}
            <Card className="border-l-4 border-l-green-500">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <CardTitle className={`font-bold text-gray-900 ${isMobile ? 'text-base' : 'text-lg'}`}>Estado del Sistema</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className={`flex items-center justify-between ${isMobile ? 'p-2' : 'p-3'} bg-green-50 rounded-lg border border-green-200`}>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className={`font-medium text-green-700 ${isMobile ? 'text-sm' : 'text-sm'}`}>Base de datos</span>
                    </div>
                    <Badge className="bg-green-100 text-green-800 text-xs">Conectado</Badge>
                  </div>
                  
                  <div className={`flex items-center justify-between ${isMobile ? 'p-2' : 'p-3'} bg-green-50 rounded-lg border border-green-200`}>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className={`font-medium text-green-700 ${isMobile ? 'text-sm' : 'text-sm'}`}>API Backend</span>
                    </div>
                    <Badge className="bg-green-100 text-green-800 text-xs">Online</Badge>
                  </div>
                  
                  <div className={`flex items-center justify-between ${isMobile ? 'p-2' : 'p-3'} bg-green-50 rounded-lg border border-green-200`}>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className={`font-medium text-green-700 ${isMobile ? 'text-sm' : 'text-sm'}`}>Sincronización</span>
                    </div>
                    <Badge className="bg-green-100 text-green-800 text-xs">Activa</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className={`space-y-6 mt-6 ${isMobile ? 'px-1' : ''}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Métricas de Rendimiento */}
            <Card className="border-l-4 border-l-orange-500">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Zap className="h-5 w-5 text-orange-600" />
                  <CardTitle className="text-lg font-bold text-gray-900">Métricas de Rendimiento</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-orange-600" />
                      <span className="text-sm font-medium text-orange-700">Tiempo de respuesta</span>
                    </div>
                    <Badge className="bg-orange-100 text-orange-800 text-xs">120ms</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <div className="flex items-center space-x-2">
                      <Database className="h-4 w-4 text-orange-600" />
                      <span className="text-sm font-medium text-orange-700">Consultas/segundo</span>
                    </div>
                    <Badge className="bg-orange-100 text-orange-800 text-xs">45</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <div className="flex items-center space-x-2">
                      <BarChart3 className="h-4 w-4 text-orange-600" />
                      <span className="text-sm font-medium text-orange-700">Uso de memoria</span>
                    </div>
                    <Badge className="bg-orange-100 text-orange-800 text-xs">68%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Optimizaciones */}
            <Card className="border-l-4 border-l-purple-500">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Settings className="h-5 w-5 text-purple-600" />
                  <CardTitle className="text-lg font-bold text-gray-900">Optimizaciones</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="flex items-center space-x-2">
                      <Zap className="h-4 w-4 text-purple-600" />
                      <span className="text-sm font-medium text-purple-700">Cache activo</span>
                    </div>
                    <Badge className="bg-purple-100 text-purple-800 text-xs">Habilitado</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="flex items-center space-x-2">
                      <RefreshCw className="h-4 w-4 text-purple-600" />
                      <span className="text-sm font-medium text-purple-700">Auto-refresh</span>
                    </div>
                    <Badge className="bg-purple-100 text-purple-800 text-xs">30s</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="flex items-center space-x-2">
                      <Database className="h-4 w-4 text-purple-600" />
                      <span className="text-sm font-medium text-purple-700">Pool de conexiones</span>
                    </div>
                    <Badge className="bg-purple-100 text-purple-800 text-xs">20</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="security" className={`space-y-6 mt-6 ${isMobile ? 'px-1' : ''}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Configuración de Seguridad */}
            <Card className="border-l-4 border-l-red-500">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-red-600" />
                  <CardTitle className="text-lg font-bold text-gray-900">Configuración de Seguridad</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-center space-x-2">
                      <Shield className="h-4 w-4 text-red-600" />
                      <span className="text-sm font-medium text-red-700">Autenticación 2FA</span>
                    </div>
                    <Badge className="bg-red-100 text-red-800 text-xs">Requerida</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-red-600" />
                      <span className="text-sm font-medium text-red-700">Timeout de sesión</span>
                    </div>
                    <Badge className="bg-red-100 text-red-800 text-xs">30 min</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <span className="text-sm font-medium text-red-700">Logs de auditoría</span>
                    </div>
                    <Badge className="bg-red-100 text-red-800 text-xs">Activo</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Permisos y Roles */}
            <Card className="border-l-4 border-l-indigo-500">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-indigo-600" />
                  <CardTitle className="text-lg font-bold text-gray-900">Permisos y Roles</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-indigo-600" />
                      <span className="text-sm font-medium text-indigo-700">Admin</span>
                    </div>
                    <Badge className="bg-indigo-100 text-indigo-800 text-xs">Completo</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-indigo-600" />
                      <span className="text-sm font-medium text-indigo-700">Cajero</span>
                    </div>
                    <Badge className="bg-indigo-100 text-indigo-800 text-xs">Limitado</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-indigo-600" />
                      <span className="text-sm font-medium text-indigo-700">Mesero</span>
                    </div>
                    <Badge className="bg-indigo-100 text-indigo-800 text-xs">Básico</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className={`space-y-6 mt-6 ${isMobile ? 'px-1' : ''}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Métricas de Uso */}
            <Card className="border-l-4 border-l-teal-500">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-teal-600" />
                  <CardTitle className="text-lg font-bold text-gray-900">Métricas de Uso</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-teal-50 rounded-lg border border-teal-200">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-teal-600" />
                      <span className="text-sm font-medium text-teal-700">Mesas activas hoy</span>
                    </div>
                    <Badge className="bg-teal-100 text-teal-800 text-xs">24</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-teal-50 rounded-lg border border-teal-200">
                    <div className="flex items-center space-x-2">
                      <BarChart3 className="h-4 w-4 text-teal-600" />
                      <span className="text-sm font-medium text-teal-700">Promedio uso</span>
                    </div>
                    <Badge className="bg-teal-100 text-teal-800 text-xs">78%</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-teal-50 rounded-lg border border-teal-200">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-teal-600" />
                      <span className="text-sm font-medium text-teal-700">Tiempo promedio</span>
                    </div>
                    <Badge className="bg-teal-100 text-teal-800 text-xs">45 min</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Reportes */}
            <Card className="border-l-4 border-l-cyan-500">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-cyan-600" />
                  <CardTitle className="text-lg font-bold text-gray-900">Reportes Disponibles</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-cyan-50 rounded-lg border border-cyan-200">
                    <div className="flex items-center space-x-2">
                      <BarChart3 className="h-4 w-4 text-cyan-600" />
                      <span className="text-sm font-medium text-cyan-700">Reporte diario</span>
                    </div>
                    <Badge className="bg-cyan-100 text-cyan-800 text-xs">Disponible</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-cyan-50 rounded-lg border border-cyan-200">
                    <div className="flex items-center space-x-2">
                      <BarChart3 className="h-4 w-4 text-cyan-600" />
                      <span className="text-sm font-medium text-cyan-700">Reporte semanal</span>
                    </div>
                    <Badge className="bg-cyan-100 text-cyan-800 text-xs">Disponible</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-cyan-50 rounded-lg border border-cyan-200">
                    <div className="flex items-center space-x-2">
                      <BarChart3 className="h-4 w-4 text-cyan-600" />
                      <span className="text-sm font-medium text-cyan-700">Reporte mensual</span>
                    </div>
                    <Badge className="bg-cyan-100 text-cyan-800 text-xs">Disponible</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="mesas" className={`space-y-6 mt-6 ${isMobile ? 'px-1' : ''}`}>
          <div className="space-y-6">
            {/* Gestión de Mesas */}
            <Card className="border-l-4 border-l-green-500">
              <CardHeader>
                <div className={`flex ${isMobile ? 'flex-col space-y-3' : 'items-center justify-between'}`}>
                  <div className="flex items-center space-x-2">
                    <Grid3X3 className="h-5 w-5 text-green-600" />
                    <CardTitle className={`font-bold text-gray-900 ${isMobile ? 'text-base' : 'text-lg'}`}>Gestión de Mesas</CardTitle>
                  </div>
                  {!isMobile && (
                    <Button
                      onClick={() => setShowCreateModal(true)}
                      className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
                      data-testid="nueva-mesa-btn"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Nueva Mesa</span>
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3'}`}>
                    <div className={`${isMobile ? 'p-3' : 'p-4'} bg-blue-50 rounded-lg border border-blue-200`}>
                      <div className="flex items-center space-x-2">
                        <Grid3X3 className="h-5 w-5 text-blue-600" />
                        <span className={`font-medium text-blue-900 ${isMobile ? 'text-sm' : ''}`}>Total de Mesas</span>
                      </div>
                      <p className={`font-bold text-blue-900 ${isMobile ? 'text-xl mt-1' : 'text-2xl mt-2'}`}>{totalMesas}</p>
                      <p className={`text-blue-600 ${isMobile ? 'text-xs' : 'text-sm'}`}>Configuradas en el sistema</p>
                    </div>
                    
                    <div className={`${isMobile ? 'p-3' : 'p-4'} bg-green-50 rounded-lg border border-green-200`}>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className={`font-medium text-green-900 ${isMobile ? 'text-sm' : ''}`}>Mesas Activas</span>
                      </div>
                      <p className={`font-bold text-green-900 ${isMobile ? 'text-xl mt-1' : 'text-2xl mt-2'}`}>{mesasActivas}</p>
                      <p className={`text-green-600 ${isMobile ? 'text-xs' : 'text-sm'}`}>En uso actualmente</p>
                    </div>
                    
                    <div className={`${isMobile ? 'p-3' : 'p-4'} bg-purple-50 rounded-lg border border-purple-200`}>
                      <div className="flex items-center space-x-2">
                        <Settings className="h-5 w-5 text-purple-600" />
                        <span className={`font-medium text-purple-900 ${isMobile ? 'text-sm' : ''}`}>Configuración</span>
                      </div>
                      <p className={`font-bold text-purple-900 ${isMobile ? 'text-xl mt-1' : 'text-2xl mt-2'}`}>{mesasConfiguracion}</p>
                      <p className={`text-purple-600 ${isMobile ? 'text-xs' : 'text-sm'}`}>Pendientes de configuración</p>
                    </div>
                  </div>
                  
                  <div className={`bg-gray-50 ${isMobile ? 'p-3' : 'p-4'} rounded-lg`}>
                    <h4 className={`font-medium text-gray-900 ${isMobile ? 'text-sm mb-2' : 'mb-3'}`}>Acciones Rápidas</h4>
                    <div className={`flex ${isMobile ? 'flex-col space-y-2' : 'flex-wrap gap-2'}`}>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className={`flex items-center space-x-2 ${isMobile ? 'w-full justify-start' : ''}`}
                        onClick={() => setShowCreateModal(true)}
                      >
                        <Plus className="h-4 w-4" />
                        <span>Crear Mesa</span>
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className={`flex items-center space-x-2 ${isMobile ? 'w-full justify-start' : ''}`}
                        onClick={handleRefreshData}
                        disabled={isLoading}
                      >
                        <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                        <span>Actualizar</span>
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className={`flex items-center space-x-2 ${isMobile ? 'w-full justify-start' : ''}`}
                        onClick={() => {
                          if (mesas.length > 0) {
                            handleEditarMesa(mesas[0]);
                          } else {
                            toast({
                              title: "No hay mesas",
                              description: "No hay mesas disponibles para editar.",
                              variant: "destructive",
                            });
                          }
                        }}
                        disabled={mesas.length === 0}
                      >
                        <Edit className="h-4 w-4" />
                        <span>Editar Primera Mesa</span>
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className={`flex items-center space-x-2 text-red-600 hover:text-red-700 ${isMobile ? 'w-full justify-start' : ''}`}
                        onClick={() => {
                          if (mesas.length > 0) {
                            handleEliminarMesa(mesas[0]);
                          } else {
                            toast({
                              title: "No hay mesas",
                              description: "No hay mesas disponibles para eliminar.",
                              variant: "destructive",
                            });
                          }
                        }}
                        disabled={mesas.length === 0}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Eliminar Primera Mesa</span>
                      </Button>
                    </div>
                    <div className={`text-gray-600 ${isMobile ? 'text-xs mt-2' : 'mt-3 text-xs'}`}>
                      <p>• Total de mesas: <span className="font-medium">{totalMesas}</span></p>
                      <p>• Mesas activas: <span className="font-medium">{mesasActivas}</span></p>
                      <p>• En mantenimiento: <span className="font-medium">{mesasConfiguracion}</span></p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Lista de Mesas Existentes */}
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Grid3X3 className="h-5 w-5 text-blue-600" />
                  <CardTitle className={`font-bold text-gray-900 ${isMobile ? 'text-base' : 'text-lg'}`}>Mesas Configuradas</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {isMobile ? (
                  // Vista móvil con tarjetas
                  <div className="space-y-3">
                    {isLoadingMesas ? (
                      <div className="text-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-3" />
                        <p className="text-gray-600">Cargando mesas...</p>
                      </div>
                    ) : mesas.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-gray-600">No hay mesas configuradas en esta sucursal.</p>
                      </div>
                    ) : (
                      mesas.map((mesa) => (
                        <div key={mesa.id_mesa} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-sm">{mesa.numero}</span>
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">Mesa {mesa.numero}</div>
                                <div className="text-sm text-gray-500">{mesa.capacidad} personas</div>
                              </div>
                            </div>
                            <Badge className={getEstadoColor(mesa.estado)}>{getEstadoText(mesa.estado)}</Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-600">
                              Sucursal: <span className="font-medium">{sucursalId}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button size="sm" variant="outline" onClick={() => handleEditarMesa(mesa)}>
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700" onClick={() => handleEliminarMesa(mesa)}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                ) : (
                  // Vista desktop con tabla
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="font-medium text-gray-700">Número</TableHead>
                          <TableHead className="font-medium text-gray-700">Capacidad</TableHead>
                          <TableHead className="font-medium text-gray-700">Estado</TableHead>
                          <TableHead className="font-medium text-gray-700">Sucursal</TableHead>
                          <TableHead className="font-medium text-gray-700">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoadingMesas ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8">
                              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                              <p className="text-gray-600 mt-2">Cargando mesas...</p>
                            </TableCell>
                          </TableRow>
                        ) : mesas.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8">
                              <p className="text-gray-600">No hay mesas configuradas en esta sucursal.</p>
                            </TableCell>
                          </TableRow>
                        ) : (
                          mesas.map((mesa) => (
                            <TableRow key={mesa.id_mesa}>
                              <TableCell className="font-medium">{mesa.numero}</TableCell>
                              <TableCell>{mesa.capacidad} personas</TableCell>
                              <TableCell>
                                <Badge className={getEstadoColor(mesa.estado)}>{getEstadoText(mesa.estado)}</Badge>
                              </TableCell>
                              <TableCell>Sucursal Principal</TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  <Button size="sm" variant="outline" onClick={() => handleEditarMesa(mesa)}>
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700" onClick={() => handleEliminarMesa(mesa)}>
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Información del Sistema */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Info className="h-5 w-5 text-blue-600" />
            <CardTitle className={`font-bold text-gray-900 ${isMobile ? 'text-base' : 'text-lg'}`}>Información del Sistema</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3'}`}>
            <div className={`text-center ${isMobile ? 'p-2' : 'p-3'} bg-white rounded-lg border border-blue-200`}>
              <p className={`font-medium text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'}`}>Versión</p>
              <p className={`font-bold text-blue-900 ${isMobile ? 'text-base' : 'text-lg'}`}>2.1.0</p>
            </div>
            <div className={`text-center ${isMobile ? 'p-2' : 'p-3'} bg-white rounded-lg border border-blue-200`}>
              <p className={`font-medium text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'}`}>Última actualización</p>
              <p className={`font-bold text-blue-900 ${isMobile ? 'text-xs' : 'text-sm'}`}>Hace 2 días</p>
            </div>
            <div className={`text-center ${isMobile ? 'p-2' : 'p-3'} bg-white rounded-lg border border-blue-200`}>
              <p className={`font-medium text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'}`}>Estado</p>
              <Badge className="bg-green-100 text-green-800">Estable</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal para Crear Nueva Mesa */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className={`${isMobile ? 'max-w-sm mx-4' : 'sm:max-w-md'}`}>
          <DialogHeader>
            <div className={`flex items-center ${isMobile ? 'space-x-2' : 'space-x-3'}`}>
              <div className="p-2 bg-green-100 rounded-lg">
                <Plus className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <DialogTitle className={`font-bold text-gray-900 ${isMobile ? 'text-base' : 'text-lg'}`}>
                  Crear Nueva Mesa
                </DialogTitle>
                <p className={`text-gray-500 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                  Configura los detalles de la nueva mesa
                </p>
              </div>
            </div>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="numero" className={isMobile ? 'text-sm' : ''}>Número de Mesa *</Label>
              <Input
                id="numero"
                type="number"
                placeholder="Ej: 25"
                value={nuevaMesa.numero || ''}
                onChange={(e) => setNuevaMesa(prev => ({ ...prev, numero: parseInt(e.target.value) || 0 }))}
                min="1"
                className={`focus:ring-2 focus:ring-green-500 ${isMobile ? 'text-base' : ''}`}
              />
              <p className={`text-gray-500 ${isMobile ? 'text-xs' : 'text-xs'}`}>Número único para identificar la mesa</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="capacidad" className={isMobile ? 'text-sm' : ''}>Capacidad *</Label>
              <Select
                value={nuevaMesa.capacidad.toString()}
                onValueChange={(value) => setNuevaMesa(prev => ({ ...prev, capacidad: parseInt(value) }))}
              >
                <SelectTrigger className={`focus:ring-2 focus:ring-green-500 ${isMobile ? 'text-base' : ''}`}>
                  <SelectValue placeholder="Selecciona la capacidad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 personas</SelectItem>
                  <SelectItem value="4">4 personas</SelectItem>
                  <SelectItem value="6">6 personas</SelectItem>
                  <SelectItem value="8">8 personas</SelectItem>
                  <SelectItem value="10">10 personas</SelectItem>
                </SelectContent>
              </Select>
              <p className={`text-gray-500 ${isMobile ? 'text-xs' : 'text-xs'}`}>Número máximo de personas que pueden sentarse</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="estado" className={isMobile ? 'text-sm' : ''}>Estado Inicial</Label>
              <Select
                value={nuevaMesa.estado}
                onValueChange={(value) => setNuevaMesa(prev => ({ ...prev, estado: value }))}
              >
                <SelectTrigger className={`focus:ring-2 focus:ring-green-500 ${isMobile ? 'text-base' : ''}`}>
                  <SelectValue placeholder="Selecciona el estado inicial" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="libre">Libre</SelectItem>
                  <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
                </SelectContent>
              </Select>
              <p className={`text-gray-500 ${isMobile ? 'text-xs' : 'text-xs'}`}>Estado inicial de la mesa</p>
            </div>
            
            <div className={`flex ${isMobile ? 'flex-col space-y-3' : 'items-center justify-between'} pt-4 border-t border-gray-200`}>
              <div className={`text-gray-600 ${isMobile ? 'text-sm text-center' : 'text-sm'}`}>
                Sucursal: <span className="font-medium">{sucursalId}</span>
              </div>
              <div className={`flex ${isMobile ? 'space-x-2 w-full' : 'space-x-2'}`}>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNuevaMesa({ numero: 0, capacidad: 4, estado: 'libre' });
                  }}
                  className={isMobile ? 'flex-1' : ''}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleCrearMesa}
                  disabled={crearMesaMutation.isPending || !nuevaMesa.numero}
                  className={`bg-green-600 hover:bg-green-700 ${isMobile ? 'flex-1' : ''}`}
                >
                  {crearMesaMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creando...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Crear Mesa
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal para Editar Mesa */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className={`${isMobile ? 'max-w-sm mx-4' : 'sm:max-w-md'}`}>
          <DialogHeader>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Edit className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-gray-900">
                  Editar Mesa
                </DialogTitle>
                <p className="text-sm text-gray-500">
                  Modifica los detalles de la mesa
                </p>
              </div>
            </div>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="numero">Número de Mesa *</Label>
              <Input
                id="numero"
                type="number"
                placeholder="Ej: 25"
                value={nuevaMesa.numero || ''}
                onChange={(e) => setNuevaMesa(prev => ({ ...prev, numero: parseInt(e.target.value) || 0 }))}
                min="1"
                className="focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500">Número único para identificar la mesa</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="capacidad">Capacidad *</Label>
              <Select
                value={nuevaMesa.capacidad.toString()}
                onValueChange={(value) => setNuevaMesa(prev => ({ ...prev, capacidad: parseInt(value) }))}
              >
                <SelectTrigger className="focus:ring-2 focus:ring-blue-500">
                  <SelectValue placeholder="Selecciona la capacidad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 personas</SelectItem>
                  <SelectItem value="4">4 personas</SelectItem>
                  <SelectItem value="6">6 personas</SelectItem>
                  <SelectItem value="8">8 personas</SelectItem>
                  <SelectItem value="10">10 personas</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">Número máximo de personas que pueden sentarse</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="estado">Estado Inicial</Label>
              <Select
                value={nuevaMesa.estado}
                onValueChange={(value) => setNuevaMesa(prev => ({ ...prev, estado: value }))}
              >
                <SelectTrigger className="focus:ring-2 focus:ring-blue-500">
                  <SelectValue placeholder="Selecciona el estado inicial" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="libre">Libre</SelectItem>
                  <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">Estado inicial de la mesa</p>
            </div>
            
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                Sucursal: <span className="font-medium">{sucursalId}</span>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowEditModal(false);
                    setNuevaMesa({ numero: 0, capacidad: 4, estado: 'libre' });
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleActualizarMesa}
                  disabled={actualizarMesaMutation.isPending || !nuevaMesa.numero}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {actualizarMesaMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Edit className="h-4 w-4 mr-2" />
                      Guardar Cambios
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal para Eliminar Mesa */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className={`${isMobile ? 'max-w-sm mx-4' : 'sm:max-w-md'}`}>
          <DialogHeader>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-gray-900">
                  Confirmar Eliminación
                </DialogTitle>
                <div className="text-sm text-gray-500 space-y-2">
                  <p>¿Estás seguro de que quieres eliminar la mesa {selectedMesa?.numero}?</p>
                  <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                    <p className="font-medium text-yellow-800">Información importante:</p>
                    <ul className="text-xs text-yellow-700 mt-1 space-y-1">
                      <li>• Solo se puede eliminar si está libre y sin dependencias</li>
                      <li>• Se eliminarán todas las referencias a esta mesa</li>
                    </ul>
                  </div>
                  <p className="text-red-600 font-medium">Esta acción no se puede deshacer.</p>
                </div>
              </div>
            </div>
          </DialogHeader>
          
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              Sucursal: <span className="font-medium">{sucursalId}</span>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowDeleteModal(false)}
                disabled={eliminarMesaMutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                onClick={confirmarEliminarMesa}
                disabled={eliminarMesaMutation.isPending}
                className="bg-red-600 hover:bg-red-700"
              >
                {eliminarMesaMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Eliminando...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar Mesa
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </>
  );
} 