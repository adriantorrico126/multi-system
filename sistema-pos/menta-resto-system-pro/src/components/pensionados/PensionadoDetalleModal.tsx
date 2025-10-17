import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { toast } from 'sonner';
import {
  X,
  Edit,
  Calendar,
  Clock,
  DollarSign,
  TrendingUp,
  FileText,
  User,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  RefreshCw
} from 'lucide-react';
import {
  obtenerEstadisticasPensionado,
  obtenerConsumos,
  obtenerPrefacturas,
  formatearFecha,
  formatearMoneda,
  calcularDiasRestantes,
  obtenerColorEstado
} from '../../services/pensionadosApi';
import type {
  Pensionado,
  EstadisticasPensionado,
  ConsumoPensionado,
  PrefacturaPensionado
} from '../../types/pensionados';

interface PensionadoDetalleModalProps {
  isOpen: boolean;
  onClose: () => void;
  pensionado: Pensionado;
  onEditar: () => void;
  onActualizar: () => void;
}

export const PensionadoDetalleModal: React.FC<PensionadoDetalleModalProps> = ({
  isOpen,
  onClose,
  pensionado,
  onEditar,
  onActualizar
}) => {
  const [loading, setLoading] = useState(false);
  const [estadisticas, setEstadisticas] = useState<EstadisticasPensionado | null>(null);
  const [consumos, setConsumos] = useState<ConsumoPensionado[]>([]);
  const [prefacturas, setPrefacturas] = useState<PrefacturaPensionado[]>([]);

  useEffect(() => {
    if (isOpen) {
      cargarDatos();
    }
  }, [isOpen, pensionado.id_pensionado]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      
      const [estadisticasRes, consumosRes, prefacturasRes] = await Promise.all([
        obtenerEstadisticasPensionado(pensionado.id_pensionado),
        obtenerConsumos(pensionado.id_pensionado),
        obtenerPrefacturas(pensionado.id_pensionado)
      ]);

      if (estadisticasRes.success && estadisticasRes.data) {
        setEstadisticas(estadisticasRes.data);
      }

      if (consumosRes.success && consumosRes.data) {
        setConsumos(consumosRes.data);
      }

      if (prefacturasRes.success && prefacturasRes.data) {
        setPrefacturas(prefacturasRes.data);
      }
    } catch (error: any) {
      console.error('Error al cargar datos:', error);
      toast.error(error.message || 'Error al cargar datos del pensionado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl">{pensionado.nombre_cliente}</DialogTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge className={obtenerColorEstado(pensionado.estado)}>
                  {pensionado.estado}
                </Badge>
                <Badge variant="outline">{pensionado.tipo_cliente}</Badge>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={onEditar}>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          </div>
        </DialogHeader>

        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="info">Información</TabsTrigger>
            <TabsTrigger value="estadisticas">Estadísticas</TabsTrigger>
            <TabsTrigger value="consumos">Consumos</TabsTrigger>
            <TabsTrigger value="prefacturas">Prefacturas</TabsTrigger>
          </TabsList>

          {/* Tab: Información */}
          <TabsContent value="info" className="space-y-4">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Datos del Cliente</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pensionado.documento_identidad && (
                    <div className="flex items-center text-sm">
                      <CreditCard className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="text-gray-600">{pensionado.documento_identidad}</span>
                    </div>
                  )}

                  {pensionado.telefono && (
                    <div className="flex items-center text-sm">
                      <Phone className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="text-gray-600">{pensionado.telefono}</span>
                    </div>
                  )}

                  {pensionado.email && (
                    <div className="flex items-center text-sm">
                      <Mail className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="text-gray-600">{pensionado.email}</span>
                    </div>
                  )}

                  {pensionado.direccion && (
                    <div className="flex items-center text-sm">
                      <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="text-gray-600">{pensionado.direccion}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Contrato</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Fecha de Inicio</p>
                    <p className="font-medium">{formatearFecha(pensionado.fecha_inicio)}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Fecha de Fin</p>
                    <p className="font-medium">{formatearFecha(pensionado.fecha_fin)}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Días Restantes</p>
                    <p className="font-medium">{calcularDiasRestantes(pensionado.fecha_fin)} días</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Días Consumidos</p>
                    <p className="font-medium">{pensionado.dias_consumo}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Máx. Platos por Día</p>
                    <p className="font-medium">{pensionado.max_platos_dia}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Descuento Aplicado</p>
                    <p className="font-medium">{pensionado.descuento_aplicado}%</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-2">Servicios Incluidos</p>
                  <div className="flex flex-wrap gap-2">
                    {pensionado.incluye_desayuno && (
                      <Badge variant="outline">Desayuno</Badge>
                    )}
                    {pensionado.incluye_almuerzo && (
                      <Badge variant="outline">Almuerzo</Badge>
                    )}
                    {pensionado.incluye_cena && (
                      <Badge variant="outline">Cena</Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Información Financiera</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Monto Acumulado</p>
                    <p className="text-xl font-bold text-blue-600">
                      {formatearMoneda(pensionado.monto_acumulado)}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Total Consumido</p>
                    <p className="text-xl font-bold text-green-600">
                      {formatearMoneda(pensionado.total_consumido)}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500">Saldo Pendiente</p>
                    <p className="text-xl font-bold text-orange-600">
                      {formatearMoneda(pensionado.saldo_pendiente)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Estadísticas */}
          <TabsContent value="estadisticas">
            <Card>
              <CardContent className="pt-6">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
                  </div>
                ) : estadisticas ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Días Activos</p>
                        <p className="text-3xl font-bold text-blue-600">{estadisticas.dias_activos}</p>
                      </div>

                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">% de Uso</p>
                        <p className="text-3xl font-bold text-green-600">
                          {estadisticas?.porcentaje_uso?.toFixed(1) || '0'}%
                        </p>
                      </div>

                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Promedio/Día</p>
                        <p className="text-3xl font-bold text-purple-600">
                          {formatearMoneda(estadisticas?.promedio_consumo_dia || 0)}
                        </p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3">Consumos por Tipo de Comida</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                          <span>Desayuno</span>
                          <Badge>{estadisticas?.consumos_por_tipo?.desayuno || 0}</Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                          <span>Almuerzo</span>
                          <Badge>{estadisticas?.consumos_por_tipo?.almuerzo || 0}</Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                          <span>Cena</span>
                          <Badge>{estadisticas?.consumos_por_tipo?.cena || 0}</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-12">No hay estadísticas disponibles</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Consumos */}
          <TabsContent value="consumos">
            <Card>
              <CardContent className="pt-6">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
                  </div>
                ) : consumos.length > 0 ? (
                  <div className="space-y-3">
                    {consumos.slice(0, 10).map((consumo) => (
                      <div key={consumo.id_consumo} className="p-4 border rounded-lg hover:bg-gray-50">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{consumo.tipo_comida}</Badge>
                            <span className="text-sm text-gray-600">
                              {formatearFecha(consumo.fecha_consumo)}
                            </span>
                          </div>
                          <span className="font-semibold">{formatearMoneda(consumo.total_consumido)}</span>
                        </div>
                        {consumo.observaciones && (
                          <p className="text-sm text-gray-500">{consumo.observaciones}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-12">No hay consumos registrados</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Prefacturas */}
          <TabsContent value="prefacturas">
            <Card>
              <CardContent className="pt-6">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
                  </div>
                ) : prefacturas.length > 0 ? (
                  <div className="space-y-3">
                    {prefacturas.map((prefactura) => (
                      <div key={prefactura.id_prefactura_pensionado} className="p-4 border rounded-lg hover:bg-gray-50">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="font-medium">Prefactura #{prefactura.id_prefactura_pensionado}</p>
                            <p className="text-sm text-gray-600">
                              {formatearFecha(prefactura.fecha_inicio_periodo)} - {formatearFecha(prefactura.fecha_fin_periodo)}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge className={obtenerColorEstado(prefactura.estado)}>
                              {prefactura.estado}
                            </Badge>
                            <p className="text-lg font-semibold mt-1">
                              {formatearMoneda(prefactura.total_final)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-12">No hay prefacturas generadas</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

