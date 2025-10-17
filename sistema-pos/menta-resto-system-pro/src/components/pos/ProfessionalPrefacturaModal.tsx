import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FileText, 
  X, 
  Clock, 
  Users, 
  DollarSign, 
  Package, 
  CheckCircle, 
  AlertCircle,
  Download,
  Printer,
  CreditCard,
  Coffee,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Star,
  TrendingUp,
  Eye,
  Edit,
  Trash2,
  Plus,
  Minus,
  RefreshCw,
  ChevronRight,
  ChevronDown,
  Info,
  Zap
} from 'lucide-react';
import { useMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { getVentaConDetalles } from '@/services/api';

interface Modificador {
  id_modificador: number;
  nombre_modificador: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

interface ProductoDetalle {
  id_detalle: number;
  producto_nombre: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  observaciones?: string;
  estado?: string;
  fecha_agregado?: string;
  modificadores?: Modificador[];
}

interface MesaInfo {
  id_mesa: number;
  numero: number;
  capacidad: number;
  estado: string;
  total_acumulado: number;
  hora_apertura?: string;
  nombre_mesero_grupo?: string;
  id_venta_actual?: number;
}

interface GrupoInfo {
  id_grupo_mesa: number;
  mesas: number[];
  cantidad_productos: number;
  total_acumulado: number;
  total_ventas?: number;
  fecha_apertura?: string;
  historial?: ProductoDetalle[];
}

interface PrefacturaData {
  mesa?: MesaInfo;
  grupo?: GrupoInfo;
  detalles?: ProductoDetalle[];
  total: number;
  subtotal: number;
  descuentos?: number;
  impuestos?: number;
  fecha_generacion: string;
  numero_prefactura: string;
}

interface ProfessionalPrefacturaModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'individual' | 'grupo';
  data: PrefacturaData;
  onAction?: (action: 'cobrar' | 'imprimir' | 'descargar' | 'editar') => void;
  loading?: boolean;
}

export function ProfessionalPrefacturaModal({
  isOpen,
  onClose,
  type,
  data,
  onAction,
  loading = false
}: ProfessionalPrefacturaModalProps) {
  const { isMobile, isTablet } = useMobile();
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
          console.error('Error obteniendo tipo de pago en prefactura:', error);
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

  // Obtener color del estado
  const getEstadoColor = (estado: string) => {
    switch (estado?.toLowerCase()) {
      case 'entregado':
      case 'listo':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
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
          "max-w-4xl w-[95vw] max-h-[95vh] overflow-hidden p-0 bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/50",
          "border-0 shadow-2xl backdrop-blur-sm [&>button]:!hidden",
          isMobile && "w-[100vw] h-[100vh] max-h-[100vh] rounded-none"
        )}
      >
        {/* Header con gradiente profesional */}
        <DialogHeader className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white p-6 pb-8">
          {/* Patrón de fondo */}
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold text-white">
                    {type === 'individual' ? `Prefactura - Mesa ${data.mesa?.numero}` : 'Prefactura de Grupo'}
                  </DialogTitle>
                  <p className="text-blue-100 text-sm">
                    {type === 'individual' 
                      ? `Capacidad: ${data.mesa?.capacidad} personas` 
                      : `Mesas: ${data.grupo?.mesas?.join(', ')}`
                    }
                  </p>
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-white hover:bg-white/20 rounded-full p-2"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Información clave */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                <div className="flex items-center space-x-2 mb-1">
                  <Calendar className="h-4 w-4 text-blue-200" />
                  <span className="text-xs text-blue-100">Fecha</span>
                </div>
                <p className="text-sm font-semibold text-white">
                  {formatDate(data.fecha_generacion)}
                </p>
              </div>
              
              <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                <div className="flex items-center space-x-2 mb-1">
                  <Package className="h-4 w-4 text-blue-200" />
                  <span className="text-xs text-blue-100">Productos</span>
                </div>
                <p className="text-sm font-semibold text-white">
                  {data.detalles?.length || data.grupo?.cantidad_productos || 0}
                </p>
              </div>
              
              <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                <div className="flex items-center space-x-2 mb-1">
                  <DollarSign className="h-4 w-4 text-blue-200" />
                  <span className="text-xs text-blue-100">Total</span>
                </div>
                <p className="text-sm font-semibold text-white">
                  {formatCurrency(data.total)}
                </p>
              </div>
              
              <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                <div className="flex items-center space-x-2 mb-1">
                  <Clock className="h-4 w-4 text-blue-200" />
                  <span className="text-xs text-blue-100">Estado</span>
                </div>
                <Badge className="bg-white/20 text-white border-white/30 text-xs">
                  {type === 'individual' ? data.mesa?.estado : 'Activo'}
                </Badge>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Tabs de navegación */}
        <div className="border-b border-gray-200 bg-white/80 backdrop-blur-sm">
          <div className="flex space-x-1 p-2">
            {[
              { id: 'resumen', label: 'Resumen', icon: Eye },
              { id: 'detalles', label: 'Detalles', icon: Package },
              { id: 'acciones', label: 'Acciones', icon: Zap }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    "flex-1 justify-center space-x-2 transition-all duration-200",
                    activeTab === tab.id
                      ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg"
                      : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="font-medium">{tab.label}</span>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Contenido principal */}
        <ScrollArea className="flex-1 p-6 bg-gradient-to-b from-white to-gray-50/50">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
                <p className="text-gray-600 font-medium">Cargando prefactura...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Tab: Resumen */}
              {activeTab === 'resumen' && (
                <div className="space-y-6">
                  {/* Información de la mesa/grupo */}
                  <Card className="bg-gradient-to-r from-white to-blue-50/30 border-blue-200 shadow-lg">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center space-x-2 text-blue-900">
                        <Coffee className="h-5 w-5" />
                        <span>Información {type === 'individual' ? 'de la Mesa' : 'del Grupo'}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {type === 'individual' && data.mesa ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                            <div className="text-2xl font-bold text-blue-600">{data.mesa.numero}</div>
                            <div className="text-xs text-gray-500">Número de Mesa</div>
                          </div>
                          <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                            <div className="text-2xl font-bold text-green-600">{data.mesa.capacidad}</div>
                            <div className="text-xs text-gray-500">Capacidad</div>
                          </div>
                          <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                            <div className="text-2xl font-bold text-purple-600">
                              {formatCurrency(data.mesa.total_acumulado)}
                            </div>
                            <div className="text-xs text-gray-500">Total Acumulado</div>
                          </div>
                          <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                            <Badge className={getEstadoColor(data.mesa.estado)}>
                              {data.mesa.estado}
                            </Badge>
                            <div className="text-xs text-gray-500 mt-1">Estado</div>
                          </div>
                        </div>
                      ) : type === 'grupo' && data.grupo ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                            <div className="text-2xl font-bold text-blue-600">{data.grupo.id_grupo_mesa}</div>
                            <div className="text-xs text-gray-500">ID Grupo</div>
                          </div>
                          <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                            <div className="text-2xl font-bold text-green-600">{data.grupo.mesas?.length || 0}</div>
                            <div className="text-xs text-gray-500">Mesas</div>
                          </div>
                          <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                            <div className="text-2xl font-bold text-purple-600">{data.grupo.cantidad_productos}</div>
                            <div className="text-xs text-gray-500">Productos</div>
                          </div>
                          <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                            <div className="text-2xl font-bold text-orange-600">
                              {formatCurrency(data.grupo.total_acumulado)}
                            </div>
                            <div className="text-xs text-gray-500">Total</div>
                          </div>
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>

                  {/* Resumen financiero */}
                  <Card className="bg-gradient-to-r from-white to-green-50/30 border-green-200 shadow-lg">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center space-x-2 text-green-900">
                        <DollarSign className="h-5 w-5" />
                        <span>Resumen Financiero</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                          <span className="text-gray-600">Subtotal:</span>
                          <span className="font-semibold text-gray-900">{formatCurrency(data.subtotal)}</span>
                        </div>
                        {data.descuentos && data.descuentos > 0 && (
                          <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                            <span className="text-gray-600">Descuentos:</span>
                            <span className="font-semibold text-red-600">-{formatCurrency(data.descuentos)}</span>
                          </div>
                        )}
                        {data.impuestos && data.impuestos > 0 && (
                          <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                            <span className="text-gray-600">Impuestos:</span>
                            <span className="font-semibold text-blue-600">+{formatCurrency(data.impuestos)}</span>
                          </div>
                        )}
                        <Separator />
                        <div className="flex justify-between items-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                          <span className="text-lg font-bold text-green-900">Total:</span>
                          <span className="text-2xl font-bold text-green-600">{formatCurrency(data.total)}</span>
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
                            // Agrupar productos por nombre Y modificadores (NUEVO: distingue por modificadores)
                            const productosAgrupados = data.detalles.reduce((acc: any, producto: any) => {
                              // Crear key única que incluya modificadores
                              const modificadores = Array.isArray(producto.modificadores) ? producto.modificadores : [];
                              const modificadoresKey = modificadores
                                .map((m: Modificador) => `${m.id_modificador}:${m.cantidad || 1}`)
                                .sort()
                                .join(',') || 'sin-mods';
                              
                              const key = `${producto.id_producto || producto.producto_nombre}__${modificadoresKey}`;
                              
                              if (!acc[key]) {
                                acc[key] = {
                                  ...producto,
                                  cantidad_total: 0,
                                  subtotal_total: 0,
                                  observaciones_combinadas: [],
                                  fechas_agregado: [],
                                  modificadores: modificadores // Incluir modificadores
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
                                className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden professional-prefactura-product"
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
                                    <div className="flex-1">
                                      <h4 className="font-semibold text-gray-900">{producto.producto_nombre}</h4>
                                      
                                      {/* NUEVO: Mostrar modificadores */}
                                      {producto.modificadores && producto.modificadores.length > 0 && (
                                        <div className="mt-1 space-y-0.5">
                                          {producto.modificadores.map((mod: Modificador) => (
                                            <div key={mod.id_modificador} className="text-xs text-green-600 flex items-center gap-1">
                                              <span>+ {mod.nombre_modificador}</span>
                                              {mod.cantidad > 1 && <span>(×{mod.cantidad})</span>}
                                              <span className="text-gray-500">
                                                {formatCurrency(mod.subtotal)}
                                              </span>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                      
                                      <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                                        <span className="font-medium text-blue-600">
                                          Cantidad: {producto.cantidad_total}
                                        </span>
                                        <span>Precio base: {formatCurrency(producto.producto_precio || producto.precio_unitario)}</span>
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
                              <div className="text-xs text-gray-500">Guardar en dispositivo</div>
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

                  {/* Información adicional */}
                  <Card className="bg-gradient-to-r from-white to-gray-50/30 border-gray-200 shadow-lg">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center space-x-2 text-gray-900">
                        <Info className="h-5 w-5" />
                        <span>Información Adicional</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <FileText className="h-4 w-4 text-blue-500" />
                            <span className="text-sm font-medium">Número de Prefactura:</span>
                          </div>
                          <p className="text-sm text-gray-600 ml-6">{data.numero_prefactura}</p>
                          
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-green-500" />
                            <span className="text-sm font-medium">Fecha de Generación:</span>
                          </div>
                          <p className="text-sm text-gray-600 ml-6">{formatDate(data.fecha_generacion)}</p>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <TrendingUp className="h-4 w-4 text-purple-500" />
                            <span className="text-sm font-medium">Estado:</span>
                          </div>
                          <Badge className="bg-green-100 text-green-800 border-green-300 ml-6">
                            {type === 'individual' ? data.mesa?.estado : 'Activo'}
                          </Badge>
                          
                          {type === 'individual' && data.mesa?.hora_apertura && (
                            <>
                              <div className="flex items-center space-x-2">
                                <Clock className="h-4 w-4 text-orange-500" />
                                <span className="text-sm font-medium">Hora de Apertura:</span>
                              </div>
                              <p className="text-sm text-gray-600 ml-6">
                                {new Date(data.mesa.hora_apertura).toLocaleTimeString('es-BO')}
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
