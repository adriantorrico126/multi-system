import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { getVentasOrdenadas, getArqueoActualPOS } from '@/services/api';
import { egresosApi, type Egreso } from '@/services/egresosApi';

type MetodoPago = 'efectivo' | 'tarjeta_debito' | 'tarjeta_credito' | 'transferencia' | 'cheque' | 'otros' | string;

const metodoLabels: Record<string, string> = {
  efectivo: 'Efectivo',
  tarjeta_debito: 'Tarjeta Débito',
  tarjeta_credito: 'Tarjeta Crédito',
  transferencia: 'Transferencia',
  cheque: 'Cheque',
  otros: 'Otros'
};

const InfoCajaPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const role = user?.rol || '';

  useEffect(() => {
    if (role !== 'cajero') {
      toast.error('Acceso limitado a cajeros');
      navigate('/');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  const [loading, setLoading] = useState(false);
  const [ventas, setVentas] = useState<any[]>([]);
  const [arqueo, setArqueo] = useState<any | null>(null);
  const [egresosHoy, setEgresosHoy] = useState<Egreso[]>([]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [vts, arq] = await Promise.all([
          getVentasOrdenadas(500),
          getArqueoActualPOS().catch(() => null)
        ]);
        // Filtrar ventas de hoy por fecha local (no UTC)
        const now = new Date();
        const hoyISO = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
        const delDia = (vts || []).filter((v: any) => {
          const f = (v.timestamp instanceof Date ? v.timestamp : new Date(v.timestamp));
          // Comparar por componentes locales
          return !isNaN(f.getTime()) &&
                 f.getFullYear() === now.getFullYear() &&
                 f.getMonth() === now.getMonth() &&
                 f.getDate() === now.getDate();
        });
        setVentas(delDia);
        setArqueo(arq);

        // Cargar egresos de hoy (solo efectivo) de la sucursal del usuario
        // Backend espera DATE, no timestamp
        const fechaInicio = hoyISO;
        const fechaFin = hoyISO;
        const filtros = {
          fecha_inicio: fechaInicio,
          fecha_fin: fechaFin,
          estado: 'pagado',
          id_sucursal: (user as any)?.sucursal?.id || (user as any)?.id_sucursal,
        } as any;
        const eg = await egresosApi.getAll(filtros);
        const egEfectivo = (eg.data || []).filter((e: Egreso) => (e.metodo_pago || '').toLowerCase() === 'efectivo');
        setEgresosHoy(egEfectivo);
      } catch (e) {
        toast.error('No se pudo cargar la información de caja');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const resumen = useMemo(() => {
    const totalesPorMetodo: Record<string, { monto: number; cantidad: number }> = {};
    let totalDia = 0;
    for (const v of ventas) {
      const metodo: MetodoPago = (v.paymentMethod || '').toLowerCase();
      const key = metodo || 'otros';
      const monto = Number(v.total) || 0;
      totalDia += monto;
      if (!totalesPorMetodo[key]) totalesPorMetodo[key] = { monto: 0, cantidad: 0 };
      totalesPorMetodo[key].monto += monto;
      totalesPorMetodo[key].cantidad += 1;
    }
    const totalEfectivo = (totalesPorMetodo['efectivo']?.monto || 0);
    const totalEgresosEfectivo = egresosHoy.reduce((acc, e) => acc + (Number(e.monto) || 0), 0);
    return { totalesPorMetodo, totalDia, totalEfectivo, totalEgresosEfectivo };
  }, [ventas, egresosHoy]);

  const porcentaje = (parte: number, total: number) => {
    if (total <= 0) return '0%';
    return `${Math.round((parte * 100) / total)}%`;
  };

  const montoInicial = Number(arqueo?.monto_inicial || 0);
  const efectivoEsperado = montoInicial + resumen.totalEfectivo - resumen.totalEgresosEfectivo;

  return (
    <div className="p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Información de Caja - Hoy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg bg-white">
                <div className="text-sm text-gray-600">Total del día</div>
                <div className="text-2xl font-bold">{resumen.totalDia.toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}</div>
                <div className="text-xs text-gray-500">Ventas registradas</div>
              </div>
              <div className="p-4 border rounded-lg bg-white">
                <div className="text-sm text-gray-600">Efectivo del día</div>
                <div className="text-2xl font-bold">{resumen.totalEfectivo.toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}</div>
                <div className="text-xs text-gray-500">Suma por método: efectivo</div>
              </div>
              <div className="p-4 border rounded-lg bg-white">
                <div className="text-sm text-gray-600">Ventas (cantidad)</div>
                <div className="text-2xl font-bold">{ventas.length}</div>
                <div className="text-xs text-gray-500">Operaciones totales</div>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg bg-white">
                <div className="font-semibold mb-2">Métodos de Pago (por día)</div>
                <div className="space-y-2">
                  {Object.entries(resumen.totalesPorMetodo).sort((a, b) => b[1].monto - a[1].monto).map(([m, info]) => (
                    <div key={m} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{metodoLabels[m] || m}</Badge>
                        <span className="text-gray-600">{info.cantidad} ops</span>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{info.monto.toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}</div>
                        <div className="text-xs text-gray-500">{porcentaje(info.monto, resumen.totalDia)}</div>
                      </div>
                    </div>
                  ))}
                  {Object.keys(resumen.totalesPorMetodo).length === 0 && (
                    <div className="text-sm text-gray-500">Sin ventas registradas hoy.</div>
                  )}
                </div>
              </div>

              <div className="p-4 border rounded-lg bg-white">
                <div className="font-semibold mb-2">Arqueo y Efectivo</div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Monto inicial (arqueo)</span>
                    <span className="font-medium">{montoInicial.toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Efectivo del día</span>
                    <span className="font-medium">{resumen.totalEfectivo.toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Egresos en efectivo (hoy)</span>
                    <span className="font-medium">{resumen.totalEgresosEfectivo.toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Efectivo esperado (neto)</span>
                    <span className="font-bold">{efectivoEsperado.toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}</span>
                  </div>
                  <div className="text-xs text-gray-500">Nota: neto = inicial + efectivo ventas - egresos efectivo</div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="outline" onClick={() => navigate(-1)} disabled={loading}>Volver</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InfoCajaPage;


