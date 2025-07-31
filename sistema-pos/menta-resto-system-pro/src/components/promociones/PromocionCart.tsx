import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  Percent, 
  DollarSign, 
  Tag,
  Eye,
  CheckCircle,
  AlertCircle,
  Sparkles,
  TrendingDown,
  Calendar,
  Package,
  X
} from 'lucide-react';
import { Label } from '@/components/ui/label';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  id_producto?: number;
}

interface Promocion {
  id_promocion: number;
  nombre: string;
  tipo: 'porcentaje' | 'monto_fijo' | 'precio_fijo';
  valor: number;
  fecha_inicio: string;
  fecha_fin: string;
  id_producto: number;
  nombre_producto?: string;
  precio_original?: number;
}

interface PromocionCartProps {
  cartItems: CartItem[];
  appliedPromociones: Promocion[];
}

export function PromocionCart({ cartItems, appliedPromociones }: PromocionCartProps) {
  const { toast } = useToast();
  const [selectedPromocion, setSelectedPromocion] = useState<Promocion | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'porcentaje': return <Percent className="h-3 w-3" />;
      case 'monto_fijo': return <DollarSign className="h-3 w-3" />;
      case 'precio_fijo': return <Tag className="h-3 w-3" />;
      default: return <Tag className="h-3 w-3" />;
    }
  };
  
  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'porcentaje': return 'Porcentaje';
      case 'monto_fijo': return 'Monto Fijo';
      case 'precio_fijo': return 'Precio Fijo';
      default: return tipo;
    }
  };

  const calcularDescuento = (promocion: Promocion, precioOriginal: number) => {
    switch (promocion.tipo) {
      case 'porcentaje':
        return (precioOriginal * promocion.valor) / 100;
      case 'monto_fijo':
        return Math.min(promocion.valor, precioOriginal);
      case 'precio_fijo':
        return Math.max(0, precioOriginal - promocion.valor);
      default:
        return 0;
    }
  };



  const openDetailsModal = (promocion: Promocion) => {
    setSelectedPromocion(promocion);
    setShowDetailsModal(true);
  };

  if (appliedPromociones.length === 0) {
    return (
      <div className="text-center py-3">
        <div className="w-6 h-6 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-1">
          <AlertCircle className="h-3 w-3 text-gray-400" />
        </div>
        <p className="text-gray-500 text-xs">Sin promociones aplicadas</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3 text-green-600" />
            <span className="text-xs font-semibold text-green-700">Promociones Aplicadas</span>
          </div>
          <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200 text-xs px-1 py-0.5">
            {appliedPromociones.length}
          </Badge>
        </div>
        
        {appliedPromociones.map((promocion) => (
          <div 
            key={promocion.id_promocion} 
            className="relative p-2 rounded-lg bg-gradient-to-r from-green-100 to-emerald-100 border-2 border-green-300 shadow-sm hover:shadow-md transition-all duration-300"
          >
            {/* Badge de tipo */}
            <div className="absolute -top-0.5 -left-0.5 z-10">
              <Badge className="bg-gradient-to-r from-green-600 to-emerald-600 text-white text-xs px-1 py-0.5 shadow-lg">
                {getTipoIcon(promocion.tipo)}
                <span className="ml-0.5 text-xs">{getTipoLabel(promocion.tipo)}</span>
              </Badge>
            </div>

            <div className="flex items-start justify-between">
              <div className="flex-1 pr-2 min-w-0">
                <div className="mb-1">
                  <h4 className="font-bold text-green-800 text-xs mb-0.5 truncate">
                    {promocion.nombre}
                  </h4>
                  <p className="text-xs text-green-700 mb-0.5">
                    <Package className="h-2 w-2 inline mr-1" />
                    <span className="truncate">{promocion.nombre_producto || 'Producto no encontrado'}</span>
                  </p>
                  <div className="flex items-center gap-1 text-xs text-green-600">
                    <Calendar className="h-2 w-2" />
                    <span>Válida hasta {new Date(promocion.fecha_fin).toLocaleDateString()}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openDetailsModal(promocion)}
                    className="bg-white/80 backdrop-blur-sm border-green-300 shadow-sm hover:shadow-md transition-all duration-200 text-xs h-5 px-1.5"
                  >
                    <Eye className="h-2.5 w-2.5 mr-0.5" />
                    Detalles
                  </Button>
                </div>
              </div>
              
              <div className="text-right flex-shrink-0">
                <div className="text-sm font-bold text-green-700 mb-0.5">
                  {promocion.tipo === 'porcentaje' ? `${promocion.valor}%` : `Bs ${promocion.valor}`}
                </div>
                <div className="flex items-center gap-0.5 text-xs text-green-700">
                  <CheckCircle className="h-2 w-2" />
                  <span>Aplicada</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Detalles de Promoción */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="sm:max-w-[500px] bg-gradient-to-br from-white to-gray-50/50">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-green-600" />
              Detalles de la Promoción
            </DialogTitle>
            <DialogDescription>
              Información completa de la promoción seleccionada
            </DialogDescription>
          </DialogHeader>
          {selectedPromocion && (
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                <h3 className="text-lg font-bold text-gray-900 mb-2">{selectedPromocion.nombre}</h3>
                <div className="flex items-center gap-2 mb-3">
                  {getTipoIcon(selectedPromocion.tipo)}
                  <Badge variant="outline" className="text-green-700 border-green-300">
                    {getTipoLabel(selectedPromocion.tipo)}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600">Valor del Descuento</Label>
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-xl font-bold text-green-600">
                      {selectedPromocion.tipo === 'porcentaje' ? `${selectedPromocion.valor}%` : `Bs ${selectedPromocion.valor}`}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600">Producto Aplicable</Label>
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm font-medium text-blue-700">
                      {selectedPromocion.nombre_producto || 'Producto no encontrado'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600">Fecha de Inicio</Label>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-sm">{new Date(selectedPromocion.fecha_inicio).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-600">Fecha de Fin</Label>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-sm">{new Date(selectedPromocion.fecha_fin).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              {selectedPromocion.precio_original && (
                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                  <h4 className="font-semibold mb-3 text-blue-800 flex items-center gap-2">
                    <TrendingDown className="h-4 w-4" />
                    Ejemplo de Aplicación
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Precio Original:</span>
                      <span className="font-medium text-gray-700">Bs {selectedPromocion.precio_original}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Descuento Aplicado:</span>
                      <span className="font-medium text-green-600">
                        -Bs {calcularDescuento(selectedPromocion, selectedPromocion.precio_original).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-blue-200">
                      <span className="font-semibold text-blue-800">Precio Final:</span>
                      <span className="font-bold text-green-600 text-lg">
                        Bs {(selectedPromocion.precio_original - calcularDescuento(selectedPromocion, selectedPromocion.precio_original)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-center pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowDetailsModal(false)}
                  className="bg-white/80 backdrop-blur-sm border-gray-300"
                >
                  Cerrar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
} 