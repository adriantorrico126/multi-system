import React, { useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { format, differenceInCalendarDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { getArqueoData, getArqueoActualPOS } from '../services/api';
import { egresosApi } from '../services/egresosApi';
import { 
  Eye, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  CreditCard,
  BarChart3
} from 'lucide-react';

interface SalesSummary {
  fecha_venta: string;
  metodo_pago: string;
  total_ventas: number;
  numero_ventas: number;
}

interface DailyCashFlow {
  fecha: string;
  ingresos_efectivo: number;
  ingresos_otros: number;
  total_ingresos: number;
}

const ArqueoPage: React.FC = () => {
  const { user } = useAuth();
  const today = format(new Date(), 'yyyy-MM-dd');
  const [startDate, setStartDate] = useState<string>(today);
  const [endDate, setEndDate] = useState<string>(today);
  const [montoContado, setMontoContado] = useState<string>('');
  
  // Estados para modales de información
  const [selectedSalesSummary, setSelectedSalesSummary] = useState<SalesSummary | null>(null);
  const [isSalesInfoDialogOpen, setIsSalesInfoDialogOpen] = useState(false);
  const [selectedCashFlow, setSelectedCashFlow] = useState<DailyCashFlow | null>(null);
  const [isCashFlowInfoDialogOpen, setIsCashFlowInfoDialogOpen] = useState(false);

  const openSalesInfoDialog = (summary: SalesSummary) => {
    setSelectedSalesSummary(summary);
    setIsSalesInfoDialogOpen(true);
  };

  const openCashFlowInfoDialog = (flow: DailyCashFlow) => {
    setSelectedCashFlow(flow);
    setIsCashFlowInfoDialogOpen(true);
  };
  const rangeDays = useMemo(() => {
    try {
      return differenceInCalendarDays(new Date(endDate), new Date(startDate)) + 1;
    } catch { return 1; }
  }, [startDate, endDate]);
  const isLongRange = rangeDays > 14;
  const [showDetailSales, setShowDetailSales] = useState<boolean>(!isLongRange);
  const [showDetailFlow, setShowDetailFlow] = useState<boolean>(!isLongRange);

  const { data: arqueoData, isLoading, error, refetch } = useQuery({
    queryKey: ['arqueoData', startDate, endDate],
    queryFn: () => getArqueoData(startDate, endDate),
    enabled: !!startDate && !!endDate, // Only run if dates are set
    onSuccess: (data) => {
      if (data?.message?.includes('No se encontraron datos para su sucursal')) {
        toast.info('Información', {
          description: 'No se encontraron datos para tu sucursal, mostrando datos de todas las sucursales.'
        });
      }
    },
    onError: (err: any) => {
      let errorMessage = 'Error al cargar los datos de arqueo.';
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      toast.error('Error', { description: errorMessage });
    }
  });

  // Arqueo actual para conocer monto inicial del día
  const { data: arqueoActual } = useQuery({
    queryKey: ['arqueo-actual'],
    queryFn: () => getArqueoActualPOS(),
    staleTime: 60_000,
  });

  // Egresos del rango (pagados) para la sucursal del usuario
  const { data: egresosRango = [] } = useQuery({
    queryKey: ['egresos-arqueo', startDate, endDate, user?.sucursal?.id],
    queryFn: async () => {
      const filtros: any = {
        fecha_inicio: startDate,
        fecha_fin: endDate,
        estado: 'pagado',
        id_sucursal: user?.sucursal?.id,
      };
      const res = await egresosApi.getAll(filtros);
      return res.data || [];
    },
    enabled: !!startDate && !!endDate,
  });

  // KPIs
  const resumen = useMemo(() => {
    const ingresosEfectivo = (arqueoData?.dailyCashFlow || []).reduce((acc: number, d: any) => acc + (Number(d.ingresos_efectivo) || 0), 0);
    const egEfectivo = (egresosRango || []).filter((e: any) => (e.metodo_pago || '').toLowerCase() === 'efectivo');
    const totalEgresosEfectivo = egEfectivo.reduce((acc: number, e: any) => acc + (Number(e.monto) || 0), 0);
    const montoInicial = Number(arqueoActual?.monto_inicial || 0);
    const efectivoTeorico = montoInicial + ingresosEfectivo - totalEgresosEfectivo;
    const contado = Number((montoContado || '').replace(',', '.'));
    const diferencia = isNaN(contado) ? 0 : contado - efectivoTeorico;
    return { ingresosEfectivo, totalEgresosEfectivo, montoInicial, efectivoTeorico, contado: isNaN(contado) ? 0 : contado, diferencia };
  }, [arqueoData?.dailyCashFlow, egresosRango, arqueoActual?.monto_inicial, montoContado]);

  // Agregaciones profesionales para rangos largos
  const ventasPorMetodoAgregado = useMemo(() => {
    if (!arqueoData?.salesSummary) return [] as any[];
    const map: Record<string, { metodo_pago: string; total_ventas: number; numero_ventas: number }>= {};
    for (const r of arqueoData.salesSummary as any[]) {
      const key = r.metodo_pago || 'Desconocido';
      if (!map[key]) map[key] = { metodo_pago: key, total_ventas: 0, numero_ventas: 0 };
      map[key].total_ventas += Number(r.total_ventas) || 0;
      map[key].numero_ventas += Number(r.numero_ventas) || 0;
    }
    return Object.values(map).sort((a,b)=> b.total_ventas - a.total_ventas);
  }, [arqueoData?.salesSummary]);

  const flujoMensualAgregado = useMemo(() => {
    if (!arqueoData?.dailyCashFlow) return [] as any[];
    const map: Record<string, { periodo: string; ingresos_efectivo: number; ingresos_otros: number; total_ingresos: number }>= {};
    for (const d of arqueoData.dailyCashFlow as any[]) {
      const monthKey = new Date(d.fecha).toISOString().slice(0,7); // YYYY-MM
      if (!map[monthKey]) map[monthKey] = { periodo: monthKey, ingresos_efectivo: 0, ingresos_otros: 0, total_ingresos: 0 };
      map[monthKey].ingresos_efectivo += Number(d.ingresos_efectivo)||0;
      map[monthKey].ingresos_otros += Number(d.ingresos_otros)||0;
      map[monthKey].total_ingresos += Number(d.total_ingresos)||0;
    }
    return Object.values(map).sort((a,b)=> a.periodo.localeCompare(b.periodo));
  }, [arqueoData?.dailyCashFlow]);

  const handleFetchClick = () => {
    if (!startDate || !endDate) {
      toast.error('Error', { description: 'Por favor, selecciona una fecha de inicio y fin.' });
      return;
    }
    refetch();
  };

  if (user?.rol !== 'admin') {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="w-[400px]">
          <CardHeader>
            <CardTitle>Acceso Denegado</CardTitle>
          </CardHeader>
          <CardContent>
            <p>No tienes permisos para acceder a esta página.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6">
      <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-4 sm:mb-6">Arqueo de Caja Avanzado</h1>

      <Card className="mb-4 sm:mb-6">
        <CardHeader className="p-3 sm:p-6">
          <CardTitle className="text-lg sm:text-xl">Seleccionar Rango de Fechas</CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="flex-1"
            />
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleFetchClick} disabled={isLoading} className="w-full sm:w-auto">
              {isLoading ? 'Cargando...' : 'Generar Arqueo'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* KPIs Profesionales */}
      <Card className="mb-4 sm:mb-6">
        <CardHeader className="p-3 sm:p-6">
          <CardTitle className="text-lg sm:text-xl">Resumen Financiero</CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
            <div className="p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs sm:text-sm text-blue-700">Monto Inicial</p>
              <p className="text-base sm:text-lg font-bold text-blue-900">{resumen.montoInicial.toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}</p>
            </div>
            <div className="p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-xs sm:text-sm text-green-700">Ingresos Efectivo</p>
              <p className="text-base sm:text-lg font-bold text-green-900">{resumen.ingresosEfectivo.toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}</p>
            </div>
            <div className="p-3 sm:p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs sm:text-sm text-amber-700">Egresos Efectivo</p>
              <p className="text-base sm:text-lg font-bold text-amber-900">{resumen.totalEgresosEfectivo.toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}</p>
            </div>
            <div className="p-3 sm:p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
              <p className="text-xs sm:text-sm text-indigo-700">Efectivo Teórico</p>
              <p className="text-base sm:text-lg font-bold text-indigo-900">{resumen.efectivoTeorico.toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}</p>
            </div>
            <div className="p-3 sm:p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-xs sm:text-sm text-gray-700">Monto Contado</p>
              <Input 
                placeholder="Ej. 1234.50" 
                value={montoContado} 
                onChange={(e)=> setMontoContado(e.target.value)}
                className="text-xs sm:text-sm"
              />
              <p className={`mt-2 text-xs sm:text-sm font-semibold ${resumen.diferencia === 0 ? 'text-gray-700' : (resumen.diferencia > 0 ? 'text-green-700' : 'text-red-700')}`}>
                Diferencia: {resumen.diferencia.toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && <p className="text-red-500 mb-4">{(error as any).message || 'Ocurrió un error'}</p>}

      {isLoading && (
        <div className="flex items-center justify-center p-8">
          <p>Cargando datos de arqueo...</p>
        </div>
      )}

      {!isLoading && (
        <Card className="mb-4 sm:mb-6">
          <CardHeader className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg sm:text-xl">Resumen de Ventas por Método de Pago</CardTitle>
              {isLongRange && (
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={()=> setShowDetailSales((v)=>!v)} className="hidden sm:inline-flex">
                    {showDetailSales ? 'Ver consolidado' : 'Ver detalle'}
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            {isLongRange && !showDetailSales ? (
              <>
                {/* Vista móvil: Tarjetas para consolidado */}
                <div className="lg:hidden space-y-3">
                  {ventasPorMetodoAgregado.map((row, idx) => (
                    <Card key={idx} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-gray-900 truncate">{row.metodo_pago}</h3>
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Total Ventas:</span>
                                <span className="text-sm font-medium text-green-600">
                                  {Number(row.total_ventas).toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Número de Ventas:</span>
                                <span className="text-sm font-medium text-blue-600">{row.numero_ventas}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Vista desktop: Tabla para consolidado */}
                <div className="hidden lg:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Método de Pago</TableHead>
                        <TableHead>Total Ventas</TableHead>
                        <TableHead>Número de Ventas</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ventasPorMetodoAgregado.map((row, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{row.metodo_pago}</TableCell>
                          <TableCell>{Number(row.total_ventas).toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}</TableCell>
                          <TableCell>{row.numero_ventas}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            ) : (
              <>
                {/* Vista móvil: Tarjetas para detalle */}
                <div className="lg:hidden space-y-3">
                  {arqueoData?.salesSummary?.map((summary, index) => (
                    <Card key={index} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-gray-900 truncate">{summary.metodo_pago}</h3>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => openSalesInfoDialog(summary)}
                                className="p-1 h-6 w-6 hover:bg-blue-100 text-blue-600 hover:text-blue-700"
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                <Calendar className="h-3 w-3" />
                                <span>{format(new Date(summary.fecha_venta), 'dd/MM/yyyy', { locale: es })}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Total Ventas:</span>
                                <span className="text-sm font-medium text-green-600">
                                  {Number(summary.total_ventas).toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Número de Ventas:</span>
                                <span className="text-sm font-medium text-blue-600">{summary.numero_ventas}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Vista desktop: Tabla para detalle */}
                <div className="hidden lg:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Método de Pago</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Total Ventas</TableHead>
                        <TableHead>Número de Ventas</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {arqueoData?.salesSummary?.map((summary, index) => (
                        <TableRow key={index}>
                          <TableCell>{summary.metodo_pago}</TableCell>
                          <TableCell>{format(new Date(summary.fecha_venta), 'dd/MM/yyyy', { locale: es })}</TableCell>
                          <TableCell>{Number(summary.total_ventas).toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}</TableCell>
                          <TableCell>{summary.numero_ventas}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {!isLoading && (
        <Card className="mb-4 sm:mb-6">
          <CardHeader className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg sm:text-xl">Flujo de Caja {isLongRange ? 'Mensual (consolidado)' : 'Diario'}</CardTitle>
              {isLongRange && (
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={()=> setShowDetailFlow((v)=>!v)} className="hidden sm:inline-flex">
                    {showDetailFlow ? 'Ver consolidado' : 'Ver detalle'}
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            {isLongRange && !showDetailFlow ? (
              <>
                {/* Vista móvil: Tarjetas para consolidado mensual */}
                <div className="lg:hidden space-y-3">
                  {flujoMensualAgregado.map((row, idx) => (
                    <Card key={idx} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-gray-900 truncate">{row.periodo}</h3>
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Ingresos Efectivo:</span>
                                <span className="text-sm font-medium text-green-600">
                                  {Number(row.ingresos_efectivo).toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Ingresos Otros:</span>
                                <span className="text-sm font-medium text-blue-600">
                                  {Number(row.ingresos_otros).toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Total Ingresos:</span>
                                <span className="text-sm font-medium text-indigo-600">
                                  {Number(row.total_ingresos).toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Vista desktop: Tabla para consolidado mensual */}
                <div className="hidden lg:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Periodo</TableHead>
                        <TableHead>Ingresos Efectivo</TableHead>
                        <TableHead>Ingresos Otros</TableHead>
                        <TableHead>Total Ingresos</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {flujoMensualAgregado.map((row, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{row.periodo}</TableCell>
                          <TableCell>{Number(row.ingresos_efectivo).toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}</TableCell>
                          <TableCell>{Number(row.ingresos_otros).toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}</TableCell>
                          <TableCell>{Number(row.total_ingresos).toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            ) : (
              <>
                {/* Vista móvil: Tarjetas para detalle diario */}
                <div className="lg:hidden space-y-3">
                  {arqueoData?.dailyCashFlow?.map((flow, index) => (
                    <Card key={index} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-gray-900 truncate">
                                {format(new Date(flow.fecha), 'dd/MM/yyyy', { locale: es })}
                              </h3>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => openCashFlowInfoDialog(flow)}
                                className="p-1 h-6 w-6 hover:bg-blue-100 text-blue-600 hover:text-blue-700"
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Ingresos Efectivo:</span>
                                <span className="text-sm font-medium text-green-600">
                                  {Number(flow.ingresos_efectivo).toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Ingresos Otros:</span>
                                <span className="text-sm font-medium text-blue-600">
                                  {Number(flow.ingresos_otros).toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Total Ingresos:</span>
                                <span className="text-sm font-medium text-indigo-600">
                                  {Number(flow.total_ingresos).toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Vista desktop: Tabla para detalle diario */}
                <div className="hidden lg:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Ingresos Efectivo</TableHead>
                        <TableHead>Ingresos Otros</TableHead>
                        <TableHead>Total Ingresos</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {arqueoData?.dailyCashFlow?.map((flow, index) => (
                        <TableRow key={index}>
                          <TableCell>{format(new Date(flow.fecha), 'dd/MM/yyyy', { locale: es })}</TableCell>
                          <TableCell>{Number(flow.ingresos_efectivo).toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}</TableCell>
                          <TableCell>{Number(flow.ingresos_otros).toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}</TableCell>
                          <TableCell>{Number(flow.total_ingresos).toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {!isLoading && !error && (!arqueoData || (arqueoData.salesSummary.length === 0 && arqueoData.dailyCashFlow.length === 0)) && (
        <Card>
          <CardHeader>
            <CardTitle>Sin Datos</CardTitle>
          </CardHeader>
          <CardContent>
            <p>No se encontraron datos de arqueo para el rango de fechas seleccionado.</p>
          </CardContent>
        </Card>
      )}

      {/* Modal de información para ventas por método de pago */}
      <Dialog open={isSalesInfoDialogOpen} onOpenChange={setIsSalesInfoDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Detalles de Ventas por Método de Pago
            </DialogTitle>
          </DialogHeader>
          
          {selectedSalesSummary && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-gray-500">Método de Pago</Label>
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-blue-400" />
                    <span className="font-medium">{selectedSalesSummary.metodo_pago}</span>
                  </div>
                </div>
                <div>
                  <Label className="text-gray-500">Fecha</Label>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">{format(new Date(selectedSalesSummary.fecha_venta), 'dd/MM/yyyy', { locale: es })}</span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-gray-500">Total Ventas</Label>
                  <p className="text-lg font-bold text-green-600">
                    {Number(selectedSalesSummary.total_ventas).toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-500">Número de Ventas</Label>
                  <p className="text-lg font-bold text-blue-600">{selectedSalesSummary.numero_ventas}</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setIsSalesInfoDialogOpen(false)}
              className="w-full sm:w-auto"
            >
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de información para flujo de caja */}
      <Dialog open={isCashFlowInfoDialogOpen} onOpenChange={setIsCashFlowInfoDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Detalles del Flujo de Caja
            </DialogTitle>
          </DialogHeader>
          
          {selectedCashFlow && (
            <div className="space-y-4">
              <div>
                <Label className="text-gray-500">Fecha</Label>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="font-medium">{format(new Date(selectedCashFlow.fecha), 'dd/MM/yyyy', { locale: es })}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-4 text-sm">
                <div>
                  <Label className="text-gray-500">Ingresos Efectivo</Label>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-400" />
                    <span className="text-lg font-bold text-green-600">
                      {Number(selectedCashFlow.ingresos_efectivo).toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}
                    </span>
                  </div>
                </div>
                
                <div>
                  <Label className="text-gray-500">Ingresos Otros</Label>
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-blue-400" />
                    <span className="text-lg font-bold text-blue-600">
                      {Number(selectedCashFlow.ingresos_otros).toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}
                    </span>
                  </div>
                </div>
                
                <div>
                  <Label className="text-gray-500">Total Ingresos</Label>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-indigo-400" />
                    <span className="text-lg font-bold text-indigo-600">
                      {Number(selectedCashFlow.total_ingresos).toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setIsCashFlowInfoDialogOpen(false)}
              className="w-full sm:w-auto"
            >
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ArqueoPage;
