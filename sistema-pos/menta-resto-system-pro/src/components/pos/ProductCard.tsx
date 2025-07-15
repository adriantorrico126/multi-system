import { useState } from 'react';
import { Product } from '@/types/restaurant';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product, notes?: string) => void;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const [notes, setNotes] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleAddToCart = () => {
    onAddToCart(product, notes);
    setNotes(''); // Clear notes after adding to cart
    setIsDialogOpen(false);
  };

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer group">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-medium text-sm leading-tight">{product.name}</h3>
          <Badge variant="secondary" className="bg-green-100 text-green-700 ml-2">
            <span translate="no">Bs</span> {product.price}
          </Badge>
        </div>
        
        <div className="flex justify-between items-center mt-4">
          <span className="text-xs text-muted-foreground">{product.category}</span>
          <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button
                size="sm"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Añadir {product.name} al Carrito</AlertDialogTitle>
                <AlertDialogDescription>
                  ¿Deseas añadir alguna nota especial para este producto?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="notes">Notas (opcional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Ej: sin cebolla, bien cocido, extra picante..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="col-span-3"
                  />
                </div>
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleAddToCart}>Añadir al Carrito</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}
