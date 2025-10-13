import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, ShoppingCart } from 'lucide-react';
import { api } from '@/services/api';

interface Product {
  id_producto?: number;
  id?: string;
  nombre?: string;
  name?: string;
  precio?: number;
  price?: number;
}

interface Modificador {
  id_modificador: number;
  nombre_modificador: string;
  precio_extra: number | string;
}

interface SimpleModifierModalProps {
  product: Product | null;
  open: boolean;
  onClose: () => void;
  onAddToCart: (product: Product, notes: string, modifiers: any[]) => void;
}

export function SimpleModifierModal({
  product,
  open,
  onClose,
  onAddToCart
}: SimpleModifierModalProps) {
  const [modificadores, setModificadores] = useState<Modificador[]>([]);
  const [selectedModifiers, setSelectedModifiers] = useState<number[]>([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  // Helpers
  const getProductId = (): number | undefined => {
    if (!product) return undefined;
    if (product.id_producto) return product.id_producto;
    if (product.id) return parseInt(product.id);
    return undefined;
  };

  const getProductName = (): string => {
    if (!product) return '';
    return product.nombre || product.name || '';
  };

  const getProductPrice = (): number => {
    if (!product) return 0;
    return product.precio || product.price || 0;
  };

  // Cargar modificadores
  useEffect(() => {
    if (open && product) {
      loadModifiers();
    } else {
      // Limpiar al cerrar
      setModificadores([]);
      setSelectedModifiers([]);
      setNotes('');
    }
  }, [open, product]);

  const loadModifiers = async () => {
    const productId = getProductId();
    if (!productId) return;

    setLoading(true);
    try {
      console.log('🔍 Cargando toppings para producto:', productId);
      const response = await api.get(`/modificadores/producto/${productId}`);
      const mods = response.data.modificadores || [];
      console.log('✅ Toppings cargados:', mods.length);
      setModificadores(mods);
      
      // Si no hay modificadores, mostrar modal sin toppings pero permitir notas
      if (mods.length === 0) {
        console.log('ℹ️ No hay toppings disponibles, pero se puede agregar notas');
        // No cerrar automáticamente, permitir agregar notas
      }
    } catch (error) {
      console.error('Error al cargar toppings:', error);
      // Si hay error, agregar sin modificadores
      onAddToCart(product!, '', []);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const toggleModifier = (id: number) => {
    setSelectedModifiers(prev => 
      prev.includes(id) 
        ? prev.filter(modId => modId !== id)
        : [...prev, id]
    );
  };

  const calculateTotal = () => {
    const modifiersTotal = selectedModifiers.reduce((total, id) => {
      const mod = modificadores.find(m => m.id_modificador === id);
      if (mod) {
        return total + parseFloat(mod.precio_extra.toString());
      }
      return total;
    }, 0);

    return getProductPrice() + modifiersTotal;
  };

  const handleAddToCart = () => {
    const selectedModsData = selectedModifiers.map(id => {
      const mod = modificadores.find(m => m.id_modificador === id);
      return {
        id_modificador: id,
        nombre_modificador: mod?.nombre_modificador || '',
        precio_extra: parseFloat(mod?.precio_extra.toString() || '0'),
        cantidad: 1
      };
    });

    onAddToCart(product!, notes, selectedModsData);
    onClose();
  };

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-xl">
            🍕 Personaliza tu pedido
          </DialogTitle>
          <DialogDescription className="text-base font-semibold text-gray-700">
            {getProductName()}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-4 px-1">
          {loading ? (
            <div className="text-center py-8 text-gray-500">
              Cargando toppings...
            </div>
          ) : (
            <>
              {/* Lista de Toppings */}
              {modificadores.length > 0 ? (
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">
                    ✨ Extras Disponibles
                  </Label>
                  <div className="border rounded-lg p-3 space-y-3 bg-gray-50 max-h-64 overflow-y-auto">
                    {modificadores.map((mod) => {
                      const precio = parseFloat(mod.precio_extra.toString());
                      const isSelected = selectedModifiers.includes(mod.id_modificador);
                      
                      return (
                        <div
                          key={mod.id_modificador}
                          className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all cursor-pointer ${
                            isSelected 
                              ? 'border-green-500 bg-green-50' 
                              : 'border-gray-200 bg-white hover:border-green-300'
                          }`}
                          onClick={() => toggleModifier(mod.id_modificador)}
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleModifier(mod.id_modificador)}
                            />
                            <div>
                              <p className="font-medium text-gray-900">
                                {mod.nombre_modificador}
                              </p>
                              <p className="text-sm text-green-600 font-semibold">
                                + Bs {precio.toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
                    <ShoppingCart className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500 mb-2">
                    Este producto no tiene extras disponibles
                  </p>
                  <p className="text-xs text-gray-400">
                    Puedes agregar notas especiales a continuación
                  </p>
                </div>
              )}

              {/* Notas */}
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-sm font-semibold text-gray-700">
                  📝 Notas especiales (opcional)
                </Label>
                <Textarea
                  id="notes"
                  placeholder="Ej: Sin cebolla, extra queso..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="resize-none"
                />
              </div>

              {/* Resumen */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Producto:</span>
                    <span className="font-medium">Bs {getProductPrice().toFixed(2)}</span>
                  </div>
                  {selectedModifiers.length > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Extras ({selectedModifiers.length}):</span>
                      <span className="font-medium">
                        Bs {(calculateTotal() - getProductPrice()).toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold border-t border-green-300 pt-2">
                    <span>Total:</span>
                    <span className="text-green-600">Bs {calculateTotal().toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="flex-shrink-0 mt-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleAddToCart}
            className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
            disabled={loading}
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            Agregar al carrito
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

