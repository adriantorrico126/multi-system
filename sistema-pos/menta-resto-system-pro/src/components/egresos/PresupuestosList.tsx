import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Label } from '../ui/label';
import { Edit, Trash2, AlertTriangle, TrendingUp, Eye, PieChart } from 'lucide-react';

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
  const [selectedPresupuestoForInfo, setSelectedPresupuestoForInfo] = useState<PresupuestoEgreso | null>(null);
  const [isInfoDialogOpen, setIsInfoDialogOpen] = useState(false);

  const openInfoDialog = (presupuesto: PresupuestoEgreso) => {
    setSelectedPresupuestoForInfo(presupuesto);
    setIsInfoDialogOpen(true);
  };
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
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {presupuestos.map((presupuesto) => {
          const estado = getEstadoPresupuesto(presupuesto);
          const porcentaje = Math.min(presupuesto.porcentaje_ejecutado || 0, 100);
          
          return (
            <Card key={presupuesto.id_presupuesto} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3 p-3 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    <div
                      className="w-3 h-3 sm:w-4 sm:h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: presupuesto.categoria_color }}
                    />
                    <CardTitle className="text-base sm:text-lg truncate">{presupuesto.categoria_nombre}</CardTitle>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openInfoDialog(presupuesto)}
                      className="lg:hidden p-1 h-6 w-6 hover:bg-blue-100 text-blue-600 hover:text-blue-700 flex-shrink-0"
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                  </div>
                  {estado === 'excedido' && (
                    <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 flex-shrink-0" />
                  )}
                </div>
                <div className="text-xs sm:text-sm text-gray-500">
                  {getNombreMes(presupuesto.mes)} {presupuesto.anio}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4 p-3 sm:p-6 pt-0">
                {/* Montos */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-gray-500">Presupuestado:</span>
                    <span className="font-medium">
                      {egresosUtils.formatCurrency(presupuesto.monto_presupuestado)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-gray-500">Gastado:</span>
                    <span className="font-medium">
                      {egresosUtils.formatCurrency(presupuesto.monto_gastado)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm">
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
                  <div className="flex justify-between text-xs sm:text-sm">
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
                    className={`text-xs ${getColorEstado(estado)}`}
                  >
                    {estado === 'excedido' && 'EXCEDIDO'}
                    {estado === 'alerta' && 'EN ALERTA'}
                    {estado === 'precaucion' && 'PRECAUCIÓN'}
                    {estado === 'normal' && 'NORMAL'}
                  </Badge>
                  
                  {!presupuesto.activo && (
                    <Badge variant="secondary" className="text-xs">Inactivo</Badge>
                  )}
                </div>

                {/* Acciones */}
                {egresosUtils.canEdit(userRole) && (
                  <div className="flex flex-col sm:flex-row gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(presupuesto)}
                      className="flex-1"
                    >
                      <Edit className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      <span className="hidden sm:inline">Editar</span>
                      <span className="sm:hidden">Editar</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (confirm('¿Estás seguro de eliminar este presupuesto?')) {
                          onDelete(presupuesto.id_presupuesto);
                        }
                      }}
                      className="text-red-600 hover:text-red-700 flex-1 sm:flex-none"
                    >
                      <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline ml-1">Eliminar</span>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Modal de información para móvil */}
      <Dialog open={isInfoDialogOpen} onOpenChange={setIsInfoDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Detalles del Presupuesto
            </DialogTitle>
          </DialogHeader>
          
          {selectedPresupuestoForInfo && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-gray-500">ID</Label>
                  <p className="font-medium">{selectedPresupuestoForInfo.id_presupuesto}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Período</Label>
                  <p className="font-medium">
                    {getNombreMes(selectedPresupuestoForInfo.mes)} {selectedPresupuestoForInfo.anio}
                  </p>
                </div>
              </div>
              
              <div>
                <Label className="text-gray-500">Categoría</Label>
                <div className="flex items-center gap-2 mt-1">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: selectedPresupuestoForInfo.categoria_color }}
                  />
                  <p className="font-medium">{selectedPresupuestoForInfo.categoria_nombre}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-gray-500">Presupuestado</Label>
                  <p className="font-medium text-lg">
                    {egresosUtils.formatCurrency(selectedPresupuestoForInfo.monto_presupuestado)}
                  </p>
                </div>
                <div>
                  <Label className="text-gray-500">Gastado</Label>
                  <p className="font-medium text-lg">
                    {egresosUtils.formatCurrency(selectedPresupuestoForInfo.monto_gastado)}
                  </p>
                </div>
              </div>
              
              <div>
                <Label className="text-gray-500">Disponible</Label>
                <p className={`font-medium text-lg ${
                  (selectedPresupuestoForInfo.diferencia || 0) < 0 ? 'text-red-600' : 'text-green-600'
                }`}>
                  {egresosUtils.formatCurrency(selectedPresupuestoForInfo.diferencia || 0)}
                </p>
              </div>
              
              <div>
                <Label className="text-gray-500">Progreso</Label>
                <div className="mt-2">
                  <div className="flex justify-between text-sm mb-1">
                    <span>{Number(selectedPresupuestoForInfo.porcentaje_ejecutado || 0).toFixed(1)}%</span>
                    <span className={`px-2 py-1 rounded text-xs ${getColorEstado(getEstadoPresupuesto(selectedPresupuestoForInfo))}`}>
                      {(() => {
                        const estado = getEstadoPresupuesto(selectedPresupuestoForInfo);
                        switch (estado) {
                          case 'excedido': return 'EXCEDIDO';
                          case 'alerta': return 'EN ALERTA';
                          case 'precaucion': return 'PRECAUCIÓN';
                          default: return 'NORMAL';
                        }
                      })()}
                    </span>
                  </div>
                  <Progress 
                    value={Math.min(selectedPresupuestoForInfo.porcentaje_ejecutado || 0, 100)} 
                    className="h-2"
                  />
                </div>
              </div>
              
              <div>
                <Label className="text-gray-500">Estado</Label>
                <div className="mt-1">
                  <Badge variant={selectedPresupuestoForInfo.activo ? "default" : "secondary"}>
                    {selectedPresupuestoForInfo.activo ? "Activo" : "Inactivo"}
                  </Badge>
                </div>
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
            {egresosUtils.canEdit(userRole) && (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsInfoDialogOpen(false);
                    onEdit(selectedPresupuestoForInfo!);
                  }}
                  className="w-full sm:w-auto"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setIsInfoDialogOpen(false);
                    if (confirm('¿Estás seguro de eliminar este presupuesto?')) {
                      onDelete(selectedPresupuestoForInfo!.id_presupuesto);
                    }
                  }}
                  className="w-full sm:w-auto"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
