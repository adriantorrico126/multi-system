import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { 
  getConfiguracionMesas, 
  crearMesa, 
  actualizarMesa, 
  eliminarMesa 
} from '@/services/api';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  Settings,
  AlertCircle,
  Save,
  X,
  CheckCircle,
  Coffee,
  Clock
} from 'lucide-react';

interface MesaConfigurationProps {
  sucursalId: number;
}

interface MesaConfig {
  id_mesa: number;
  numero: number;
  capacidad: number;
  estado: string;
  created_at: string;
  updated_at: string;
}

export default function MesaConfiguration({ sucursalId }: MesaConfigurationProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingMesa, setEditingMesa] = useState<MesaConfig | null>(null);
  const [formData, setFormData] = useState({
    numero: '',
    capacidad: '4',
    estado: 'libre'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Query para obtener configuración de mesas
  const { data: mesas, isLoading, refetch } = useQuery({
    queryKey: ['mesas-configuracion', sucursalId],
    queryFn: () => getConfiguracionMesas(sucursalId),
    enabled: !!sucursalId
  });

  // Mutación para crear mesa
  const createMesaMutation = useMutation({
    mutationFn: crearMesa,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mesas-configuracion', sucursalId] });
      toast({
        title: "✅ Mesa creada exitosamente",
        description: "La mesa se ha agregado al sistema.",
      });
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "❌ Error al crear mesa",
        description: error.response?.data?.message || "No se pudo crear la mesa. Verifique los datos.",
        variant: "destructive",
      });
    }
  });

  // Mutación para actualizar mesa
  const updateMesaMutation = useMutation({
    mutationFn: ({ id_mesa, data }: { id_mesa: number; data: any }) => 
      actualizarMesa(id_mesa, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mesas-configuracion', sucursalId] });
      toast({
        title: "✅ Mesa actualizada exitosamente",
        description: "Los cambios se han guardado correctamente.",
      });
      setIsEditDialogOpen(false);
      setEditingMesa(null);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "❌ Error al actualizar mesa",
        description: error.response?.data?.message || "No se pudieron guardar los cambios.",
        variant: "destructive",
      });
    }
  });

  // Mutación para eliminar mesa
  const deleteMesaMutation = useMutation({
    mutationFn: eliminarMesa,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mesas-configuracion', sucursalId] });
      toast({
        title: "✅ Mesa eliminada exitosamente",
        description: "La mesa se ha removido del sistema.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "❌ Error al eliminar mesa",
        description: error.response?.data?.message || "No se pudo eliminar la mesa.",
        variant: "destructive",
      });
    }
  });

  const resetForm = () => {
    setFormData({
      numero: '',
      capacidad: '4',
      estado: 'libre'
    });
    setIsSubmitting(false);
  };

  const handleCreateMesa = async () => {
    if (!formData.numero || !formData.numero.trim()) {
      toast({
        title: "⚠️ Campo requerido",
        description: "El número de mesa es obligatorio.",
        variant: "destructive",
      });
      return;
    }

    const numero = parseInt(formData.numero);
    if (numero <= 0) {
      toast({
        title: "⚠️ Número inválido",
        description: "El número de mesa debe ser mayor a 0.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    createMesaMutation.mutate({
      numero: numero,
      id_sucursal: sucursalId,
      capacidad: parseInt(formData.capacidad),
      estado: formData.estado
    });
  };

  const handleEditMesa = (mesa: MesaConfig) => {
    setEditingMesa(mesa);
    setFormData({
      numero: mesa.numero.toString(),
      capacidad: mesa.capacidad.toString(),
      estado: mesa.estado
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateMesa = async () => {
    if (!editingMesa || !formData.numero || !formData.numero.trim()) {
      toast({
        title: "⚠️ Datos incompletos",
        description: "Complete todos los campos requeridos.",
        variant: "destructive",
      });
      return;
    }

    const numero = parseInt(formData.numero);
    if (numero <= 0) {
      toast({
        title: "⚠️ Número inválido",
        description: "El número de mesa debe ser mayor a 0.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    updateMesaMutation.mutate({
      id_mesa: editingMesa.id_mesa,
      data: {
        numero: numero,
        capacidad: parseInt(formData.capacidad),
        estado: formData.estado,
        id_sucursal: sucursalId
      }
    });
  };

  const handleDeleteMesa = (mesa: MesaConfig) => {
    if (mesa.estado !== 'libre') {
      toast({
        title: "⚠️ Mesa en uso",
        description: "No se puede eliminar una mesa que está siendo utilizada.",
        variant: "destructive",
      });
      return;
    }
  };

  const getEstadoBadge = (estado: string) => {
    const estados = {
      libre: { variant: 'default' as const, text: 'Libre', icon: <CheckCircle className="h-3 w-3" /> },
      en_uso: { variant: 'secondary' as const, text: 'En Uso', icon: <Coffee className="h-3 w-3" /> },
      pendiente_cobro: { variant: 'destructive' as const, text: 'Pendiente Cobro', icon: <AlertCircle className="h-3 w-3" /> },
      reservada: { variant: 'outline' as const, text: 'Reservada', icon: <Clock className="h-3 w-3" /> },
      mantenimiento: { variant: 'destructive' as const, text: 'Mantenimiento', icon: <X className="h-3 w-3" /> }
    };
    
    const estadoConfig = estados[estado as keyof typeof estados] || estados.libre;
    return (
      <Badge variant={estadoConfig.variant} className="flex items-center gap-1">
        {estadoConfig.icon}
        {estadoConfig.text}
      </Badge>
    );
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'libre': return 'text-green-600';
      case 'en_uso': return 'text-blue-600';
      case 'pendiente_cobro': return 'text-yellow-600';
      case 'reservada': return 'text-purple-600';
      case 'mantenimiento': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <span className="ml-3 text-gray-600">Cargando configuración de mesas...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Settings className="h-5 w-5" />
              Configuración de Mesas
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Gestiona las mesas disponibles en la sucursal
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => refetch()}>
              Actualizar
            </Button>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => resetForm()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Mesa
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Crear Nueva Mesa
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="numero">Número de Mesa *</Label>
                    <Input
                      id="numero"
                      type="number"
                      value={formData.numero}
                      onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                      placeholder="Ej: 1"
                      min="1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="capacidad">Capacidad</Label>
                    <Select value={formData.capacidad} onValueChange={(value) => setFormData({ ...formData, capacidad: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2">2 personas</SelectItem>
                        <SelectItem value="4">4 personas</SelectItem>
                        <SelectItem value="6">6 personas</SelectItem>
                        <SelectItem value="8">8 personas</SelectItem>
                        <SelectItem value="10">10 personas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="estado">Estado Inicial</Label>
                    <Select value={formData.estado} onValueChange={(value) => setFormData({ ...formData, estado: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="libre">Libre</SelectItem>
                        <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleCreateMesa}
                    disabled={createMesaMutation.isPending || isSubmitting}
                  >
                    {createMesaMutation.isPending || isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Creando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Crear Mesa
                      </>
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Número</TableHead>
                  <TableHead className="w-[120px]">Capacidad</TableHead>
                  <TableHead className="w-[150px]">Estado</TableHead>
                  <TableHead className="w-[120px]">Creada</TableHead>
                  <TableHead className="w-[120px]">Actualizada</TableHead>
                  <TableHead className="w-[150px] text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mesas?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <Coffee className="h-8 w-8" />
                        <p>No hay mesas configuradas</p>
                        <p className="text-sm">Crea la primera mesa para comenzar</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  mesas?.map((mesa: MesaConfig) => (
                    <TableRow key={mesa.id_mesa} className="hover:bg-muted/50">
                      <TableCell className="font-medium">
                        Mesa {mesa.numero}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          {mesa.capacidad} personas
                        </div>
                      </TableCell>
                      <TableCell>
                        {getEstadoBadge(mesa.estado)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(mesa.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(mesa.updated_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditMesa(mesa)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={mesa.estado !== 'libre'}
                                className="h-8 w-8 p-0"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Eliminar mesa?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta acción no se puede deshacer. Se eliminará permanentemente la mesa {mesa.numero}.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteMesaMutation.mutate(mesa.id_mesa)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog para editar mesa */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-4 w-4" />
              Editar Mesa {editingMesa?.numero}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-numero">Número de Mesa *</Label>
              <Input
                id="edit-numero"
                type="number"
                value={formData.numero}
                onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                placeholder="Ej: 1"
                min="1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-capacidad">Capacidad</Label>
              <Select value={formData.capacidad} onValueChange={(value) => setFormData({ ...formData, capacidad: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 personas</SelectItem>
                  <SelectItem value="4">4 personas</SelectItem>
                  <SelectItem value="6">6 personas</SelectItem>
                  <SelectItem value="8">8 personas</SelectItem>
                  <SelectItem value="10">10 personas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-estado">Estado</Label>
              <Select value={formData.estado} onValueChange={(value) => setFormData({ ...formData, estado: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="libre">Libre</SelectItem>
                  <SelectItem value="en_uso">En Uso</SelectItem>
                  <SelectItem value="pendiente_cobro">Pendiente Cobro</SelectItem>
                  <SelectItem value="reservada">Reservada</SelectItem>
                  <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleUpdateMesa}
              disabled={updateMesaMutation.isPending || isSubmitting}
            >
              {updateMesaMutation.isPending || isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Guardar Cambios
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 