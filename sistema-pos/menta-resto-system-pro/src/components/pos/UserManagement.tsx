import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Edit, 
  Trash, 
  Search, 
  User, 
  Shield, 
  UserCheck,
  Users,
  Building,
  Mail,
  Calendar,
  Eye,
  EyeOff,
  Filter,
  Download,
  RefreshCw,
  Crown,
  UserCog,
  ChefHat,
  ShoppingCart
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUsers, createUser, getBranches, deleteUser, updateUser } from '@/services/api';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface User {
  id: string;
  nombre: string;
  username: string;
  email: string;
  rol: 'cajero' | 'admin' | 'cocinero' | 'mesero' | 'super_admin';
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
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
    rol: 'cajero' as 'cajero' | 'admin' | 'cocinero' | 'mesero' | 'super_admin',
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
      const matchesStatus = selectedStatus === 'all' || 
                           (selectedStatus === 'active' && user.activo) ||
                           (selectedStatus === 'inactive' && !user.activo);
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, selectedRole, selectedStatus]);

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
    setShowPassword(false);
  };

  const createUserMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ['users'] });
      if (user?.rol === 'admin' || user?.rol === 'super_admin') {
        toast({
          title: "✅ Usuario Creado Exitosamente",
          description: `${formData.nombre} ha sido registrado en el sistema`,
        });
      }
      resetForm();
      setIsAddDialogOpen(false);
    },
    onError: (error: any) => {
      if (user?.rol === 'admin' || user?.rol === 'super_admin') {
        toast({
          title: "❌ Error al Crear Usuario",
          description: error.response?.data?.message || "No se pudo crear el usuario. Verifica los datos.",
          variant: "destructive",
        });
      }
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ userId, userData }: { userId: string; userData: any }) => {
      return updateUser(userId, userData);
    },
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ['users'] });
      if (user?.rol === 'admin' || user?.rol === 'super_admin') {
        toast({
          title: "✅ Usuario Actualizado",
          description: `${formData.nombre} ha sido actualizado exitosamente`,
        });
      }
      resetForm();
      setEditingUser(null);
      setIsEditDialogOpen(false);
    },
    onError: (error: any) => {
      if (user?.rol === 'admin' || user?.rol === 'super_admin') {
        toast({
          title: "❌ Error al Actualizar Usuario",
          description: error.response?.data?.message || "No se pudo actualizar el usuario.",
          variant: "destructive",
        });
      }
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ['users'] });
      if (user?.rol === 'admin' || user?.rol === 'super_admin') {
        toast({
          title: "✅ Usuario Eliminado",
          description: "El usuario ha sido eliminado exitosamente",
        });
      }
      setUserToDelete(null);
    },
    onError: (error: any) => {
      if (user?.rol === 'admin' || user?.rol === 'super_admin') {
        toast({
          title: "❌ Error al Eliminar Usuario",
          description: error.response?.data?.message || "No se pudo eliminar el usuario.",
          variant: "destructive",
        });
      }
    },
  });

  const handleAddUser = () => {
    if (!formData.nombre || !formData.username || !formData.password || !formData.rol || formData.id_sucursal === 0) {
      toast({
        title: "❌ Campos Requeridos",
        description: "Todos los campos son obligatorios",
        variant: "destructive",
      });
      return;
    }

    createUserMutation.mutate({
      nombre: formData.nombre,
      username: formData.username,
      email: formData.email,
      password: formData.password,
      rol: formData.rol,
      activo: formData.activo,
      id_sucursal: formData.id_sucursal,
    });
  };

  const handleEditUser = () => {
    if (!editingUser) return;

    if (!formData.nombre || !formData.username || !formData.rol || formData.id_sucursal === 0) {
      toast({
        title: "❌ Campos Requeridos",
        description: "Los campos nombre, usuario, rol y sucursal son obligatorios",
        variant: "destructive",
      });
      return;
    }

    updateUserMutation.mutate({
      userId: editingUser.id,
      userData: {
        nombre: formData.nombre,
        username: formData.username,
        email: formData.email,
        password: formData.password || undefined, // Solo enviar si se cambió
        rol: formData.rol,
        activo: formData.activo,
        id_sucursal: formData.id_sucursal,
      },
    });
  };

  const handleDeleteUser = (userId: string) => {
    setUserToDelete(userId);
  };

  const confirmDeleteUser = () => {
    if (userToDelete) {
      deleteUserMutation.mutate(userToDelete);
    }
  };

  const openEditDialog = (user: User) => {
    setEditingUser(user);
    setFormData({
      nombre: user.nombre,
      username: user.username,
      email: user.email,
      password: '', // No mostrar contraseña actual
      rol: user.rol,
      activo: user.activo,
      id_sucursal: user.id_sucursal,
    });
    setIsEditDialogOpen(true);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield className="h-4 w-4" />;
      case 'cocinero': return <ChefHat className="h-4 w-4" />;
      case 'mesero': return <ShoppingCart className="h-4 w-4" />;
      case 'super_admin': return <Crown className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800 border-red-200';
      case 'cocinero': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'mesero': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'super_admin': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'cocinero': return 'Cocinero';
      case 'mesero': return 'Mesero';
      case 'super_admin': return 'Super Admin';
      default: return 'Cajero';
    }
  };

  const stats = useMemo(() => {
    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.activo).length;
    const inactiveUsers = totalUsers - activeUsers;
    const adminUsers = users.filter(u => u.rol === 'admin' || u.rol === 'super_admin').length;
    const staffUsers = users.filter(u => u.rol === 'cajero' || u.rol === 'mesero').length;
    const kitchenUsers = users.filter(u => u.rol === 'cocinero').length;

    return {
      total: totalUsers,
      active: activeUsers,
      inactive: inactiveUsers,
      admins: adminUsers,
      staff: staffUsers,
      kitchen: kitchenUsers
    };
  }, [users]);

  return (
    <div className="space-y-6">
      {/* Header del Dashboard de Usuarios */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-900 bg-clip-text text-transparent">
            Gestión de Usuarios
          </h2>
          <p className="text-gray-600 mt-1">
            Administra usuarios, roles y permisos del sistema
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['users'] })}
            className="bg-white/80 backdrop-blur-sm border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          
          <Button
            onClick={() => setIsAddDialogOpen(true)}
            className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Usuario
          </Button>
        </div>
      </div>

      {/* Estadísticas de Usuarios */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Total Usuarios</p>
                <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
              </div>
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200/50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Usuarios Activos</p>
                <p className="text-2xl font-bold text-green-900">{stats.active}</p>
              </div>
              <div className="p-2 bg-green-500/10 rounded-lg">
                <UserCheck className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-pink-50 border border-red-200/50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-700">Usuarios Inactivos</p>
                <p className="text-2xl font-bold text-red-900">{stats.inactive}</p>
              </div>
              <div className="p-2 bg-red-500/10 rounded-lg">
                <User className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-200/50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700">Administradores</p>
                <p className="text-2xl font-bold text-purple-900">{stats.admins}</p>
              </div>
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Shield className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200/50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700">Personal</p>
                <p className="text-2xl font-bold text-orange-900">{stats.staff}</p>
              </div>
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <ShoppingCart className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-cyan-50 to-blue-50 border border-cyan-200/50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-cyan-700">Cocineros</p>
                <p className="text-2xl font-bold text-cyan-900">{stats.kitchen}</p>
              </div>
              <div className="p-2 bg-cyan-500/10 rounded-lg">
                <ChefHat className="h-5 w-5 text-cyan-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros y Búsqueda */}
      <Card className="bg-white/80 backdrop-blur-sm border border-gray-200/50 shadow-xl hover:shadow-2xl transition-all duration-300">
        <CardHeader>
          <CardTitle className="text-lg font-semibold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
            Filtros y Búsqueda
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar usuarios..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white/80 backdrop-blur-sm border-gray-200/50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                />
              </div>
            </div>
            
            <Select value={selectedRole} onValueChange={value => setSelectedRole(value)}>
              <SelectTrigger className="w-48 bg-white/80 backdrop-blur-sm border-gray-200/50">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem key="all" value="all">Todos los roles</SelectItem>
                <SelectItem key="cajero" value="cajero">Cajero</SelectItem>
                <SelectItem key="admin" value="admin">Administrador</SelectItem>
                <SelectItem key="cocinero" value="cocinero">Cocinero</SelectItem>
                <SelectItem key="mesero" value="mesero">Mesero</SelectItem>
                <SelectItem key="super_admin" value="super_admin">Super Administrador</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={selectedStatus} onValueChange={value => setSelectedStatus(value)}>
              <SelectTrigger className="w-40 bg-white/80 backdrop-blur-sm border-gray-200/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem key="all" value="all">Todos los estados</SelectItem>
                <SelectItem key="active" value="active">Activo</SelectItem>
                <SelectItem key="inactive" value="inactive">Inactivo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Usuarios */}
      <Card className="bg-white/80 backdrop-blur-sm border border-gray-200/50 shadow-xl hover:shadow-2xl transition-all duration-300">
        <CardHeader>
          <CardTitle className="text-lg font-semibold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
            Lista de Usuarios
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingUsers ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Cargando usuarios...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-gray-200 bg-gradient-to-r from-gray-50/80 to-white/80">
                    <TableHead className="h-14 px-6 text-left align-middle font-semibold text-gray-700">Usuario</TableHead>
                    <TableHead className="h-14 px-6 text-left align-middle font-semibold text-gray-700">Email</TableHead>
                    <TableHead className="h-14 px-6 text-left align-middle font-semibold text-gray-700">Rol</TableHead>
                    <TableHead className="h-14 px-6 text-left align-middle font-semibold text-gray-700">Sucursal</TableHead>
                    <TableHead className="h-14 px-6 text-left align-middle font-semibold text-gray-700">Estado</TableHead>
                    <TableHead className="h-14 px-6 text-left align-middle font-semibold text-gray-700">Fecha Creación</TableHead>
                    <TableHead className="h-14 px-6 text-center align-middle font-semibold text-gray-700">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        <div className="flex flex-col items-center gap-2">
                          <Users className="h-12 w-12 text-gray-400" />
                          <p>No se encontraron usuarios</p>
                          <p className="text-sm">Intenta ajustar los filtros de búsqueda</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id} className="border-b border-gray-100 transition-all duration-200 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50">
                        <TableCell className="p-6 align-middle">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold">
                              {user.nombre.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{user.nombre}</p>
                              <p className="text-sm text-gray-600">@{user.username}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="p-6 align-middle">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-700">{user.email}</span>
                          </div>
                        </TableCell>
                        <TableCell className="p-6 align-middle">
                          <Badge className={`${getRoleBadgeColor(user.rol)} flex items-center gap-1`}>
                            {getRoleIcon(user.rol)}
                            {getRoleDisplayName(user.rol)}
                          </Badge>
                        </TableCell>
                        <TableCell className="p-6 align-middle">
                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-700">{user.sucursal_nombre}</span>
                          </div>
                        </TableCell>
                        <TableCell className="p-6 align-middle">
                          <Badge 
                            variant={user.activo ? "success" : "destructive"}
                            className="flex items-center gap-1"
                          >
                            {user.activo ? <UserCheck className="h-3 w-3" /> : <User className="h-3 w-3" />}
                            {user.activo ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </TableCell>
                        <TableCell className="p-6 align-middle">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-700">
                              {new Date(user.created_at).toLocaleDateString('es-BO')}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="p-6 align-middle">
                          <div className="flex items-center justify-center gap-2">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => openEditDialog(user)}
                                    className="bg-white/80 backdrop-blur-sm border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-200"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Editar usuario</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span>
                                    {user.rol === 'admin' || user.rol === 'super_admin' ? (
                                      <Button size="sm" variant="destructive" disabled>
                                        <Trash className="h-4 w-4" />
                                      </Button>
                                    ) : (
                                      <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => handleDeleteUser(user.id)}
                                        className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                                      >
                                        <Trash className="h-4 w-4" />
                                      </Button>
                                    )}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {user.rol === 'admin' || user.rol === 'super_admin' ? 'No se puede eliminar al administrador principal.' : 'Eliminar usuario'}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
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

             {/* Diálogo para Agregar Usuario */}
       <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
         <DialogContent className="max-w-md bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-200/50" aria-describedby="add-user-description">
           <DialogHeader>
             <DialogTitle className="text-xl font-semibold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
               Registrar Nuevo Usuario
             </DialogTitle>
           </DialogHeader>
           <div id="add-user-description" className="sr-only">
             Formulario para registrar un nuevo usuario en el sistema
           </div>
          <div className="space-y-5 pt-2">
            <div>
              <Label htmlFor="nombre" className="text-sm font-semibold text-gray-700">Nombre Completo</Label>
                             <Input
                 id="nombre"
                 value={formData.nombre || ''}
                 onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                 placeholder="Nombre completo del usuario"
                 className="bg-white/80 backdrop-blur-sm border-gray-200/50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
               />
            </div>
            <div>
              <Label htmlFor="username" className="text-sm font-semibold text-gray-700">Nombre de Usuario</Label>
                             <Input
                 id="username"
                 value={formData.username || ''}
                 onChange={(e) => setFormData({...formData, username: e.target.value})}
                 placeholder="username"
                 className="bg-white/80 backdrop-blur-sm border-gray-200/50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
               />
            </div>
            <div>
              <Label htmlFor="email" className="text-sm font-semibold text-gray-700">Email</Label>
                             <Input
                 id="email"
                 type="email"
                 value={formData.email || ''}
                 onChange={(e) => setFormData({...formData, email: e.target.value})}
                 placeholder="usuario@email.com"
                 className="bg-white/80 backdrop-blur-sm border-gray-200/50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
               />
            </div>
            <div className="relative">
              <Label htmlFor="password" className="text-sm font-semibold text-gray-700">Contraseña</Label>
                             <Input
                 id="password"
                 type={showPassword ? "text" : "password"}
                 value={formData.password || ''}
                 onChange={(e) => setFormData({...formData, password: e.target.value})}
                 placeholder="Contraseña segura"
                 className="bg-white/80 backdrop-blur-sm border-gray-200/50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
               />
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-3 top-1/2 -translate-y-1/2"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <div>
              <Label htmlFor="rol" className="text-sm font-semibold text-gray-700">Rol</Label>
              <Select value={formData.rol} onValueChange={(value: 'cajero' | 'admin' | 'cocinero' | 'mesero' | 'super_admin') => setFormData({...formData, rol: value})}>
                <SelectTrigger className="bg-white/80 backdrop-blur-sm border-gray-200/50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem key="cajero" value="cajero">Cajero</SelectItem>
                  <SelectItem key="admin" value="admin">Administrador</SelectItem>
                  <SelectItem key="cocinero" value="cocinero">Cocinero</SelectItem>
                  <SelectItem key="mesero" value="mesero">Mesero</SelectItem>
                  <SelectItem key="super_admin" value="super_admin">Super Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="sucursal" className="text-sm font-semibold text-gray-700">Sucursal</Label>
              <Select value={(formData.id_sucursal || 0).toString()} onValueChange={(value) => setFormData({...formData, id_sucursal: Number(value)})}>
                <SelectTrigger className="bg-white/80 backdrop-blur-sm border-gray-200/50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {branches.map(branch => (
                    <SelectItem key={branch.id_sucursal} value={(branch.id_sucursal || 0).toString()}>
                      {branch.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button 
                variant="outline" 
                onClick={() => setIsAddDialogOpen(false)}
                className="bg-white/80 backdrop-blur-sm border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleAddUser} 
                disabled={createUserMutation.isPending}
                className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {createUserMutation.isPending ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

             {/* Editar Usuario */}
       <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
         <DialogContent className="max-w-md bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-200/50" aria-describedby="edit-user-description">
           <DialogHeader>
             <DialogTitle className="text-xl font-semibold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
               Editar Usuario
             </DialogTitle>
           </DialogHeader>
           <div id="edit-user-description" className="sr-only">
             Formulario para editar un usuario existente en el sistema
           </div>
          <div className="space-y-5 pt-2">
            <div>
              <Label htmlFor="edit-nombre" className="text-sm font-semibold text-gray-700">Nombre Completo</Label>
                             <Input
                 id="edit-nombre"
                 value={formData.nombre || ''}
                 onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                 className="bg-white/80 backdrop-blur-sm border-gray-200/50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
               />
            </div>
            <div>
              <Label htmlFor="edit-username" className="text-sm font-semibold text-gray-700">Nombre de Usuario</Label>
                             <Input
                 id="edit-username"
                 value={formData.username || ''}
                 onChange={(e) => setFormData({...formData, username: e.target.value})}
                 className="bg-white/80 backdrop-blur-sm border-gray-200/50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
               />
            </div>
            <div>
              <Label htmlFor="edit-email" className="text-sm font-semibold text-gray-700">Email</Label>
                             <Input
                 id="edit-email"
                 type="email"
                 value={formData.email || ''}
                 onChange={(e) => setFormData({...formData, email: e.target.value})}
                 className="bg-white/80 backdrop-blur-sm border-gray-200/50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
               />
            </div>
            <div className="relative">
              <Label htmlFor="edit-password" className="text-sm font-semibold text-gray-700">Contraseña (dejar en blanco para no cambiar)</Label>
                             <Input
                 id="edit-password"
                 type={showPassword ? "text" : "password"}
                 value={formData.password || ''}
                 onChange={(e) => setFormData({...formData, password: e.target.value})}
                 className="bg-white/80 backdrop-blur-sm border-gray-200/50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
               />
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-3 top-1/2 -translate-y-1/2"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <div>
              <Label htmlFor="edit-rol" className="text-sm font-semibold text-gray-700">Rol</Label>
              <Select
                value={formData.rol}
                onValueChange={(value: 'cajero' | 'admin' | 'cocinero' | 'mesero' | 'super_admin') => setFormData({...formData, rol: value})}
              >
                <SelectTrigger className="bg-white/80 backdrop-blur-sm border-gray-200/50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem key="cajero" value="cajero">Cajero</SelectItem>
                  <SelectItem key="admin" value="admin">Administrador</SelectItem>
                  <SelectItem key="cocinero" value="cocinero">Cocinero</SelectItem>
                  <SelectItem key="mesero" value="mesero">Mesero</SelectItem>
                  <SelectItem key="super_admin" value="super_admin">Super Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-sucursal" className="text-sm font-semibold text-gray-700">Sucursal</Label>
              <Select
                value={(formData.id_sucursal || 0).toString()}
                onValueChange={(value) => setFormData({...formData, id_sucursal: Number(value)})}
              >
                <SelectTrigger className="bg-white/80 backdrop-blur-sm border-gray-200/50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {branches.map(branch => (
                    <SelectItem key={branch.id_sucursal} value={(branch.id_sucursal || 0).toString()}>
                      {branch.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-activo" className="text-sm font-semibold text-gray-700">Activo</Label>
              <Switch
                id="edit-activo"
                checked={formData.activo}
                onCheckedChange={(checked) => setFormData({...formData, activo: checked})}
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" onClick={() => setIsEditDialogOpen(false)} className="bg-white/80 backdrop-blur-sm border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
                Cancelar
              </Button>
              <Button onClick={handleEditUser} disabled={updateUserMutation.isPending} className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-lg hover:shadow-xl transition-all duration-200">
                {updateUserMutation.isPending ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Confirmación de Eliminación */}
      <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <AlertDialogContent className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-200/50">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-semibold bg-gradient-to-r from-red-800 to-pink-800 bg-clip-text text-transparent">
              Confirmar Eliminación
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600 leading-relaxed">
              ¿Estás seguro de que deseas eliminar este usuario? Esta acción no se puede deshacer y el usuario perderá acceso al sistema inmediatamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/80 backdrop-blur-sm border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteUser}
              className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {deleteUserMutation.isPending ? 'Eliminando...' : 'Eliminar Usuario'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
