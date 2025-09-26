import React, { useState, useMemo } from 'react';
import { Product, CartItem } from '@/types/restaurant';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Search,
  Filter,
  Package,
  DollarSign,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  CreditCard,
  Banknote,
  Receipt,
  Calculator,
  Zap,
  Star,
  TrendingUp
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMobile } from '@/hooks/use-mobile';

interface SalesProcessImprovedProps {
  products: Product[];
  cartItems: CartItem[];
  onAddToCart: (product: Product) => void;
  onRemoveFromCart: (productId: number) => void;
  onUpdateQuantity: (productId: number, quantity: number) => void;
  onClearCart: () => void;
  onCheckout: () => void;
  isLoading?: boolean;
}

export function SalesProcessImproved({
  products,
  cartItems,
  onAddToCart,
  onRemoveFromCart,
  onUpdateQuantity,
  onClearCart,
  onCheckout,
  isLoading = false
}: SalesProcessImprovedProps) {
  const { toast } = useToast();
  const mobileInfo = useMobile();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'popularity'>('popularity');

  // Filtrar productos
  const filteredProducts = useMemo(() => {
    let filtered = products.filter(product => {
      const matchesSearch = product.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.descripcion?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || 
                             product.categoria_id?.toString() === selectedCategory;
      const isAvailable = product.disponible;
      return matchesSearch && matchesCategory && isAvailable;
    });

    // Ordenar productos
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.nombre || '').localeCompare(b.nombre || '');
        case 'price':
          return (a.precio || 0) - (b.precio || 0);
        case 'popularity':
          // Simular popularidad basada en disponibilidad y precio
          const aScore = (a.disponible ? 1 : 0) + (a.precio ? 1 : 0);
          const bScore = (b.disponible ? 1 : 0) + (b.precio ? 1 : 0);
          return bScore - aScore;
        default:
          return 0;
      }
    });

    return filtered;
  }, [products, searchTerm, selectedCategory, sortBy]);

  // Calcular totales del carrito
  const cartTotals = useMemo(() => {
    const subtotal = cartItems.reduce((sum, item) => sum + (item.precio * item.quantity), 0);
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const tax = subtotal * 0.13; // 13% de impuesto
    const total = subtotal + tax;

    return { subtotal, totalItems, tax, total };
  }, [cartItems]);

  // Obtener categorías únicas
  const categories = useMemo(() => {
    const uniqueCategories = new Set(products.map(p => p.categoria_id).filter(Boolean));
    return Array.from(uniqueCategories).map(id => ({
      id,
      name: `Categoría ${id}` // En una implementación real, obtendrías el nombre de la categoría
    }));
  }, [products]);

  const handleAddToCart = (product: Product) => {
    onAddToCart(product);
    toast({
      title: "Producto agregado",
      description: `${product.nombre} se agregó al carrito.`,
    });
  };

  const handleRemoveFromCart = (productId: number) => {
    onRemoveFromCart(productId);
    toast({
      title: "Producto eliminado",
      description: "El producto se eliminó del carrito.",
    });
  };

  const handleUpdateQuantity = (productId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveFromCart(productId);
    } else {
      onUpdateQuantity(productId, newQuantity);
    }
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      toast({
        title: "Carrito vacío",
        description: "Agrega productos al carrito antes de proceder al pago.",
        variant: "destructive",
      });
      return;
    }
    onCheckout();
  };

  return (
    <div className="h-full flex flex-col mobile-content">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Punto de Venta</h2>
          <p className="text-sm text-gray-600">Selecciona productos para la venta</p>
        </div>
        <Badge className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white">
          <ShoppingCart className="h-3 w-3 mr-1" />
          {cartTotals.totalItems} items
        </Badge>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Panel de productos */}
        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
          {/* Filtros */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Buscar productos..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 mobile-form"
                    />
                  </div>
                </div>
                
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm mobile-form"
                >
                  <option value="all">Todas las categorías</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm mobile-form"
                >
                  <option value="popularity">Popularidad</option>
                  <option value="name">Nombre</option>
                  <option value="price">Precio</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Grid de productos */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 mobile-grid">
            {filteredProducts.map((product) => (
              <Card 
                key={product.id} 
                className="hover:shadow-lg transition-all duration-200 group cursor-pointer mobile-touch-feedback"
                onClick={() => handleAddToCart(product)}
              >
                <CardContent className="p-3">
                  <div className="space-y-2">
                    {/* Imagen del producto */}
                    <div className="w-full h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                      <Package className="h-8 w-8 text-gray-400" />
                    </div>

                    {/* Información del producto */}
                    <div className="space-y-1">
                      <h3 className="font-medium text-gray-800 text-sm line-clamp-2">{product.nombre}</h3>
                      <p className="text-xs text-gray-600 line-clamp-1">{product.descripcion}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-green-600">
                          {product.precio?.toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}
                        </span>
                        <Badge className="bg-green-100 text-green-800 text-xs">
                          Disponible
                        </Badge>
                      </div>
                    </div>

                    {/* Botón de agregar */}
                    <Button
                      size="sm"
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white mobile-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToCart(product);
                      }}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Agregar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Panel del carrito */}
        <div className="w-full lg:w-96 border-l border-gray-200 bg-gray-50 flex flex-col">
          {/* Header del carrito */}
          <div className="p-4 border-b border-gray-200 bg-white">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">Carrito de Compras</h3>
              {cartItems.length > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onClearCart}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 mobile-touch-target"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Limpiar
                </Button>
              )}
            </div>
          </div>

          {/* Lista de items del carrito */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {cartItems.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">El carrito está vacío</p>
                <p className="text-gray-400 text-xs">Agrega productos para comenzar</p>
              </div>
            ) : (
              cartItems.map((item) => (
                <Card key={item.id} className="bg-white">
                  <CardContent className="p-3">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-800 text-sm truncate">{item.nombre}</h4>
                          <p className="text-xs text-gray-600">
                            {item.precio.toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRemoveFromCart(item.id)}
                          className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 mobile-touch-target"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                            className="h-6 w-6 p-0 mobile-touch-target"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                            className="h-6 w-6 p-0 mobile-touch-target"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <span className="text-sm font-bold text-gray-800">
                          {(item.precio * item.quantity).toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Resumen y checkout */}
          {cartItems.length > 0 && (
            <div className="p-4 border-t border-gray-200 bg-white space-y-4">
              {/* Resumen de totales */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">{cartTotals.subtotal.toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Impuesto (13%):</span>
                  <span className="font-medium">{cartTotals.tax.toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2">
                  <span>Total:</span>
                  <span className="text-green-600">{cartTotals.total.toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}</span>
                </div>
              </div>

              {/* Botón de checkout */}
              <Button
                onClick={handleCheckout}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white mobile-button h-12"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Procesando...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Proceder al Pago
                  </div>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


