import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Edit, 
  Trash, 
  Search, 
  Store, 
  MapPin, 
  Building,
  Users,
  Activity,
  Target,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Download,
  RefreshCw,
  BarChart3,
  Globe,
  Phone,
  Mail
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getBranches, createSucursal, updateSucursal, deleteSucursal } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Sucursal {
  id_sucursal: number;
  nombre: string;
  ciudad: string;
  direccion: string;
  activo: boolean;
  id_restaurante: number;
}

interface SucursalManagementProps {
  currentUserRole: string;
}

export function SucursalManagement({ currentUserRole }: SucursalManagementProps) {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [editingSucursal, setEditingSucursal] = useState<Sucursal | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [sucursalToDelete, setSucursalToDelete] = useState<Sucursal | null>(null);
  const [selectedSucursalForInfo, setSelectedSucursalForInfo] = useState<Sucursal | null>(null);
  const [isInfoDialogOpen, setIsInfoDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: sucursales = [], isLoading: isLoadingSucursales } = useQuery<Sucursal[]>({ 
    queryKey: ['branches'], 
    queryFn: getBranches 
  });

  const [formData, setFormData] = useState({
    nombre: '',
    ciudad: '',
    direccion: '',
    activo: true
  });

  const filteredSucursales = useMemo(() => {
    return sucursales.filter(sucursal => {
      const matchesSearch = sucursal.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           sucursal.ciudad.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           sucursal.direccion.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = selectedStatus === 'all' || 
                           (selectedStatus === 'active' && sucursal.activo) ||
                           (selectedStatus === 'inactive' && !sucursal.activo);
      return matchesSearch && matchesStatus;
    });
  }, [sucursales, searchTerm, selectedStatus]);

  const resetForm = () => {
    setFormData({
      nombre: '',
      ciudad: '',
      direccion: '',
      activo: true
    });
  };

  // Calcular estadísticas
  const stats = {
    total: sucursales.length,
    active: sucursales.filter(s => s.activo).length,
    inactive: sucursales.filter(s => !s.activo).length,
    cities: [...new Set(sucursales.map(s => s.ciudad))].length,
    avgPerCity: sucursales.length > 0 ? sucursales.length / [...new Set(sucursales.map(s => s.ciudad))].length : 0
  };

  const createSucursalMutation = useMutation({
    mutationFn: createSucursal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      toast({
        title: "✅ Sucursal Creada",
        description: `${formData.nombre} ha sido creada exitosamente`,
      });
      resetForm();
      setIsAddDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "❌ Error al crear sucursal",
        description: error.response?.data?.message || "No se pudo crear la sucursal. Verifique los datos.",
        variant: "destructive",
      });
    }
  });

  const updateSucursalMutation = useMutation({
    mutationFn: ({ id_sucursal, data }: { id_sucursal: number; data: any }) => 
      updateSucursal(id_sucursal, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      toast({
        title: "✅ Sucursal Actualizada",
        description: `${formData.nombre} ha sido actualizada exitosamente`,
      });
      resetForm();
      setEditingSucursal(null);
      setIsEditDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "❌ Error al actualizar sucursal",
        description: error.response?.data?.message || "No se pudo actualizar la sucursal. Verifique los datos.",
        variant: "destructive",
      });
    }
  });

  const deleteSucursalMutation = useMutation({
    mutationFn: deleteSucursal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      toast({
        title: "✅ Sucursal Eliminada",
        description: `${sucursalToDelete?.nombre} ha sido eliminada exitosamente`,
      });
      setSucursalToDelete(null);
      setIsDeleteDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "❌ Error al eliminar sucursal",
        description: error.response?.data?.message || "No se pudo eliminar la sucursal. Verifique que no tenga usuarios o mesas asignadas.",
        variant: "destructive",
      });
    }
  });

  const handleAddSucursal = () => {
    if (!formData.nombre || !formData.ciudad) {
      toast({
        title: "⚠️ Campos requeridos",
        description: "Nombre y ciudad son campos obligatorios.",
        variant: "destructive"
      });
      return;
    }

    createSucursalMutation.mutate({
      nombre: formData.nombre.trim(),
      ciudad: formData.ciudad.trim(),
      direccion: formData.direccion.trim()
    });
  };

  const handleEditSucursal = (sucursal: Sucursal) => {
    setEditingSucursal(sucursal);
    setFormData({
      nombre: sucursal.nombre,
      ciudad: sucursal.ciudad,
      direccion: sucursal.direccion,
      activo: sucursal.activo
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateSucursal = () => {
    if (!editingSucursal || !formData.nombre || !formData.ciudad) {
      toast({
        title: "⚠️ Campos requeridos",
        description: "Nombre y ciudad son campos obligatorios.",
        variant: "destructive"
      });
      return;
    }

    updateSucursalMutation.mutate({
      id_sucursal: editingSucursal.id_sucursal,
      data: {
        nombre: formData.nombre.trim(),
        ciudad: formData.ciudad.trim(),
        direccion: formData.direccion.trim(),
        activo: editingSucursal.activo
      }
    });
  };

  const handleDeleteSucursal = (sucursal: Sucursal) => {
    setSucursalToDelete(sucursal);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteSucursal = () => {
    if (sucursalToDelete) {
      deleteSucursalMutation.mutate(sucursalToDelete.id_sucursal);
    }
  };

  const openAddDialog = () => {
    resetForm();
    setIsAddDialogOpen(true);
  };

  const openInfoDialog = (sucursal: Sucursal) => {
    setSelectedSucursalForInfo(sucursal);
    setIsInfoDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="p-3 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl lg:text-3xl">
              <Building className="h-5 w-5 sm:h-6 sm:w-6" />
              Gestión de Sucursales
            </CardTitle>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openAddDialog} className="w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Agregar Sucursal</span>
                  <span className="sm:hidden">Agregar</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Agregar Nueva Sucursal</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="nombre">Nombre de la Sucursal *</Label>
                    <Input
                      id="nombre"
                      value={formData.nombre}
                      onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                      placeholder="Ej: Sucursal Centro"
                    />
                  </div>
                  <div>
                    <Label htmlFor="ciudad">Ciudad *</Label>
                    <Input
                      id="ciudad"
                      value={formData.ciudad}
                      onChange={(e) => setFormData({...formData, ciudad: e.target.value})}
                      placeholder="Ej: Caracas"
                    />
                  </div>
                  <div>
                    <Label htmlFor="direccion">Dirección</Label>
                    <Input
                      id="direccion"
                      value={formData.direccion}
                      onChange={(e) => setFormData({...formData, direccion: e.target.value})}
                      placeholder="Ej: Av. Principal, Centro Comercial ABC"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="secondary" onClick={() => setIsAddDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleAddSucursal} disabled={createSucursalMutation.isPending}>
                      {createSucursalMutation.isPending ? 'Guardando...' : 'Guardar'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar sucursales..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {isLoadingSucursales ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2 text-gray-600">Cargando sucursales...</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead className="hidden lg:table-cell">Ciudad</TableHead>
                    <TableHead className="hidden lg:table-cell">Dirección</TableHead>
                    <TableHead className="hidden lg:table-cell">Estado</TableHead>
                    <TableHead className="text-right hidden lg:table-cell">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSucursales.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={1} className="text-center py-8 text-gray-500">
                        {searchTerm ? 'No se encontraron sucursales que coincidan con la búsqueda.' : 'No hay sucursales registradas.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSucursales.map((sucursal) => (
                      <TableRow key={sucursal.id_sucursal}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Store className="h-4 w-4 text-gray-500" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="truncate">{sucursal.nombre}</span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => openInfoDialog(sucursal)}
                                  className="lg:hidden p-1 h-6 w-6 hover:bg-blue-100 text-blue-600 hover:text-blue-700"
                                >
                                  <Eye className="h-3 w-3" />
                                </Button>
                              </div>
                              <div className="lg:hidden mt-1 space-y-1">
                                <div className="flex items-center gap-1 text-sm text-gray-600">
                                  <MapPin className="h-3 w-3" />
                                  <span className="truncate">{sucursal.ciudad}</span>
                                </div>
                                <div className="text-xs text-gray-500 truncate">
                                  {sucursal.direccion || 'Sin dirección'}
                                </div>
                                <Badge variant={sucursal.activo ? "default" : "secondary"} className="text-xs">
                                  {sucursal.activo ? "Activa" : "Inactiva"}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-gray-500" />
                            {sucursal.ciudad}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs truncate hidden lg:table-cell">
                          {sucursal.direccion || 'Sin dirección'}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <Badge variant={sucursal.activo ? "default" : "secondary"}>
                            {sucursal.activo ? "Activa" : "Inactiva"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right hidden lg:table-cell">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditSucursal(sucursal)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteSucursal(sucursal)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog para editar sucursal */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Sucursal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-nombre">Nombre de la Sucursal *</Label>
              <Input
                id="edit-nombre"
                value={formData.nombre}
                onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                placeholder="Ej: Sucursal Centro"
              />
            </div>
            <div>
              <Label htmlFor="edit-ciudad">Ciudad *</Label>
              <Input
                id="edit-ciudad"
                value={formData.ciudad}
                onChange={(e) => setFormData({...formData, ciudad: e.target.value})}
                placeholder="Ej: Caracas"
              />
            </div>
            <div>
              <Label htmlFor="edit-direccion">Dirección</Label>
              <Input
                id="edit-direccion"
                value={formData.direccion}
                onChange={(e) => setFormData({...formData, direccion: e.target.value})}
                placeholder="Ej: Av. Principal, Centro Comercial ABC"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setIsEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleUpdateSucursal} disabled={updateSucursalMutation.isPending}>
                {updateSucursalMutation.isPending ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para confirmar eliminación */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-600">
              ¿Está seguro de que desea eliminar la sucursal <strong>"{sucursalToDelete?.nombre}"</strong>?
            </p>
            <p className="text-sm text-gray-500">
              Esta acción no se puede deshacer. Asegúrese de que la sucursal no tenga usuarios o mesas asignadas.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setIsDeleteDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                variant="destructive" 
                onClick={confirmDeleteSucursal}
                disabled={deleteSucursalMutation.isPending}
              >
                {deleteSucursalMutation.isPending ? 'Eliminando...' : 'Eliminar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de información de sucursal */}
      <Dialog open={isInfoDialogOpen} onOpenChange={setIsInfoDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Información de Sucursal
            </DialogTitle>
          </DialogHeader>
          {selectedSucursalForInfo && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Nombre</label>
                <p className="text-lg font-semibold text-gray-900">{selectedSucursalForInfo.nombre}</p>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">ID</label>
                <p className="text-sm text-gray-600">#{selectedSucursalForInfo.id_sucursal}</p>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Ciudad</label>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <p className="text-sm text-gray-900">{selectedSucursalForInfo.ciudad}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Dirección</label>
                <p className="text-sm text-gray-900">{selectedSucursalForInfo.direccion || 'Sin dirección'}</p>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Estado</label>
                <Badge variant={selectedSucursalForInfo.activo ? "default" : "secondary"}>
                  {selectedSucursalForInfo.activo ? "Activa" : "Inactiva"}
                </Badge>
              </div>
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsInfoDialogOpen(false);
                setSelectedSucursalForInfo(null);
              }}
              className="w-full sm:w-auto"
            >
              Cerrar
            </Button>
            {selectedSucursalForInfo && (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsInfoDialogOpen(false);
                    handleEditSucursal(selectedSucursalForInfo);
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
                    handleDeleteSucursal(selectedSucursalForInfo);
                  }}
                  className="w-full sm:w-auto"
                >
                  <Trash className="h-4 w-4 mr-2" />
                  Eliminar
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 