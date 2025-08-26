import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Edit, Trash2, AlertTriangle, TrendingUp } from 'lucide-react';

import { 
  type PresupuestoEgreso, 
  type CategoriaEgreso, 
  egresosUtils 
} from '../../services/egresosApi';

interface PresupuestosListProps {
  presupuestos: PresupuestoEgreso[];
  categorias: CategoriaEgreso[];
  loading: boolean;
  userRole: string;
  onEdit: (presupuesto: PresupuestoEgreso) => void;
  onDelete: (id: number) => void;
}

export const PresupuestosList: React.FC<PresupuestosListProps> = ({
  presupuestos,
  categorias,
  loading,
  userRole,
  onEdit,
  onDelete
}) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const getEstadoPresupuesto = (presupuesto: PresupuestoEgreso) => {
    const porcentaje = presupuesto.porcentaje_ejecutado || 0;
    
    if (porcentaje > 100) return 'excedido';
    if (porcentaje >= 90) return 'alerta';
    if (porcentaje >= 70) return 'precaucion';
    return 'normal';
  };

  const getColorEstado = (estado: string) => {
    switch (estado) {
      case 'excedido': return 'text-red-600 bg-red-50';
      case 'alerta': return 'text-orange-600 bg-orange-50';
      case 'precaucion': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-green-600 bg-green-50';
    }
  };

  const getProgressColor = (estado: string) => {
    switch (estado) {
      case 'excedido': return 'bg-red-500';
      case 'alerta': return 'bg-orange-500';
      case 'precaucion': return 'bg-yellow-500';
      default: return 'bg-green-500';
    }
  };

  const getNombreMes = (mes?: number) => {
    if (!mes) return 'Anual';
    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return meses[mes - 1];
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {presupuestos.map((presupuesto) => {
        const estado = getEstadoPresupuesto(presupuesto);
        const porcentaje = Math.min(presupuesto.porcentaje_ejecutado || 0, 100);
        
        return (
          <Card key={presupuesto.id_presupuesto} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: presupuesto.categoria_color }}
                  />
                  <CardTitle className="text-lg">{presupuesto.categoria_nombre}</CardTitle>
                </div>
                {estado === 'excedido' && (
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                )}
              </div>
              <div className="text-sm text-gray-500">
                {getNombreMes(presupuesto.mes)} {presupuesto.anio}
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Montos */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Presupuestado:</span>
                  <span className="font-medium">
                    {egresosUtils.formatCurrency(presupuesto.monto_presupuestado)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Gastado:</span>
                  <span className="font-medium">
                    {egresosUtils.formatCurrency(presupuesto.monto_gastado)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Disponible:</span>
                  <span className={`font-medium ${
                    (presupuesto.diferencia || 0) < 0 ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {egresosUtils.formatCurrency(presupuesto.diferencia || 0)}
                  </span>
                </div>
              </div>

              {/* Progreso */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Progreso:</span>
                  <span className={`font-medium px-2 py-1 rounded text-xs ${getColorEstado(estado)}`}>
                    {Number(presupuesto.porcentaje_ejecutado || 0).toFixed(1)}%
                  </span>
                </div>
                <Progress 
                  value={porcentaje} 
                  className="h-2"
                />
              </div>

              {/* Estado */}
              <div className="flex justify-between items-center">
                <Badge 
                  variant={estado === 'excedido' ? 'destructive' : 'default'}
                  className={getColorEstado(estado)}
                >
                  {estado === 'excedido' && 'EXCEDIDO'}
                  {estado === 'alerta' && 'EN ALERTA'}
                  {estado === 'precaucion' && 'PRECAUCIÓN'}
                  {estado === 'normal' && 'NORMAL'}
                </Badge>
                
                {!presupuesto.activo && (
                  <Badge variant="secondary">Inactivo</Badge>
                )}
              </div>

              {/* Acciones */}
              {egresosUtils.canEdit(userRole) && (
                <div className="flex space-x-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(presupuesto)}
                    className="flex-1"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (confirm('¿Estás seguro de eliminar este presupuesto?')) {
                        onDelete(presupuesto.id_presupuesto);
                      }
                    }}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
