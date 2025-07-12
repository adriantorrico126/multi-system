import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
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
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [salesSummary, setSalesSummary] = useState<SalesSummary[]>([]);
  const [dailyCashFlow, setDailyCashFlow] = useState<DailyCashFlow[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Set default dates to today
    const today = format(new Date(), 'yyyy-MM-dd');
    setStartDate(today);
    setEndDate(today);
    
    // Auto-load data for today
    if (user?.rol === 'admin') {
      setTimeout(() => {
        fetchArqueoData();
      }, 100);
    }
  }, [user]);

  const fetchArqueoData = async () => {
    if (!startDate || !endDate) {
      toast.error('Error', { description: 'Por favor, selecciona una fecha de inicio y fin.' });
      return;
    }

    setLoading(true);
    setError(null);
    try {
      console.log('Fetching arqueo data with:', { startDate, endDate });
      
      const responseData = await getArqueoData(startDate, endDate);
      
      console.log('Arqueo response:', responseData);
      
      // Validar que la respuesta tenga la estructura esperada
      if (responseData) {
        setSalesSummary(responseData.salesSummary || []);
        setDailyCashFlow(responseData.dailyCashFlow || []);
        
        // Mostrar mensaje si se usaron datos de todas las sucursales
        if (responseData.message && responseData.message.includes('No se encontraron datos para su sucursal')) {
          toast.info('Información', { 
            description: 'No se encontraron datos para tu sucursal, mostrando datos de todas las sucursales.' 
          });
        }
      } else {
        console.error('Invalid response structure:', responseData);
        setError('Estructura de respuesta inválida del servidor.');
        setSalesSummary([]);
        setDailyCashFlow([]);
      }
    } catch (err: any) {
      console.error('Error fetching arqueo data:', err);
      
      let errorMessage = 'Error al cargar los datos de arqueo.';
      if (err.response) {
        console.error('Error response:', err.response.data);
        if (err.response.status === 401) {
          errorMessage = 'No tienes permisos para acceder a esta función.';
        } else if (err.response.status === 400) {
          errorMessage = 'Fechas inválidas. Verifica el formato de las fechas.';
        } else if (err.response.data && err.response.data.message) {
          errorMessage = err.response.data.message;
        }
      }
      
      setError(errorMessage);
      toast.error('Error', { description: errorMessage });
      setSalesSummary([]);
      setDailyCashFlow([]);
    } finally {
      setLoading(false);
    }
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
          <Button onClick={fetchArqueoData} disabled={loading} className="md:w-auto">
            {loading ? 'Cargando...' : 'Generar Arqueo'}
          </Button>
        </CardContent>
      </Card>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      {loading && (
        <div className="flex items-center justify-center p-8">
          <p>Cargando datos de arqueo...</p>
        </div>
      )}

      {!loading && salesSummary.length > 0 && (
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
                {salesSummary.map((summary, index) => (
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

      {!loading && dailyCashFlow.length > 0 && (
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
                {dailyCashFlow.map((flow, index) => (
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

      {!loading && salesSummary.length === 0 && dailyCashFlow.length === 0 && !error && (
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
