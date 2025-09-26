import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Label } from '../ui/label';
import { 
  DollarSign, 
  User, 
  Calendar, 
  TrendingUp, 
  TrendingDown,
  Users,
  FileText,
  Eye,
  CreditCard
} from 'lucide-react';
import { type Egreso, egresosUtils } from '../../services/egresosApi';

interface EgresosInfoProps {
  egresos: Egreso[];
  userRole: string;
}

export const EgresosInfo: React.FC<EgresosInfoProps> = ({ egresos, userRole }) => {
  // Estado para indicar si se están cargando los datos
  const [isLoading, setIsLoading] = React.useState(false);
  const [selectedEgresoForInfo, setSelectedEgresoForInfo] = useState<Egreso | null>(null);
  const [isInfoDialogOpen, setIsInfoDialogOpen] = useState(false);

  const openInfoDialog = (egreso: Egreso) => {
    setSelectedEgresoForInfo(egreso);
    setIsInfoDialogOpen(true);
  };
  
  // Detectar si los datos están cargando y debuggear
  React.useEffect(() => {
    console.log('EgresosInfo - egresos recibidos:', egresos);
    console.log('EgresosInfo - cantidad de egresos:', egresos.length);
    
    if (egresos.length > 0) {
      console.log('EgresosInfo - primer egreso:', egresos[0]);
      console.log('EgresosInfo - registrado_por_nombre del primer egreso:', egresos[0].registrado_por_nombre);
    }
    
    if (egresos.length === 0) {
      setIsLoading(true);
    } else {
      setIsLoading(false);
    }
  }, [egresos]);

  // Calcular estadísticas
  const stats = React.useMemo(() => {
    const totalEgresos = egresos.length;
    const totalMonto = egresos.reduce((sum, egreso) => {
      // Validar que el monto sea un número válido
      let monto = 0;
      if (egreso.monto !== null && egreso.monto !== undefined) {
        monto = Number(egreso.monto);
        if (isNaN(monto)) {
          console.warn('Monto inválido encontrado:', egreso.monto, 'en egreso ID:', egreso.id_egreso);
          monto = 0;
        }
      }
      return sum + monto;
    }, 0);
    
    const egresosPagados = egresos.filter(e => e.estado === 'pagado').length;
    const egresosPendientes = egresos.filter(e => e.estado === 'pendiente').length;
    const egresosAprobados = egresos.filter(e => e.estado === 'aprobado').length;
    
    // Agrupar por cajero
    const porCajero = egresos.reduce((acc, egreso) => {
      const cajero = egreso.registrado_por_nombre || 'Desconocido';
      console.log('EgresosInfo - procesando egreso para cajero:', cajero, 'egreso ID:', egreso.id_egreso);
      
      if (!acc[cajero]) {
        acc[cajero] = {
          total: 0,
          monto: 0,
          egresos: []
        };
        console.log('EgresosInfo - nuevo cajero creado:', cajero);
      }
      acc[cajero].total++;
      console.log('EgresosInfo - total actualizado para', cajero, ':', acc[cajero].total);
      
      // Validar que el monto sea un número válido antes de sumarlo
      let monto = 0;
      if (egreso.monto !== null && egreso.monto !== undefined) {
        monto = Number(egreso.monto);
        if (isNaN(monto)) {
          console.warn('Monto inválido encontrado para cajero:', cajero, 'monto:', egreso.monto, 'egreso ID:', egreso.id_egreso);
          monto = 0;
        }
      }
      acc[cajero].monto += monto;
      acc[cajero].egresos.push(egreso);
      return acc;
    }, {} as Record<string, { total: number; monto: number; egresos: Egreso[] }>);

    console.log('EgresosInfo - estadísticas por cajero calculadas:', porCajero);

    return {
      totalEgresos,
      totalMonto,
      egresosPagados,
      egresosPendientes,
      egresosAprobados,
      porCajero
    };
  }, [egresos]);

  // Obtener egresos recientes (últimos 10)
  const egresosRecientes = React.useMemo(() => {
    return [...egresos]
      .sort((a, b) => new Date(b.fecha_egreso).getTime() - new Date(a.fecha_egreso).getTime())
      .slice(0, 10);
  }, [egresos]);

  const getEstadoBadge = (estado: string | null) => {
    const colors = {
      pendiente: 'bg-yellow-100 text-yellow-800',
      aprobado: 'bg-blue-100 text-blue-800',
      pagado: 'bg-green-100 text-green-800',
      cancelado: 'bg-gray-100 text-gray-800',
      rechazado: 'bg-red-100 text-red-800'
    };

    const estadoValue = estado || 'pendiente';

    return (
      <Badge className={colors[estadoValue as keyof typeof colors] || colors.pendiente}>
        {estadoValue.toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Estadísticas Generales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Egresos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEgresos}</div>
            <p className="text-xs text-muted-foreground">
              En el período seleccionado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monto Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {egresosUtils.formatCurrency(stats.totalMonto)}
            </div>
            <p className="text-xs text-muted-foreground">
              Suma de todos los egresos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagados</CardTitle>
            <TrendingDown className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.egresosPagados}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalEgresos > 0 ? Math.round((stats.egresosPagados / stats.totalEgresos) * 100) : 0}% del total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <TrendingUp className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.egresosPendientes}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalEgresos > 0 ? Math.round((stats.egresosPendientes / stats.totalEgresos) * 100) : 0}% del total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Resumen por Cajero */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Resumen por Cajero
          </CardTitle>
          {/* Botón de debug */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              console.log('EgresosInfo - Debug - egresos:', egresos);
              console.log('EgresosInfo - Debug - stats:', stats);
              console.log('EgresosInfo - Debug - stats.porCajero:', stats.porCajero);
            }}
          >
            Debug
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              Cargando información de egresos...
            </div>
          ) : Object.keys(stats.porCajero).length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No hay egresos registrados para mostrar en el resumen por cajero.
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(stats.porCajero).map(([cajero, datos]) => (
                <div key={cajero} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-blue-600" />
                      <span className="font-semibold">{cajero}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">
                        {egresosUtils.formatCurrency(datos.monto)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {datos.total} egreso{datos.total !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                  
                  {/* Estados del cajero */}
                  <div className="flex gap-2 flex-wrap">
                    {datos.egresos.filter(e => e.estado === 'pagado').length > 0 && (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        {datos.egresos.filter(e => e.estado === 'pagado').length} Pagados
                      </Badge>
                    )}
                    {datos.egresos.filter(e => e.estado === 'pendiente').length > 0 && (
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                        {datos.egresos.filter(e => e.estado === 'pendiente').length} Pendientes
                      </Badge>
                    )}
                    {datos.egresos.filter(e => e.estado === 'aprobado').length > 0 && (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        {datos.egresos.filter(e => e.estado === 'aprobado').length} Aprobados
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Egresos Recientes */}
      <Card>
        <CardHeader className="p-3 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
            Egresos Recientes
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0">
          {egresosRecientes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No hay egresos para mostrar
            </div>
          ) : (
            <>
              {/* Vista móvil: Tarjetas */}
              <div className="lg:hidden space-y-3">
                {egresosRecientes.map((egreso) => (
                  <Card key={egreso.id_egreso} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-gray-900 truncate">{egreso.concepto}</h3>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openInfoDialog(egreso)}
                              className="p-1 h-6 w-6 hover:bg-blue-100 text-blue-600 hover:text-blue-700"
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <Calendar className="h-3 w-3" />
                              <span>{egresosUtils.formatDate(egreso.fecha_egreso)}</span>
                            </div>
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <User className="h-3 w-3" />
                              <span className="truncate">{egreso.registrado_por_nombre || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: egreso.categoria_color }}
                              />
                              <span className="truncate">{egreso.categoria_nombre}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-green-600">
                                {egresosUtils.formatCurrency(egreso.monto)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Vista desktop: Tabla */}
              <div className="hidden lg:block">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Cajero</TableHead>
                        <TableHead>Concepto</TableHead>
                        <TableHead>Categoría</TableHead>
                        <TableHead>Monto</TableHead>
                        <TableHead>Método Pago</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {egresosRecientes.map((egreso) => (
                        <TableRow key={egreso.id_egreso}>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              <span>{egresosUtils.formatDate(egreso.fecha_egreso)}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <User className="h-4 w-4 text-blue-400" />
                              <span className="text-sm">{egreso.registrado_por_nombre || 'N/A'}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{egreso.concepto}</div>
                              {egreso.descripcion && (
                                <div className="text-sm text-gray-500 truncate max-w-xs">
                                  {egreso.descripcion}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: egreso.categoria_color }}
                              />
                              <span className="text-sm">{egreso.categoria_nombre}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">
                              {egresosUtils.formatCurrency(egreso.monto)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1">
                              <DollarSign className="h-4 w-4 text-gray-400" />
                              <span className="text-sm capitalize">
                                {egreso.metodo_pago.replace('_', ' ')}
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Modal de información para móvil */}
      <Dialog open={isInfoDialogOpen} onOpenChange={setIsInfoDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Detalles del Egreso
            </DialogTitle>
          </DialogHeader>
          
          {selectedEgresoForInfo && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-gray-500">ID</Label>
                  <p className="font-medium">{selectedEgresoForInfo.id_egreso}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Fecha</Label>
                  <p className="font-medium">{egresosUtils.formatDate(selectedEgresoForInfo.fecha_egreso)}</p>
                </div>
              </div>
              
              <div>
                <Label className="text-gray-500">Concepto</Label>
                <p className="font-medium">{selectedEgresoForInfo.concepto}</p>
              </div>
              
              {selectedEgresoForInfo.descripcion && (
                <div>
                  <Label className="text-gray-500">Descripción</Label>
                  <p className="text-sm">{selectedEgresoForInfo.descripcion}</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-gray-500">Cajero</Label>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-blue-400" />
                    <span className="font-medium">{selectedEgresoForInfo.registrado_por_nombre || 'N/A'}</span>
                  </div>
                </div>
                <div>
                  <Label className="text-gray-500">Estado</Label>
                  <div className="mt-1">
                    {getEstadoBadge(selectedEgresoForInfo.estado)}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-gray-500">Categoría</Label>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: selectedEgresoForInfo.categoria_color }}
                    />
                    <span className="font-medium">{selectedEgresoForInfo.categoria_nombre}</span>
                  </div>
                </div>
                <div>
                  <Label className="text-gray-500">Método de Pago</Label>
                  <div className="flex items-center gap-1">
                    <CreditCard className="h-4 w-4 text-gray-400" />
                    <span className="font-medium capitalize">
                      {selectedEgresoForInfo.metodo_pago.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>
              
              <div>
                <Label className="text-gray-500">Monto</Label>
                <p className="text-lg font-bold text-green-600">
                  {egresosUtils.formatCurrency(selectedEgresoForInfo.monto)}
                </p>
              </div>
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setIsInfoDialogOpen(false)}
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
