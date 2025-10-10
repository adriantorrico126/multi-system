import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, Edit } from 'lucide-react';
import { api } from '@/services/api';
import { useToast } from '@/components/ui/use-toast';

interface Producto {
  id_producto: number;
  nombre: string;
  precio: number;
  categoria?: string;
}

interface Modificador {
  id_modificador: number;
  id_producto: number;
  nombre_modificador: string;
  precio_extra: number; // Siempre convertido a number en el estado
  producto_nombre?: string;
}

export function ToppingsManager() {
  const { toast } = useToast();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [modificadores, setModificadores] = useState<Modificador[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    id_producto: '',
    nombre_modificador: '',
    precio_extra: 0
  });

  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    cargarProductos();
    cargarModificadores();
  }, []);

  const cargarProductos = async () => {
    try {
      const response = await api.get('/productos');
      setProductos(response.data.data || []);
    } catch (error) {
      console.error('Error al cargar productos:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los productos',
        variant: 'destructive'
      });
    }
  };

  const cargarModificadores = async () => {
    try {
      console.log('🔍 Cargando modificadores...');
      
      // Método directo: cargar por productos individuales
      const todosModificadores: Modificador[] = [];
      
      console.log(`🔄 Procesando ${productos.length} productos...`);
      
      for (const prod of productos) {
        try {
          const response = await api.get(`/modificadores/producto/${prod.id_producto}`);
          const productMods = response.data.modificadores || [];
          
          if (productMods.length > 0) {
            console.log(`📋 Producto ${prod.nombre}: ${productMods.length} modificadores`);
            productMods.forEach((mod: any) => {
              todosModificadores.push({
                id_modificador: mod.id_modificador,
                id_producto: mod.id_producto,
                nombre_modificador: mod.nombre_modificador,
                precio_extra: parseFloat(mod.precio_extra) || 0,
                producto_nombre: prod.nombre
              });
            });
          }
        } catch (error) {
          // Producto sin modificadores - ignorar silenciosamente
          console.log(`ℹ️ Producto ${prod.nombre}: sin modificadores`);
        }
      }
      
      console.log(`✅ Total modificadores cargados: ${todosModificadores.length}`);
      setModificadores(todosModificadores);
      
    } catch (error) {
      console.error('Error al cargar modificadores:', error);
      setModificadores([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.id_producto || !formData.nombre_modificador) {
      toast({
        title: 'Error',
        description: 'Por favor completa todos los campos obligatorios',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    
    try {
      const dataToSend = {
        id_producto: parseInt(formData.id_producto),
        nombre_modificador: formData.nombre_modificador,
        precio_extra: parseFloat(formData.precio_extra.toString()) || 0,
        tipo_modificador: 'topping',
        controlar_stock: false,
        stock_disponible: null
      };

      console.log('📤 Enviando datos al backend:', dataToSend);

      if (editingId) {
        console.log('🔄 Actualizando modificador ID:', editingId);
        const response = await api.put(`/modificadores/${editingId}`, dataToSend);
        console.log('✅ Respuesta del backend (actualizar):', response.data);
        toast({
          title: 'Éxito',
          description: 'Topping actualizado correctamente'
        });
      } else {
        console.log('➕ Creando nuevo modificador...');
        const response = await api.post('/modificadores/completo', dataToSend);
        console.log('✅ Respuesta del backend (crear):', response.data);
        toast({
          title: 'Éxito',
          description: 'Topping creado correctamente'
        });
      }

      // Limpiar formulario
      setFormData({
        id_producto: '',
        nombre_modificador: '',
        precio_extra: 0
      });
      setEditingId(null);

      // Recargar lista
      console.log('✅ Topping guardado, recargando lista...');
      cargarModificadores();

    } catch (error: any) {
      console.error('Error al guardar topping:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Error al guardar el topping',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditar = (mod: Modificador) => {
    setFormData({
      id_producto: mod.id_producto.toString(),
      nombre_modificador: mod.nombre_modificador,
      precio_extra: mod.precio_extra
    });
    setEditingId(mod.id_modificador);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEliminar = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este topping?')) return;

    try {
      await api.delete(`/modificadores/${id}`);
      toast({
        title: 'Éxito',
        description: 'Topping eliminado correctamente'
      });
      cargarModificadores();
    } catch (error) {
      console.error('Error al eliminar:', error);
      toast({
        title: 'Error',
        description: 'Error al eliminar el topping',
        variant: 'destructive'
      });
    }
  };

  const handleCancelar = () => {
    setFormData({
      id_producto: '',
      nombre_modificador: '',
      precio_extra: 0
    });
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Gestión de Toppings</h2>
        <p className="text-muted-foreground">
          Agrega extras personalizables a tus productos (queso, salsas, ingredientes adicionales, etc.)
        </p>
      </div>

      {/* Formulario */}
      <Card>
        <CardHeader>
          <CardTitle>{editingId ? 'Editar Topping' : 'Agregar Nuevo Topping'}</CardTitle>
          <CardDescription>
            Completa los campos para {editingId ? 'actualizar' : 'crear'} un topping
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Producto */}
              <div className="space-y-2">
                <Label htmlFor="producto">
                  Producto <span className="text-red-500">*</span>
                </Label>
                <Select 
                  value={formData.id_producto} 
                  onValueChange={v => setFormData({...formData, id_producto: v})}
                  disabled={loading}
                >
                  <SelectTrigger id="producto">
                    <SelectValue placeholder="Selecciona un producto" />
                  </SelectTrigger>
                  <SelectContent>
                    {productos.map(p => (
                      <SelectItem key={p.id_producto} value={String(p.id_producto)}>
                        {p.nombre} {p.categoria && `(${p.categoria})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Nombre del Topping */}
              <div className="space-y-2">
                <Label htmlFor="nombre">
                  Nombre del Topping <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="nombre"
                  placeholder="Ej: Queso Extra, Salsa BBQ"
                  value={formData.nombre_modificador}
                  onChange={e => setFormData({...formData, nombre_modificador: e.target.value})}
                  disabled={loading}
                  required
                />
              </div>

              {/* Precio Extra */}
              <div className="space-y-2">
                <Label htmlFor="precio">
                  Precio Extra (Bs)
                </Label>
                <Input
                  id="precio"
                  type="text"
                  placeholder="0.00"
                  value={formData.precio_extra === 0 ? '' : formData.precio_extra.toString()}
                  onChange={e => {
                    const value = e.target.value.replace(/[^0-9.,]/g, '');
                    const numValue = parseFloat(value.replace(',', '.')) || 0;
                    setFormData({...formData, precio_extra: numValue});
                  }}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Guardando...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    {editingId ? 'Actualizar Topping' : 'Agregar Topping'}
                  </>
                )}
              </Button>
              
              {editingId && (
                <Button type="button" variant="outline" onClick={handleCancelar}>
                  Cancelar
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Lista de Toppings */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Toppings Creados ({modificadores.length})</CardTitle>
              <CardDescription>
                Lista de todos los toppings disponibles en el sistema
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  console.log('🔄 Recargando modificadores...');
                  cargarModificadores();
                }}
              >
                🔄 Recargar
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={async () => {
                  console.log('🧪 PRUEBA DIRECTA: Probando endpoint...');
                  try {
                    // Probar endpoint directo
                    const response = await api.get('/modificadores/producto/94');
                    console.log('✅ PRUEBA EXITOSA:', response.data);
                    console.log('📋 Modificadores encontrados:', response.data.modificadores?.length || 0);
                  } catch (error) {
                    console.error('❌ PRUEBA FALLÓ:', error.response?.data || error.message);
                  }
                }}
              >
                🧪 Probar API
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={async () => {
                  console.log('🧪 PRUEBA CREACIÓN: Probando crear modificador...');
                  try {
                    const dataToSend = {
                      id_producto: 94,
                      nombre_modificador: 'PRUEBA DIRECTA',
                      precio_extra: 3.50,
                      tipo_modificador: 'topping',
                      controlar_stock: false,
                      stock_disponible: null
                    };
                    console.log('📤 Enviando:', dataToSend);
                    const response = await api.post('/modificadores/completo', dataToSend);
                    console.log('✅ CREACIÓN EXITOSA:', response.data);
                    cargarModificadores(); // Recargar lista
                  } catch (error) {
                    console.error('❌ CREACIÓN FALLÓ:', error.response?.data || error.message);
                  }
                }}
              >
                ➕ Crear Test
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {modificadores.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-lg font-medium">No hay toppings creados</p>
              <p className="text-sm">Comienza agregando tu primer topping arriba</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead>Topping</TableHead>
                    <TableHead>Precio Extra</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {modificadores.map(mod => (
                    <TableRow key={mod.id_modificador}>
                      <TableCell className="font-medium">
                        {mod.producto_nombre}
                      </TableCell>
                      <TableCell>{mod.nombre_modificador}</TableCell>
                      <TableCell>
                        <span className="font-semibold">
                          Bs {mod.precio_extra.toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditar(mod)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleEliminar(mod.id_modificador)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ayuda */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">💡 ¿Cómo funciona?</CardTitle>
        </CardHeader>
        <CardContent className="text-blue-800 space-y-2">
          <p><strong>1.</strong> Selecciona el producto al que quieres agregar un topping</p>
          <p><strong>2.</strong> Escribe el nombre del topping (Ej: "Queso Extra", "Salsa Picante")</p>
          <p><strong>3.</strong> Define el precio adicional que costará ese topping</p>
          <p><strong>4.</strong> Haz clic en "Agregar Topping"</p>
          <p className="pt-2 text-sm">
            ✨ Los toppings aparecerán automáticamente cuando vendas ese producto en el POS
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
