import { useState } from 'react';
import { Product } from '@/types/restaurant';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createProduct, updateProduct, deleteProduct, getCategories } from '@/services/api';

interface Category {
  id_categoria: number;
  nombre: string;
}

interface ProductManagementProps {
  products: Product[];
  categories: Category[];
  currentUserRole: 'cajero' | 'admin' | 'gerente' | 'super_admin';
  idRestaurante: number;
}

export function ProductManagement({ products, categories, currentUserRole, idRestaurante }: ProductManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();

  // Form state for new/edit product
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: '',
    available: true
  });

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const resetForm = () => {
    setFormData({
      name: '',
      price: '',
      category: '',
      available: true
    });
  };

  const queryClient = useQueryClient();

  const addProductMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', idRestaurante] });
      if (currentUserRole === 'admin' || currentUserRole === 'super_admin') {
        toast({
          title: "Producto Agregado",
          description: `${formData.name} ha sido agregado exitosamente`
        });
      }
      resetForm();
      setIsAddDialogOpen(false);
    },
    onError: (error) => {
      if (currentUserRole === 'admin' || currentUserRole === 'super_admin') {
        toast({
          title: "Error al agregar producto",
          description: error.message || "No se pudo agregar el producto. Intenta nuevamente.",
          variant: "destructive"
        });
      }
    },
  });

  const handleAddProduct = () => {
    if (!formData.name || !formData.price || !formData.category) {
      toast({
        title: "Error",
        description: "Todos los campos son obligatorios",
        variant: "destructive"
      });
      return;
    }

    addProductMutation.mutate({
      nombre: formData.name.toUpperCase(),
      precio: parseFloat(formData.price),
      id_categoria: categories.find(cat => cat.nombre === formData.category)?.id_categoria || 0, // Assuming category name maps to id
      stock_actual: 0, // Default to 0 for new products
      activo: formData.available,
      imagen_url: "", // Placeholder for now
      id_restaurante: idRestaurante // Pasar id_restaurante
    });
  };

  const editProductMutation = useMutation({
    mutationFn: updateProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', idRestaurante] });
      if (currentUserRole === 'admin' || currentUserRole === 'super_admin') {
        toast({
          title: "Producto Actualizado",
          description: `${formData.name} ha sido actualizado exitosamente`
        });
      }
      resetForm();
      setEditingProduct(null);
      setIsEditDialogOpen(false);
    },
    onError: (error) => {
      if (currentUserRole === 'admin' || currentUserRole === 'super_admin') {
        toast({
          title: "Error al actualizar producto",
          description: error.message || "No se pudo actualizar el producto. Intenta nuevamente.",
          variant: "destructive"
        });
      }
    },
  });

  const handleEditProduct = () => {
    if (!editingProduct || !formData.name || !formData.price || !formData.category) {
      toast({
        title: "Error",
        description: "Todos los campos son obligatorios",
        variant: "destructive"
      });
      return;
    }

    editProductMutation.mutate({
      id: editingProduct.id,
      nombre: formData.name.toUpperCase(),
      precio: parseFloat(formData.price),
      id_categoria: categories.find(cat => cat.nombre === formData.category)?.id_categoria || 0,
      activo: formData.available,
      imagen_url: editingProduct.imagen_url, // Keep existing image URL
      id_restaurante: idRestaurante // Pasar id_restaurante
    });
  };

  const deleteProductMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: (_, productId) => {
      queryClient.invalidateQueries({ queryKey: ['products', idRestaurante] });
      const product = products.find(p => p.id === productId);
      if (currentUserRole === 'admin' || currentUserRole === 'super_admin') {
        toast({
          title: "Producto Eliminado",
          description: `${product?.name || 'El producto'} ha sido eliminado`,
          variant: "destructive"
        });
      }
    },
    onError: (error) => {
      if (currentUserRole === 'admin' || currentUserRole === 'super_admin') {
        toast({
          title: "Error al eliminar producto",
          description: error.message || "No se pudo eliminar el producto. Intenta nuevamente.",
          variant: "destructive"
        });
      }
    },
  });

  const handleDeleteProduct = (productId: string) => {
    deleteProductMutation.mutate(productId);
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.price.toString(),
      category: product.category,
      available: product.available
    });
    setIsEditDialogOpen(true);
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
            <CardTitle>Gestión de Productos</CardTitle>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openAddDialog} className="bg-green-600 hover:bg-green-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Producto
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Agregar Nuevo Producto</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nombre del Producto</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="Nombre del producto"
                    />
                  </div>
                  <div>
                    <Label htmlFor="price">Precio (Bs)</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: e.target.value})}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Categoría</Label>
                    <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(category => (
                          <SelectItem key={category.id_categoria} value={category.nombre}>{category.nombre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="available"
                      checked={formData.available}
                      onChange={(e) => setFormData({...formData, available: e.target.checked})}
                    />
                    <Label htmlFor="available">Disponible</Label>
                  </div>
                  <div className="flex space-x-2">
                    <Button onClick={handleAddProduct} className="bg-green-600 hover:bg-green-700">
                      Agregar
                    </Button>
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Filter Controls */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar productos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Todas las categorías" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category.id_categoria} value={category.nombre}>{category.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Products Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell><span translate="no">Bs</span> {product.price.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant={product.available ? "default" : "secondary"}>
                      {product.available ? "Disponible" : "No disponible"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditDialog(product)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteProduct(product.id)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No se encontraron productos</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Product Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Producto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Nombre del Producto</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Nombre del producto"
              />
            </div>
            <div>
              <Label htmlFor="edit-price">Precio (Bs)</Label>
              <Input
                id="edit-price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: e.target.value})}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="edit-category">Categoría</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category.id_categoria} value={category.nombre}>{category.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="edit-available"
                checked={formData.available}
                onChange={(e) => setFormData({...formData, available: e.target.checked})}
              />
              <Label htmlFor="edit-available">Disponible</Label>
            </div>
            <div className="flex space-x-2">
              <Button onClick={handleEditProduct} className="bg-green-600 hover:bg-green-700">
                Guardar Cambios
              </Button>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
