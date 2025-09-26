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
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  FileText,
  Calendar,
  Building,
  User
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
  onFiltrosChange,
  onPageChange
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [selectedEgreso, setSelectedEgreso] = useState<Egreso | null>(null);
  const [selectedEgresoForInfo, setSelectedEgresoForInfo] = useState<Egreso | null>(null);
  const [isInfoDialogOpen, setIsInfoDialogOpen] = useState(false);

  const openInfoDialog = (egreso: Egreso) => {
    setSelectedEgresoForInfo(egreso);
    setIsInfoDialogOpen(true);
  };

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

  const getEstadoBadge = (estado: string | null) => {
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

    // Manejar caso cuando estado es null o undefined
    const estadoValue = estado || 'pendiente';

    return (
      <Badge className={colors[estadoValue as keyof typeof colors] || colors.pendiente}>
        {estadoValue.toUpperCase()}
      </Badge>
    );
  };

  const canEdit = (egreso: Egreso | null) => {
    if (!egreso) return false;
    // Solo permitir editar egresos pendientes o aprobados (no pagados, cancelados o rechazados)
    return ['pendiente', 'aprobado'].includes(egreso.estado) && egresosUtils.canEdit(userRole);
  };

  const canDelete = (egreso: Egreso | null) => {
    if (!egreso) return false;
    // Solo permitir eliminar egresos pendientes o aprobados (no pagados, cancelados o rechazados)
    // Los cajeros solo pueden eliminar egresos que ellos crearon
    if (userRole === 'cajero') {
      return ['pendiente', 'aprobado'].includes(egreso.estado) && egresosUtils.canDelete(userRole);
    }
    return ['pendiente', 'aprobado'].includes(egreso.estado) && egresosUtils.canEdit(userRole);
  };

  const canApprove = (egreso: Egreso | null) => {
    if (!egreso) return false;
    return egreso.estado === 'pendiente' && egresosUtils.canApprove(userRole);
  };

  const canPay = (egreso: Egreso | null) => {
    if (!egreso) return false;
    // Solo mostrar botón de pagar si el egreso NO está pagado y el usuario tiene permisos
    return !['pagado', 'cancelado', 'rechazado'].includes(egreso.estado) && egresosUtils.canPay(userRole);
  };

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <Card>
        <CardHeader className="pb-3 p-3 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <CardTitle className="text-lg sm:text-xl">Filtros de Búsqueda</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="w-full sm:w-auto"
            >
              <Filter className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">{showFilters ? 'Ocultar' : 'Mostrar'} Filtros</span>
              <span className="sm:hidden">{showFilters ? 'Ocultar' : 'Filtros'}</span>
            </Button>
          </div>
        </CardHeader>
        
        {showFilters && (
          <CardContent className="pt-0 p-3 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
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
                  value={filtros.id_categoria_egreso?.toString() || 'all'}
                  onValueChange={(value) => 
                    handleFilterChange('id_categoria_egreso', value === 'all' ? undefined : parseInt(value))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas las categorías" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las categorías</SelectItem>
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
                  value={filtros.estado || 'all'}
                  onValueChange={(value) => handleFilterChange('estado', value === 'all' ? undefined : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los estados" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
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
        <CardHeader className="p-3 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <CardTitle className="text-lg sm:text-xl">
              Egresos ({pagination.total} total)
            </CardTitle>
            <div className="text-sm text-gray-500">
              Página {pagination.page} de {pagination.pages}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : egresos.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No se encontraron egresos con los filtros aplicados
            </div>
          ) : (
            <>
              {/* Vista móvil: Tarjetas */}
              <div className="lg:hidden space-y-3">
                {egresos.map((egreso) => (
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
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: egreso.categoria_color }}
                              />
                              <span className="truncate">{egreso.categoria_nombre}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              {getEstadoBadge(egreso.estado)}
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
                              <FileText className="h-4 w-4 text-gray-400" />
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
              </div>
            </>
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
                  <Label className="text-gray-500">Estado</Label>
                  <div className="mt-1">
                    {getEstadoBadge(selectedEgresoForInfo.estado)}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-gray-500">Proveedor</Label>
                  <p className="font-medium">{selectedEgresoForInfo.proveedor_nombre || '-'}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Método de Pago</Label>
                  <div className="flex items-center gap-1">
                    <FileText className="h-4 w-4 text-gray-400" />
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
            <Button
              onClick={() => {
                setIsInfoDialogOpen(false);
                if (selectedEgresoForInfo) {
                  onView(selectedEgresoForInfo);
                }
              }}
              className="w-full sm:w-auto"
            >
              Ver Detalles
            </Button>
            {canEdit(selectedEgresoForInfo) && (
              <Button
                variant="outline"
                onClick={() => {
                  setIsInfoDialogOpen(false);
                  if (selectedEgresoForInfo) {
                    onEdit(selectedEgresoForInfo);
                  }
                }}
                className="w-full sm:w-auto"
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
            )}
            {canDelete(selectedEgresoForInfo) && (
              <Button
                variant="destructive"
                onClick={() => {
                  setIsInfoDialogOpen(false);
                  if (selectedEgresoForInfo && confirm('¿Estás seguro de cancelar este egreso?')) {
                    onDelete(selectedEgresoForInfo.id_egreso);
                  }
                }}
                className="w-full sm:w-auto"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
