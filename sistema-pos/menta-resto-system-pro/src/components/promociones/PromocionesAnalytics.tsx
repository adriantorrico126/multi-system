import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  LineChart, 
  Line, 
  AreaChart, 
  Area 
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  ShoppingCart, 
  DollarSign, 
  Percent, 
  Calendar, 
  Clock, 
  Target, 
  Award, 
  AlertCircle, 
  CheckCircle, 
  Eye, 
  Download, 
  Filter,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Zap,
  Crown,
  Star,
  MapPin
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface PromocionesAnalyticsProps {
  promociones: any[];
  ventas: any[];
  isLoading?: boolean;
}

export const PromocionesAnalytics: React.FC<PromocionesAnalyticsProps> = ({
  promociones,
  ventas,
  isLoading = false
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedPromocion, setSelectedPromocion] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [filtroFecha, setFiltroFecha] = useState('30');
  const [filtroSucursal, setFiltroSucursal] = useState('todas');
  const [filtroEstado, setFiltroEstado] = useState('todas');

  // Filtrar promociones según filtros
  const promocionesFiltradas = useMemo(() => {
    let filtradas = promociones;

    // Filtro por fecha
    if (filtroFecha !== 'todas') {
      const dias = parseInt(filtroFecha);
      const fechaLimite = new Date();
      fechaLimite.setDate(fechaLimite.getDate() - dias);
      
      filtradas = filtradas.filter(p => 
        new Date(p.fecha_inicio) >= fechaLimite || 
        new Date(p.fecha_fin) >= fechaLimite
      );
    }

    // Filtro por estado
    if (filtroEstado !== 'todas') {
      filtradas = filtradas.filter(p => p.estado_promocion === filtroEstado);
    }

    return filtradas;
  }, [promociones, filtroFecha, filtroEstado]);

  // Calcular métricas generales
  const metricas = useMemo(() => {
    const activas = promocionesFiltradas.filter(p => p.estado_promocion === 'activa').length;
    const pendientes = promocionesFiltradas.filter(p => p.estado_promocion === 'pendiente').length;
    const expiradas = promocionesFiltradas.filter(p => p.estado_promocion === 'expirada').length;
    
    // Calcular ventas con promociones
    const ventasConPromociones = ventas.filter(v => v.appliedPromociones && v.appliedPromociones.length > 0);
    const totalVentasConPromociones = ventasConPromociones.length;
    const totalIngresosConPromociones = ventasConPromociones.reduce((sum, v) => sum + (v.total || 0), 0);
    
    // Calcular descuentos aplicados
    const totalDescuentos = ventasConPromociones.reduce((sum, v) => sum + (v.totalDescuentos || 0), 0);
    
    // Promedio de descuento por venta
    const promedioDescuento = totalVentasConPromociones > 0 ? totalDescuentos / totalVentasConPromociones : 0;
    
    // Tasa de conversión (ventas con promociones / total ventas)
    const tasaConversion = ventas.length > 0 ? (totalVentasConPromociones / ventas.length) * 100 : 0;

    return {
      activas,
      pendientes,
      expiradas,
      total: promocionesFiltradas.length,
      totalVentasConPromociones,
      totalIngresosConPromociones,
      totalDescuentos,
      promedioDescuento,
      tasaConversion
    };
  }, [promocionesFiltradas, ventas]);

  // Datos para gráficos
  const datosGraficos = useMemo(() => {
    // Gráfico de promociones por tipo
    const porTipo = promocionesFiltradas.reduce((acc, p) => {
      acc[p.tipo] = (acc[p.tipo] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const datosTipo = Object.entries(porTipo).map(([tipo, cantidad]) => ({
      tipo: tipo.charAt(0).toUpperCase() + tipo.slice(1),
      cantidad,
      porcentaje: (cantidad / promocionesFiltradas.length) * 100
    }));

    // Gráfico de promociones por estado
    const porEstado = promocionesFiltradas.reduce((acc, p) => {
      acc[p.estado_promocion] = (acc[p.estado_promocion] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const datosEstado = Object.entries(porEstado).map(([estado, cantidad]) => ({
      estado: estado.charAt(0).toUpperCase() + estado.slice(1),
      cantidad,
      porcentaje: (cantidad / promocionesFiltradas.length) * 100
    }));

    // Gráfico de rendimiento por promoción
    const rendimientoPromociones = promocionesFiltradas.map(p => {
      const ventasPromocion = ventas.filter(v => 
        v.appliedPromociones?.some((ap: any) => ap.id_promocion === p.id_promocion)
      );
      
      const ingresosPromocion = ventasPromocion.reduce((sum, v) => sum + (v.total || 0), 0);
      const descuentosPromocion = ventasPromocion.reduce((sum, v) => sum + (v.totalDescuentos || 0), 0);
      
      return {
        nombre: p.nombre,
        ventas: ventasPromocion.length,
        ingresos: ingresosPromocion,
        descuentos: descuentosPromocion,
        efectividad: ventasPromocion.length > 0 ? (ingresosPromocion / ventasPromocion.length) : 0
      };
    }).sort((a, b) => b.ventas - a.ventas).slice(0, 10);

    // Gráfico de tendencia temporal
    const tendenciaTemporal = promocionesFiltradas.reduce((acc, p) => {
      const mes = format(new Date(p.fecha_inicio), 'MMM yyyy', { locale: es });
      if (!acc[mes]) {
        acc[mes] = { mes, creadas: 0, activas: 0 };
      }
      acc[mes].creadas++;
      if (p.estado_promocion === 'activa') {
        acc[mes].activas++;
      }
      return acc;
    }, {} as Record<string, any>);

    const datosTendencia = Object.values(tendenciaTemporal).sort((a: any, b: any) => 
      new Date(a.mes).getTime() - new Date(b.mes).getTime()
    );

    return {
      datosTipo,
      datosEstado,
      rendimientoPromociones,
      datosTendencia
    };
  }, [promocionesFiltradas, ventas]);

  // Colores para gráficos
  const colores = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', 
    '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
  ];

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'activa': return 'bg-green-100 text-green-800';
      case 'pendiente': return 'bg-yellow-100 text-yellow-800';
      case 'expirada': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'porcentaje': return <Percent className="h-4 w-4" />;
      case 'monto_fijo': return <DollarSign className="h-4 w-4" />;
      case 'precio_fijo': return <Tag className="h-4 w-4" />;
      case 'x_uno_gratis': return <Star className="h-4 w-4" />;
      case 'combo': return <Target className="h-4 w-4" />;
      default: return <Tag className="h-4 w-4" />;
    }
  };

  const openDetailsModal = (promocion: any) => {
    setSelectedPromocion(promocion);
    setShowDetailsModal(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con filtros */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics de Promociones</h2>
          <p className="text-gray-600">Análisis detallado del rendimiento de promociones</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <Label className="text-sm">Filtros:</Label>
          </div>
          
          <Select value={filtroFecha} onValueChange={setFiltroFecha}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 días</SelectItem>
              <SelectItem value="30">Últimos 30 días</SelectItem>
              <SelectItem value="90">Últimos 90 días</SelectItem>
              <SelectItem value="todas">Todas</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filtroEstado} onValueChange={setFiltroEstado}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todos</SelectItem>
              <SelectItem value="activa">Activas</SelectItem>
              <SelectItem value="pendiente">Pendientes</SelectItem>
              <SelectItem value="expirada">Expiradas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Activas</p>
                <p className="text-2xl font-bold text-green-600">{metricas.activas}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Pendientes</p>
                <p className="text-2xl font-bold text-yellow-600">{metricas.pendientes}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Expiradas</p>
                <p className="text-2xl font-bold text-red-600">{metricas.expiradas}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <ShoppingCart className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Ventas con Promo</p>
                <p className="text-2xl font-bold text-blue-600">{metricas.totalVentasConPromociones}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Ingresos</p>
                <p className="text-lg font-bold text-green-600">Bs {metricas.totalIngresosConPromociones.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingDown className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Descuentos</p>
                <p className="text-lg font-bold text-red-600">Bs {metricas.totalDescuentos.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Percent className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Tasa Conversión</p>
                <p className="text-lg font-bold text-purple-600">{metricas.tasaConversion.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Award className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Promedio Descuento</p>
                <p className="text-lg font-bold text-orange-600">Bs {metricas.promedioDescuento.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de análisis */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Resumen</span>
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Rendimiento</span>
          </TabsTrigger>
          <TabsTrigger value="trends" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Tendencias</span>
          </TabsTrigger>
          <TabsTrigger value="details" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            <span className="hidden sm:inline">Detalles</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab: Resumen */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico de promociones por tipo */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5 text-blue-600" />
                  Promociones por Tipo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={datosGraficos.datosTipo}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ tipo, porcentaje }) => `${tipo}: ${porcentaje.toFixed(1)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="cantidad"
                    >
                      {datosGraficos.datosTipo.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={colores[index % colores.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Gráfico de promociones por estado */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-green-600" />
                  Promociones por Estado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={datosGraficos.datosEstado}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="estado" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="cantidad" fill="#10B981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Rendimiento */}
        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-purple-600" />
                Top 10 Promociones por Rendimiento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={datosGraficos.rendimientoPromociones} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="nombre" type="category" width={150} />
                  <Tooltip />
                  <Bar dataKey="ventas" fill="#8B5CF6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Tabla de rendimiento */}
          <Card>
            <CardHeader>
              <CardTitle>Detalle de Rendimiento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Promoción</th>
                      <th className="text-right p-2">Ventas</th>
                      <th className="text-right p-2">Ingresos</th>
                      <th className="text-right p-2">Descuentos</th>
                      <th className="text-right p-2">Efectividad</th>
                    </tr>
                  </thead>
                  <tbody>
                    {datosGraficos.rendimientoPromociones.map((promo, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="p-2 font-medium">{promo.nombre}</td>
                        <td className="p-2 text-right">{promo.ventas}</td>
                        <td className="p-2 text-right">Bs {promo.ingresos.toFixed(2)}</td>
                        <td className="p-2 text-right text-red-600">Bs {promo.descuentos.toFixed(2)}</td>
                        <td className="p-2 text-right text-green-600">Bs {promo.efectividad.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Tendencias */}
        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-indigo-600" />
                Tendencia de Creación de Promociones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={datosGraficos.datosTendencia}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="creadas" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="activas" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Detalles */}
        <TabsContent value="details" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Lista Detallada de Promociones</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {promocionesFiltradas.map((promocion) => {
                  const ventasPromocion = ventas.filter(v => 
                    v.appliedPromociones?.some((ap: any) => ap.id_promocion === promocion.id_promocion)
                  );
                  
                  return (
                    <div key={promocion.id_promocion} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-lg">{promocion.nombre}</h3>
                            <Badge className={getEstadoColor(promocion.estado_promocion)}>
                              {promocion.estado_promocion}
                            </Badge>
                            <div className="flex items-center gap-1">
                              {getTipoIcon(promocion.tipo)}
                              <span className="text-sm text-gray-600">{promocion.tipo}</span>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Producto:</span>
                              <p className="font-medium">{promocion.nombre_producto}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Valor:</span>
                              <p className="font-medium">
                                {promocion.tipo === 'porcentaje' ? `${promocion.valor}%` : `Bs ${promocion.valor}`}
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-500">Vigencia:</span>
                              <p className="font-medium">
                                {format(new Date(promocion.fecha_inicio), 'dd/MM/yyyy')} - {format(new Date(promocion.fecha_fin), 'dd/MM/yyyy')}
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-500">Ventas:</span>
                              <p className="font-medium text-green-600">{ventasPromocion.length}</p>
                            </div>
                          </div>
                        </div>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDetailsModal(promocion)}
                          className="ml-4"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Detalles
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de detalles */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-purple-600" />
              Detalles de la Promoción
            </DialogTitle>
          </DialogHeader>
          
          {selectedPromocion && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-gray-500">Nombre</Label>
                  <p className="font-semibold">{selectedPromocion.nombre}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-500">Estado</Label>
                  <Badge className={getEstadoColor(selectedPromocion.estado_promocion)}>
                    {selectedPromocion.estado_promocion}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm text-gray-500">Tipo</Label>
                  <p className="font-medium">{selectedPromocion.tipo}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-500">Valor</Label>
                  <p className="font-medium">
                    {selectedPromocion.tipo === 'porcentaje' ? `${selectedPromocion.valor}%` : `Bs ${selectedPromocion.valor}`}
                  </p>
                </div>
                <div>
                  <Label className="text-sm text-gray-500">Producto</Label>
                  <p className="font-medium">{selectedPromocion.nombre_producto}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-500">Precio Original</Label>
                  <p className="font-medium">Bs {selectedPromocion.precio_original}</p>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-2">Estadísticas de Uso</h4>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">
                      {ventas.filter(v => 
                        v.appliedPromociones?.some((ap: any) => ap.id_promocion === selectedPromocion.id_promocion)
                      ).length}
                    </p>
                    <p className="text-sm text-gray-600">Ventas</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">
                      Bs {ventas.filter(v => 
                        v.appliedPromociones?.some((ap: any) => ap.id_promocion === selectedPromocion.id_promocion)
                      ).reduce((sum, v) => sum + (v.total || 0), 0).toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-600">Ingresos</p>
                  </div>
                  <div className="p-3 bg-red-50 rounded-lg">
                    <p className="text-2xl font-bold text-red-600">
                      Bs {ventas.filter(v => 
                        v.appliedPromociones?.some((ap: any) => ap.id_promocion === selectedPromocion.id_promocion)
                      ).reduce((sum, v) => sum + (v.totalDescuentos || 0), 0).toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-600">Descuentos</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
