import React, { useState } from 'react';
import { Product } from '@/types/restaurant';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit3 } from 'lucide-react';
import { useMobile } from '@/hooks/use-mobile';
import { SimpleModifierModal } from './modifiers/SimpleModifierModal';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product, notes?: string, modificadores?: any[]) => void;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const [isModifierModalOpen, setIsModifierModalOpen] = useState(false);
  const mobileInfo = useMobile();

  // Agregar al carrito directamente (sin modal)
  const handleQuickAddToCart = () => {
    onAddToCart(product, '', []);
  };

  // Abrir modal de personalización
  const handleOpenCustomizeModal = () => {
    setIsModifierModalOpen(true);
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
              disabled={product.stock_actual === 0}
            >
              <Plus className="h-4 w-4 mr-1" />
              Agregar
            </Button>

            {/* Botón secundario: Modal para notas y toppings */}
            <Button
              size="sm"
              variant="outline"
              className="border-blue-300 text-blue-600 hover:bg-blue-50 min-h-[40px] w-10 p-0"
              onClick={handleOpenCustomizeModal}
              disabled={product.stock_actual === 0}
            >
              <Edit3 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Modal Simple de Toppings */}
        <SimpleModifierModal
          product={product}
          open={isModifierModalOpen}
          onClose={() => setIsModifierModalOpen(false)}
          onAddToCart={onAddToCart}
        />
      </CardContent>
    </Card>
  );
}
