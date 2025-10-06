import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { getVentasOrdenadas, getArqueoActualPOS } from '@/services/api';
import { egresosApi, type Egreso } from '@/services/egresosApi';
import { useMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  Receipt,
  Calculator,
  AlertTriangle,
  CheckCircle,
  Clock,
  Calendar,
  Download,
  RefreshCw,
  Eye,
  PieChart,
  Activity,
  Target,
  Zap,
  Award,
  Package,
  Users,
  Building,
  FileText,
  Printer,
  Filter,
  Search,
  ChevronDown,
  ChevronUp,
  Info,
  AlertCircle
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

type MetodoPago = 'efectivo' | 'tarjeta_debito' | 'tarjeta_credito' | 'transferencia' | 'cheque' | 'otros' | string;

const metodoLabels: Record<string, string> = {
  efectivo: 'Efectivo',
  tarjeta_debito: 'Tarjeta Débito',
  tarjeta_credito: 'Tarjeta Crédito',
  transferencia: 'Transferencia',
  cheque: 'Cheque',
  otros: 'Otros'
};

const metodoColors: Record<string, string> = {
  efectivo: '#10b981',
  tarjeta_debito: '#3b82f6',
  tarjeta_credito: '#8b5cf6',
  transferencia: '#f59e0b',
  cheque: '#ef4444',
  otros: '#6b7280'
};

interface ProfessionalCashierInfoProps {
  onClose?: () => void;
}

export function ProfessionalCashierInfo({ onClose }: ProfessionalCashierInfoProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isMobile } = useMobile();
  const { toast } = useToast();

  // Estados principales
  const [loading, setLoading] = useState(false);
  const [ventas, setVentas] = useState<any[]>([]);
  const [arqueo, setArqueo] = useState<any | null>(null);
  const [egresosHoy, setEgresosHoy] = useState<Egreso[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [showReconciliationModal, setShowReconciliationModal] = useState(false);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historialReconciliaciones, setHistorialReconciliaciones] = useState<any[]>([]);

  // Estados para reconciliación
  const [efectivoFisico, setEfectivoFisico] = useState('');
  const [diferencia, setDiferencia] = useState(0);
  const [observaciones, setObservaciones] = useState('');
  const [tipoReconciliacion, setTipoReconciliacion] = useState<'efectivo' | 'completa'>('efectivo');
  const [reconciliacionCompleta, setReconciliacionCompleta] = useState<Record<string, number>>({});
  const [diferenciaCompleta, setDiferenciaCompleta] = useState<Record<string, number>>({});

  // Estados para filtros
  const [filtroFecha, setFiltroFecha] = useState('hoy');
  const [filtroMetodo, setFiltroMetodo] = useState('todos');

  // Verificar acceso
  useEffect(() => {
    if (user?.rol !== 'cajero') {
      toast({
        title: "Acceso Restringido",
        description: "Esta página es exclusiva para cajeros.",
        variant: "destructive",
      });
      navigate('/');
    }
  }, [user?.rol, navigate, toast]);

  // Cargar datos iniciales
  useEffect(() => {
    loadData();
  }, []);

  // Auto-refresco cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      loadData(false); // Carga silenciosa
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      
      const [vts, arq] = await Promise.all([
        getVentasOrdenadas(1000),
        getArqueoActualPOS().catch(() => null)
      ]);

      // Filtrar ventas del día
      const now = new Date();
      const delDia = (vts || []).filter((v: any) => {
        const f = (v.timestamp instanceof Date ? v.timestamp : new Date(v.timestamp));
        return !isNaN(f.getTime()) &&
               f.getFullYear() === now.getFullYear() &&
               f.getMonth() === now.getMonth() &&
               f.getDate() === now.getDate();
      });

      setVentas(delDia);
      setArqueo(arq);

      // Cargar egresos del día
      const hoyISO = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
      const filtros = {
        fecha_inicio: hoyISO,
        fecha_fin: hoyISO,
        estado: 'pagado',
        id_sucursal: (user as any)?.sucursal?.id || (user as any)?.id_sucursal,
      };
      const eg = await egresosApi.getAll(filtros);
      setEgresosHoy(eg.data || []);

    } catch (error) {
      console.error('Error cargando datos:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos de caja.",
        variant: "destructive",
      });
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // Cálculos y métricas
  const metrics = useMemo(() => {
    const totalesPorMetodo: Record<string, { monto: number; cantidad: number }> = {};
    let totalDia = 0;
    let ventaMaxima = 0;
    let ventaMinima = Infinity;
    const ventasPorHora: Record<number, number> = {};

    for (const v of ventas) {
      const metodo: MetodoPago = (v.paymentMethod || '').toLowerCase();
      const key = metodo || 'otros';
      const monto = Number(v.total) || 0;
      const hora = new Date(v.timestamp).getHours();

      totalDia += monto;
      ventaMaxima = Math.max(ventaMaxima, monto);
      ventaMinima = Math.min(ventaMinima, monto);

      if (!totalesPorMetodo[key]) totalesPorMetodo[key] = { monto: 0, cantidad: 0 };
      totalesPorMetodo[key].monto += monto;
      totalesPorMetodo[key].cantidad += 1;

      if (!ventasPorHora[hora]) ventasPorHora[hora] = 0;
      ventasPorHora[hora] += monto;
    }

    const totalEfectivo = totalesPorMetodo['efectivo']?.monto || 0;
    const totalEgresos = egresosHoy.reduce((acc, e) => acc + (Number(e.monto) || 0), 0);
    const totalEgresosEfectivo = egresosHoy
      .filter(e => (e.metodo_pago || '').toLowerCase() === 'efectivo')
      .reduce((acc, e) => acc + (Number(e.monto) || 0), 0);

    const montoInicial = Number(arqueo?.monto_inicial || 0);
    const efectivoEsperado = montoInicial + totalEfectivo - totalEgresosEfectivo;
    const ticketPromedio = ventas.length > 0 ? totalDia / ventas.length : 0;

    return {
      totalesPorMetodo,
      totalDia,
      totalEfectivo,
      totalEgresos,
      totalEgresosEfectivo,
      montoInicial,
      efectivoEsperado,
      ticketPromedio,
      ventaMaxima,
      ventaMinima: ventaMinima === Infinity ? 0 : ventaMinima,
      ventasPorHora,
      cantidadVentas: ventas.length,
      cantidadEgresos: egresosHoy.length
    };
  }, [ventas, egresosHoy, arqueo]);

  // Datos para gráficos
  const chartData = useMemo(() => {
    return Object.entries(metrics.totalesPorMetodo).map(([metodo, data]) => ({
      name: metodoLabels[metodo] || metodo,
      value: data.monto,
      cantidad: data.cantidad,
      color: metodoColors[metodo] || '#6b7280'
    }));
  }, [metrics.totalesPorMetodo]);

  const hourlyData = useMemo(() => {
    return Array.from({ length: 24 }, (_, hora) => ({
      hora: `${hora}:00`,
      ventas: metrics.ventasPorHora[hora] || 0
    }));
  }, [metrics.ventasPorHora]);

  // Función para calcular diferencia
  const calcularDiferencia = (fisico: string) => {
    const fisicoNum = parseFloat(fisico) || 0;
    const diferencia = fisicoNum - metrics.efectivoEsperado;
    setDiferencia(diferencia);
  };

  // Función para calcular diferencias por método de pago
  const calcularDiferenciasCompletas = () => {
    const diferencias: Record<string, number> = {};
    Object.entries(metrics.totalesPorMetodo).forEach(([metodo, data]) => {
      const registrado = reconciliacionCompleta[metodo] || 0;
      diferencias[metodo] = registrado - data.monto;
    });
    setDiferenciaCompleta(diferencias);
  };

  // Función para actualizar reconciliación completa
  const actualizarReconciliacionCompleta = (metodo: string, valor: string) => {
    const nuevoValor = parseFloat(valor) || 0;
    setReconciliacionCompleta(prev => ({
      ...prev,
      [metodo]: nuevoValor
    }));
  };

  // Efecto para calcular diferencias cuando cambia la reconciliación completa
  useEffect(() => {
    if (tipoReconciliacion === 'completa') {
      calcularDiferenciasCompletas();
    }
  }, [reconciliacionCompleta, metrics.totalesPorMetodo, tipoReconciliacion]);

  // Función para cargar historial de reconciliaciones
  const cargarHistorialReconciliaciones = () => {
    try {
      const reconciliaciones = JSON.parse(localStorage.getItem('reconciliaciones_caja') || '[]');
      // Filtrar solo las del día actual
      const hoy = new Date().toISOString().split('T')[0];
      const delDia = reconciliaciones.filter((r: any) => r.fecha === hoy);
      setHistorialReconciliaciones(delDia.reverse()); // Más recientes primero
    } catch (error) {
      console.error('❌ Error cargando historial:', error);
      setHistorialReconciliaciones([]);
    }
  };

  // Función para abrir modal de historial
  const abrirHistorial = () => {
    cargarHistorialReconciliaciones();
    setShowHistoryModal(true);
  };

  // Función para guardar reconciliación en localStorage
  const guardarReconciliacion = (datos: any) => {
    try {
      const reconciliaciones = JSON.parse(localStorage.getItem('reconciliaciones_caja') || '[]');
      const nuevaReconciliacion = {
        id: Date.now(),
        fecha: new Date().toISOString().split('T')[0],
        hora: new Date().toLocaleTimeString('es-BO'),
        usuario: user?.nombre || 'Cajero',
        id_usuario: 0, // Se puede obtener del contexto de autenticación
        id_restaurante: user?.id_restaurante || 0,
        id_sucursal: (user as any)?.sucursal?.id || (user as any)?.id_sucursal || 0,
        ...datos
      };
      
      reconciliaciones.push(nuevaReconciliacion);
      localStorage.setItem('reconciliaciones_caja', JSON.stringify(reconciliaciones));
      
      console.log('💾 Reconciliación guardada:', nuevaReconciliacion);
    } catch (error) {
      console.error('❌ Error guardando reconciliación:', error);
    }
  };

  // Función para reconciliación
  const handleReconciliation = () => {
    if (tipoReconciliacion === 'efectivo') {
      if (!efectivoFisico) {
        toast({
          title: "Error",
          description: "Debe ingresar el efectivo físico.",
          variant: "destructive",
        });
        return;
      }

      // Guardar reconciliación de efectivo
      const datosReconciliacion = {
        tipo_reconciliacion: 'efectivo',
        monto_inicial: metrics.montoInicial,
        efectivo_esperado: metrics.efectivoEsperado,
        efectivo_fisico: parseFloat(efectivoFisico),
        diferencia_efectivo: diferencia,
        observaciones: observaciones,
        estado: diferencia === 0 ? 'cuadrada' : diferencia > 0 ? 'sobrante' : 'faltante'
      };

      guardarReconciliacion(datosReconciliacion);

      toast({
        title: "Reconciliación de Efectivo Registrada",
        description: `Diferencia: Bs ${diferencia.toFixed(2)} | Guardada en historial`,
      });
    } else {
      // Reconciliación completa
      const totalRegistrado = Object.values(reconciliacionCompleta).reduce((sum, val) => sum + val, 0);
      const totalEsperado = metrics.totalDia;
      const diferenciaTotal = totalRegistrado - totalEsperado;

      // Guardar reconciliación completa
      const datosReconciliacion = {
        tipo_reconciliacion: 'completa',
        total_esperado: totalEsperado,
        total_registrado: totalRegistrado,
        diferencia_total: diferenciaTotal,
        datos_por_metodo: reconciliacionCompleta,
        diferencias_por_metodo: diferenciaCompleta,
        observaciones: observaciones,
        estado: diferenciaTotal === 0 ? 'cuadrada' : diferenciaTotal > 0 ? 'sobrante' : 'faltante'
      };

      guardarReconciliacion(datosReconciliacion);

      toast({
        title: "Reconciliación Completa Registrada",
        description: `Total registrado: Bs ${totalRegistrado.toFixed(2)} | Diferencia: Bs ${diferenciaTotal.toFixed(2)} | Guardada en historial`,
      });
    }

    // Limpiar formularios
    setEfectivoFisico('');
    setObservaciones('');
    setReconciliacionCompleta({});
    setDiferenciaCompleta({});
  };

  // Componente de métrica
  const MetricCard = ({ 
    title, 
    value, 
    subtitle, 
    icon: Icon, 
    trend, 
    color = 'blue',
    onClick 
  }: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: any;
    trend?: 'up' | 'down' | 'neutral';
    color?: 'blue' | 'green' | 'orange' | 'purple' | 'red';
    onClick?: () => void;
  }) => {
    const colorClasses = {
      blue: 'from-blue-500 to-indigo-500',
      green: 'from-green-500 to-emerald-500',
      orange: 'from-orange-500 to-amber-500',
      purple: 'from-purple-500 to-pink-500',
      red: 'from-red-500 to-rose-500'
    };

    return (
      <Card 
        className={cn(
          "bg-gradient-to-br from-white to-gray-50/30 border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 cashier-metric-card cashier-touch-feedback cashier-optimized",
          onClick && "cursor-pointer hover:scale-105"
        )}
        onClick={onClick}
      >
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-600">{title}</p>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              {subtitle && (
                <p className="text-xs text-gray-500">{subtitle}</p>
              )}
              {trend && (
                <div className="flex items-center gap-1">
                  {trend === 'up' ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : trend === 'down' ? (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  ) : (
                    <Activity className="h-4 w-4 text-gray-500" />
                  )}
                </div>
              )}
            </div>
            <div className={`p-3 rounded-full bg-gradient-to-r ${colorClasses[color]}`}>
              <Icon className="h-6 w-6 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading && ventas.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span>Cargando información de caja...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 cashier-professional-system">
      {/* Header Profesional */}
      <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 text-white p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="p-2 sm:p-3 bg-white/20 rounded-full backdrop-blur-sm">
              <Calculator className="h-5 w-5 sm:h-7 sm:w-7 text-white" />
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl font-bold drop-shadow-md">Sistema de Información para Cajeros</h1>
              <p className="text-xs sm:text-sm opacity-90 mt-1">Análisis avanzado y control de caja profesional</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => loadData()}
              disabled={loading}
              className="text-white hover:bg-white/20 transition-all duration-200 p-2"
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </Button>
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30 text-xs sm:text-sm">
              {metrics.cantidadVentas} ventas hoy
            </Badge>
          </div>
        </div>
      </div>

      {/* Tabs de Navegación */}
      <div className="px-3 sm:px-6 pt-4 sm:pt-6">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value)}>
          <TabsList className={cn(
            "grid w-full bg-white/80 backdrop-blur-sm rounded-xl p-1 shadow-lg",
            isMobile ? "grid-cols-2 h-10" : "grid-cols-4 h-12"
          )}>
            <TabsTrigger
              value="overview"
              className={cn(
                "text-xs sm:text-sm font-medium transition-all duration-200 rounded-lg px-2 sm:px-3",
                activeTab === 'overview' ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md" : "text-gray-600 hover:bg-gray-100"
              )}
            >
              <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Resumen</span>
              <span className="sm:hidden">Resumen</span>
            </TabsTrigger>
            <TabsTrigger
              value="analysis"
              className={cn(
                "text-xs sm:text-sm font-medium transition-all duration-200 rounded-lg px-2 sm:px-3",
                activeTab === 'analysis' ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md" : "text-gray-600 hover:bg-gray-100"
              )}
            >
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Análisis</span>
              <span className="sm:hidden">Análisis</span>
            </TabsTrigger>
            <TabsTrigger
              value="reconciliation"
              className={cn(
                "text-xs sm:text-sm font-medium transition-all duration-200 rounded-lg px-2 sm:px-3",
                activeTab === 'reconciliation' ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md" : "text-gray-600 hover:bg-gray-100"
              )}
            >
              <Calculator className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Reconciliación</span>
              <span className="sm:hidden">Reconciliación</span>
            </TabsTrigger>
            <TabsTrigger
              value="reports"
              className={cn(
                "text-xs sm:text-sm font-medium transition-all duration-200 rounded-lg px-2 sm:px-3",
                activeTab === 'reports' ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md" : "text-gray-600 hover:bg-gray-100"
              )}
            >
              <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Reportes</span>
              <span className="sm:hidden">Reportes</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Contenido de los Tabs */}
      <div className="p-3 sm:p-6">
        {/* Tab: Resumen */}
        {activeTab === 'overview' && (
          <div className="space-y-4 sm:space-y-6">
            {/* Métricas Principales */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              <MetricCard
                title="Total del Día"
                value={metrics.totalDia.toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}
                subtitle="Ingresos totales"
                icon={DollarSign}
                color="green"
                trend="up"
              />
              <MetricCard
                title="Efectivo Esperado"
                value={metrics.efectivoEsperado.toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}
                subtitle="En caja (calculado)"
                icon={CreditCard}
                color="blue"
                onClick={() => setShowReconciliationModal(true)}
              />
              <MetricCard
                title="Ticket Promedio"
                value={metrics.ticketPromedio.toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}
                subtitle="Por venta"
                icon={Target}
                color="purple"
              />
              <MetricCard
                title="Ventas Realizadas"
                value={metrics.cantidadVentas}
                subtitle="Operaciones del día"
                icon={Receipt}
                color="orange"
              />
            </div>

            {/* Métricas Secundarias */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              <MetricCard
                title="Efectivo del Día"
                value={metrics.totalEfectivo.toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}
                subtitle="Ventas en efectivo"
                icon={DollarSign}
                color="green"
              />
              <MetricCard
                title="Egresos Totales"
                value={metrics.totalEgresos.toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}
                subtitle={`${metrics.cantidadEgresos} operaciones`}
                icon={TrendingDown}
                color="red"
              />
              <MetricCard
                title="Venta Máxima"
                value={metrics.ventaMaxima.toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}
                subtitle="Mayor venta del día"
                icon={Award}
                color="purple"
              />
              <MetricCard
                title="Monto Inicial"
                value={metrics.montoInicial.toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}
                subtitle="Apertura de caja"
                icon={Clock}
                color="blue"
              />
            </div>

            {/* Distribución por Métodos de Pago */}
            <Card className="bg-gradient-to-br from-white to-blue-50/30 border-blue-200 shadow-lg">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center space-x-2 text-sm sm:text-base">
                  <PieChart className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                  <span>Distribución por Métodos de Pago</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Gráfico de Torta */}
                  <div className="h-64 cashier-chart-container">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="value"
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [value.toLocaleString('es-BO', { style: 'currency', currency: 'BOB' }), 'Monto']} />
                        <Legend />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Lista Detallada */}
                  <div className="space-y-3">
                    {chartData.map((item) => (
                      <div key={item.name} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100">
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                          <div>
                            <p className="font-semibold text-gray-900">{item.name}</p>
                            <p className="text-xs text-gray-500">{item.cantidad} operaciones</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">
                            {item.value.toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}
                          </p>
                          <p className="text-xs text-gray-500">
                            {((item.value / metrics.totalDia) * 100).toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tab: Análisis */}
        {activeTab === 'analysis' && (
          <div className="space-y-4 sm:space-y-6">
            {/* Gráfico de Ventas por Hora */}
            <Card className="bg-gradient-to-br from-white to-indigo-50/30 border-indigo-200 shadow-lg">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center space-x-2 text-sm sm:text-base">
                  <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600" />
                  <span>Ventas por Hora del Día</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="h-64 cashier-chart-container">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={hourlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hora" />
                      <YAxis />
                      <Tooltip formatter={(value) => [value.toLocaleString('es-BO', { style: 'currency', currency: 'BOB' }), 'Ventas']} />
                      <Bar dataKey="ventas" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Análisis de Rendimiento */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gradient-to-br from-white to-green-50/30 border-green-200 shadow-lg">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="flex items-center space-x-2 text-sm sm:text-base">
                    <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                    <span>Rendimiento del Día</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                      <span className="text-sm font-medium text-gray-700">Eficiencia de Ventas</span>
                      <span className="text-lg font-bold text-green-600">
                        {metrics.cantidadVentas > 0 ? '95%' : '0%'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                      <span className="text-sm font-medium text-gray-700">Hora Pico</span>
                      <span className="text-lg font-bold text-blue-600">
                        {Object.entries(metrics.ventasPorHora).reduce((a, b) => 
                          metrics.ventasPorHora[a[0]] > metrics.ventasPorHora[b[0]] ? a : b, ['0', 0])[0]}:00
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                      <span className="text-sm font-medium text-gray-700">Método Más Usado</span>
                      <span className="text-lg font-bold text-purple-600">
                        {Object.entries(metrics.totalesPorMetodo).reduce((a, b) => 
                          a[1].cantidad > b[1].cantidad ? a : b, ['otros', { cantidad: 0, monto: 0 }])[0]}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-white to-orange-50/30 border-orange-200 shadow-lg">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="flex items-center space-x-2 text-sm sm:text-base">
                    <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
                    <span>Alertas y Recomendaciones</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <div className="space-y-3">
                    {metrics.totalEfectivo > metrics.totalDia * 0.7 && (
                      <div className="flex items-center space-x-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm text-yellow-800">Alto uso de efectivo ({(metrics.totalEfectivo / metrics.totalDia * 100).toFixed(1)}%)</span>
                      </div>
                    )}
                    {metrics.cantidadVentas < 10 && (
                      <div className="flex items-center space-x-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                        <Info className="h-4 w-4 text-blue-600" />
                        <span className="text-sm text-blue-800">Bajo volumen de ventas hoy</span>
                      </div>
                    )}
                    {metrics.ticketPromedio > 100 && (
                      <div className="flex items-center space-x-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-green-800">Excelente ticket promedio</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Tab: Reconciliación */}
        {activeTab === 'reconciliation' && (
          <div className="space-y-4 sm:space-y-6">
            <Card className="bg-gradient-to-br from-white to-orange-50/30 border-orange-200 shadow-lg">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center space-x-2 text-sm sm:text-base">
                  <Calculator className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
                  <span>Reconciliación de Caja</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {/* Resumen Completo por Métodos de Pago */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900">Resumen por Métodos de Pago</h3>
                    <div className="space-y-3">
                      {Object.entries(metrics.totalesPorMetodo).map(([metodo, data]) => (
                        <div key={metodo} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                          <div className="flex items-center space-x-3">
                            <div 
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: metodoColors[metodo] || '#6b7280' }}
                            />
                            <span className="text-sm font-medium text-gray-700">
                              {metodoLabels[metodo] || metodo}
                            </span>
                            <span className="text-xs text-gray-500">({data.cantidad} ops)</span>
                          </div>
                          <span className="font-bold text-gray-900">
                            {data.monto.toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}
                          </span>
                        </div>
                      ))}
                      <Separator />
                      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-2 border-green-200">
                        <span className="text-sm font-bold text-green-700">Total del Día (Todos los Métodos)</span>
                        <span className="font-bold text-green-900 text-lg">
                          {metrics.totalDia.toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Estado Actual de la Caja (Solo Efectivo) */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900">Estado de Caja (Solo Efectivo)</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                        <span className="text-sm font-medium text-gray-700">Monto Inicial</span>
                        <span className="font-bold text-gray-900">
                          {metrics.montoInicial.toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                        <span className="text-sm font-medium text-gray-700">Efectivo del Día</span>
                        <span className="font-bold text-green-600">
                          +{metrics.totalEfectivo.toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                        <span className="text-sm font-medium text-gray-700">Egresos en Efectivo</span>
                        <span className="font-bold text-red-600">
                          -{metrics.totalEgresosEfectivo.toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200">
                        <span className="text-sm font-bold text-blue-700">Efectivo Esperado en Caja</span>
                        <span className="font-bold text-blue-900 text-lg">
                          {metrics.efectivoEsperado.toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Resumen Financiero Completo */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900">Resumen Financiero Completo</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                        <span className="text-sm font-medium text-gray-700">Total Ventas del Día</span>
                        <span className="font-bold text-green-600">
                          {metrics.totalDia.toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                        <span className="text-sm font-medium text-gray-700">Efectivo Recibido</span>
                        <span className="font-bold text-blue-600">
                          {metrics.totalEfectivo.toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                        <span className="text-sm font-medium text-gray-700">Tarjetas/Transferencias</span>
                        <span className="font-bold text-purple-600">
                          {(metrics.totalDia - metrics.totalEfectivo).toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                        <span className="text-sm font-medium text-gray-700">Total Egresos</span>
                        <span className="font-bold text-red-600">
                          -{metrics.totalEgresos.toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}
                        </span>
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border-2 border-indigo-200">
                        <span className="text-sm font-bold text-indigo-700">Ingreso Neto del Día</span>
                        <span className="font-bold text-indigo-900 text-lg">
                          {(metrics.totalDia - metrics.totalEgresos).toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 p-2 bg-gray-50 rounded">
                        💡 <strong>Nota:</strong> El ingreso neto incluye todos los métodos de pago menos los egresos totales.
                      </div>
                    </div>
                  </div>

                  {/* Reconciliación */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900">Realizar Reconciliación</h3>
                    
                    {/* Selector de Tipo de Reconciliación */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Tipo de Reconciliación</Label>
                      <Select value={tipoReconciliacion} onValueChange={(value: 'efectivo' | 'completa') => setTipoReconciliacion(value)}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="efectivo">Solo Efectivo Físico</SelectItem>
                          <SelectItem value="completa">Todos los Métodos de Pago</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Reconciliación Solo Efectivo */}
                    {tipoReconciliacion === 'efectivo' && (
                      <div className="space-y-4">
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                          <div className="flex items-start space-x-2">
                            <Info className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                            <div className="text-xs text-amber-800">
                              <strong>Reconciliación de Efectivo:</strong> Cuenta físicamente el dinero en caja y compáralo con el efectivo esperado.
                            </div>
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="efectivo-fisico" className="text-sm font-medium">Efectivo Físico en Caja</Label>
                          <Input
                            id="efectivo-fisico"
                            type="number"
                            step="0.01"
                            value={efectivoFisico}
                            onChange={(e) => {
                              setEfectivoFisico(e.target.value);
                              calcularDiferencia(e.target.value);
                            }}
                            placeholder="0.00"
                            className="mt-1 cashier-reconciliation-input"
                          />
                        </div>
                        {efectivoFisico && (
                          <div className={`p-3 rounded-lg border ${
                            diferencia === 0 
                              ? 'cashier-difference-zero' 
                              : diferencia > 0 
                                ? 'cashier-difference-positive'
                                : 'cashier-difference-negative'
                          }`}>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">
                                {diferencia === 0 ? 'Caja Cuadrada' : diferencia > 0 ? 'Sobrante' : 'Faltante'}
                              </span>
                              <span className={`font-bold ${
                                diferencia === 0 ? 'text-green-600' : diferencia > 0 ? 'text-blue-600' : 'text-red-600'
                              }`}>
                                Bs {Math.abs(diferencia).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Reconciliación Completa */}
                    {tipoReconciliacion === 'completa' && (
                      <div className="space-y-4">
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-start space-x-2">
                            <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div className="text-xs text-blue-800">
                              <strong>Reconciliación Completa:</strong> Registra los montos reales recibidos por cada método de pago para cuadrar todos los ingresos.
                            </div>
                          </div>
                        </div>
                        <div className="space-y-3">
                          {Object.entries(metrics.totalesPorMetodo).map(([metodo, data]) => (
                            <div key={metodo} className="space-y-2">
                              <Label className="text-sm font-medium flex items-center space-x-2">
                                <div 
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: metodoColors[metodo] || '#6b7280' }}
                                />
                                <span>{metodoLabels[metodo] || metodo}</span>
                                <span className="text-xs text-gray-500">(Esperado: Bs {data.monto.toFixed(2)})</span>
                              </Label>
                              <Input
                                type="number"
                                step="0.01"
                                value={reconciliacionCompleta[metodo] || ''}
                                onChange={(e) => actualizarReconciliacionCompleta(metodo, e.target.value)}
                                placeholder="0.00"
                                className="cashier-reconciliation-input"
                              />
                              {diferenciaCompleta[metodo] !== undefined && (
                                <div className={`text-xs p-2 rounded ${
                                  diferenciaCompleta[metodo] === 0 
                                    ? 'bg-green-50 text-green-700' 
                                    : diferenciaCompleta[metodo] > 0 
                                      ? 'bg-blue-50 text-blue-700'
                                      : 'bg-red-50 text-red-700'
                                }`}>
                                  {diferenciaCompleta[metodo] === 0 ? '✅ Cuadrado' : 
                                   diferenciaCompleta[metodo] > 0 ? `📈 Sobrante: Bs ${diferenciaCompleta[metodo].toFixed(2)}` : 
                                   `📉 Faltante: Bs ${Math.abs(diferenciaCompleta[metodo]).toFixed(2)}`}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Observaciones y Botón */}
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="observaciones" className="text-sm font-medium">Observaciones</Label>
                        <Input
                          id="observaciones"
                          value={observaciones}
                          onChange={(e) => setObservaciones(e.target.value)}
                          placeholder="Notas sobre la reconciliación..."
                          className="mt-1"
                        />
                      </div>
                      <div className="space-y-3">
                        <Button 
                          onClick={handleReconciliation}
                          disabled={
                            tipoReconciliacion === 'efectivo' ? !efectivoFisico : 
                            Object.keys(reconciliacionCompleta).length === 0
                          }
                          className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white cashier-action-button cashier-reconciliation-button"
                        >
                          <Calculator className="h-4 w-4 mr-2" />
                          Registrar Reconciliación {tipoReconciliacion === 'completa' ? 'Completa' : 'de Efectivo'}
                        </Button>
                        <Button 
                          onClick={abrirHistorial}
                          variant="outline"
                          className="w-full border-orange-200 text-orange-600 hover:bg-orange-50 hover:border-orange-300"
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Ver Historial del Día
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tab: Reportes */}
        {activeTab === 'reports' && (
          <div className="space-y-4 sm:space-y-6">
            <Card className="bg-gradient-to-br from-white to-purple-50/30 border-purple-200 shadow-lg">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center space-x-2 text-sm sm:text-base">
                  <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                  <span>Reportes y Exportación</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Button
                    variant="outline"
                    onClick={() => window.print()}
                    className="h-20 flex flex-col items-center justify-center space-y-2 bg-white hover:bg-gray-50"
                  >
                    <Printer className="h-6 w-6 text-gray-600" />
                    <span className="text-sm font-medium">Imprimir Resumen</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      const data = {
                        fecha: new Date().toLocaleDateString('es-BO'),
                        totalDia: metrics.totalDia,
                        efectivoEsperado: metrics.efectivoEsperado,
                        cantidadVentas: metrics.cantidadVentas,
                        ticketPromedio: metrics.ticketPromedio
                      };
                      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `resumen-caja-${new Date().toISOString().split('T')[0]}.json`;
                      a.click();
                    }}
                    className="h-20 flex flex-col items-center justify-center space-y-2 bg-white hover:bg-gray-50"
                  >
                    <Download className="h-6 w-6 text-gray-600" />
                    <span className="text-sm font-medium">Exportar JSON</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowAnalysisModal(true)}
                    className="h-20 flex flex-col items-center justify-center space-y-2 bg-white hover:bg-gray-50"
                  >
                    <Eye className="h-6 w-6 text-gray-600" />
                    <span className="text-sm font-medium">Análisis Detallado</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Modal de Análisis Detallado */}
      <Dialog open={showAnalysisModal} onOpenChange={setShowAnalysisModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Análisis Detallado de Caja</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh]">
            <div className="space-y-6 p-4">
              {/* Información detallada */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Resumen Financiero</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span>Total Ventas:</span>
                      <span className="font-bold">{metrics.totalDia.toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Efectivo Esperado:</span>
                      <span className="font-bold">{metrics.efectivoEsperado.toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Ticket Promedio:</span>
                      <span className="font-bold">{metrics.ticketPromedio.toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}</span>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Estadísticas</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span>Ventas Realizadas:</span>
                      <span className="font-bold">{metrics.cantidadVentas}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Egresos Registrados:</span>
                      <span className="font-bold">{metrics.cantidadEgresos}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Venta Máxima:</span>
                      <span className="font-bold">{metrics.ventaMaxima.toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Modal de Historial de Reconciliaciones */}
      <Dialog open={showHistoryModal} onOpenChange={setShowHistoryModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-orange-600" />
              <span>Historial de Reconciliaciones - {new Date().toLocaleDateString('es-BO')}</span>
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh]">
            <div className="space-y-4 p-4">
              {historialReconciliaciones.length > 0 ? (
                historialReconciliaciones.map((reconciliacion, index) => (
                  <Card key={reconciliacion.id} className="bg-gradient-to-br from-white to-orange-50/30 border-orange-200">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center space-x-2">
                          <Calculator className="h-5 w-5 text-orange-600" />
                          <span>
                            {reconciliacion.tipo_reconciliacion === 'efectivo' ? 'Reconciliación de Efectivo' : 'Reconciliación Completa'}
                          </span>
                        </CardTitle>
                        <Badge 
                          variant="outline" 
                          className={`${
                            reconciliacion.estado === 'cuadrada' ? 'border-green-200 text-green-700 bg-green-50' :
                            reconciliacion.estado === 'sobrante' ? 'border-blue-200 text-blue-700 bg-blue-50' :
                            'border-red-200 text-red-700 bg-red-50'
                          }`}
                        >
                          {reconciliacion.estado === 'cuadrada' ? '✅ Cuadrada' :
                           reconciliacion.estado === 'sobrante' ? '📈 Sobrante' : '📉 Faltante'}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>🕒 {reconciliacion.hora}</span>
                        <span>👤 {reconciliacion.usuario}</span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {reconciliacion.tipo_reconciliacion === 'efectivo' ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="p-2 bg-white rounded border">
                            <div className="text-xs text-gray-500">Efectivo Esperado</div>
                            <div className="font-bold">Bs {reconciliacion.efectivo_esperado?.toFixed(2) || '0.00'}</div>
                          </div>
                          <div className="p-2 bg-white rounded border">
                            <div className="text-xs text-gray-500">Efectivo Físico</div>
                            <div className="font-bold">Bs {reconciliacion.efectivo_fisico?.toFixed(2) || '0.00'}</div>
                          </div>
                          <div className="p-2 bg-white rounded border">
                            <div className="text-xs text-gray-500">Diferencia</div>
                            <div className={`font-bold ${
                              reconciliacion.diferencia_efectivo === 0 ? 'text-green-600' :
                              reconciliacion.diferencia_efectivo > 0 ? 'text-blue-600' : 'text-red-600'
                            }`}>
                              Bs {Math.abs(reconciliacion.diferencia_efectivo || 0).toFixed(2)}
                            </div>
                          </div>
                          <div className="p-2 bg-white rounded border">
                            <div className="text-xs text-gray-500">Monto Inicial</div>
                            <div className="font-bold">Bs {reconciliacion.monto_inicial?.toFixed(2) || '0.00'}</div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            <div className="p-2 bg-white rounded border">
                              <div className="text-xs text-gray-500">Total Esperado</div>
                              <div className="font-bold">Bs {reconciliacion.total_esperado?.toFixed(2) || '0.00'}</div>
                            </div>
                            <div className="p-2 bg-white rounded border">
                              <div className="text-xs text-gray-500">Total Registrado</div>
                              <div className="font-bold">Bs {reconciliacion.total_registrado?.toFixed(2) || '0.00'}</div>
                            </div>
                            <div className="p-2 bg-white rounded border">
                              <div className="text-xs text-gray-500">Diferencia Total</div>
                              <div className={`font-bold ${
                                reconciliacion.diferencia_total === 0 ? 'text-green-600' :
                                reconciliacion.diferencia_total > 0 ? 'text-blue-600' : 'text-red-600'
                              }`}>
                                Bs {Math.abs(reconciliacion.diferencia_total || 0).toFixed(2)}
                              </div>
                            </div>
                          </div>
                          {reconciliacion.datos_por_metodo && (
                            <div className="space-y-2">
                              <div className="text-sm font-medium text-gray-700">Detalle por Métodos:</div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {Object.entries(reconciliacion.datos_por_metodo).map(([metodo, monto]: [string, any]) => (
                                  <div key={metodo} className="flex items-center justify-between p-2 bg-white rounded border text-sm">
                                    <span className="flex items-center space-x-2">
                                      <div 
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: metodoColors[metodo] || '#6b7280' }}
                                      />
                                      <span>{metodoLabels[metodo] || metodo}</span>
                                    </span>
                                    <span className="font-bold">Bs {monto?.toFixed(2) || '0.00'}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      {reconciliacion.observaciones && (
                        <div className="p-3 bg-gray-50 rounded border">
                          <div className="text-sm font-medium text-gray-700 mb-1">Observaciones:</div>
                          <div className="text-sm text-gray-600">{reconciliacion.observaciones}</div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500 font-medium">No hay reconciliaciones registradas hoy</p>
                  <p className="text-gray-400 text-sm">Las reconciliaciones aparecerán aquí después de registrarlas</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
