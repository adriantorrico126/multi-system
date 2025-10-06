import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  FileText,
  Calendar,
  Package,
  DollarSign,
  Clock,
  Users,
  CreditCard,
  Printer,
  Download,
  Edit,
  ChevronRight,
  ChevronDown,
  Info,
  Zap,
  CheckCircle,
  RefreshCw,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getVentaConDetalles } from '@/services/api';

interface ProductoDetalle {
  id_detalle: number;
  producto_nombre: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  observaciones?: string;
  estado?: string;
  fecha_agregado?: string;
}

interface MesaData {
  id_mesa: number;
  numero: number;
  capacidad: number;
  estado: string;
  total_acumulado?: number;
  hora_apertura?: string;
  id_venta_actual?: number;
}

interface GrupoData {
  id_grupo_mesa: number;
  mesas: { id_mesa: number; numero: number; capacidad: number; estado: string; total_acumulado?: number; hora_apertura?: string; }[];
  total_acumulado_grupo: number;
  cantidad_productos: number;
  historial: ProductoDetalle[];
  total_ventas?: number;
  fecha_apertura?: string;
}

interface PrefacturaData {
  mesa?: MesaData;
  grupo?: GrupoData;
  detalles: ProductoDetalle[];
  total: number;
  subtotal: number;
  descuentos: number;
  impuestos: number;
  fecha_generacion: string;
  numero_prefactura: string;
}

interface ProfessionalDesktopPrefacturaModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'individual' | 'grupo';
  data: PrefacturaData;
  onAction?: (action: 'cobrar' | 'imprimir' | 'descargar' | 'editar') => void;
  loading?: boolean;
}

export function ProfessionalDesktopPrefacturaModal({
  isOpen,
  onClose,
  type,
  data,
  onAction,
  loading = false
}: ProfessionalDesktopPrefacturaModalProps) {
  const [activeTab, setActiveTab] = useState<'resumen' | 'detalles' | 'acciones'>('resumen');
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const [tipoPago, setTipoPago] = useState<'anticipado' | 'diferido' | null>(null);
  const [loadingTipoPago, setLoadingTipoPago] = useState(false);

  // Obtener tipo de pago de la venta actual
  useEffect(() => {
    const obtenerTipoPago = async () => {
      if (type === 'individual' && data.mesa?.id_venta_actual) {
        setLoadingTipoPago(true);
        try {
          const response = await getVentaConDetalles(data.mesa.id_venta_actual);
          if (response && response.data) {
            setTipoPago(response.data.tipo_pago || 'anticipado');
          }
        } catch (error) {
          console.error('Error obteniendo tipo de pago en prefactura desktop:', error);
          setTipoPago('anticipado'); // Default
        } finally {
          setLoadingTipoPago(false);
        }
      } else {
        // Para grupos, asumir diferido por defecto
        setTipoPago('diferido');
      }
    };

    if (isOpen) {
      obtenerTipoPago();
    }
  }, [isOpen, type, data.mesa?.id_venta_actual]);

  // Formatear moneda en Bolivianos
  const formatCurrency = (amount: number) => {
    return `Bs ${Number(amount).toFixed(2)}`;
  };

  // Formatear fecha
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-BO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Toggle expandir item
  const toggleItem = (id: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'entregado':
      case 'listo':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'recibido':
      case 'en_preparacion':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'cancelado':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className={cn(
          "max-w-6xl w-[95vw] max-h-[95vh] overflow-hidden p-0 bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/50",
          "border-0 shadow-2xl backdrop-blur-sm [&>button]:!hidden"
        )}
      >
        {/* Header con gradiente profesional */}
        <DialogHeader className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white p-6 pb-8">
          {/* Patrón de fondo */}
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>

          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
                <FileText className="h-7 w-7 text-white" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold drop-shadow-md">
                  Prefactura - {type === 'individual' ? `Mesa ${data.mesa?.numero}` : 'Grupo'}
                </DialogTitle>
                {type === 'individual' && data.mesa && (
                  <p className="text-sm opacity-90 mt-1">Capacidad: {data.mesa.capacidad} personas</p>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white hover:bg-white/20 transition-all duration-200 rounded-full"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
        </DialogHeader>

        {/* Contenido principal */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Tabs de navegación */}
          <Tabs defaultValue="resumen" className="w-full flex-shrink-0 px-6 pt-4">
            <TabsList className="grid w-full grid-cols-3 h-12 bg-gray-100 rounded-xl p-1">
              <TabsTrigger
                value="resumen"
                onClick={() => setActiveTab('resumen')}
                className={cn(
                  "text-sm font-medium transition-all duration-200 rounded-lg",
                  activeTab === 'resumen' ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md" : "text-gray-600 hover:bg-gray-200"
                )}
              >
                <FileText className="h-4 w-4 mr-2" /> Resumen
              </TabsTrigger>
              <TabsTrigger
                value="detalles"
                onClick={() => setActiveTab('detalles')}
                className={cn(
                  "text-sm font-medium transition-all duration-200 rounded-lg",
                  activeTab === 'detalles' ? "bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-md" : "text-gray-600 hover:bg-gray-200"
                )}
              >
                <Package className="h-4 w-4 mr-2" /> Detalles
              </TabsTrigger>
              <TabsTrigger
                value="acciones"
                onClick={() => setActiveTab('acciones')}
                className={cn(
                  "text-sm font-medium transition-all duration-200 rounded-lg",
                  activeTab === 'acciones' ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md" : "text-gray-600 hover:bg-gray-200"
                )}
              >
                <Zap className="h-4 w-4 mr-2" /> Acciones
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Contenido de los tabs */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Tab: Resumen */}
            {activeTab === 'resumen' && (
              <div className="space-y-6">
                <Card className="bg-gradient-to-r from-white to-blue-50/30 border-blue-200 shadow-lg">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center space-x-2 text-blue-900">
                      <FileText className="h-5 w-5" />
                      <span>Información General</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-600" />
                        <div>
                          <span className="text-sm font-medium text-gray-700">Fecha:</span>
                          <p className="text-sm text-gray-900">{formatDate(data.fecha_generacion)}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Package className="h-4 w-4 text-gray-600" />
                        <div>
                          <span className="text-sm font-medium text-gray-700">Productos:</span>
                          <p className="text-sm text-gray-900">{data.detalles.length}</p>
                        </div>
                      </div>
                      {type === 'individual' && data.mesa && (
                        <>
                          <div className="flex items-center space-x-2">
                            <Users className="h-4 w-4 text-gray-600" />
                            <div>
                              <span className="text-sm font-medium text-gray-700">Capacidad:</span>
                              <p className="text-sm text-gray-900">{data.mesa.capacidad}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-gray-600" />
                            <div>
                              <span className="text-sm font-medium text-gray-700">Estado:</span>
                              <Badge className={cn(
                                data.mesa.estado === 'en_uso' && 'bg-blue-500',
                                data.mesa.estado === 'libre' && 'bg-green-500',
                                data.mesa.estado === 'pendiente_cobro' && 'bg-yellow-500',
                                'text-white'
                              )}>{data.mesa.estado}</Badge>
                            </div>
                          </div>
                        </>
                      )}
                      {type === 'grupo' && data.grupo && (
                        <>
                          <div className="flex items-center space-x-2">
                            <Users className="h-4 w-4 text-gray-600" />
                            <div>
                              <span className="text-sm font-medium text-gray-700">Mesas en Grupo:</span>
                              <p className="text-sm text-gray-900">{data.grupo.mesas.map(m => m.numero).join(', ')}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-gray-600" />
                            <div>
                              <span className="text-sm font-medium text-gray-700">Estado Grupo:</span>
                              <Badge className="bg-blue-500 text-white">Agrupado</Badge>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                    <Separator className="my-4" />
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">Subtotal:</span>
                        <span className="text-base font-semibold text-gray-900">{formatCurrency(data.subtotal)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">Descuentos:</span>
                        <span className="text-base font-semibold text-red-600">- {formatCurrency(data.descuentos)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">Impuestos:</span>
                        <span className="text-base font-semibold text-gray-900">{formatCurrency(data.impuestos)}</span>
                      </div>
                      <Separator className="my-2" />
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-bold text-gray-800">Total Final:</span>
                        <span className="text-xl font-bold text-green-600">{formatCurrency(data.total)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Tab: Detalles */}
            {activeTab === 'detalles' && (
              <div className="space-y-4">
                <Card className="bg-gradient-to-r from-white to-purple-50/30 border-purple-200 shadow-lg">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center space-x-2 text-purple-900">
                      <Package className="h-5 w-5" />
                      <span>Productos Consumidos</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {data.detalles && data.detalles.length > 0 ? (
                      <div className="space-y-3">
                        {(() => {
                          // Agrupar productos por nombre y sumar cantidades
                          const productosAgrupados = data.detalles.reduce((acc: any, producto: any) => {
                            const key = producto.producto_nombre;
                            if (!acc[key]) {
                              acc[key] = {
                                ...producto,
                                cantidad_total: 0,
                                subtotal_total: 0,
                                observaciones_combinadas: [],
                                fechas_agregado: []
                              };
                            }
                            // Asegurar que los valores sean números
                            const cantidad = Number(producto.cantidad) || 0;
                            const subtotal = Number(producto.subtotal) || 0;
                            const precioUnitario = Number(producto.precio_unitario) || 0;
                            
                            acc[key].cantidad_total += cantidad;
                            acc[key].subtotal_total += subtotal;
                            
                            // Si no hay subtotal, calcularlo
                            if (subtotal === 0 && precioUnitario > 0 && cantidad > 0) {
                              acc[key].subtotal_total += precioUnitario * cantidad;
                            }
                            
                            // Combinar observaciones únicas
                            if (producto.observaciones && !acc[key].observaciones_combinadas.includes(producto.observaciones)) {
                              acc[key].observaciones_combinadas.push(producto.observaciones);
                            }
                            
                            // Combinar fechas
                            if (producto.fecha_agregado) {
                              acc[key].fechas_agregado.push(producto.fecha_agregado);
                            }
                            
                            return acc;
                          }, {});

                          return Object.values(productosAgrupados).map((producto: any, index: number) => (
                            <div
                              key={`${producto.producto_nombre}-${index}`}
                              className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden"
                            >
                              <div
                                className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                                onClick={() => toggleItem(index)}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center">
                                      <Package className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                      <h4 className="font-semibold text-gray-900">{producto.producto_nombre}</h4>
                                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                                        <span className="font-medium text-blue-600">
                                          Cantidad: {producto.cantidad_total}
                                        </span>
                                        <span>Precio unitario: {formatCurrency(producto.precio_unitario)}</span>
                                        {producto.estado && (
                                          <Badge className={getEstadoColor(producto.estado)}>
                                            {producto.estado}
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-lg font-bold text-green-600">
                                      {formatCurrency(producto.subtotal_total || (producto.precio_unitario * producto.cantidad_total))}
                                    </div>
                                    {producto.cantidad_total > 1 && (
                                      <div className="text-xs text-gray-500">
                                        {formatCurrency(producto.precio_unitario)} × {producto.cantidad_total}
                                      </div>
                                    )}
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="p-1"
                                    >
                                      {expandedItems.has(index) ? (
                                        <ChevronDown className="h-4 w-4" />
                                      ) : (
                                        <ChevronRight className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </div>
                                </div>
                              </div>
                              
                              {expandedItems.has(index) && (
                                <div className="px-4 pb-4 border-t bg-gray-50">
                                  <div className="pt-3 space-y-2">
                                    {producto.observaciones_combinadas.length > 0 && (
                                      <div className="flex items-start space-x-2">
                                        <Info className="h-4 w-4 text-blue-500 mt-0.5" />
                                        <div>
                                          <span className="text-sm font-medium text-gray-700">Observaciones:</span>
                                          {producto.observaciones_combinadas.map((obs: string, idx: number) => (
                                            <p key={idx} className="text-sm text-gray-600">• {obs}</p>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    {producto.fechas_agregado.length > 0 && (
                                      <div className="flex items-center space-x-2">
                                        <Clock className="h-4 w-4 text-gray-500" />
                                        <span className="text-sm text-gray-600">
                                          Agregado: {formatDate(producto.fechas_agregado[0])}
                                          {producto.fechas_agregado.length > 1 && (
                                            <span className="ml-1 text-xs text-gray-500">
                                              (+{producto.fechas_agregado.length - 1} veces más)
                                            </span>
                                          )}
                                        </span>
                                      </div>
                                    )}
                                    {producto.cantidad_total > 1 && (
                                      <div className="flex items-center space-x-2">
                                        <Package className="h-4 w-4 text-purple-500" />
                                        <span className="text-sm text-gray-600">
                                          <strong>Desglose:</strong> {producto.cantidad_total} unidades × {formatCurrency(producto.precio_unitario)} = {formatCurrency(producto.subtotal_total || (producto.precio_unitario * producto.cantidad_total))}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          ));
                        })()}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500 font-medium">No hay productos registrados</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Tab: Acciones */}
            {activeTab === 'acciones' && (
              <div className="space-y-6">
                <Card className="bg-gradient-to-r from-white to-orange-50/30 border-orange-200 shadow-lg">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center space-x-2 text-orange-900">
                      <Zap className="h-5 w-5" />
                      <span>Acciones Disponibles</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Botón de cobro - Solo mostrar si es pago diferido */}
                      {tipoPago === 'diferido' && (
                        <Button
                          onClick={() => onAction?.('cobrar')}
                          className="h-16 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                        >
                          <div className="flex items-center space-x-3">
                            <CreditCard className="h-6 w-6" />
                            <div className="text-left">
                              <div className="font-bold">Procesar Cobro</div>
                              <div className="text-xs opacity-90">Cobrar {formatCurrency(data.total)}</div>
                            </div>
                          </div>
                        </Button>
                      )}

                      {/* Mostrar estado de pago si es anticipado */}
                      {tipoPago === 'anticipado' && (
                        <div className="h-16 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg flex items-center justify-center shadow-lg">
                          <div className="flex items-center space-x-3">
                            <CheckCircle className="h-6 w-6" />
                            <div className="text-left">
                              <div className="font-bold">Pago Completado</div>
                              <div className="text-xs opacity-90">Ya se cobró {formatCurrency(data.total)}</div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Mostrar loading mientras verifica tipo de pago */}
                      {loadingTipoPago && (
                        <div className="h-16 bg-gradient-to-r from-gray-400 to-gray-500 text-white rounded-lg flex items-center justify-center shadow-lg">
                          <div className="flex items-center space-x-3">
                            <RefreshCw className="h-6 w-6 animate-spin" />
                            <div className="text-left">
                              <div className="font-bold">Verificando...</div>
                              <div className="text-xs opacity-90">Consultando tipo de pago</div>
                            </div>
                          </div>
                        </div>
                      )}

                      <Button
                        onClick={() => onAction?.('imprimir')}
                        variant="outline"
                        className="h-16 border-blue-200 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200"
                      >
                        <div className="flex items-center space-x-3">
                          <Printer className="h-6 w-6 text-blue-600" />
                          <div className="text-left">
                            <div className="font-bold text-blue-600">Imprimir</div>
                            <div className="text-xs text-gray-500">Generar copia física</div>
                          </div>
                        </div>
                      </Button>

                      <Button
                        onClick={() => onAction?.('descargar')}
                        variant="outline"
                        className="h-16 border-purple-200 hover:bg-purple-50 hover:border-purple-300 transition-all duration-200"
                      >
                        <div className="flex items-center space-x-3">
                          <Download className="h-6 w-6 text-purple-600" />
                          <div className="text-left">
                            <div className="font-bold text-purple-600">Descargar PDF</div>
                            <div className="text-xs text-gray-500">Guardar prefactura</div>
                          </div>
                        </div>
                      </Button>

                      <Button
                        onClick={() => onAction?.('editar')}
                        variant="outline"
                        className="h-16 border-orange-200 hover:bg-orange-50 hover:border-orange-300 transition-all duration-200"
                      >
                        <div className="flex items-center space-x-3">
                          <Edit className="h-6 w-6 text-orange-600" />
                          <div className="text-left">
                            <div className="font-bold text-orange-600">Editar</div>
                            <div className="text-xs text-gray-500">Modificar productos</div>
                          </div>
                        </div>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
