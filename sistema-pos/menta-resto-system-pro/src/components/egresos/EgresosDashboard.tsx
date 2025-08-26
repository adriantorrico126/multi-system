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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categorías Activas</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCategorias}</div>
            <p className="text-xs text-muted-foreground">
              Categorías configuradas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Egresos Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEgresosPendientes}</div>
            <p className="text-xs text-muted-foreground">
              Requieren atención
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monto Pendiente</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {egresosUtils.formatCurrency(montoTotalPendiente)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total por procesar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Por Aprobar</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{egresosPorAprobar.length}</div>
            <p className="text-xs text-muted-foreground">
              Esperan aprobación
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Acciones rápidas */}
      <div className="flex flex-wrap gap-4">
        {egresosUtils.canEdit(userRole) && (
          <Button onClick={onCreateEgreso}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Egreso
          </Button>
        )}
      </div>

      {/* Egresos pendientes de aprobación */}
      {egresosUtils.canApprove(userRole) && egresosPorAprobar.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-orange-500" />
              Egresos Pendientes de Aprobación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {egresosPorAprobar.slice(0, 5).map((egreso) => (
                <div key={egreso.id_egreso} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: egreso.categoria_color }}
                      />
                      <span className="font-medium">{egreso.concepto}</span>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {egreso.categoria_nombre} • {egresosUtils.formatDate(egreso.fecha_egreso)}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <span className="font-semibold">
                      {egresosUtils.formatCurrency(egreso.monto)}
                    </span>
                    
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewEgreso(egreso)}
                        title="Ver detalles"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onAprobarEgreso(egreso.id_egreso)}
                        className="text-green-600 hover:text-green-700"
                        title="Aprobar"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              
              {egresosPorAprobar.length > 5 && (
                <div className="text-center pt-2">
                  <p className="text-sm text-gray-500">
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
          <CardHeader>
            <CardTitle>Resumen por Categorías</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categorias.map((categoria) => (
                <div key={categoria.id_categoria_egreso} className="p-3 border rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: categoria.color }}
                    />
                    <span className="font-medium">{categoria.nombre}</span>
                  </div>
                  <div className="text-sm text-gray-600">
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
          <CardContent className="text-center py-8">
            <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Bienvenido al Sistema de Egresos
            </h3>
            <p className="text-gray-600 mb-4">
              Comienza creando categorías para organizar tus gastos empresariales.
            </p>
            {egresosUtils.canEdit(userRole) && (
              <Button onClick={onCreateEgreso}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Primera Categoría
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
