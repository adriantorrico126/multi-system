import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../ui/dialog';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import {
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  X,
  Clock,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  FileText,
  Calendar,
  Building,
  User,
  CreditCard
} from 'lucide-react';

import {
  type Egreso,
  type CategoriaEgreso,
  type FiltrosEgresos,
  egresosUtils
} from '../../services/egresosApi';

interface EgresosListProps {
  egresos: Egreso[];
  categorias: CategoriaEgreso[];
  loading: boolean;
  pagination: {
    page: number;
    pages: number;
    total: number;
    limit: number;
  };
  filtros: FiltrosEgresos;
  userRole: string;
  onEdit: (egreso: Egreso) => void;
  onView: (egreso: Egreso) => void;
  onDelete: (id: number) => void;
  onAprobar: (id: number, comentario?: string) => void;
  onRechazar: (id: number, comentario: string) => void;
  onPagar: (id: number, comentario?: string) => void;
  onFiltrosChange: (filtros: FiltrosEgresos) => void;
  onPageChange: (page: number) => void;
}

export const EgresosList: React.FC<EgresosListProps> = ({
  egresos,
  categorias,
  loading,
  pagination,
  filtros,
  userRole,
  onEdit,
  onView,
  onDelete,
  onAprobar,
  onRechazar,
  onPagar,
  onFiltrosChange,
  onPageChange
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [selectedEgreso, setSelectedEgreso] = useState<Egreso | null>(null);
  const [actionModal, setActionModal] = useState<{
    open: boolean;
    action: 'aprobar' | 'rechazar' | 'pagar' | null;
    comentario: string;
  }>({
    open: false,
    action: null,
    comentario: ''
  });

  // Handlers para filtros
  const handleFilterChange = (key: keyof FiltrosEgresos, value: any) => {
    onFiltrosChange({
      ...filtros,
      [key]: value,
      page: 1 // Reset página al filtrar
    });
  };

  const clearFilters = () => {
    onFiltrosChange({
      page: 1,
      limit: filtros.limit
    });
  };

  // Handler para acciones
  const handleAction = (egreso: Egreso, action: 'aprobar' | 'rechazar' | 'pagar') => {
    setSelectedEgreso(egreso);
    setActionModal({
      open: true,
      action,
      comentario: ''
    });
  };

  const executeAction = () => {
    if (!selectedEgreso || !actionModal.action) return;

    const { id_egreso } = selectedEgreso;
    const { action, comentario } = actionModal;

    switch (action) {
      case 'aprobar':
        onAprobar(id_egreso, comentario);
        break;
      case 'rechazar':
        if (!comentario.trim()) {
          alert('El comentario es requerido para rechazar');
          return;
        }
        onRechazar(id_egreso, comentario);
        break;
      case 'pagar':
        onPagar(id_egreso, comentario);
        break;
    }

    setActionModal({ open: false, action: null, comentario: '' });
    setSelectedEgreso(null);
  };

  const getEstadoBadge = (estado: string) => {
    const variants = {
      pendiente: 'secondary',
      aprobado: 'default',
      pagado: 'success',
      cancelado: 'outline',
      rechazado: 'destructive'
    } as const;

    const colors = {
      pendiente: 'bg-yellow-100 text-yellow-800',
      aprobado: 'bg-blue-100 text-blue-800',
      pagado: 'bg-green-100 text-green-800',
      cancelado: 'bg-gray-100 text-gray-800',
      rechazado: 'bg-red-100 text-red-800'
    };

    return (
      <Badge className={colors[estado as keyof typeof colors] || colors.pendiente}>
        {estado.toUpperCase()}
      </Badge>
    );
  };

  const canEdit = (egreso: Egreso) => {
    return egreso.estado === 'pendiente' && egresosUtils.canEdit(userRole);
  };

  const canDelete = (egreso: Egreso) => {
    return egreso.estado === 'pendiente' && egresosUtils.canEdit(userRole);
  };

  const canApprove = (egreso: Egreso) => {
    return egreso.estado === 'pendiente' && egresosUtils.canApprove(userRole);
  };

  const canPay = (egreso: Egreso) => {
    return ['pendiente', 'aprobado'].includes(egreso.estado) && egresosUtils.canPay(userRole);
  };

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">Filtros de Búsqueda</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              {showFilters ? 'Ocultar' : 'Mostrar'} Filtros
            </Button>
          </div>
        </CardHeader>
        
        {showFilters && (
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Búsqueda por concepto/proveedor */}
              <div>
                <Label htmlFor="search">Buscar</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Concepto o proveedor..."
                    value={filtros.proveedor_nombre || ''}
                    onChange={(e) => handleFilterChange('proveedor_nombre', e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>

              {/* Filtro por categoría */}
              <div>
                <Label htmlFor="categoria">Categoría</Label>
                <Select
                  value={filtros.id_categoria_egreso?.toString() || ''}
                  onValueChange={(value) => 
                    handleFilterChange('id_categoria_egreso', value ? parseInt(value) : undefined)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas las categorías" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas las categorías</SelectItem>
                    {categorias.map((categoria) => (
                      <SelectItem 
                        key={categoria.id_categoria_egreso} 
                        value={categoria.id_categoria_egreso.toString()}
                      >
                        <div className="flex items-center space-x-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: categoria.color }}
                          />
                          <span>{categoria.nombre}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro por estado */}
              <div>
                <Label htmlFor="estado">Estado</Label>
                <Select
                  value={filtros.estado || ''}
                  onValueChange={(value) => handleFilterChange('estado', value || undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los estados" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos los estados</SelectItem>
                    <SelectItem value="pendiente">Pendiente</SelectItem>
                    <SelectItem value="aprobado">Aprobado</SelectItem>
                    <SelectItem value="pagado">Pagado</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                    <SelectItem value="rechazado">Rechazado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Fecha desde */}
              <div>
                <Label htmlFor="fecha-desde">Fecha Desde</Label>
                <Input
                  id="fecha-desde"
                  type="date"
                  value={filtros.fecha_inicio || ''}
                  onChange={(e) => handleFilterChange('fecha_inicio', e.target.value)}
                />
              </div>

              {/* Fecha hasta */}
              <div>
                <Label htmlFor="fecha-hasta">Fecha Hasta</Label>
                <Input
                  id="fecha-hasta"
                  type="date"
                  value={filtros.fecha_fin || ''}
                  onChange={(e) => handleFilterChange('fecha_fin', e.target.value)}
                />
              </div>

              {/* Botón limpiar filtros */}
              <div className="flex items-end">
                <Button variant="outline" onClick={clearFilters} className="w-full">
                  Limpiar Filtros
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Tabla de egresos */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>
              Egresos ({pagination.total} total)
            </CardTitle>
            <div className="text-sm text-gray-500">
              Página {pagination.page} de {pagination.pages}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : egresos.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No se encontraron egresos con los filtros aplicados
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Concepto</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Proveedor</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Método Pago</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {egresos.map((egreso) => (
                    <TableRow key={egreso.id_egreso}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span>{egresosUtils.formatDate(egreso.fecha_egreso)}</span>
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
                        {egreso.proveedor_nombre || (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        <span className="font-medium">
                          {egresosUtils.formatCurrency(egreso.monto)}
                        </span>
                      </TableCell>
                      
                      <TableCell>
                        {getEstadoBadge(egreso.estado)}
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <CreditCard className="h-4 w-4 text-gray-400" />
                          <span className="text-sm capitalize">
                            {egreso.metodo_pago.replace('_', ' ')}
                          </span>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          {/* Ver */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onView(egreso)}
                            title="Ver detalles"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>

                          {/* Editar */}
                          {canEdit(egreso) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onEdit(egreso)}
                              title="Editar"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}

                          {/* Aprobar */}
                          {canApprove(egreso) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleAction(egreso, 'aprobar')}
                              title="Aprobar"
                              className="text-green-600 hover:text-green-700"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}

                          {/* Rechazar */}
                          {canApprove(egreso) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleAction(egreso, 'rechazar')}
                              title="Rechazar"
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}

                          {/* Marcar como pagado */}
                          {canPay(egreso) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleAction(egreso, 'pagar')}
                              title="Marcar como pagado"
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <CreditCard className="h-4 w-4" />
                            </Button>
                          )}

                          {/* Eliminar */}
                          {canDelete(egreso) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (confirm('¿Estás seguro de cancelar este egreso?')) {
                                  onDelete(egreso.id_egreso);
                                }
                              }}
                              title="Cancelar"
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Paginación */}
          {pagination.pages > 1 && (
            <div className="flex justify-between items-center mt-4">
              <div className="text-sm text-gray-500">
                Mostrando {((pagination.page - 1) * pagination.limit) + 1} a{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} de{' '}
                {pagination.total} egresos
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </Button>
                
                <span className="text-sm">
                  Página {pagination.page} de {pagination.pages}
                </span>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                >
                  Siguiente
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de acciones */}
      <Dialog open={actionModal.open} onOpenChange={(open) => !open && setActionModal({ ...actionModal, open: false })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionModal.action === 'aprobar' && 'Aprobar Egreso'}
              {actionModal.action === 'rechazar' && 'Rechazar Egreso'}
              {actionModal.action === 'pagar' && 'Marcar como Pagado'}
            </DialogTitle>
          </DialogHeader>
          
          {selectedEgreso && (
            <div className="space-y-4">
              <div>
                <strong>Concepto:</strong> {selectedEgreso.concepto}
              </div>
              <div>
                <strong>Monto:</strong> {egresosUtils.formatCurrency(selectedEgreso.monto)}
              </div>
              
              <div>
                <Label htmlFor="comentario">
                  Comentario {actionModal.action === 'rechazar' && '*'}
                </Label>
                <Textarea
                  id="comentario"
                  placeholder={
                    actionModal.action === 'aprobar' ? 'Comentario opcional...' :
                    actionModal.action === 'rechazar' ? 'Motivo del rechazo (requerido)...' :
                    'Comentario sobre el pago...'
                  }
                  value={actionModal.comentario}
                  onChange={(e) => setActionModal({ ...actionModal, comentario: e.target.value })}
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setActionModal({ ...actionModal, open: false })}
            >
              Cancelar
            </Button>
            <Button
              onClick={executeAction}
              variant={actionModal.action === 'rechazar' ? 'destructive' : 'default'}
            >
              {actionModal.action === 'aprobar' && 'Aprobar'}
              {actionModal.action === 'rechazar' && 'Rechazar'}
              {actionModal.action === 'pagar' && 'Marcar como Pagado'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
