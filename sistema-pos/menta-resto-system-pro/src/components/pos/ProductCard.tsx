import { useState } from 'react';
import { Product } from '@/types/restaurant';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit3 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { getModificadoresPorProducto } from '@/services/api';
import { useMobile } from '@/hooks/use-mobile';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product, notes?: string, modificadores?: any[]) => void;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const [notes, setNotes] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [modificadores, setModificadores] = useState<any[]>([]);
  const [selectedMods, setSelectedMods] = useState<number[]>([]);
  const [loadingMods, setLoadingMods] = useState(false);
  const mobileInfo = useMobile();

  // Agregar al carrito directamente (sin modal)
  const handleQuickAddToCart = () => {
    onAddToCart(product, '', []);
  };

  // Agregar al carrito con notas y modificadores
  const handleAddToCartWithDetails = () => {
    onAddToCart(product, notes, modificadores.filter(m => selectedMods.includes(m.id_modificador)));
    setNotes(''); // Clear notes after adding to cart
    setSelectedMods([]);
    setIsDialogOpen(false);
  };

  // Cargar modificadores al abrir el diálogo
  const handleOpenDialog = async (open: boolean) => {
    setIsDialogOpen(open);
    if (open && modificadores.length === 0 && !loadingMods) {
      setLoadingMods(true);
      try {
        const mods = await getModificadoresPorProducto(product.id);
        setModificadores(mods);
      } catch (e) {
        // opcional: mostrar error
      } finally {
        setLoadingMods(false);
      }
    }
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-200 hover:-translate-y-1 cursor-pointer group bg-white/90 backdrop-blur-sm border border-gray-200/50 shadow-sm touch-manipulation h-full">
      <CardContent className="p-3 h-full flex flex-col">
        {/* Información del producto */}
        <div className="flex-1 flex flex-col justify-between">
          <div>
            {/* Badge de stock */}
            <Badge 
              variant={product.stock_actual === 0 ? "destructive" : product.stock_actual <= 5 ? "destructive" : "default"} 
              className={`mb-2 text-xs px-2 py-1 ${product.stock_actual > 5 ? 'bg-blue-500 text-white border-blue-500' : ''}`}
            >
              Stock: {product.stock_actual}
            </Badge>
            
            <h3 className="font-semibold text-sm text-gray-900 line-clamp-2 mb-2 leading-tight">
              {product.name}
            </h3>
            <p className="text-lg font-bold text-green-600 mb-2">
              <span translate="no">Bs</span> {product.price}
            </p>
            <span className="text-xs text-gray-500">{product.category}</span>
          </div>
          
          {/* Botones adaptados para móvil */}
          <div className="flex items-center gap-2 mt-3">
            {/* Botón principal: Agregar al carrito directamente */}
            <Button
              size="sm"
              onClick={handleQuickAddToCart}
              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg min-h-[40px] text-sm font-medium"
            >
              <Plus className="h-4 w-4 mr-1" />
              Agregar
            </Button>

            {/* Botón secundario: Modal para notas y modificadores */}
            <AlertDialog open={isDialogOpen} onOpenChange={handleOpenDialog}>
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-blue-300 text-blue-600 hover:bg-blue-50 min-h-[40px] w-10 p-0"
                >
                  <Edit3 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-white border border-gray-200 rounded-xl shadow-2xl max-w-md">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-gray-900">Personalizar {product.name}</AlertDialogTitle>
                  <AlertDialogDescription className="text-gray-600">
                    Agregar notas especiales o modificadores (opcional)
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="notes" className="text-gray-700 font-medium">Notas (opcional)</Label>
                    <Textarea
                      id="notes"
                      placeholder="Ej: sin cebolla, bien cocido, extra picante..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="col-span-3 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  {loadingMods ? (
                    <div className="text-xs text-gray-500">Cargando modificadores...</div>
                  ) : modificadores.length > 0 && (
                    <div className="grid gap-2">
                      <Label className="text-gray-700 font-medium">Modificadores/Adiciones</Label>
                      <div className="flex flex-wrap gap-2">
                        {modificadores.map(mod => (
                          <Button
                            key={mod.id_modificador}
                            size="sm"
                            variant={selectedMods.includes(mod.id_modificador) ? 'default' : 'outline'}
                            onClick={() => setSelectedMods(prev => prev.includes(mod.id_modificador)
                              ? prev.filter(id => id !== mod.id_modificador)
                              : [...prev, mod.id_modificador])}
                            className={selectedMods.includes(mod.id_modificador) 
                              ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg' 
                              : 'hover:border-green-300 hover:text-green-700 border-gray-300'
                            }
                          >
                            {mod.nombre_modificador} {mod.precio_extra > 0 ? `(+${mod.precio_extra})` : ''}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel className="border-gray-300 text-gray-700 hover:bg-gray-50">Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleAddToCartWithDetails} className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg">
                    Agregar al Carrito
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
