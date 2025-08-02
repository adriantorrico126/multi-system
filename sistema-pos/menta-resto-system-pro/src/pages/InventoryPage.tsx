import React, { useState, useEffect } from 'react';
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
  id_restaurante: number;
}

const InventarioLotesManagement: React.FC = () => {
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedLote, setSelectedLote] = useState<Lote | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const fetchLotes = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("jwtToken");
      const response = await api.get(`${import.meta.env.VITE_BACKEND_URL}/inventario-lotes`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setLotes(response.data.data || []);
    } catch (err) {
      setError('Error al cargar los lotes.');
      toast.error('Error', { description: 'Error al cargar los lotes.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLotes();
  }, []);

  const handleSave = async (loteData: Lote) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("jwtToken");
      if (selectedLote) {
        await api.put(`${import.meta.env.VITE_BACKEND_URL}/inventario-lotes/${selectedLote.id_lote}`, loteData, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        toast.success("Lote actualizado");
      } else {
        await api.post(`${import.meta.env.VITE_BACKEND_URL}/inventario-lotes`, loteData, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        toast.success('Lote creado');
      }
      fetchLotes();
      setIsDialogOpen(false);
    } catch (err) {
      setError('Error al guardar el lote.');
      toast.error('Error', { description: 'Error al guardar el lote.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex justify-between items-center">
        <CardTitle>Gestión de Lotes de Inventario</CardTitle>
        <Button onClick={() => {
          setSelectedLote(null);
          setIsDialogOpen(true);
        }}>Crear Lote</Button>
      </CardHeader>
      <CardContent>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        {loading ? (
          <p>Cargando...</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto ID</TableHead>
                <TableHead>Número de Lote</TableHead>
                <TableHead>Cantidad Actual</TableHead>
                <TableHead>Fecha de Caducidad</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lotes.map((lote) => (
                <TableRow key={lote.id_lote}>
                  <TableCell>{lote.id_producto}</TableCell>
                  <TableCell>{lote.numero_lote}</TableCell>
                  <TableCell>{lote.cantidad_actual}</TableCell>
                  <TableCell>{new Date(lote.fecha_caducidad).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" onClick={() => {
                      setSelectedLote(lote);
                      setIsDialogOpen(true);
                    }}>
                      Editar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
      <LoteDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSave={handleSave}
        lote={selectedLote}
      />
    </Card>
  );
};

interface LoteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (lote: Lote) => void;
  lote: Lote | null;
}

const LoteDialog: React.FC<LoteDialogProps> = ({ isOpen, onClose, onSave, lote }) => {
  const [formData, setFormData] = useState<Partial<Lote>>(lote || {});

  useEffect(() => {
    setFormData(lote || {});
  }, [lote]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSave = () => {
    onSave(formData as Lote);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{lote ? 'Editar Lote' : 'Crear Lote'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Label>Producto ID</Label>
          <Input name="id_producto" type="number" value={formData.id_producto || ''} onChange={handleChange} />
          <Label>Número de Lote</Label>
          <Input name="numero_lote" value={formData.numero_lote || ''} onChange={handleChange} />
          <Label>Cantidad Inicial</Label>
          <Input name="cantidad_inicial" type="number" value={formData.cantidad_inicial || ''} onChange={handleChange} />
          <Label>Cantidad Actual</Label>
          <Input name="cantidad_actual" type="number" value={formData.cantidad_actual || ''} onChange={handleChange} />
          <Label>Fecha de Fabricación</Label>
          <Input name="fecha_fabricacion" type="date" value={formData.fecha_fabricacion || ''} onChange={handleChange} />
          <Label>Fecha de Caducidad</Label>
          <Input name="fecha_caducidad" type="date" value={formData.fecha_caducidad || ''} onChange={handleChange} />
          <Label>Precio de Compra</Label>
          <Input name="precio_compra" type="number" value={formData.precio_compra || ''} onChange={handleChange} />
        </div>
        <DialogFooter>
          <Button onClick={handleSave}>Guardar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

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
  const [activeTab, setActiveTab] = useState<'productos' | 'lotes'>('productos');

  const fetchInventoryData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('jwtToken');
      const inventoryResponse = await api.get(`${import.meta.env.VITE_BACKEND_URL}/productos/inventario/resumen`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setInventory(inventoryResponse.data.data || []);

      const movementsResponse = await api.get(`${import.meta.env.VITE_BACKEND_URL}/productos/inventario/movimientos`, {
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
      if (activeTab === 'productos') {
        fetchInventoryData();
      }
    }
  }, [role, activeTab]);

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
      await api.post(`${import.meta.env.VITE_BACKEND_URL}/productos/inventario/${selectedProduct.id_producto}/stock`, {
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
        <Button
          onClick={() => navigate(-1)}
        >
          Volver
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gestión de Inventario</h1>
        <div className="flex gap-2">
          <Button
            variant={activeTab === 'productos' ? 'default' : 'outline'}
            onClick={() => setActiveTab('productos')}
          >
            Productos
          </Button>
          <Button
            variant={activeTab === 'lotes' ? 'default' : 'outline'}
            onClick={() => setActiveTab('lotes')}
          >
            Lotes
          </Button>
        </div>
      </div>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      {loading && (
        <div className="flex items-center justify-center p-8">
          <p>Cargando datos...</p>
        </div>
      )}

      {!loading && activeTab === 'productos' && (
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
      {!loading && activeTab === 'lotes' && (
        <InventarioLotesManagement />
      )}
    </div>
  );
};

export default InventoryPage;
