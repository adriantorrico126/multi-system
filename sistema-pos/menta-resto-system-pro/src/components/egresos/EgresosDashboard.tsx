import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  DollarSign, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Plus,
  Eye
} from 'lucide-react';

import { 
  type Egreso, 
  type CategoriaEgreso, 
  egresosUtils 
} from '../../services/egresosApi';

interface EgresosDashboardProps {
  categorias: CategoriaEgreso[];
  egresosPendientes: Egreso[];
  userRole: string;
  onCreateEgreso: () => void;
  onViewEgreso: (egreso: Egreso) => void;
  onAprobarEgreso: (id: number, comentario?: string) => void;
  onRechazarEgreso: (id: number, comentario: string) => void;
}

export const EgresosDashboard: React.FC<EgresosDashboardProps> = ({
  categorias,
  egresosPendientes,
  userRole,
  onCreateEgreso,
  onViewEgreso,
  onAprobarEgreso,
  onRechazarEgreso
}) => {
  // Calcular estadísticas
  const totalCategorias = categorias.length;
  const totalEgresosPendientes = egresosPendientes.length;
  const montoTotalPendiente = egresosPendientes.reduce((sum, egreso) => sum + egreso.monto, 0);

  // Egresos por aprobar (solo si puede aprobar)
  const egresosPorAprobar = egresosUtils.canApprove(userRole) 
    ? egresosPendientes.filter(e => e.estado === 'pendiente')
    : [];

  return (
    <div className="space-y-6">
      {/* Estadísticas principales */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Categorías Activas</CardTitle>
            <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="text-lg sm:text-2xl font-bold">{totalCategorias}</div>
            <p className="text-xs text-muted-foreground hidden sm:block">
              Categorías configuradas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Egresos Pendientes</CardTitle>
            <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="text-lg sm:text-2xl font-bold">{totalEgresosPendientes}</div>
            <p className="text-xs text-muted-foreground hidden sm:block">
              Requieren atención
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Monto Pendiente</CardTitle>
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="text-lg sm:text-2xl font-bold">
              {egresosUtils.formatCurrency(montoTotalPendiente)}
            </div>
            <p className="text-xs text-muted-foreground hidden sm:block">
              Total por procesar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Por Aprobar</CardTitle>
            <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="text-lg sm:text-2xl font-bold">{egresosPorAprobar.length}</div>
            <p className="text-xs text-muted-foreground hidden sm:block">
              Esperan aprobación
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Acciones rápidas */}
      <div className="flex flex-wrap gap-4">
        {egresosUtils.canEdit(userRole) && (
          <Button onClick={onCreateEgreso} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Nuevo Egreso</span>
            <span className="sm:hidden">Nuevo</span>
          </Button>
        )}
      </div>

      {/* Egresos pendientes de aprobación */}
      {egresosUtils.canApprove(userRole) && egresosPorAprobar.length > 0 && (
        <Card>
          <CardHeader className="p-3 sm:p-6">
            <CardTitle className="flex items-center text-lg sm:text-xl">
              <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-orange-500" />
              <span className="hidden sm:inline">Egresos Pendientes de Aprobación</span>
              <span className="sm:hidden">Pendientes</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="space-y-3">
              {egresosPorAprobar.slice(0, 5).map((egreso) => (
                <div key={egreso.id_egreso} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-gray-50 rounded-lg gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: egreso.categoria_color }}
                      />
                      <span className="font-medium truncate">{egreso.concepto}</span>
                    </div>
                    <div className="text-xs sm:text-sm text-gray-500">
                      <div className="sm:hidden">{egreso.categoria_nombre}</div>
                      <div className="sm:hidden">{egresosUtils.formatDate(egreso.fecha_egreso)}</div>
                      <div className="hidden sm:block">{egreso.categoria_nombre} • {egresosUtils.formatDate(egreso.fecha_egreso)}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between sm:justify-end sm:space-x-3">
                    <span className="font-semibold text-sm sm:text-base">
                      {egresosUtils.formatCurrency(egreso.monto)}
                    </span>
                    
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewEgreso(egreso)}
                        title="Ver detalles"
                        className="p-1 h-6 w-6 sm:h-8 sm:w-8"
                      >
                        <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onAprobarEgreso(egreso.id_egreso)}
                        className="text-green-600 hover:text-green-700 p-1 h-6 w-6 sm:h-8 sm:w-8"
                        title="Aprobar"
                      >
                        <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              
              {egresosPorAprobar.length > 5 && (
                <div className="text-center pt-2">
                  <p className="text-xs sm:text-sm text-gray-500">
                    Y {egresosPorAprobar.length - 5} más...
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resumen por categorías */}
      {categorias.length > 0 && (
        <Card>
          <CardHeader className="p-3 sm:p-6">
            <CardTitle className="text-lg sm:text-xl">Resumen por Categorías</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {categorias.map((categoria) => (
                <div key={categoria.id_categoria_egreso} className="p-3 border rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <div
                      className="w-3 h-3 sm:w-4 sm:h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: categoria.color }}
                    />
                    <span className="font-medium text-sm sm:text-base truncate">{categoria.nombre}</span>
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600 space-y-1">
                    <div>Total: {egresosUtils.formatCurrency(categoria.total_gastado || 0)}</div>
                    <div>Egresos: {categoria.total_egresos || 0}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mensaje cuando no hay datos */}
      {totalCategorias === 0 && (
        <Card>
          <CardContent className="text-center py-6 sm:py-8 p-3 sm:p-6">
            <DollarSign className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
              Bienvenido al Sistema de Egresos
            </h3>
            <p className="text-sm sm:text-base text-gray-600 mb-4">
              Comienza creando categorías para organizar tus gastos empresariales.
            </p>
            {egresosUtils.canEdit(userRole) && (
              <Button onClick={onCreateEgreso} className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Crear Primera Categoría</span>
                <span className="sm:hidden">Crear Categoría</span>
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
