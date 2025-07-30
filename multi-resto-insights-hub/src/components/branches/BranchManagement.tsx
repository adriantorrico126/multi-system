
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Plus, 
  Edit, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  DollarSign,
  Users,
  Store,
  Search,
  Filter,
  Map
} from "lucide-react";
import { apiFetch } from '@/services/api';
import { useAuth } from '@/context/AuthContext';

export const BranchManagement: React.FC = () => {
  const [branches, setBranches] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCity, setFilterCity] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  const [newBranch, setNewBranch] = useState({
    name: '',
    address: '',
    city: '',
    phone: '',
    email: '',
    manager: '',
    plan: 'Básico',
    openTime: '08:00',
    closeTime: '22:00'
  });

  useEffect(() => {
    const fetchBranches = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await apiFetch<any[]>('/sucursales', {}, token || undefined);
        setBranches(data);
      } catch (err: any) {
        setError(err.message || 'Error al cargar sucursales.');
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchBranches();
  }, [token]);

  const filteredBranches = branches.filter(branch => {
    const matchesSearch = branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         branch.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         branch.manager.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCity = filterCity === 'all' || branch.city === filterCity;
    const matchesStatus = filterStatus === 'all' || branch.status === filterStatus;
    
    return matchesSearch && matchesCity && matchesStatus;
  });

  const handleAddBranch = () => {
    const branch = {
      id: Date.now(),
      ...newBranch,
      status: 'active',
      sales: 0,
      orders: 0,
      rating: 0
    };
    setBranches([...branches, branch]);
    setNewBranch({
      name: '',
      address: '',
      city: '',
      phone: '',
      email: '',
      manager: '',
      plan: 'Básico',
      openTime: '08:00',
      closeTime: '22:00'
    });
    setIsAddDialogOpen(false);
  };

  const toggleStatus = (id: number) => {
    setBranches(branches.map(branch => 
      branch.id === id 
        ? { ...branch, status: branch.status === 'active' ? 'inactive' : 'active' }
        : branch
    ));
  };

  return (
    <div className="space-y-6">
      {loading && <div className="text-center text-blue-600">Cargando sucursales...</div>}
      {error && <div className="text-center text-red-600">{error}</div>}
      {/* Header y Controles */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Gestión de Sucursales</h2>
          <p className="text-slate-600">Administra todas tus ubicaciones desde un solo lugar</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Sucursal
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Agregar Nueva Sucursal</DialogTitle>
              <DialogDescription>
                Completa la información de la nueva sucursal
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre de la Sucursal</Label>
                <Input
                  id="name"
                  value={newBranch.name}
                  onChange={(e) => setNewBranch({...newBranch, name: e.target.value})}
                  placeholder="Ej. Sucursal Centro"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="manager">Gerente</Label>
                <Input
                  id="manager"
                  value={newBranch.manager}
                  onChange={(e) => setNewBranch({...newBranch, manager: e.target.value})}
                  placeholder="Nombre del gerente"
                />
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Dirección</Label>
                <Textarea
                  id="address"
                  value={newBranch.address}
                  onChange={(e) => setNewBranch({...newBranch, address: e.target.value})}
                  placeholder="Dirección completa"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="city">Ciudad</Label>
                <Input
                  id="city"
                  value={newBranch.city}
                  onChange={(e) => setNewBranch({...newBranch, city: e.target.value})}
                  placeholder="Ciudad"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  value={newBranch.phone}
                  onChange={(e) => setNewBranch({...newBranch, phone: e.target.value})}
                  placeholder="+52 55 1234-5678"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newBranch.email}
                  onChange={(e) => setNewBranch({...newBranch, email: e.target.value})}
                  placeholder="email@restaurant.com"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="plan">Plan</Label>
                <Select value={newBranch.plan} onValueChange={(value) => setNewBranch({...newBranch, plan: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar plan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Básico">Básico</SelectItem>
                    <SelectItem value="Premium">Premium</SelectItem>
                    <SelectItem value="Empresarial">Empresarial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="openTime">Hora de Apertura</Label>
                <Input
                  id="openTime"
                  type="time"
                  value={newBranch.openTime}
                  onChange={(e) => setNewBranch({...newBranch, openTime: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="closeTime">Hora de Cierre</Label>
                <Input
                  id="closeTime"
                  type="time"
                  value={newBranch.closeTime}
                  onChange={(e) => setNewBranch({...newBranch, closeTime: e.target.value})}
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddBranch}>
                Agregar Sucursal
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Resumen y Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sucursales</CardTitle>
            <Store className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{branches.length}</div>
            <p className="text-xs text-slate-500">
              {branches.filter(b => b.status === 'active').length} activas
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventas Totales</CardTitle>
            <DollarSign className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${branches.reduce((sum, branch) => sum + branch.sales, 0).toLocaleString()}
            </div>
            <p className="text-xs text-slate-500">Este mes</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pedidos Totales</CardTitle>
            <Users className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {branches.reduce((sum, branch) => sum + branch.orders, 0)}
            </div>
            <p className="text-xs text-slate-500">Este mes</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rating Promedio</CardTitle>
            <MapPin className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(branches.reduce((sum, branch) => sum + branch.rating, 0) / branches.length).toFixed(1)}
            </div>
            <p className="text-xs text-slate-500">De 5.0 estrellas</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filtros</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="search"
                  placeholder="Buscar por nombre, dirección o gerente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="city-filter">Ciudad</Label>
              <Select value={filterCity} onValueChange={setFilterCity}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas las ciudades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las ciudades</SelectItem>
                  <SelectItem value="Ciudad de México">Ciudad de México</SelectItem>
                  <SelectItem value="Guadalajara">Guadalajara</SelectItem>
                  <SelectItem value="Monterrey">Monterrey</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status-filter">Estado</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="active">Activo</SelectItem>
                  <SelectItem value="inactive">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button variant="outline" className="w-full">
                <Map className="h-4 w-4 mr-2" />
                Ver en Mapa
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Sucursales */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Sucursales</CardTitle>
          <CardDescription>
            {filteredBranches.length} de {branches.length} sucursales
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sucursal</TableHead>
                <TableHead>Gerente</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Horario</TableHead>
                <TableHead>Ventas</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBranches.map((branch) => (
                <TableRow key={branch.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{branch.name}</div>
                      <div className="text-sm text-slate-500 flex items-center">
                        <MapPin className="h-3 w-3 mr-1" />
                        {branch.address}
                      </div>
                      <div className="text-sm text-slate-500 flex items-center space-x-2">
                        <Phone className="h-3 w-3" />
                        <span>{branch.phone}</span>
                        <Mail className="h-3 w-3" />
                        <span>{branch.email}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{branch.manager}</TableCell>
                  <TableCell>
                    <Badge variant={
                      branch.plan === 'Premium' ? 'default' : 
                      branch.plan === 'Empresarial' ? 'secondary' : 
                      'outline'
                    }>
                      {branch.plan}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={branch.status === 'active' ? 'default' : 'secondary'}>
                      {branch.status === 'active' ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-sm">
                      <Clock className="h-3 w-3 mr-1" />
                      {branch.openTime} - {branch.closeTime}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">${branch.sales.toLocaleString()}</div>
                      <div className="text-sm text-slate-500">{branch.orders} pedidos</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <span className="font-medium">{branch.rating}</span>
                      <span className="text-slate-400 ml-1">★</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">
                        <Edit className="h-3 w-3 mr-1" />
                        Editar
                      </Button>
                      <Button 
                        size="sm" 
                        variant={branch.status === 'active' ? 'destructive' : 'default'}
                        onClick={() => toggleStatus(branch.id)}
                      >
                        {branch.status === 'active' ? 'Desactivar' : 'Activar'}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
