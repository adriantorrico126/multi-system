import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Label } from '../ui/label';
import { Edit, Trash2, Eye, Package } from 'lucide-react';

import { type CategoriaEgreso, egresosUtils } from '../../services/egresosApi';

interface CategoriasListProps {
  categorias: CategoriaEgreso[];
  loading: boolean;
  userRole: string;
  onEdit: (categoria: CategoriaEgreso) => void;
  onDelete: (id: number) => void;
}

export const CategoriasList: React.FC<CategoriasListProps> = ({
  categorias,
  loading,
  userRole,
  onEdit,
  onDelete
}) => {
  const [selectedCategoriaForInfo, setSelectedCategoriaForInfo] = useState<CategoriaEgreso | null>(null);
  const [isInfoDialogOpen, setIsInfoDialogOpen] = useState(false);

  const openInfoDialog = (categoria: CategoriaEgreso) => {
    setSelectedCategoriaForInfo(categoria);
    setIsInfoDialogOpen(true);
  };
  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {categorias.map((categoria) => (
          <Card key={categoria.id_categoria_egreso} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2 p-3 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                  <div
                    className="w-3 h-3 sm:w-4 sm:h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: categoria.color }}
                  />
                  <CardTitle className="text-base sm:text-lg truncate">{categoria.nombre}</CardTitle>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => openInfoDialog(categoria)}
                    className="lg:hidden p-1 h-6 w-6 hover:bg-blue-100 text-blue-600 hover:text-blue-700 flex-shrink-0"
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                </div>
                {!categoria.activo && (
                  <Badge variant="secondary" className="text-xs">Inactiva</Badge>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3 p-3 sm:p-6 pt-0">
              {categoria.descripcion && (
                <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">{categoria.descripcion}</p>
              )}
              
              <div className="space-y-2">
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-500">Total egresos:</span>
                  <span className="font-medium">{categoria.total_egresos || 0}</span>
                </div>
                
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-500">Total gastado:</span>
                  <span className="font-medium">
                    {egresosUtils.formatCurrency(categoria.total_gastado || 0)}
                  </span>
                </div>
              </div>
              
              {egresosUtils.canEdit(userRole) && (
                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(categoria)}
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
                      if (confirm('¿Estás seguro de eliminar esta categoría?')) {
                        onDelete(categoria.id_categoria_egreso);
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
        ))}
      </div>

      {/* Modal de información para móvil */}
      <Dialog open={isInfoDialogOpen} onOpenChange={setIsInfoDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Detalles de la Categoría
            </DialogTitle>
          </DialogHeader>
          
          {selectedCategoriaForInfo && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-gray-500">ID</Label>
                  <p className="font-medium">{selectedCategoriaForInfo.id_categoria_egreso}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Estado</Label>
                  <div className="mt-1">
                    <Badge variant={selectedCategoriaForInfo.activo ? "default" : "secondary"}>
                      {selectedCategoriaForInfo.activo ? "Activa" : "Inactiva"}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div>
                <Label className="text-gray-500">Nombre</Label>
                <div className="flex items-center gap-2 mt-1">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: selectedCategoriaForInfo.color }}
                  />
                  <p className="font-medium">{selectedCategoriaForInfo.nombre}</p>
                </div>
              </div>
              
              {selectedCategoriaForInfo.descripcion && (
                <div>
                  <Label className="text-gray-500">Descripción</Label>
                  <p className="text-sm mt-1">{selectedCategoriaForInfo.descripcion}</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-gray-500">Total Egresos</Label>
                  <p className="font-medium text-lg">{selectedCategoriaForInfo.total_egresos || 0}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Total Gastado</Label>
                  <p className="font-medium text-lg text-green-600">
                    {egresosUtils.formatCurrency(selectedCategoriaForInfo.total_gastado || 0)}
                  </p>
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
                    onEdit(selectedCategoriaForInfo!);
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
                    if (confirm('¿Estás seguro de eliminar esta categoría?')) {
                      onDelete(selectedCategoriaForInfo!.id_categoria_egreso);
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
