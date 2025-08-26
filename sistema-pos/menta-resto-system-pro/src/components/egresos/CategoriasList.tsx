import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
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
  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {categorias.map((categoria) => (
        <Card key={categoria.id_categoria_egreso} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: categoria.color }}
                />
                <CardTitle className="text-lg">{categoria.nombre}</CardTitle>
              </div>
              {!categoria.activo && (
                <Badge variant="secondary">Inactiva</Badge>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="space-y-3">
            {categoria.descripcion && (
              <p className="text-sm text-gray-600">{categoria.descripcion}</p>
            )}
            
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Total egresos:</span>
              <span className="font-medium">{categoria.total_egresos || 0}</span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Total gastado:</span>
              <span className="font-medium">
                {egresosUtils.formatCurrency(categoria.total_gastado || 0)}
              </span>
            </div>
            
            {egresosUtils.canEdit(userRole) && (
              <div className="flex space-x-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(categoria)}
                  className="flex-1"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Editar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (confirm('¿Estás seguro de eliminar esta categoría?')) {
                      onDelete(categoria.id_categoria_egreso);
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
      ))}
    </div>
  );
};
