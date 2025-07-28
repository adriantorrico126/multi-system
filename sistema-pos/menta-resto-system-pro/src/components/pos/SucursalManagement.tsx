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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Gestión de Sucursales
            </CardTitle>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openAddDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Sucursal
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
        <CardContent>
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
                    <TableHead>Ciudad</TableHead>
                    <TableHead>Dirección</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSucursales.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        {searchTerm ? 'No se encontraron sucursales que coincidan con la búsqueda.' : 'No hay sucursales registradas.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSucursales.map((sucursal) => (
                      <TableRow key={sucursal.id_sucursal}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Store className="h-4 w-4 text-gray-500" />
                            {sucursal.nombre}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-gray-500" />
                            {sucursal.ciudad}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {sucursal.direccion || 'Sin dirección'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={sucursal.activo ? "default" : "secondary"}>
                            {sucursal.activo ? "Activa" : "Inactiva"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
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
    </div>
  );
} 