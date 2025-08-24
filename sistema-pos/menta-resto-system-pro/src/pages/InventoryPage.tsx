import React, { useState, useEffect, useMemo } from 'react';
import { api } from '@/services/api';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useNavigate } from 'react-router-dom';
import { InventoryDashboard } from '../components/inventory/InventoryDashboard';
import { LotesManagement } from '../components/inventory/LotesManagement';
import { InventoryReports } from '../components/inventory/InventoryReports';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  Package, 
  FileText, 
  BarChart3, 
  TrendingUp, 
  AlertTriangle,
  Download,
  Settings
} from 'lucide-react';
import { 
  getLotesPorVencer,
  getProductosStockBajo,
  crearLote,
  actualizarLote,
  eliminarLote
} from '../services/api';

interface Product {
  id_producto: number;
  nombre: string;
  stock_actual: number;
  precio: number;
  categoria_nombre: string;
}

interface Movement {
  id_movimiento: number;
  fecha_movimiento: string;
  tipo_movimiento: string;
  cantidad: number;
  stock_anterior: number;
  stock_actual: number;
  producto_nombre: string;
  vendedor_username: string;
}

interface Lote {
  id_lote: number;
  id_producto: number;
  numero_lote: string;
  cantidad_inicial: number;
  cantidad_actual: number;
  fecha_fabricacion: string;
  fecha_caducidad: string;
  precio_compra: number;
  ubicacion_especifica?: string;
  proveedor?: string;
  certificacion_organica: boolean;
  id_restaurante: number;
  producto_nombre?: string;
  categoria_nombre?: string;
  estado_caducidad?: string;
  estado_stock?: string;
}

const InventoryPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const role = user?.rol || user?.role || '';

  const [inventory, setInventory] = useState<Product[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [changeAmount, setChangeAmount] = useState<string>('');
  const [movementType, setMovementType] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'productos' | 'lotes' | 'reportes'>('dashboard');
  const [filteredInventory, setFilteredInventory] = useState<Product[]>([]);

  const fetchInventoryData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('jwtToken');
      const [inventoryResponse, movementsResponse, lotesResponse] = await Promise.all([
        api.get(`${import.meta.env.VITE_BACKEND_URL}/productos/inventario/resumen`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        api.get(`${import.meta.env.VITE_BACKEND_URL}/productos/inventario/movimientos`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        api.get(`${import.meta.env.VITE_BACKEND_URL}/inventario-lotes`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setInventory(inventoryResponse.data.data || []);
      setMovements(movementsResponse.data.data || []);
      setLotes(lotesResponse.data.data || []);
      setFilteredInventory(inventoryResponse.data.data || []);

    } catch (err) {
      console.error('Error fetching inventory data:', err);
      setError('Error al cargar los datos de inventario. Asegúrate de tener permisos.');
      toast.error('Error al cargar los datos de inventario.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (role === 'admin' || role === 'gerente') {
      fetchInventoryData();
    }
  }, [role]);

  const handleUpdateStock = async () => {
    if (!selectedProduct || !changeAmount || !movementType) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('jwtToken');
      const cantidad = parseFloat(changeAmount);
      
      let nuevaCantidad = selectedProduct.stock_actual || 0;
      if (movementType === 'entrada' || movementType === 'ajuste_positivo') {
        nuevaCantidad += cantidad;
      } else {
        nuevaCantidad -= cantidad;
      }

      await api.post(`${import.meta.env.VITE_BACKEND_URL}/productos/inventario/${selectedProduct.id_producto}/stock`, {
        cantidad: cantidad,
        tipo_movimiento: movementType,
        stock_anterior: selectedProduct.stock_actual || 0,
        stock_actual: nuevaCantidad
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success('Stock actualizado correctamente');
      setChangeAmount('');
      setMovementType('');
      setSelectedProduct(null);
      fetchInventoryData();
    } catch (err) {
      console.error('Error updating stock:', err);
      toast.error('Error al actualizar el stock');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filters: any) => {
    setFilteredInventory(filters.filteredInventory || inventory);
  };

  const handleExportData = () => {
    toast.info('Exportación', { description: 'Usa la pestaña de Reportes para exportar datos específicos.' });
  };

  const handleSaveLote = async (loteData: Lote) => {
    try {
      if (loteData.id_lote) {
        await actualizarLote(loteData.id_lote, loteData);
        toast.success("Lote actualizado");
      } else {
        await crearLote(loteData);
        toast.success('Lote creado');
      }
      fetchInventoryData();
    } catch (err) {
      setError('Error al guardar el lote.');
      toast.error('Error', { description: 'Error al guardar el lote.' });
      throw err;
    }
  };

  const handleDeleteLote = async (id: number) => {
    try {
      await eliminarLote(id);
      toast.success('Lote eliminado');
      fetchInventoryData();
    } catch (err) {
      setError('Error al eliminar el lote.');
      toast.error('Error', { description: 'Error al eliminar el lote.' });
      throw err;
    }
  };

  if (role !== 'admin' && role !== 'gerente') {
    return (
      <div className="flex flex-col items-center justify-center h-full p-10">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Acceso denegado</h2>
        <p className="text-gray-700 mb-6">No tienes permisos para ver el inventario.</p>
        <Button onClick={() => navigate(-1)}>
          Volver
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Inventario Profesional</h1>
          <p className="text-gray-600 mt-2">Sistema completo de gestión de inventario para restaurantes</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-500">Cargando datos...</p>
          </div>
        </div>
      )}

      {!loading && (
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="productos" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Productos
            </TabsTrigger>
            <TabsTrigger value="lotes" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Lotes
            </TabsTrigger>
            <TabsTrigger value="reportes" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Reportes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-6">
            <InventoryDashboard
              inventory={inventory}
              lotes={lotes}
              onFilterChange={handleFilterChange}
              onExportData={handleExportData}
            />
          </TabsContent>

          <TabsContent value="productos" className="mt-6">
            <div className="space-y-6">
              {/* Resumen de inventario */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Resumen de Inventario
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Producto</TableHead>
                        <TableHead>Categoría</TableHead>
                        <TableHead>Stock Actual</TableHead>
                        <TableHead>Precio</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredInventory.map((product) => (
                        <TableRow key={product.id_producto}>
                          <TableCell className="font-medium">{product.nombre}</TableCell>
                          <TableCell>{product.categoria_nombre}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={
                                (product.stock_actual || 0) === 0 ? "destructive" : 
                                (product.stock_actual || 0) <= 10 ? "secondary" : "default"
                              }
                            >
                              {product.stock_actual || 0}
                            </Badge>
                          </TableCell>
                          <TableCell>Bs {(typeof product.precio === 'number' ? product.precio : parseFloat(product.precio) || 0).toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={
                                (product.stock_actual || 0) === 0 ? "destructive" : 
                                (product.stock_actual || 0) <= 10 ? "secondary" : "default"
                              }
                            >
                              {(product.stock_actual || 0) === 0 ? 'Sin Stock' : 
                               (product.stock_actual || 0) <= 10 ? 'Stock Bajo' : 'Stock OK'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => setSelectedProduct(product)}
                                >
                                  Ajustar Stock
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Ajustar Stock de {selectedProduct?.nombre}</DialogTitle>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                  <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="changeAmount" className="text-right">
                                      Cantidad
                                    </Label>
                                    <Input
                                      id="changeAmount"
                                      type="number"
                                      value={changeAmount}
                                      onChange={(e) => setChangeAmount(e.target.value)}
                                      className="col-span-3"
                                    />
                                  </div>
                                  <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="movementType" className="text-right">
                                      Tipo de Movimiento
                                    </Label>
                                    <Select onValueChange={setMovementType} value={movementType}>
                                      <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Selecciona tipo" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="entrada">Entrada</SelectItem>
                                        <SelectItem value="salida">Salida</SelectItem>
                                        <SelectItem value="ajuste_positivo">Ajuste Positivo</SelectItem>
                                        <SelectItem value="ajuste_negativo">Ajuste Negativo</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                                <DialogFooter>
                                  <Button onClick={handleUpdateStock} disabled={loading}>
                                    {loading ? 'Guardando...' : 'Guardar Cambios'}
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Historial de movimientos */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Historial de Movimientos de Stock
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Producto</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Cantidad</TableHead>
                        <TableHead>Stock Anterior</TableHead>
                        <TableHead>Stock Actual</TableHead>
                        <TableHead>Vendedor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {movements.map((movement) => (
                        <TableRow key={movement.id_movimiento}>
                          <TableCell>{new Date(movement.fecha_movimiento).toLocaleString()}</TableCell>
                          <TableCell className="font-medium">{movement.producto_nombre}</TableCell>
                          <TableCell>
                            <Badge variant={movement.tipo_movimiento === 'entrada' ? 'default' : 'secondary'}>
                              {movement.tipo_movimiento}
                            </Badge>
                          </TableCell>
                          <TableCell>{movement.cantidad}</TableCell>
                          <TableCell>{movement.stock_anterior}</TableCell>
                          <TableCell>{movement.stock_actual}</TableCell>
                          <TableCell>{movement.vendedor_username}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="lotes" className="mt-6">
            <LotesManagement
              lotes={lotes}
              products={inventory}
              onSave={handleSaveLote}
              onDelete={handleDeleteLote}
              loading={loading}
            />
          </TabsContent>

          <TabsContent value="reportes" className="mt-6">
            <InventoryReports
              inventory={inventory}
              lotes={lotes}
              movements={movements}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default InventoryPage;
