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
    <Card className="hover:shadow-md transition-shadow cursor-pointer group">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-medium text-sm leading-tight">{product.name}</h3>
          <Badge variant="success" className="bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold shadow-lg">
            <span translate="no">Bs</span> {product.price}
          </Badge>
        </div>
        
        <div className="flex justify-between items-center mt-4">
          <span className="text-xs text-muted-foreground">{product.category}</span>
          
          {/* Botón principal: Agregar al carrito directamente */}
          <Button
            size="sm"
            onClick={handleQuickAddToCart}
            className="opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg mr-2"
          >
            <Plus className="h-4 w-4" />
          </Button>

          {/* Botón secundario: Modal para notas y modificadores */}
          <AlertDialog open={isDialogOpen} onOpenChange={handleOpenDialog}>
            <AlertDialogTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="opacity-0 group-hover:opacity-100 transition-opacity border-blue-300 text-blue-600 hover:bg-blue-50"
              >
                <Edit3 className="h-3 w-3" />
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
      </CardContent>
    </Card>
  );
}
