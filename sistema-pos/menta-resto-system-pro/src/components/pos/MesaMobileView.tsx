import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Users,
  Clock,
  ShoppingCart,
  Plus,
  Search,
  UtensilsCrossed,
  CheckCircle,
  AlertCircle,
  DollarSign,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import { getMesas, liberarMesa, getVentasOrdenadas } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useMobile } from '@/hooks/use-mobile';

interface MesaMobileViewProps {
  onMesaSelect?: (mesa: any) => void;
  onNewOrder?: (mesa: any) => void;
}

export function MesaMobileView({ onMesaSelect, onNewOrder }: MesaMobileViewProps) {
  const { user } = useAuth();
  const mobileInfo = useMobile();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMesa, setSelectedMesa] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Obtener sucursal actual
  const getCurrentSucursalId = () => {
    const savedSucursalId = localStorage.getItem('selectedSucursalId');
    return savedSucursalId ? parseInt(savedSucursalId) : (user?.sucursal?.id || 1);
  };

  const currentSucursalId = getCurrentSucursalId();

  // Query para obtener mesas
  const { data: mesas = [], isLoading: isLoadingMesas } = useQuery({
    queryKey: ['mesas', currentSucursalId],
    queryFn: () => getMesas(),
    enabled: true,
  });

  // Query para obtener ventas
  const { data: ventas = [] } = useQuery({
    queryKey: ['ventas-ordenadas', currentSucursalId],
    queryFn: () => getVentasOrdenadas(100),
    enabled: true,
  });

  // Mutation para liberar mesa
  const liberarMesaMutation = useMutation({
    mutationFn: liberarMesa,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mesas'] });
      queryClient.invalidateQueries({ queryKey: ['ventas-ordenadas'] });
      setIsDetailOpen(false);
    },
  });

  // Filtrar mesas por búsqueda
  const filteredMesas = useMemo(() => {
    if (!searchTerm) return mesas;
    return mesas.filter((mesa: any) =>
      mesa.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mesa.numero?.toString().includes(searchTerm)
    );
  }, [mesas, searchTerm]);

  // Obtener estado de la mesa
  const getMesaStatus = (mesa: any) => {
    const ventaActiva = ventas.find((v: any) => 
      v.mesa_id === mesa.id && 
      (v.estado === 'pendiente' || v.estado === 'preparando' || v.estado === 'listo')
    );
    
    if (ventaActiva) {
      return {
        status: 'ocupada',
        venta: ventaActiva,
        color: 'from-red-500 to-pink-500',
        bgColor: 'from-red-50 to-pink-50',
        borderColor: 'border-red-200'
      };
    }
    
    return {
      status: 'libre',
      venta: null,
      color: 'from-green-500 to-emerald-500',
      bgColor: 'from-green-50 to-emerald-50',
      borderColor: 'border-green-200'
    };
  };

  const handleMesaClick = (mesa: any) => {
    setSelectedMesa(mesa);
    setIsDetailOpen(true);
  };

  const handleLiberarMesa = () => {
    if (selectedMesa) {
      liberarMesaMutation.mutate(selectedMesa.id);
    }
  };

  const handleNuevaOrden = () => {
    if (selectedMesa && onNewOrder) {
      onNewOrder(selectedMesa);
    }
    setIsDetailOpen(false);
  };

  if (!mobileInfo.isMobile) {
    return null;
  }

  return (
    <div className="p-4 space-y-4 mobile-content">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Gestión de Mesas</h2>
          <p className="text-sm text-gray-600">Control de ocupación y pedidos</p>
        </div>
        <Badge className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white">
          {mesas.length} mesas
        </Badge>
      </div>

      {/* Búsqueda */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Buscar mesa..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 mobile-form"
        />
      </div>

      {/* Grid de mesas */}
      <div className="grid grid-cols-2 gap-3 mobile-grid">
        {filteredMesas.map((mesa: any) => {
          const mesaStatus = getMesaStatus(mesa);
          
          return (
            <Card
              key={mesa.id}
              className={`bg-gradient-to-br ${mesaStatus.bgColor} border ${mesaStatus.borderColor} hover:shadow-lg transition-all duration-200 mobile-touch-feedback`}
              onClick={() => handleMesaClick(mesa)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-8 h-8 bg-gradient-to-r ${mesaStatus.color} rounded-lg flex items-center justify-center`}>
                    <UtensilsCrossed className="h-4 w-4 text-white" />
                  </div>
                  <Badge className={`bg-gradient-to-r ${mesaStatus.color} text-white text-xs`}>
                    {mesaStatus.status === 'ocupada' ? 'Ocupada' : 'Libre'}
                  </Badge>
                </div>
                
                <div className="space-y-1">
                  <h3 className="font-semibold text-gray-800">{mesa.nombre}</h3>
                  <p className="text-xs text-gray-600">Capacidad: {mesa.capacidad} personas</p>
                  
                  {mesaStatus.venta && (
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center gap-1 text-xs text-gray-600">
                        <Clock className="h-3 w-3" />
                        <span>{mesaStatus.venta.tiempo_transcurrido || '0 min'}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-600">
                        <DollarSign className="h-3 w-3" />
                        <span>{mesaStatus.venta.total?.toLocaleString('es-BO', { style: 'currency', currency: 'BOB' }) || 'Bs 0'}</span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Modal de detalles de mesa */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="mobile-modal">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UtensilsCrossed className="h-5 w-5 text-blue-600" />
              Mesa {selectedMesa?.nombre}
            </DialogTitle>
          </DialogHeader>
          
          {selectedMesa && (
            <div className="space-y-4">
              {/* Información de la mesa */}
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-800">{selectedMesa.nombre}</h3>
                    <p className="text-sm text-gray-600">Capacidad: {selectedMesa.capacidad} personas</p>
                  </div>
                  <Badge className={`bg-gradient-to-r ${getMesaStatus(selectedMesa).color} text-white`}>
                    {getMesaStatus(selectedMesa).status === 'ocupada' ? 'Ocupada' : 'Libre'}
                  </Badge>
                </div>
              </div>

              {/* Información de la venta activa */}
              {getMesaStatus(selectedMesa).venta && (
                <div className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border border-orange-200">
                  <h4 className="font-semibold text-gray-800 mb-2">Pedido Activo</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Tiempo:</span>
                      <span className="text-sm font-medium">{getMesaStatus(selectedMesa).venta.tiempo_transcurrido || '0 min'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Total:</span>
                      <span className="text-sm font-medium">{getMesaStatus(selectedMesa).venta.total?.toLocaleString('es-BO', { style: 'currency', currency: 'BOB' }) || 'Bs 0'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Estado:</span>
                      <Badge variant="outline" className="text-xs">
                        {getMesaStatus(selectedMesa).venta.estado}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}

              {/* Acciones */}
              <div className="flex gap-2">
                {getMesaStatus(selectedMesa).status === 'libre' ? (
                  <Button
                    onClick={handleNuevaOrden}
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white mobile-button"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Nueva Orden
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={handleNuevaOrden}
                      variant="outline"
                      className="flex-1 mobile-button"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Ver Pedido
                    </Button>
                    <Button
                      onClick={handleLiberarMesa}
                      variant="destructive"
                      className="flex-1 mobile-button"
                      disabled={liberarMesaMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Liberar
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
