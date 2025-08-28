import React, { useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { format, differenceInCalendarDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { getArqueoData, getArqueoActualPOS } from '../services/api';
import { egresosApi } from '../services/egresosApi';

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
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Arqueo de Caja Avanzado</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Seleccionar Rango de Fechas</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-4">
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
          <Button onClick={handleFetchClick} disabled={isLoading} className="md:w-auto">
            {isLoading ? 'Cargando...' : 'Generar Arqueo'}
          </Button>
        </CardContent>
      </Card>

      {/* KPIs Profesionales */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Resumen Financiero</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-700">Monto Inicial</p>
              <p className="text-lg font-bold text-blue-900">{resumen.montoInicial.toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}</p>
            </div>
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-xs text-green-700">Ingresos Efectivo</p>
              <p className="text-lg font-bold text-green-900">{resumen.ingresosEfectivo.toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}</p>
            </div>
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs text-amber-700">Egresos Efectivo</p>
              <p className="text-lg font-bold text-amber-900">{resumen.totalEgresosEfectivo.toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}</p>
            </div>
            <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
              <p className="text-xs text-indigo-700">Efectivo Teórico</p>
              <p className="text-lg font-bold text-indigo-900">{resumen.efectivoTeorico.toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}</p>
            </div>
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-xs text-gray-700">Monto Contado</p>
              <Input placeholder="Ej. 1234.50" value={montoContado} onChange={(e)=> setMontoContado(e.target.value)} />
              <p className={`mt-2 text-sm font-semibold ${resumen.diferencia === 0 ? 'text-gray-700' : (resumen.diferencia > 0 ? 'text-green-700' : 'text-red-700')}`}>
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
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Resumen de Ventas por Método de Pago</CardTitle>
              {isLongRange && (
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={()=> setShowDetailSales((v)=>!v)}>
                    {showDetailSales ? 'Ver consolidado' : 'Ver detalle'}
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLongRange && !showDetailSales ? (
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
            ) : (
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
            )}
          </CardContent>
        </Card>
      )}

      {!isLoading && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Flujo de Caja {isLongRange ? 'Mensual (consolidado)' : 'Diario'}</CardTitle>
              {isLongRange && (
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={()=> setShowDetailFlow((v)=>!v)}>
                    {showDetailFlow ? 'Ver consolidado' : 'Ver detalle'}
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLongRange && !showDetailFlow ? (
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
            ) : (
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
    </div>
  );
};

export default ArqueoPage;
