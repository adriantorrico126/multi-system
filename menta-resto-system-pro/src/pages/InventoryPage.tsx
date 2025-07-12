import React, { useState, useEffect } from 'react';
import axios from 'axios';
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

const InventoryPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const role = user?.rol || user?.role || '';

  const [inventory, setInventory] = useState<Product[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [changeAmount, setChangeAmount] = useState<string>('');
  const [movementType, setMovementType] = useState<string>('');

  const fetchInventoryData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('jwtToken');
      const inventoryResponse = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/productos/inventario/resumen`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log('Frontend: Inventory response:', inventoryResponse.data);
      console.log('Frontend: Inventory data sample:', inventoryResponse.data.data?.slice(0, 2));
      setInventory(inventoryResponse.data.data || []);

      const movementsResponse = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/productos/inventario/movimientos`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setMovements(movementsResponse.data.data || []);

    } catch (err) {
      console.error('Error fetching inventory data:', err);
      setError('Error al cargar los datos de inventario. Asegúrate de tener permisos.');
      toast.error('Error', { description: 'Error al cargar los datos de inventario.' });
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
      toast.error('Error', { description: 'Por favor, completa todos los campos.' });
      return;
    }

    const amount = parseInt(changeAmount);
    if (isNaN(amount) || amount === 0) {
      toast.error('Error', { description: 'La cantidad debe ser un número válido y diferente de cero.' });
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('jwtToken');
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/productos/inventario/${selectedProduct.id_producto}/stock`, {
        cantidad_cambio: amount,
        tipo_movimiento: movementType,
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      toast.success('Stock actualizado', { description: 'El stock del producto ha sido actualizado exitosamente.' });
      fetchInventoryData(); // Refresh data
      setSelectedProduct(null);
      setChangeAmount('');
      setMovementType('');
    } catch (err) {
      console.error('Error updating stock:', err);
      setError('Error al actualizar el stock.');
      toast.error('Error', { description: 'Error al actualizar el stock.' });
    } finally {
      setLoading(false);
    }
  };

  if (role !== 'admin' && role !== 'gerente') {
    return (
      <div className="flex flex-col items-center justify-center h-full p-10">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Acceso denegado</h2>
        <p className="text-gray-700 mb-6">No tienes permisos para ver el inventario.</p>
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={() => navigate(-1)}
        >
          Volver
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Gestión de Inventario</h1>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      {loading && (
        <div className="flex items-center justify-center p-8">
          <p>Cargando datos de inventario...</p>
        </div>
      )}

      {!loading && (
        <>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Resumen de Inventario</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Stock Actual</TableHead>
                    <TableHead>Precio</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(inventory || []).map((product) => (
                    <TableRow key={product.id_producto}>
                      <TableCell>{product.nombre}</TableCell>
                      <TableCell>{product.categoria_nombre}</TableCell>
                      <TableCell>{product.stock_actual || 0}</TableCell>
                      <TableCell>${(typeof product.precio === 'number' ? product.precio : parseFloat(product.precio) || 0).toFixed(2)}</TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setSelectedProduct(product)}>
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

          <Card>
            <CardHeader>
              <CardTitle>Historial de Movimientos de Stock</CardTitle>
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
                  {(movements || []).map((movement) => (
                    <TableRow key={movement.id_movimiento}>
                      <TableCell>{new Date(movement.fecha_movimiento).toLocaleString()}</TableCell>
                      <TableCell>{movement.producto_nombre}</TableCell>
                      <TableCell>{movement.tipo_movimiento}</TableCell>
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
        </>
      )}
    </div>
  );
};

export default InventoryPage;
