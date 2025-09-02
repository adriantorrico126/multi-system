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
import { 
  Plus, 
  Edit, 
  Trash, 
  Search, 
  Package,
  Tag,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Eye,
  EyeOff,
  Filter,
  Download,
  RefreshCw,
  BarChart3,
  Activity,
  Target,
  Zap,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createProduct, updateProduct, deleteProduct, getCategories } from '@/services/api';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Category {
  id_categoria: number;
  nombre: string;
}

interface ProductManagementProps {
  products: Product[];
  categories: Category[];
  currentUserRole: 'cajero' | 'admin' | 'super_admin';
  idRestaurante: number;
}

export function ProductManagement({ products, categories, currentUserRole, idRestaurante }: ProductManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form state for new/edit product
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: '',
    available: true,
    stock: '0',
    description: ''
  });

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || 
                         (selectedStatus === 'active' && product.available) ||
                         (selectedStatus === 'inactive' && !product.available);
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const resetForm = () => {
    setFormData({
      name: '',
      price: '',
      category: '',
      available: true,
      stock: '0',
      description: ''
    });
  };

  // Calcular estadísticas
  const stats = {
    total: products.length,
    active: products.filter(p => p.available).length,
    inactive: products.filter(p => !p.available).length,
    lowStock: products.filter(p => p.stock_actual < 10).length,
    categories: categories.length,
    avgPrice: products.length > 0 ? products.reduce((sum, p) => sum + p.price, 0) / products.length : 0
  };

  const addProductMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ['products', idRestaurante] });
      if (currentUserRole === 'admin' || currentUserRole === 'super_admin') {
        toast({
          title: "✅ Producto Agregado Exitosamente",
          description: `${formData.name} ha sido agregado al catálogo`,
        });
      }
      resetForm();
      setIsAddDialogOpen(false);
    },
    onError: (error) => {
      if (currentUserRole === 'admin' || currentUserRole === 'super_admin') {
        toast({
          title: "❌ Error al Agregar Producto",
          description: error.response?.data?.message || "No se pudo agregar el producto. Verifica los datos.",
          variant: "destructive"
        });
      }
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: updateProduct,
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ['products', idRestaurante] });
      if (currentUserRole === 'admin' || currentUserRole === 'super_admin') {
        toast({
          title: "✅ Producto Actualizado",
          description: `${formData.name} ha sido actualizado exitosamente`,
        });
      }
      resetForm();
      setEditingProduct(null);
      setIsEditDialogOpen(false);
    },
    onError: (error) => {
      if (currentUserRole === 'admin' || currentUserRole === 'super_admin') {
        toast({
          title: "❌ Error al Actualizar Producto",
          description: error.response?.data?.message || "No se pudo actualizar el producto.",
          variant: "destructive"
        });
      }
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ['products', idRestaurante] });
      if (currentUserRole === 'admin' || currentUserRole === 'super_admin') {
        toast({
          title: "✅ Producto Eliminado",
          description: "El producto ha sido eliminado exitosamente",
        });
      }
      setProductToDelete(null);
    },
    onError: (error) => {
      if (currentUserRole === 'admin' || currentUserRole === 'super_admin') {
        toast({
          title: "❌ Error al Eliminar Producto",
          description: error.response?.data?.message || "No se pudo eliminar el producto.",
          variant: "destructive"
        });
      }
    },
  });

  const handleAddProduct = () => {
    if (!formData.name || !formData.price || !formData.category) {
      toast({
        title: "❌ Campos Requeridos",
        description: "Los campos nombre, precio y categoría son obligatorios",
        variant: "destructive"
      });
      return;
    }

    const categoriaEncontrada = categories.find(cat => cat.nombre === formData.category);
    if (!categoriaEncontrada) {
      toast({
        title: "❌ Categoría Inválida",
        description: "La categoría seleccionada no es válida",
        variant: "destructive"
      });
      return;
    }

    addProductMutation.mutate({
      nombre: formData.name.toUpperCase(),
      precio: parseFloat(formData.price),
      id_categoria: categoriaEncontrada.id_categoria,
      stock_actual: parseInt(formData.stock) || 0,
      activo: formData.available,
      imagen_url: formData.description || undefined,
    });
  };

  const handleEditProduct = () => {
    if (!editingProduct) return;

    console.log('🔍 Debug - Editando producto:', editingProduct);
    console.log('🔍 Debug - FormData:', formData);
    console.log('🔍 Debug - Categorías:', categories);

    if (!formData.name || !formData.price) {
      toast({
        title: "❌ Campos Requeridos",
        description: "Los campos nombre y precio son obligatorios",
        variant: "destructive"
      });
      return;
    }

    // Si no hay categoría seleccionada, usar la original del producto
    let categoriaEncontrada = null;
    if (formData.category) {
      categoriaEncontrada = categories.find(cat => 
        cat.nombre.toLowerCase() === formData.category.toLowerCase()
      );
    } else {
      // Buscar por la categoría original del producto
      categoriaEncontrada = categories.find(cat => 
        cat.nombre.toLowerCase() === editingProduct.category?.toLowerCase()
      );
    }

    console.log('🔍 Debug - Categoría encontrada para edición:', categoriaEncontrada);

    if (!categoriaEncontrada) {
      toast({
        title: "❌ Categoría Inválida",
        description: "No se pudo encontrar la categoría. Usando categoría original del producto.",
        variant: "destructive"
      });
      // Usar la categoría original del producto
      categoriaEncontrada = categories.find(cat => 
        cat.nombre.toLowerCase() === editingProduct.category?.toLowerCase()
      );
      
      if (!categoriaEncontrada) {
        toast({
          title: "❌ Error",
          description: "No se pudo determinar la categoría del producto",
          variant: "destructive"
        });
        return;
      }
    }

    updateProductMutation.mutate({
      id: editingProduct.id,
      nombre: formData.name.toUpperCase(),
      precio: parseFloat(formData.price),
      id_categoria: categoriaEncontrada.id_categoria,
      activo: formData.available,
      imagen_url: formData.description || undefined,
    });
  };

  const handleDeleteProduct = (productId: string) => {
    setProductToDelete(productId);
  };

  const confirmDeleteProduct = () => {
    if (productToDelete) {
      deleteProductMutation.mutate(productToDelete);
    }
  };

  const openEditDialog = (product: Product) => {
    console.log('🔍 Debug - Producto a editar:', product);
    console.log('🔍 Debug - Categorías disponibles:', categories);
    console.log('🔍 Debug - Categoría del producto:', product.category);
    
    // Buscar la categoría exacta que coincida
    const categoriaEncontrada = categories.find(cat => 
      cat.nombre.toLowerCase() === product.category?.toLowerCase()
    );
    
    console.log('🔍 Debug - Categoría encontrada:', categoriaEncontrada);
    
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.price.toString(),
      category: categoriaEncontrada?.nombre || product.category || '',
      available: product.available,
      stock: product.stock_actual?.toString() || '0',
      description: product.imagen_url || ''
    });
    setIsEditDialogOpen(true);
  };

  const openAddDialog = () => {
    resetForm();
    setIsAddDialogOpen(true);
  };

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { color: 'destructive', text: 'Sin Stock' };
    if (stock < 10) return { color: 'warning', text: 'Stock Bajo' };
    return { color: 'success', text: 'En Stock' };
  };

  const getPriceDisplay = (price: number) => {
    return `Bs ${price.toLocaleString('es-BO')}`;
  };

  return (
    <div className="space-y-6">
      {/* Header del Dashboard de Productos */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-900 bg-clip-text text-transparent">
            Gestión de Productos
          </h2>
          <p className="text-gray-600 mt-1">
            Administra el catálogo de productos y controla el inventario
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['products'] })}
            className="bg-white/80 backdrop-blur-sm border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          
          <Button
            onClick={openAddDialog}
            className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Producto
          </Button>
        </div>
      </div>

      {/* Estadísticas de Productos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Total Productos</p>
                <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
              </div>
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200/50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Productos Activos</p>
                <p className="text-2xl font-bold text-green-900">{stats.active}</p>
              </div>
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Activity className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-pink-50 border border-red-200/50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-700">Productos Inactivos</p>
                <p className="text-2xl font-bold text-red-900">{stats.inactive}</p>
              </div>
              <div className="p-2 bg-red-500/10 rounded-lg">
                <Package className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200/50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700">Stock Bajo</p>
                <p className="text-2xl font-bold text-orange-900">{stats.lowStock}</p>
              </div>
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <TrendingDown className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-200/50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700">Categorías</p>
                <p className="text-2xl font-bold text-purple-900">{stats.categories}</p>
              </div>
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Tag className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-cyan-50 to-blue-50 border border-cyan-200/50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-cyan-700">Precio Promedio</p>
                <p className="text-2xl font-bold text-cyan-900">
                  Bs {stats.avgPrice.toFixed(2)}
                </p>
              </div>
              <div className="p-2 bg-cyan-500/10 rounded-lg">
                <DollarSign className="h-5 w-5 text-cyan-600" />
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
                  placeholder="Buscar productos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white/80 backdrop-blur-sm border-gray-200/50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                />
              </div>
            </div>
            
            <Select value={selectedCategory} onValueChange={value => setSelectedCategory(value)}>
              <SelectTrigger className="w-48 bg-white/80 backdrop-blur-sm border-gray-200/50">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem key="all" value="all">Todas las categorías</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category.id_categoria} value={category.nombre}>
                    {category.nombre}
                  </SelectItem>
                ))}
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

      {/* Tabla de Productos */}
      <Card className="bg-white/80 backdrop-blur-sm border border-gray-200/50 shadow-xl hover:shadow-2xl transition-all duration-300">
        <CardHeader>
          <CardTitle className="text-lg font-semibold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
            Lista de Productos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-gray-200 bg-gradient-to-r from-gray-50/80 to-white/80">
                  <TableHead className="h-14 px-6 text-left align-middle font-semibold text-gray-700">Producto</TableHead>
                  <TableHead className="h-14 px-6 text-left align-middle font-semibold text-gray-700">Categoría</TableHead>
                  <TableHead className="h-14 px-6 text-left align-middle font-semibold text-gray-700">Precio</TableHead>
                  <TableHead className="h-14 px-6 text-left align-middle font-semibold text-gray-700">Stock</TableHead>
                  <TableHead className="h-14 px-6 text-left align-middle font-semibold text-gray-700">Estado</TableHead>
                  <TableHead className="h-14 px-6 text-center align-middle font-semibold text-gray-700">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      <div className="flex flex-col items-center gap-2">
                        <Package className="h-12 w-12 text-gray-400" />
                        <p>No se encontraron productos</p>
                        <p className="text-sm">Intenta ajustar los filtros de búsqueda</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product) => {
                    const stockStatus = getStockStatus(product.stock_actual || 0);
                    return (
                      <TableRow key={product.id} className="border-b border-gray-100 transition-all duration-200 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50">
                        <TableCell className="p-6 align-middle">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center text-white font-semibold">
                              {product.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{product.name}</p>
                              <p className="text-sm text-gray-600">ID: {product.id}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="p-6 align-middle">
                          <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-200">
                            {product.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="p-6 align-middle">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-green-600" />
                            <span className="font-semibold text-green-700">
                              {getPriceDisplay(product.price)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="p-6 align-middle">
                          <Badge 
                            variant={stockStatus.color as any}
                            className="flex items-center gap-1"
                          >
                            <Package className="h-3 w-3" />
                            {product.stock_actual || 0} - {stockStatus.text}
                          </Badge>
                        </TableCell>
                        <TableCell className="p-6 align-middle">
                          <Badge 
                            variant={product.available ? "success" : "destructive"}
                            className="flex items-center gap-1"
                          >
                            {product.available ? <Activity className="h-3 w-3" /> : <Package className="h-3 w-3" />}
                            {product.available ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </TableCell>
                        <TableCell className="p-6 align-middle">
                          <div className="flex items-center justify-center gap-2">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => openEditDialog(product)}
                                    className="bg-white/80 backdrop-blur-sm border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-200"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Editar producto</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleDeleteProduct(product.id)}
                                    className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                                  >
                                    <Trash className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Eliminar producto</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

             {/* Diálogo para Agregar Producto */}
       <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
         <DialogContent className="max-w-lg bg-gradient-to-br from-white via-green-50/30 to-emerald-50/30 backdrop-blur-xl rounded-3xl shadow-2xl border border-green-200/50" aria-describedby="add-product-description">
           <DialogHeader className="text-center pb-4">
             <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
               <Plus className="h-8 w-8 text-white" />
             </div>
             <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-green-800 to-emerald-900 bg-clip-text text-transparent">
               Agregar Nuevo Producto
             </DialogTitle>
             <p className="text-gray-600 text-sm mt-1">Completa los datos para crear un nuevo producto</p>
           </DialogHeader>
           <div id="add-product-description" className="sr-only">
             Formulario para agregar un nuevo producto al sistema
           </div>
           <div className="space-y-6 pt-4">
             <div className="grid grid-cols-1 gap-6">
               <div className="space-y-2">
                 <Label htmlFor="name" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                   <Package className="h-4 w-4 text-green-600" />
                   Nombre del Producto
                 </Label>
                 <Input
                   id="name"
                   value={formData.name}
                   onChange={(e) => setFormData({...formData, name: e.target.value})}
                   placeholder="Nombre del producto"
                   className="bg-white/90 backdrop-blur-sm border-gray-200/50 focus:border-green-500 focus:ring-2 focus:ring-green-500/30 rounded-xl h-12 px-4 transition-all duration-200 hover:shadow-md"
                 />
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <Label htmlFor="price" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                     <DollarSign className="h-4 w-4 text-green-600" />
                     Precio (Bs)
                   </Label>
                   <Input
                     id="price"
                     type="number"
                     step="0.01"
                     value={formData.price}
                     onChange={(e) => setFormData({...formData, price: e.target.value})}
                     placeholder="0.00"
                     className="bg-white/90 backdrop-blur-sm border-gray-200/50 focus:border-green-500 focus:ring-2 focus:ring-green-500/30 rounded-xl h-12 px-4 transition-all duration-200 hover:shadow-md"
                   />
                 </div>
                 
                 <div className="space-y-2">
                   <Label htmlFor="stock" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                     <Package className="h-4 w-4 text-orange-600" />
                     Stock Inicial
                   </Label>
                   <Input
                     id="stock"
                     type="number"
                     value={formData.stock}
                     onChange={(e) => setFormData({...formData, stock: e.target.value})}
                     placeholder="0"
                     className="bg-white/90 backdrop-blur-sm border-gray-200/50 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/30 rounded-xl h-12 px-4 transition-all duration-200 hover:shadow-md"
                   />
                 </div>
               </div>
               
               <div className="space-y-2">
                 <Label htmlFor="category" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                   <Tag className="h-4 w-4 text-purple-600" />
                   Categoría
                 </Label>
                 <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                   <SelectTrigger className="bg-white/90 backdrop-blur-sm border-gray-200/50 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 rounded-xl h-12 px-4 transition-all duration-200 hover:shadow-md">
                     <SelectValue placeholder="Seleccionar categoría" />
                   </SelectTrigger>
                   <SelectContent className="bg-white/95 backdrop-blur-md border border-gray-200/50 shadow-xl rounded-xl">
                     {categories.map(category => (
                       <SelectItem 
                         key={category.id_categoria} 
                         value={category.nombre}
                         className="hover:bg-purple-50 focus:bg-purple-50 cursor-pointer rounded-lg m-1"
                       >
                         {category.nombre}
                       </SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
               </div>
               
               <div className="space-y-2">
                 <Label htmlFor="description" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                   <Edit className="h-4 w-4 text-gray-600" />
                   Descripción (Opcional)
                 </Label>
                 <Input
                   id="description"
                   value={formData.description}
                   onChange={(e) => setFormData({...formData, description: e.target.value})}
                   placeholder="Descripción del producto"
                   className="bg-white/90 backdrop-blur-sm border-gray-200/50 focus:border-gray-500 focus:ring-2 focus:ring-gray-500/30 rounded-xl h-12 px-4 transition-all duration-200 hover:shadow-md"
                 />
               </div>
               
               <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50/50 to-emerald-50/50 rounded-xl border border-green-200/30">
                 <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                     <Activity className="h-5 w-5 text-white" />
                   </div>
                   <div>
                     <Label htmlFor="available" className="text-sm font-semibold text-gray-700">Disponibilidad</Label>
                     <p className="text-xs text-gray-500">Controla si el producto está disponible para venta</p>
                   </div>
                 </div>
                 <Switch
                   id="available"
                   checked={formData.available}
                   onCheckedChange={(checked) => setFormData({...formData, available: checked})}
                   className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-green-500 data-[state=checked]:to-emerald-600"
                 />
               </div>
             </div>
             
             <div className="flex justify-end gap-4 pt-6 border-t border-gray-200/50">
               <Button 
                 variant="outline" 
                 onClick={() => setIsAddDialogOpen(false)}
                 className="bg-white/80 backdrop-blur-sm border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl px-6 h-12 font-semibold"
               >
                 Cancelar
               </Button>
               <Button 
                 onClick={handleAddProduct} 
                 disabled={addProductMutation.isPending}
                 className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl px-8 h-12 font-semibold"
               >
                 {addProductMutation.isPending ? (
                   <div className="flex items-center gap-2">
                     <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                     Guardando...
                   </div>
                 ) : (
                   <div className="flex items-center gap-2">
                     <Plus className="h-4 w-4" />
                     Crear Producto
                   </div>
                 )}
               </Button>
             </div>
           </div>
         </DialogContent>
       </Dialog>

             {/* Diálogo para Editar Producto */}
       <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
         <DialogContent className="max-w-lg bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/30 backdrop-blur-xl rounded-3xl shadow-2xl border border-blue-200/50" aria-describedby="edit-product-description">
           <DialogHeader className="text-center pb-4">
             <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
               <Edit className="h-8 w-8 text-white" />
             </div>
             <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-900 bg-clip-text text-transparent">
               Editar Producto
             </DialogTitle>
             <p className="text-gray-600 text-sm mt-1">Modifica los datos del producto seleccionado</p>
           </DialogHeader>
           <div id="edit-product-description" className="sr-only">
             Formulario para editar un producto existente en el sistema
           </div>
           <div className="space-y-6 pt-4">
             <div className="grid grid-cols-1 gap-6">
               <div className="space-y-2">
                 <Label htmlFor="edit-name" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                   <Package className="h-4 w-4 text-blue-600" />
                   Nombre del Producto
                 </Label>
                 <Input
                   id="edit-name"
                   value={formData.name}
                   onChange={(e) => setFormData({...formData, name: e.target.value})}
                   className="bg-white/90 backdrop-blur-sm border-gray-200/50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 rounded-xl h-12 px-4 transition-all duration-200 hover:shadow-md"
                   placeholder="Ingresa el nombre del producto"
                 />
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <Label htmlFor="edit-price" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                     <DollarSign className="h-4 w-4 text-green-600" />
                     Precio (Bs)
                   </Label>
                   <Input
                     id="edit-price"
                     type="number"
                     step="0.01"
                     value={formData.price}
                     onChange={(e) => setFormData({...formData, price: e.target.value})}
                     className="bg-white/90 backdrop-blur-sm border-gray-200/50 focus:border-green-500 focus:ring-2 focus:ring-green-500/30 rounded-xl h-12 px-4 transition-all duration-200 hover:shadow-md"
                     placeholder="0.00"
                   />
                 </div>
                 
                 <div className="space-y-2">
                   <Label htmlFor="edit-category" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                     <Tag className="h-4 w-4 text-purple-600" />
                     Categoría
                   </Label>
                   <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                     <SelectTrigger className="bg-white/90 backdrop-blur-sm border-gray-200/50 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 rounded-xl h-12 px-4 transition-all duration-200 hover:shadow-md">
                       <SelectValue placeholder="Seleccionar categoría" />
                     </SelectTrigger>
                     <SelectContent className="bg-white/95 backdrop-blur-md border border-gray-200/50 shadow-xl rounded-xl">
                       {categories.map(category => (
                         <SelectItem 
                           key={category.id_categoria} 
                           value={category.nombre}
                           className="hover:bg-purple-50 focus:bg-purple-50 cursor-pointer rounded-lg m-1"
                         >
                           {category.nombre}
                         </SelectItem>
                       ))}
                     </SelectContent>
                   </Select>
                 </div>
               </div>
               
               <div className="space-y-2">
                 <Label htmlFor="edit-description" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                   <Edit className="h-4 w-4 text-gray-600" />
                   Descripción (Opcional)
                 </Label>
                 <Input
                   id="edit-description"
                   value={formData.description}
                   onChange={(e) => setFormData({...formData, description: e.target.value})}
                   className="bg-white/90 backdrop-blur-sm border-gray-200/50 focus:border-gray-500 focus:ring-2 focus:ring-gray-500/30 rounded-xl h-12 px-4 transition-all duration-200 hover:shadow-md"
                   placeholder="Descripción del producto"
                 />
               </div>
               
               <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 rounded-xl border border-blue-200/30">
                 <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                     <Activity className="h-5 w-5 text-white" />
                   </div>
                   <div>
                     <Label htmlFor="edit-available" className="text-sm font-semibold text-gray-700">Disponibilidad</Label>
                     <p className="text-xs text-gray-500">Controla si el producto está disponible para venta</p>
                   </div>
                 </div>
                 <Switch
                   id="edit-available"
                   checked={formData.available}
                   onCheckedChange={(checked) => setFormData({...formData, available: checked})}
                   className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-blue-500 data-[state=checked]:to-indigo-600"
                 />
               </div>
             </div>
             
             <div className="flex justify-end gap-4 pt-6 border-t border-gray-200/50">
               <Button 
                 variant="outline" 
                 onClick={() => setIsEditDialogOpen(false)}
                 className="bg-white/80 backdrop-blur-sm border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl px-6 h-12 font-semibold"
               >
                 Cancelar
               </Button>
               <Button 
                 onClick={handleEditProduct} 
                 disabled={updateProductMutation.isPending}
                 className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl px-8 h-12 font-semibold"
               >
                 {updateProductMutation.isPending ? (
                   <div className="flex items-center gap-2">
                     <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                     Guardando...
                   </div>
                 ) : (
                   <div className="flex items-center gap-2">
                     <Edit className="h-4 w-4" />
                     Guardar Cambios
                   </div>
                 )}
               </Button>
             </div>
           </div>
         </DialogContent>
       </Dialog>

      {/* Diálogo de Confirmación de Eliminación */}
      <AlertDialog open={!!productToDelete} onOpenChange={() => setProductToDelete(null)}>
        <AlertDialogContent className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-200/50">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-semibold bg-gradient-to-r from-red-800 to-pink-800 bg-clip-text text-transparent">
              Confirmar Eliminación
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600 leading-relaxed">
              ¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer y el producto será removido del catálogo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/80 backdrop-blur-sm border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteProduct}
              className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {deleteProductMutation.isPending ? 'Eliminando...' : 'Eliminar Producto'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
