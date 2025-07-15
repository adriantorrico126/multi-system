import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash, Search, User, Shield, UserCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUsers, createUser, getBranches, deleteUser } from '@/services/api';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

interface User {
  id: string;
  nombre: string;
  username: string;
  email: string;
  rol: 'cajero' | 'admin' | 'cocinero';
  activo: boolean;
  created_at: string;
  id_sucursal: number;
  sucursal_nombre: string;
}

import { useAuth } from '../../context/AuthContext'; // Import useAuth

export function UserManagement() {
  const { user } = useAuth(); // Get user from AuthContext
  const currentUserRole = user?.rol; // Assign to a variable for easier migration

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  const { data: users = [], isLoading: isLoadingUsers } = useQuery<User[]>({ queryKey: ['users'], queryFn: getUsers });
  const { data: branches = [], isLoading: isLoadingBranches } = useQuery<any[]>({ queryKey: ['branches'], queryFn: getBranches });

  const [formData, setFormData] = useState({
    nombre: '',
    username: '',
    email: '',
    password: '',
    rol: 'cajero' as 'cajero' | 'admin' | 'cocinero',
    activo: true,
    id_sucursal: 0, // Initialize with 0, will be updated in useEffect
  });

  // Set default branch once branches are loaded
  useEffect(() => {
    if (branches.length > 0 && formData.id_sucursal === 0) {
      setFormData(prev => ({ ...prev, id_sucursal: branches[0].id_sucursal }));
    }
  }, [branches, formData.id_sucursal]);

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = user.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = selectedRole === 'all' || user.rol === selectedRole;
      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, selectedRole]);

  const resetForm = () => {
    setFormData({
      nombre: '',
      username: '',
      email: '',
      password: '',
      rol: 'cajero',
      activo: true,
      id_sucursal: 0,
    });
  };

  const createUserMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ['users'] });
      if (user?.rol === 'admin') {
        toast({
          title: "Usuario Creado",
          description: `${formData.nombre} ha sido registrado exitosamente`,
        });
      }
      resetForm();
      setIsAddDialogOpen(false);
    },
    onError: (error: any) => {
      if (user?.rol === 'admin') {
        toast({
          title: "Error al crear usuario",
          description: error.message || "No se pudo crear el usuario. Intenta nuevamente.",
          variant: "destructive",
        });
      }
    }
  });

  const handleAddUser = () => {
    if (!formData.nombre || !formData.username || !formData.email || !formData.password || formData.id_sucursal === 0) {
      toast({
        title: "Error",
        description: "Todos los campos son obligatorios",
        variant: "destructive"
      });
      return;
    }

    createUserMutation.mutate({
      nombre: formData.nombre,
      username: formData.username,
      email: formData.email,
      password: formData.password,
      rol: formData.rol,
      id_sucursal: formData.id_sucursal,
    });
  };

  const editUserMutation = useMutation({
    mutationFn: (userData: any) => createUser(userData), // Reusing createUser for now, will need a dedicated updateUser endpoint
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ['users'] });
      if (user?.rol === 'admin') {
        toast({
          title: "Usuario Actualizado",
          description: `${formData.nombre} ha sido actualizado exitosamente`
        });
      }
      resetForm();
      setEditingUser(null);
      setIsEditDialogOpen(false);
    },
    onError: (error: any) => {
      if (user?.rol === 'admin') {
        toast({
          title: "Error al actualizar usuario",
          description: error.message || "No se pudo actualizar el usuario. Intenta nuevamente.",
          variant: "destructive"
        });
      }
    },
  });

  const handleEditUser = () => {
    if (!editingUser || !formData.nombre || !formData.username || !formData.email || formData.id_sucursal === 0) {
      toast({
        title: "Error",
        description: "Todos los campos son obligatorios",
        variant: "destructive"
      });
      return;
    }

    editUserMutation.mutate({
      id: editingUser.id,
      nombre: formData.nombre,
      username: formData.username,
      email: formData.email,
      password: formData.password || undefined, // Only send password if it's changed
      rol: formData.rol,
      id_sucursal: formData.id_sucursal,
      activo: formData.activo,
    });
  };

  const deleteUserMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ['users'] });
      toast({
        title: 'Usuario Eliminado',
        description: 'El usuario ha sido eliminado exitosamente.',
        variant: 'destructive',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error al eliminar usuario',
        description: error?.response?.data?.message || error.message || 'No se pudo eliminar el usuario.',
        variant: 'destructive',
      });
    },
  });

  const handleDeleteUser = (userId: string) => {
    setUserToDelete(userId);
  };

  const confirmDeleteUser = () => {
    if (userToDelete) {
      deleteUserMutation.mutate(userToDelete);
      setUserToDelete(null);
    }
  };

  const openEditDialog = (user: User) => {
    setEditingUser(user);
    setFormData({
      nombre: user.nombre,
      username: user.username,
      email: user.email,
      password: '',
      rol: user.rol,
      activo: user.activo,
      id_sucursal: user.id_sucursal,
    });
    setIsEditDialogOpen(true);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield className="h-4 w-4" />;
      case 'cocinero': return <UserCheck className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'cocinero': return 'bg-blue-100 text-blue-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Gestión de Usuarios
            </CardTitle>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Usuario
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
                <DialogHeader>
                  <DialogTitle>Registrar Nuevo Usuario</DialogTitle>
                </DialogHeader>
                <div className="space-y-5 pt-2">
                  <div>
                    <Label htmlFor="nombre">Nombre Completo</Label>
                    <Input
                      id="nombre"
                      value={formData.nombre}
                      onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                      placeholder="Nombre completo del usuario"
                      className="bg-white border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div>
                    <Label htmlFor="username">Nombre de Usuario</Label>
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={(e) => setFormData({...formData, username: e.target.value})}
                      placeholder="username"
                      className="bg-white border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="usuario@email.com"
                      className="bg-white border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">Contraseña</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      placeholder="Contraseña segura"
                      className="bg-white border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div>
                    <Label htmlFor="rol">Rol</Label>
                    <Select value={formData.rol} onValueChange={(value: 'cajero' | 'admin' | 'cocinero') => setFormData({...formData, rol: value})}>
                      <SelectTrigger className="bg-white border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/30">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem key="cajero" value="cajero">Cajero</SelectItem>
                        <SelectItem key="admin" value="admin">Administrador</SelectItem>
                        <SelectItem key="cocinero" value="cocinero">Cocinero</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="sucursal">Sucursal</Label>
                    <Select value={formData.id_sucursal.toString()} onValueChange={(value) => setFormData({...formData, id_sucursal: Number(value)})}>
                      <SelectTrigger className="bg-white border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/30">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {branches.map(branch => (
                          <SelectItem key={branch.id_sucursal} value={branch.id_sucursal.toString()}>
                            {branch.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <Button variant="secondary" onClick={() => setIsAddDialogOpen(false)} className="px-6 py-2">Cancelar</Button>
                    <Button onClick={handleAddUser} disabled={createUserMutation.isPending} className="px-6 py-2">
                      {createUserMutation.isPending ? 'Guardando...' : 'Guardar'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="flex gap-4 mt-4 flex-wrap">
            <div className="relative max-w-xs">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar usuarios..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedRole} onValueChange={value => setSelectedRole(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem key="all" value="all">Todos los roles</SelectItem>
                <SelectItem key="cajero" value="cajero">Cajero</SelectItem>
                <SelectItem key="admin" value="admin">Administrador</SelectItem>
                <SelectItem key="cocinero" value="cocinero">Cocinero</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingUsers || isLoadingBranches ? (
            <p>Cargando usuarios...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Sucursal</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow key="no-users">
                    <TableCell colSpan={7} className="text-center p-4">No se encontraron usuarios</TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map(user => (
                    <TableRow key={user.id}>
                      <TableCell>{user.nombre}</TableCell>
                      <TableCell>{user.username}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge className={`${getRoleBadgeColor(user.rol)} flex items-center gap-1`}>
                          {getRoleIcon(user.rol)}
                          {user.rol.charAt(0).toUpperCase() + user.rol.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.activo ? 'Activo' : 'Inactivo'}</TableCell>
                      <TableCell>{user.sucursal_nombre}</TableCell>
                      <TableCell className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => openEditDialog(user)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span>
                                {user.rol === 'admin' ? (
                                  <Button size="sm" variant="destructive" disabled>
                                    <Trash className="h-4 w-4" />
                                  </Button>
                                ) : (
                                  <Button size="sm" variant="destructive" onClick={() => handleDeleteUser(user.id)}>
                                    <Trash className="h-4 w-4" />
                                  </Button>
                                )}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              {user.rol === 'admin' ? 'No se puede eliminar al administrador principal.' : 'Eliminar usuario'}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Editar Usuario */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-nombre">Nombre Completo</Label>
              <Input
                id="edit-nombre"
                value={formData.nombre}
                onChange={(e) => setFormData({...formData, nombre: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="edit-username">Nombre de Usuario</Label>
              <Input
                id="edit-username"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="edit-password">Contraseña (dejar en blanco para no cambiar)</Label>
              <Input
                id="edit-password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="edit-rol">Rol</Label>
              <Select
                value={formData.rol}
                onValueChange={(value: 'cajero' | 'admin' | 'cocinero') => setFormData({...formData, rol: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem key="cajero" value="cajero">Cajero</SelectItem>
                  <SelectItem key="admin" value="admin">Administrador</SelectItem>
                  <SelectItem key="cocinero" value="cocinero">Cocinero</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-sucursal">Sucursal</Label>
              <Select
                value={formData.id_sucursal.toString()}
                onValueChange={(value) => setFormData({...formData, id_sucursal: Number(value)})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {branches.map(branch => (
                    <SelectItem key={branch.id_sucursal} value={branch.id_sucursal.toString()}>
                      {branch.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-activo">Activo</Label>
              <Select
                value={formData.activo ? 'true' : 'false'}
                onValueChange={(value) => setFormData({...formData, activo: value === 'true'})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem key="true" value="true">Activo</SelectItem>
                  <SelectItem key="false" value="false">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setIsEditDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleEditUser} disabled={editUserMutation.isPending}>
                {editUserMutation.isPending ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmación de eliminación */}
      <AlertDialog open={!!userToDelete} onOpenChange={open => !open && setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro que desea eliminar este usuario?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El usuario será marcado como inactivo y no podrá acceder al sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setUserToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteUser} autoFocus>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
