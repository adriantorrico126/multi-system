import React, { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { ProfessionalDesktopPrefacturaModal } from './ProfessionalDesktopPrefacturaModal';
import { 
  Users2, 
  Coffee, 
  DollarSign, 
  Clock, 
  FileText, 
  X, 
  Plus, 
  Minus,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Activity,
  MapPin,
  User,
  Receipt,
  CreditCard,
  Settings,
  Menu,
  Info,
  AlertTriangle,
  Printer,
  Download
} from 'lucide-react';
import { useMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';
import { 
  listarGruposActivosCompletos,
  cerrarGrupoMesas,
  generarPrefacturaGrupo,
  obtenerGrupoCompleto
} from '@/services/api';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface Mesa {
  id_mesa: number;
  numero: number;
  capacidad: number;
  estado: string;
  total_acumulado?: number;
  hora_apertura?: string;
}

interface GrupoMesa {
  id_grupo_mesa: number;
  id_restaurante: number;
  id_sucursal: number;
  id_mesero: number;
  nombre_mesero?: string;
  username_mesero?: string;
  estado: string;
  created_at: string;
  updated_at?: string;
  mesas: Mesa[];
  total_acumulado_grupo: number;
}

interface PrefacturaDetalle {
  id_detalle: number;
  id_producto?: number;
  producto?: string;
  nombre_producto?: string;
  producto_nombre: string;
  cantidad: number;
  precio: number;
  precio_unitario: number;
  total: number;
  subtotal: number;
  descripcion?: string;
  observaciones?: string;
  estado?: string;
  fecha_agregado?: string;
}

interface PrefacturaData {
  grupo: any;
  detalles: PrefacturaDetalle[];
  total: number;
  subtotal: number;
  descuentos: number;
  impuestos: number;
  fecha_generacion: string;
  numero_prefactura: string;
  id_grupo_mesa?: number;
  mesas?: number[];
  cantidad_productos?: number;
  total_acumulado?: number;
  total_ventas?: number;
  historial?: any[];
  fecha_apertura?: string;
}

interface GruposMesasManagementProps {
  idRestaurante: number;
}

interface EstadoInfo {
  color: string;
  icon: JSX.Element;
  label: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const ESTADO_CONFIG: Record<string, EstadoInfo> = {
  ABIERTO: {
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: <Activity className="h-3 w-3" />,
    label: 'Activo'
  },
  CERRADO: {
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: <X className="h-3 w-3" />,
    label: 'Cerrado'
  }
};

const REFETCH_INTERVAL = 5000; // 5 segundos
const ANIMATION_DURATION = 200; // ms

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-BO', {
    style: 'currency',
    currency: 'BOB',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount).replace('BOB', '$');
};

const formatDateTime = (dateString: string): string => {
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(new Date(dateString));
};

const formatTime = (dateString: string): string => {
  return new Intl.DateTimeFormat('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(new Date(dateString));
};

const getEstadoConfig = (estado: string): EstadoInfo => {
  return ESTADO_CONFIG[estado] || {
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: <Clock className="h-3 w-3" />,
    label: estado
  };
};

const generatePrefacturaNumber = (grupoId: number): string => {
  return `PF-GRUPO-${grupoId}-${Date.now()}`;
};

// ============================================================================
// STATISTICS COMPONENT
// ============================================================================

interface StatisticCardProps {
  value: string | number;
  label: string;
  className?: string;
}

const StatisticCard: React.FC<StatisticCardProps> = ({ value, label, className = '' }) => (
  <div className={`text-center ${className}`}>
    <div className="text-2xl font-bold">{value}</div>
    <div className="text-sm text-blue-100">{label}</div>
  </div>
);

// ============================================================================
// MESA CARD COMPONENT
// ============================================================================

interface MesaCardProps {
  mesa: Mesa;
  isMobile: boolean;
}

const MesaCard: React.FC<MesaCardProps> = ({ mesa, isMobile }) => (
  <div className={`flex items-center justify-between ${isMobile ? 'p-2' : 'p-3'} bg-gray-50 rounded-lg border border-gray-200 hover:shadow-sm transition-shadow duration-150`}>
    <div className="flex items-center space-x-3">
      <div className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-sm`}>
        <span className={`text-white font-bold ${isMobile ? 'text-xs' : 'text-sm'}`}>
          {mesa.numero}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div className={`font-medium text-gray-900 ${isMobile ? 'text-sm' : ''}`}>
          Mesa {mesa.numero}
        </div>
        <div className={`text-gray-500 ${isMobile ? 'text-xs' : 'text-sm'}`}>
          {mesa.capacidad} personas • {mesa.estado}
        </div>
      </div>
    </div>
    <div className="text-right">
      <div className={`font-bold text-green-600 ${isMobile ? 'text-sm' : ''}`}>
        {formatCurrency(Number(mesa.total_acumulado) || 0)}
      </div>
      {mesa.hora_apertura && (
        <div className={`text-gray-500 ${isMobile ? 'text-xs' : 'text-xs'}`}>
          {formatTime(mesa.hora_apertura)}
        </div>
      )}
    </div>
  </div>
);

// ============================================================================
// EMPTY STATE COMPONENT
// ============================================================================

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description }) => (
  <div className="text-center py-12">
    <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
      {icon}
    </div>
    <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-500">{description}</p>
  </div>
);

// ============================================================================
// LOADING STATE COMPONENT
// ============================================================================

const LoadingState: React.FC<{ message?: string }> = ({ message = 'Cargando...' }) => (
  <div className="flex items-center justify-center py-12">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
      <p className="text-sm text-gray-600">{message}</p>
    </div>
  </div>
);

// ============================================================================
// PROFESSIONAL PREFACTURA MODAL COMPONENT
// ============================================================================

interface ProfessionalPrefacturaModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: string;
  data: PrefacturaData | null;
  loading: boolean;
  onAction: (action: string) => void;
}

const ProfessionalPrefacturaModal: React.FC<ProfessionalPrefacturaModalProps> = ({ 
  isOpen, 
  onClose, 
  type, 
  data, 
  loading, 
  onAction 
}) => {
  if (!data) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="text-2xl font-bold">Prefactura del Grupo</DialogTitle>
          <DialogDescription>
            Detalles de la prefactura generada para el grupo #{data.grupo?.id_grupo_mesa}
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-1 max-h-[65vh] grupo-prefactura-scroll">
          <div className="space-y-6 p-4">
              {/* Información de la prefactura */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold">Número de Prefactura:</h3>
                  <p className="text-lg font-bold">{data.numero_prefactura}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Fecha de Generación:</h3>
                  <p>{formatDateTime(data.fecha_generacion)}</p>
                </div>
              </div>
              
              {/* Información del grupo */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-3 text-lg">Información del Grupo</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p><span className="font-medium">ID Grupo:</span> {data.grupo?.id_grupo_mesa}</p>
                    <p><span className="font-medium">Mesero:</span> {data.grupo?.nombre_mesero || data.grupo?.username_mesero || 'Sin asignar'}</p>
                    <p><span className="font-medium">Estado:</span> {data.grupo?.estado}</p>
                  </div>
                  <div>
                    <p><span className="font-medium">Mesas:</span> {data.mesas?.length || data.grupo?.mesas?.length || 0}</p>
                    <p><span className="font-medium">Fecha Apertura:</span> {formatDateTime(data.fecha_apertura || data.grupo?.created_at)}</p>
                  </div>
                </div>
              </div>
              
              {/* Detalles de la prefactura */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-3 text-lg">Detalles de la Prefactura</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead>Cantidad</TableHead>
                      <TableHead>Precio Unitario</TableHead>
                      <TableHead>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.detalles && data.detalles.length > 0 ? (
                      data.detalles.map((detalle, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">
                            {detalle.nombre_producto || detalle.producto || `Producto ${index + 1}`}
                          </TableCell>
                          <TableCell>{detalle.cantidad}</TableCell>
                          <TableCell>{formatCurrency(detalle.precio)}</TableCell>
                          <TableCell className="font-bold">{formatCurrency(detalle.total)}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-gray-500">
                          No hay detalles de prefactura disponibles
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              
              {/* Resumen de totales */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-3 text-lg">Resumen de Totales</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex justify-between py-1">
                      <span>Subtotal:</span>
                      <span>{formatCurrency(data.subtotal)}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>Descuentos:</span>
                      <span className="text-red-600">-{formatCurrency(data.descuentos)}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>Impuestos:</span>
                      <span>{formatCurrency(data.impuestos)}</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between py-1 border-t border-gray-200">
                      <span className="font-semibold">Total:</span>
                      <span className="font-bold text-xl text-green-600">
                        {formatCurrency(data.total)}
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="font-medium">Cantidad de Productos:</span>
                      <span>{data.cantidad_productos || data.detalles?.reduce((sum, detalle) => sum + detalle.cantidad, 0) || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Historial de transacciones */}
              {data.historial && data.historial.length > 0 && (
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-3 text-lg">Historial de Transacciones</h3>
                  <div className="space-y-2">
                    {data.historial.map((historial, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span>{historial.descripcion || `Transacción ${index + 1}`}</span>
                        <span className="font-medium">{formatCurrency(historial.monto || historial.total || 0)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
        </ScrollArea>
        
        <DialogFooter className="shrink-0">
          <Button 
            onClick={() => onAction('imprimir')} 
            variant="outline"
            disabled={loading}
          >
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
          <Button 
            onClick={() => onAction('descargar')} 
            variant="outline"
            disabled={loading}
          >
            <Download className="h-4 w-4 mr-2" />
            Descargar PDF
          </Button>
          <Button 
            onClick={() => onAction('cobrar')} 
            variant="default"
            className="bg-green-600 hover:bg-green-700"
            disabled={loading}
          >
            <Receipt className="h-4 w-4 mr-2" />
            Cobrar
          </Button>
          <Button 
            onClick={onClose}
            variant="secondary"
          >
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function GruposMesasManagement({ idRestaurante }: GruposMesasManagementProps) {
  // ============================================================================
  // HOOKS
  // ============================================================================
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isMobile } = useMobile();
  
  // ============================================================================
  // STATE
  // ============================================================================
  
  const [selectedGrupo, setSelectedGrupo] = useState<GrupoMesa | null>(null);
  const [showPrefactura, setShowPrefactura] = useState(false);
  const [showProfessionalPrefactura, setShowProfessionalPrefactura] = useState(false);
  const [prefacturaData, setPrefacturaData] = useState<PrefacturaData | null>(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [selectedGrupoForInfo, setSelectedGrupoForInfo] = useState<GrupoMesa | null>(null);

  // ============================================================================
  // QUERIES
  // ============================================================================
  
  const { 
    data: grupos = [], 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['grupos-activos-completos', idRestaurante],
    queryFn: () => listarGruposActivosCompletos(idRestaurante),
    enabled: !!idRestaurante,
    refetchInterval: REFETCH_INTERVAL,
    staleTime: 1000,
  });

  // ============================================================================
  // MUTATIONS
  // ============================================================================
  
  const cerrarGrupoMutation = useMutation({
    mutationFn: cerrarGrupoMesas,
    onSuccess: () => {
      toast({
        title: "✅ Grupo cerrado exitosamente",
        description: "Todas las mesas han sido liberadas correctamente.",
      });
      queryClient.invalidateQueries({ queryKey: ['grupos-activos-completos'] });
      queryClient.invalidateQueries({ queryKey: ['mesas'] });
    },
    onError: (error: any) => {
      toast({
        title: "❌ Error al cerrar grupo",
        description: error.response?.data?.message || "No se pudo cerrar el grupo. Intente nuevamente.",
        variant: "destructive",
      });
    },
  });

  const generarPrefacturaMutation = useMutation({
    mutationFn: generarPrefacturaGrupo,
    onSuccess: (data) => {
      console.log('🔍 [PREFACTURA] Datos recibidos:', data);
      
      const prefacturaData: PrefacturaData = {
        grupo: data,
        detalles: data.historial || [],
        total: data.total_acumulado || 0,
        subtotal: data.total_acumulado || 0,
        descuentos: 0,
        impuestos: 0,
        fecha_generacion: new Date().toISOString(),
        numero_prefactura: generatePrefacturaNumber(data.id_grupo_mesa),
        ...data
      };

      setPrefacturaData(prefacturaData);
      setShowProfessionalPrefactura(true);
      
      toast({
        title: "✅ Prefactura generada",
        description: `Prefactura ${prefacturaData.numero_prefactura} generada exitosamente.`,
      });
    },
    onError: (error: any) => {
      console.error('❌ [PREFACTURA] Error:', error);
      toast({
        title: "❌ Error al generar prefactura",
        description: error.response?.data?.message || "No se pudo generar la prefactura. Intente nuevamente.",
        variant: "destructive",
      });
    },
  });

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================
  
  const statistics = useMemo(() => ({
    totalGrupos: grupos.length,
    totalMesas: grupos.reduce((sum, grupo) => sum + grupo.mesas.length, 0),
    totalAcumulado: grupos.reduce((sum, grupo) => sum + grupo.total_acumulado_grupo, 0)
  }), [grupos]);

  // ============================================================================
  // HANDLERS
  // ============================================================================
  
  const handleCerrarGrupo = useCallback((id_grupo_mesa: number) => {
    if (window.confirm('¿Está seguro de que desea cerrar este grupo?\n\nEsta acción liberará todas las mesas asociadas.')) {
      cerrarGrupoMutation.mutate(id_grupo_mesa);
    }
  }, [cerrarGrupoMutation]);

  const handleGenerarPrefactura = useCallback((id_grupo_mesa: number) => {
    generarPrefacturaMutation.mutate(id_grupo_mesa);
  }, [generarPrefacturaMutation]);

  const handlePrefacturaAction = useCallback((action: string) => {
    console.log('🔍 [ACCIÓN] Prefactura:', action);
    
    const actions: Record<string, () => void> = {
      cobrar: () => toast({
        title: "💰 Cobrar Grupo",
        description: "Redirigiendo al módulo de cobros...",
      }),
      imprimir: () => toast({
        title: "🖨️ Imprimiendo",
        description: "Preparando documento para impresión...",
      }),
      descargar: () => toast({
        title: "📥 Descargando",
        description: "Generando archivo PDF...",
      }),
      editar: () => toast({
        title: "✏️ Editar",
        description: "Abriendo editor de prefactura...",
      }),
    };

    const actionHandler = actions[action];
    if (actionHandler) {
      actionHandler();
    } else {
      console.warn(`Acción no reconocida: ${action}`);
    }
  }, [toast]);

  const handleCloseProfessionalPrefactura = useCallback(() => {
    setShowProfessionalPrefactura(false);
    setPrefacturaData(null);
  }, []);

  const handleCloseInfoModal = useCallback(() => {
    setSelectedGrupoForInfo(null);
  }, []);

  // ============================================================================
  // RENDER CONDITIONS
  // ============================================================================
  
  if (isLoading) {
    return <LoadingState message="Cargando grupos de mesas..." />;
  }

  if (error) {
    return (
      <Alert variant="destructive" className="m-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Error al cargar los grupos de mesas. Por favor, intente recargar la página.
        </AlertDescription>
      </Alert>
    );
  }

  // ============================================================================
  // RENDER
  // ============================================================================
  
  return (
    <div className="space-y-6">
      {/* Header con estadísticas */}
      <Card className="bg-gradient-to-r from-blue-600 to-indigo-700 border-0 shadow-lg">
        <CardContent className="p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg md:text-2xl font-bold text-white truncate">
                Gestión de Grupos de Mesas
              </h2>
              <p className="text-blue-100 text-sm md:text-base mt-1">
                Administra los grupos de mesas unidas
              </p>
            </div>
            
            {/* Estadísticas - Desktop */}
            {!isMobile && (
              <div className="flex items-center space-x-6">
                <StatisticCard 
                  value={statistics.totalGrupos} 
                  label="Grupos Activos" 
                />
                <StatisticCard 
                  value={statistics.totalMesas} 
                  label="Mesas Agrupadas" 
                />
                <StatisticCard 
                  value={formatCurrency(statistics.totalAcumulado)} 
                  label="Total Acumulado" 
                />
              </div>
            )}

            {/* Menú Mobile */}
            {isMobile && (
              <Sheet open={showMobileMenu} onOpenChange={setShowMobileMenu}>
                <SheetTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="bg-white/20 border-white/30 text-white hover:bg-white/30 ml-2"
                  >
                    <Menu className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80">
                  <SheetHeader>
                    <SheetTitle className="text-left">Estadísticas</SheetTitle>
                  </SheetHeader>
                  <div className="space-y-4 mt-6">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {statistics.totalGrupos}
                        </div>
                        <div className="text-sm text-blue-700">Grupos Activos</div>
                      </div>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {statistics.totalMesas}
                        </div>
                        <div className="text-sm text-green-700">Mesas Agrupadas</div>
                      </div>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {formatCurrency(statistics.totalAcumulado)}
                        </div>
                        <div className="text-sm text-purple-700">Total Acumulado</div>
                      </div>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lista de grupos */}
      {grupos.length === 0 ? (
        <EmptyState
          icon={<Users2 className="h-8 w-8 text-gray-400" />}
          title="No hay grupos activos"
          description="Los grupos de mesas aparecerán aquí cuando se creen desde el sistema"
        />
      ) : (
        <div className="grid gap-4 grid-cols-1">
          {grupos.map((grupo) => {
            const estadoConfig = getEstadoConfig(grupo.estado);
            
            return (
              <Card 
                key={grupo.id_grupo_mesa} 
                className="overflow-hidden border-2 border-gray-100 hover:border-blue-200 hover:shadow-md transition-all duration-200"
              >
                <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-200">
                  <div className={`flex ${isMobile ? 'flex-col space-y-3' : 'items-center justify-between'}`}>
                    <div className={`flex items-center ${isMobile ? 'space-x-3' : 'space-x-4'}`}>
                      <div className="p-2 bg-blue-100 rounded-lg shadow-sm">
                        <Users2 className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className={`font-bold text-gray-900 ${isMobile ? 'text-base' : 'text-lg'}`}>
                          Grupo #{grupo.id_grupo_mesa}
                        </CardTitle>
                        <div className={`flex items-center ${isMobile ? 'flex-wrap gap-2 mt-2' : 'space-x-4 mt-1'}`}>
                          <Badge className={estadoConfig.color}>
                            {estadoConfig.icon}
                            <span className="ml-1">{grupo.estado}</span>
                          </Badge>
                          <div className="flex items-center space-x-1 text-sm text-gray-600">
                            <User className="h-4 w-4" />
                            <span className={isMobile ? 'truncate max-w-[120px]' : ''}>
                              {grupo.nombre_mesero || grupo.username_mesero || 'Sin asignar'}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1 text-sm text-gray-600">
                            <Clock className="h-4 w-4" />
                            <span className={isMobile ? 'text-xs' : ''}>
                              {formatDateTime(grupo.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className={`flex items-center ${isMobile ? 'justify-between' : 'space-x-2'}`}>
                      <div className={`text-right ${isMobile ? 'flex-1' : ''}`}>
                        <div className={`font-bold text-green-600 ${isMobile ? 'text-xl' : 'text-2xl'}`}>
                          {formatCurrency(grupo.total_acumulado_grupo)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {grupo.mesas.length} mesa{grupo.mesas.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                      {isMobile && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedGrupoForInfo(grupo)}
                          className="ml-2"
                        >
                          <Info className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className={`${isMobile ? 'p-4' : 'p-6'}`}>
                  {/* Mesas del grupo */}
                  <div className={`${isMobile ? 'mb-4' : 'mb-6'}`}>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                      <MapPin className="h-4 w-4 mr-2" />
                      Mesas del Grupo ({grupo.mesas.length})
                    </h4>
                    <div className={`grid gap-3 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
                      {grupo.mesas.map((mesa) => (
                        <MesaCard key={mesa.id_mesa} mesa={mesa} isMobile={isMobile} />
                      ))}
                    </div>
                  </div>

                  <Separator className="my-4" />

                  {/* Resumen y acciones */}
                  <div className={`flex ${isMobile ? 'flex-col space-y-3' : 'items-center justify-between'}`}>
                    <div className={`text-gray-600 ${isMobile ? 'text-sm text-center' : 'text-sm'}`}>
                      <span className="font-medium">{grupo.mesas.length}</span> mesa{grupo.mesas.length !== 1 ? 's' : ''} unida{grupo.mesas.length !== 1 ? 's' : ''} 
                      <span className="mx-2">•</span>
                      Total: <span className="font-bold text-green-600">{formatCurrency(grupo.total_acumulado_grupo)}</span>
                    </div>
                    <div className={`flex items-center ${isMobile ? 'space-x-2 w-full' : 'space-x-2'}`}>
                      <Button
                        onClick={() => handleGenerarPrefactura(grupo.id_grupo_mesa)}
                        variant="outline"
                        size="sm"
                        disabled={generarPrefacturaMutation.isPending}
                        className={`${isMobile ? 'flex-1' : ''} hover:bg-blue-50 hover:border-blue-300 transition-colors`}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Prefactura
                      </Button>
                      <Button
                        onClick={() => handleCerrarGrupo(grupo.id_grupo_mesa)}
                        variant="destructive"
                        size="sm"
                        disabled={cerrarGrupoMutation.isPending}
                        className={`${isMobile ? 'flex-1' : ''} hover:bg-red-600 transition-colors`}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cerrar Grupo
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal de información para mobile */}
      <Dialog open={!!selectedGrupoForInfo} onOpenChange={handleCloseInfoModal}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Info className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-gray-900">
                  Detalles del Grupo #{selectedGrupoForInfo?.id_grupo_mesa}
                </DialogTitle>
                <DialogDescription>
                  Información completa del grupo de mesas
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          {selectedGrupoForInfo && (
            <div className="space-y-4">
              {/* Información básica */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-3">Información General</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Estado:</span>
                    <Badge className={getEstadoConfig(selectedGrupoForInfo.estado).color}>
                      {getEstadoConfig(selectedGrupoForInfo.estado).icon}
                      <span className="ml-1">{selectedGrupoForInfo.estado}</span>
                    </Badge>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Mesero:</span>
                    <span className="text-sm font-medium">
                      {selectedGrupoForInfo.nombre_mesero || selectedGrupoForInfo.username_mesero || 'Sin asignar'}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Fecha creación:</span>
                    <span className="text-sm font-medium">{formatDateTime(selectedGrupoForInfo.created_at)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total acumulado:</span>
                    <span className="text-sm font-bold text-green-600">
                      {formatCurrency(selectedGrupoForInfo.total_acumulado_grupo)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Mesas del grupo */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-3">
                  Mesas del Grupo ({selectedGrupoForInfo.mesas.length})
                </h3>
                <div className="space-y-2">
                  {selectedGrupoForInfo.mesas.map((mesa) => (
                    <div key={mesa.id_mesa} className="flex items-center justify-between p-3 bg-white rounded-lg border shadow-sm">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-sm">
                          <span className="text-white font-bold text-sm">{mesa.numero}</span>
                        </div>
                        <div>
                          <div className="font-medium text-sm">Mesa {mesa.numero}</div>
                          <div className="text-xs text-gray-500">{mesa.capacidad} personas • {mesa.estado}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-600 text-sm">
                          {formatCurrency(Number(mesa.total_acumulado) || 0)}
                        </div>
                        {mesa.hora_apertura && (
                          <div className="text-xs text-gray-500">
                            {formatTime(mesa.hora_apertura)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Acciones */}
              <div className="flex space-x-2 pt-2">
                <Button
                  onClick={() => {
                    handleGenerarPrefactura(selectedGrupoForInfo.id_grupo_mesa);
                    handleCloseInfoModal();
                  }}
                  variant="outline"
                  className="flex-1"
                  disabled={generarPrefacturaMutation.isPending}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Prefactura
                </Button>
                <Button
                  onClick={() => {
                    handleCerrarGrupo(selectedGrupoForInfo.id_grupo_mesa);
                    handleCloseInfoModal();
                  }}
                  variant="destructive"
                  className="flex-1"
                  disabled={cerrarGrupoMutation.isPending}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cerrar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Prefactura - Responsive */}
      <>
        {/* Modal Profesional para Móvil */}
        {isMobile && (
          <ProfessionalPrefacturaModal
            isOpen={showProfessionalPrefactura}
            onClose={handleCloseProfessionalPrefactura}
            type="grupo"
            data={prefacturaData}
            loading={generarPrefacturaMutation.isPending}
            onAction={handlePrefacturaAction}
          />
        )}
        
        {/* Modal Profesional para Desktop */}
        {!isMobile && (
          <ProfessionalDesktopPrefacturaModal
            isOpen={showProfessionalPrefactura}
            onClose={handleCloseProfessionalPrefactura}
            type="grupo"
            data={prefacturaData}
            loading={generarPrefacturaMutation.isPending}
            onAction={handlePrefacturaAction}
          />
        )}
      </>
    </div>
  );
}