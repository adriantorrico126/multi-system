import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { getArqueoData } from '../services/api';

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

      {error && <p className="text-red-500 mb-4">{(error as any).message || 'Ocurrió un error'}</p>}

      {isLoading && (
        <div className="flex items-center justify-center p-8">
          <p>Cargando datos de arqueo...</p>
        </div>
      )}

      {!isLoading && arqueoData?.salesSummary?.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Resumen de Ventas por Método de Pago</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Método de Pago</TableHead>
                  <TableHead>Total Ventas</TableHead>
                  <TableHead>Número de Ventas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {arqueoData.salesSummary.map((summary, index) => (
                  <TableRow key={index}>
                    <TableCell>{format(new Date(summary.fecha_venta), 'dd/MM/yyyy', { locale: es })}</TableCell>
                    <TableCell>{summary.metodo_pago}</TableCell>
                    <TableCell>${Number(summary.total_ventas).toFixed(2)}</TableCell>
                    <TableCell>{summary.numero_ventas}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {!isLoading && arqueoData?.dailyCashFlow?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Flujo de Caja Diario</CardTitle>
          </CardHeader>
          <CardContent>
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
                {arqueoData.dailyCashFlow.map((flow, index) => (
                  <TableRow key={index}>
                    <TableCell>{format(new Date(flow.fecha), 'dd/MM/yyyy', { locale: es })}</TableCell>
                    <TableCell>${Number(flow.ingresos_efectivo).toFixed(2)}</TableCell>
                    <TableCell>${Number(flow.ingresos_otros).toFixed(2)}</TableCell>
                    <TableCell>${Number(flow.total_ingresos).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
