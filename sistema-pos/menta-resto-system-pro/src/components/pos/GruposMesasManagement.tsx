import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Users2, 
  Coffee, 
  DollarSign, 
  Clock, 
  FileText, 
  X, 
  Plus, 
  Minus,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Activity,
  MapPin,
  User,
  Receipt,
  CreditCard,
  Settings
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  listarGruposActivosCompletos,
  cerrarGrupoMesas,
  generarPrefacturaGrupo,
  obtenerGrupoCompleto
} from '@/services/api';

interface GrupoMesa {
  id_grupo_mesa: number;
  id_restaurante: number;
  id_sucursal: number;
  id_mesero: number;
  nombre_mesero?: string;
  username_mesero?: string;
  estado: string;
  created_at: string;
  updated_at?: string;
  mesas: Mesa[];
  total_acumulado_grupo: number;
}

interface Mesa {
  id_mesa: number;
  numero: number;
  capacidad: number;
  estado: string;
  total_acumulado?: number;
  hora_apertura?: string;
}

interface GruposMesasManagementProps {
  idRestaurante: number;
}

export function GruposMesasManagement({ idRestaurante }: GruposMesasManagementProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedGrupo, setSelectedGrupo] = useState<GrupoMesa | null>(null);
  const [showPrefactura, setShowPrefactura] = useState(false);
  const [prefacturaData, setPrefacturaData] = useState<any>(null);

  // Query para obtener grupos activos con información completa
  const { data: grupos = [], isLoading, refetch } = useQuery({
    queryKey: ['grupos-activos-completos', idRestaurante],
    queryFn: () => listarGruposActivosCompletos(idRestaurante),
    enabled: !!idRestaurante,
    refetchInterval: 5000, // Actualizar cada 5 segundos
  });

  // Mutation para cerrar grupo
  const cerrarGrupoMutation = useMutation({
    mutationFn: cerrarGrupoMesas,
    onSuccess: () => {
      toast({
        title: "✅ Grupo cerrado",
        description: "El grupo de mesas se ha cerrado exitosamente.",
      });
      queryClient.invalidateQueries({ queryKey: ['grupos-activos-completos'] });
      queryClient.invalidateQueries({ queryKey: ['mesas'] });
    },
    onError: (error: any) => {
      toast({
        title: "❌ Error",
        description: error.response?.data?.message || "Error al cerrar el grupo",
        variant: "destructive",
      });
    },
  });

  // Mutation para generar prefactura
  const generarPrefacturaMutation = useMutation({
    mutationFn: generarPrefacturaGrupo,
    onSuccess: (data) => {
      console.log('🔍 Prefactura recibida:', data);
      setPrefacturaData(data);
      setShowPrefactura(true);
      toast({
        title: "✅ Prefactura generada",
        description: "La prefactura del grupo se ha generado exitosamente.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "❌ Error",
        description: error.response?.data?.message || "Error al generar la prefactura",
        variant: "destructive",
      });
    },
  });

  const handleCerrarGrupo = (id_grupo_mesa: number) => {
    if (confirm('¿Estás seguro de que quieres cerrar este grupo? Esto liberará todas las mesas.')) {
      cerrarGrupoMutation.mutate(id_grupo_mesa);
    }
  };

  const handleGenerarPrefactura = (id_grupo_mesa: number) => {
    generarPrefacturaMutation.mutate(id_grupo_mesa);
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'ABIERTO':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'CERRADO':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'ABIERTO':
        return <Activity className="h-3 w-3" />;
      case 'CERRADO':
        return <X className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
          <p className="text-sm text-gray-600">Cargando grupos de mesas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con estadísticas */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Gestión de Grupos de Mesas</h2>
            <p className="text-blue-100">Administra los grupos de mesas unidas</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{grupos.length}</div>
              <div className="text-sm text-blue-100">Grupos Activos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {grupos.reduce((sum, grupo) => sum + grupo.mesas.length, 0)}
              </div>
              <div className="text-sm text-blue-100">Mesas Agrupadas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                ${grupos.reduce((sum, grupo) => sum + grupo.total_acumulado_grupo, 0).toFixed(2)}
              </div>
              <div className="text-sm text-blue-100">Total Acumulado</div>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de grupos */}
      {grupos.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Users2 className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay grupos activos</h3>
          <p className="text-gray-500">Los grupos de mesas aparecerán aquí cuando se creen</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {grupos.map((grupo) => (
            <Card key={grupo.id_grupo_mesa} className="overflow-hidden border-2 border-gray-100 hover:border-blue-200 transition-all duration-200">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Users2 className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-bold text-gray-900">
                        Grupo #{grupo.id_grupo_mesa}
                      </CardTitle>
                      <div className="flex items-center space-x-4 mt-1">
                        <Badge className={getEstadoColor(grupo.estado)}>
                          {getEstadoIcon(grupo.estado)}
                          <span className="ml-1">{grupo.estado}</span>
                        </Badge>
                        <div className="flex items-center space-x-1 text-sm text-gray-600">
                          <User className="h-4 w-4" />
                          <span>{grupo.nombre_mesero || grupo.username_mesero || 'Sin asignar'}</span>
                        </div>
                        <div className="flex items-center space-x-1 text-sm text-gray-600">
                          <Clock className="h-4 w-4" />
                          <span>{formatDate(grupo.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">
                        ${grupo.total_acumulado_grupo.toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {grupo.mesas.length} mesa{grupo.mesas.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-6">
                {/* Mesas del grupo */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    Mesas del Grupo
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {grupo.mesas.map((mesa) => (
                      <div key={mesa.id_mesa} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-sm">{mesa.numero}</span>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">Mesa {mesa.numero}</div>
                            <div className="text-sm text-gray-500">
                              {mesa.capacidad} personas • {mesa.estado}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-green-600">
                            ${(Number(mesa.total_acumulado) || 0).toFixed(2)}
                          </div>
                          {mesa.hora_apertura && (
                            <div className="text-xs text-gray-500">
                              {new Date(mesa.hora_apertura).toLocaleTimeString()}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">{grupo.mesas.length}</span> mesa{grupo.mesas.length !== 1 ? 's' : ''} unida{grupo.mesas.length !== 1 ? 's' : ''} • 
                    Total: <span className="font-bold text-green-600">${grupo.total_acumulado_grupo.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={() => handleGenerarPrefactura(grupo.id_grupo_mesa)}
                      variant="outline"
                      size="sm"
                      disabled={generarPrefacturaMutation.isPending}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Prefactura
                    </Button>
                    <Button
                      onClick={() => handleCerrarGrupo(grupo.id_grupo_mesa)}
                      variant="destructive"
                      size="sm"
                      disabled={cerrarGrupoMutation.isPending}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cerrar Grupo
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de Prefactura del Grupo */}
      <Dialog open={showPrefactura} onOpenChange={setShowPrefactura}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <FileText className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-gray-900">
                  Prefactura del Grupo
                </DialogTitle>
                <DialogDescription>
                  Detalles de productos y totales del grupo completo
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          {prefacturaData ? (
            <div className="space-y-6">
              {/* Información del grupo */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Grupo ID</p>
                    <p className="text-lg font-bold text-gray-900">{prefacturaData.id_grupo_mesa}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Mesas</p>
                    <p className="text-lg font-bold text-gray-900">{prefacturaData.mesas?.join(', ')}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Productos</p>
                    <p className="text-lg font-bold text-blue-600">{prefacturaData.cantidad_productos || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Acumulado</p>
                    <p className="text-lg font-bold text-green-600">
                      ${(Number(prefacturaData.total_acumulado) || 0).toFixed(2)}
                    </p>
                  </div>
                </div>
                {prefacturaData.total_ventas && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs font-medium text-gray-500">Ventas Realizadas</p>
                        <p className="text-sm font-bold text-blue-600">{prefacturaData.total_ventas}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500">Productos Diferentes</p>
                        <p className="text-sm font-bold text-purple-600">{prefacturaData.historial?.length || 0}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500">Fecha Apertura</p>
                        <p className="text-sm font-bold text-orange-600">
                          {prefacturaData.fecha_apertura ? new Date(prefacturaData.fecha_apertura).toLocaleString() : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Lista de productos */}
              {prefacturaData.historial && prefacturaData.historial.length > 0 ? (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Productos del Grupo</h3>
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader className="bg-gray-50">
                        <TableRow>
                          <TableHead className="font-medium text-gray-700">Producto</TableHead>
                          <TableHead className="font-medium text-gray-700 text-right">Cantidad</TableHead>
                          <TableHead className="font-medium text-gray-700 text-right">Precio Unit.</TableHead>
                          <TableHead className="font-medium text-gray-700 text-right">Subtotal</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {prefacturaData.historial.map((producto: any, index: number) => (
                          <TableRow key={index} className="hover:bg-gray-50">
                            <TableCell className="font-medium">
                              <div>
                                <div className="text-gray-900">{producto.nombre_producto}</div>
                                {producto.observaciones && producto.observaciones !== '-' && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    {producto.observaciones}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {producto.cantidad_total}
                            </TableCell>
                            <TableCell className="text-right text-gray-600">
                              ${Number(producto.precio_unitario).toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right font-bold text-green-600">
                              ${Number(producto.subtotal_total).toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <FileText className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No hay productos</h3>
                  <p className="text-gray-500">Este grupo no tiene productos registrados</p>
                </div>
              )}

              {/* Totales */}
              {prefacturaData.historial && prefacturaData.historial.length > 0 && (
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-green-800">Total Acumulado del Grupo:</span>
                    <span className="text-2xl font-bold text-green-900">
                      ${(Number(prefacturaData.total_acumulado) || 0).toFixed(2)}
                    </span>
                  </div>
                  {prefacturaData.total_ventas && (
                    <div className="mt-2 text-sm text-green-700">
                      {prefacturaData.total_ventas} venta{prefacturaData.total_ventas !== 1 ? 's' : ''} • 
                      {prefacturaData.fecha_apertura && ` Abierta desde: ${new Date(prefacturaData.fecha_apertura).toLocaleString()}`}
                    </div>
                  )}
                </div>
              )}

              {/* Acciones */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  Grupo {prefacturaData.id_grupo_mesa} • {prefacturaData.historial?.length || 0} producto{prefacturaData.historial?.length !== 1 ? 's' : ''}
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowPrefactura(false)}
                  >
                    Cerrar
                  </Button>
                  <Button
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Marcar como Pagado
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                <p className="text-sm text-gray-600">Cargando prefactura...</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 