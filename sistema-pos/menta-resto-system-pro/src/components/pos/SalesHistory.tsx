import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Search, Edit, Trash2, FileText, Download, Calendar, Filter, BarChart3, TrendingUp, DollarSign, Users, Package, Building, CreditCard, Tag, Settings, Eye, MoreHorizontal } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMobile } from '@/hooks/use-mobile';
import { exportVentasFiltradas } from '@/services/api';
import { exportSalesToCSV } from '@/utils/csvExport';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { Label } from '@/components/ui/label';
import { CardDescription } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { FileSpreadsheet } from 'lucide-react';
import { Sale } from '@/types/restaurant';
import { SaleDetailsModal } from './SaleDetailsModal';
import { AdvancedAnalytics } from './AdvancedAnalytics';
import { MobileAdvancedAnalytics } from './MobileAdvancedAnalytics';
import { getBranches, getProducts, getPaymentMethods, getUsers } from '@/services/api';
import { PlanGate } from '@/components/plan/PlanGate';

interface SalesHistoryProps {
  sales: Sale[];
  onDeleteSale: (saleId: string) => void;
  userRole: 'cajero' | 'admin' | 'cocinero';
}

export function SalesHistory({ sales, onDeleteSale, userRole }: SalesHistoryProps) {
  const [activeTab, setActiveTab] = useState<'historial' | 'avanzadas'>('historial');
  const [searchTerm, setSearchTerm] = useState('');
  const [saleForDetails, setSaleForDetails] = useState<Sale | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedSaleForInfo, setSelectedSaleForInfo] = useState<Sale | null>(null);
  const [isInfoDialogOpen, setIsInfoDialogOpen] = useState(false);
  const [loadingExport, setLoadingExport] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const { toast } = useToast();
  const mobileInfo = useMobile();

  // Debug: Log de las ventas recibidas
  useEffect(() => {
    console.log('🔍 SalesHistory - Ventas recibidas:', sales);
    console.log('🔍 SalesHistory - Total de ventas:', sales.length);
    if (sales.length > 0) {
      const primeraVenta = sales[0];
      console.log('🔍 SalesHistory - Primera venta:', primeraVenta);
      console.log('🔍 SalesHistory - Propiedades de la primera venta:', Object.keys(primeraVenta));
      console.log('🔍 SalesHistory - Timestamp de la primera venta:', primeraVenta.timestamp);
      console.log('🔍 SalesHistory - Fecha de la primera venta:', primeraVenta.fecha);
      console.log('🔍 SalesHistory - Tipo de timestamp:', typeof primeraVenta.timestamp);
      console.log('🔍 SalesHistory - Es válido timestamp:', !isNaN(new Date(primeraVenta.timestamp).getTime()));
    }
  }, [sales]);

  // Estado para analytics avanzados
  const [showAdvancedAnalytics, setShowAdvancedAnalytics] = useState(false);
  
  // Logs de depuración para analytics
  console.log('🔍 [SALES-HISTORY] Componente renderizado');
  console.log('🔍 [SALES-HISTORY] activeTab:', activeTab);
  console.log('🔍 [SALES-HISTORY] showAdvancedAnalytics:', showAdvancedAnalytics);

  // Componente de restricción para funciones avanzadas
  const FuncionesAvanzadasRestricted = () => (
    <div className="flex-1 p-6">
      <Card className="border-purple-200 bg-purple-50">
        <CardHeader>
          <CardTitle className="text-center text-purple-800">
            🔒 Funciones Avanzadas - Plan Básico Requerido
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-purple-700">
            Las <strong>Funciones Avanzadas</strong> están disponibles únicamente en el plan <strong>Básico</strong> o superior.
          </p>
          <p className="text-sm text-purple-600">
            Esta funcionalidad incluye analytics avanzados, comparaciones de períodos, análisis de tendencias, exportación profesional con gráficos y métricas detalladas de rendimiento.
          </p>
          <div className="space-y-3">
            <div className="text-left">
              <h4 className="font-semibold text-purple-800 mb-2">Funcionalidades incluidas:</h4>
              <ul className="text-sm text-purple-600 space-y-1">
                <li>• 📊 Analytics avanzados con gráficos interactivos</li>
                <li>• 📈 Análisis de tendencias y comparaciones</li>
                <li>• 🎯 Métricas de rendimiento por vendedor</li>
                <li>• 📋 Exportación profesional (Excel con gráficos)</li>
                <li>• ⏰ Análisis de distribución horaria</li>
                <li>• 🏆 Rankings y top performers</li>
              </ul>
            </div>
          </div>
          <div className="flex justify-center space-x-4">
            <Button variant="outline" className="border-purple-300 text-purple-700">
              📞 Contactar Soporte
            </Button>
            <Button className="bg-purple-600 hover:bg-purple-700">
              👑 Actualizar Plan
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Función para formatear moneda
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-BO', {
      style: 'currency',
      currency: 'BOB'
    }).format(amount);
  };

  // Función para obtener la fecha de una venta
  const getSaleDate = (sale: Sale): Date | null => {
    if (sale.fecha) {
      const date = new Date(sale.fecha);
      if (!isNaN(date.getTime())) return date;
    }
    if (sale.timestamp) {
      const date = new Date(sale.timestamp);
      if (!isNaN(date.getTime())) return date;
    }
    return null;
  };

  // Función para formatear fecha con validación
  const formatDate = (dateInput: string | Date) => {
    try {
      const date = new Date(dateInput);
      // Verificar si la fecha es válida
      if (isNaN(date.getTime())) {
        return 'Fecha inválida';
      }
      return format(date, 'dd/MM/yyyy HH:mm');
    } catch (error) {
      console.warn('Error formateando fecha:', dateInput, error);
      return 'Fecha inválida';
    }
  };

  // Función para mostrar detalles de venta
  const handleShowDetails = (sale: Sale) => {
    setSaleForDetails(sale);
    setShowDetailsModal(true);
  };

  // Función para eliminar venta
  const handleDeleteSale = (saleId: string) => {
    onDeleteSale(saleId);
    toast({
      title: "Venta eliminada",
      description: "La venta ha sido eliminada exitosamente",
    });
  };

  // Filtrar ventas basado en el término de búsqueda
  const filteredSales = sales.filter(sale => {
    // Validar que la venta tenga una fecha válida
    const saleDate = getSaleDate(sale);
    if (!saleDate) {
      console.warn('Venta sin fecha válida encontrada:', sale);
      return false;
    }
    
    const searchLower = searchTerm.toLowerCase();
    return (
      sale.id.toString().includes(searchLower) ||
      (sale.tipo_servicio && sale.tipo_servicio.toLowerCase().includes(searchLower)) ||
      (sale.mesa_numero && sale.mesa_numero.toString().includes(searchLower)) ||
      (sale.estado && sale.estado.toLowerCase().includes(searchLower)) ||
      sale.total.toString().includes(searchLower)
    );
  });

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header con pestañas - Optimizado para móvil */}
      <div className="flex flex-col gap-3">
        <div className="flex gap-2 overflow-x-auto pb-2">
          <Button
            variant={activeTab === 'historial' ? 'default' : 'outline'}
            onClick={() => setActiveTab('historial')}
            className="flex items-center gap-2 whitespace-nowrap text-sm px-3 py-2 min-w-fit"
          >
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Historial</span>
            <span className="sm:hidden">Ventas</span>
          </Button>
          <Button
            variant={activeTab === 'avanzadas' ? 'default' : 'outline'}
            onClick={() => {
              console.log('🔍 [SALES-HISTORY] Clic en "Funciones Avanzadas"');
              setActiveTab('avanzadas');
            }}
            className="flex items-center gap-2 whitespace-nowrap text-sm px-3 py-2 min-w-fit"
          >
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Funciones Avanzadas</span>
            <span className="sm:hidden">Analytics</span>
          </Button>
        </div>
      </div>

      {/* Contenido del historial */}
      {activeTab === 'historial' && (
        <div className="space-y-3 md:space-y-4">
          {/* Filtros de búsqueda - Optimizado para móvil */}
          <Card>
            <CardContent className="p-3 md:p-4">
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar ventas..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 text-sm md:text-base"
                  />
                </div>
                {/* Contador de resultados */}
                <div className="flex justify-between items-center text-sm text-gray-600">
                  <span>{filteredSales.length} venta{filteredSales.length !== 1 ? 's' : ''} encontrada{filteredSales.length !== 1 ? 's' : ''}</span>
                  {searchTerm && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSearchTerm('')}
                      className="text-xs h-6 px-2"
                    >
                      Limpiar
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de ventas - Optimizada para móvil */}
          {filteredSales.length > 0 ? (
            <div className="space-y-3">
              {filteredSales.map((sale) => (
                <Card key={sale.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        {/* Header de la venta */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              #{sale.id}
                            </Badge>
                            <Badge 
                              variant={sale.estado === 'completada' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {sale.estado || 'N/A'}
                            </Badge>
                          </div>
                          <span className="text-lg font-bold text-green-600">
                            {formatCurrency(sale.total || 0)}
                          </span>
                        </div>

                        {/* Detalles de la venta */}
                        <div className="space-y-1 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(getSaleDate(sale) || '')}</span>
                          </div>
                          {sale.tipo_servicio && (
                            <div className="flex items-center gap-2">
                              <Tag className="h-3 w-3" />
                              <span>{sale.tipo_servicio}</span>
                            </div>
                          )}
                          {sale.mesa_numero && (
                            <div className="flex items-center gap-2">
                              <Package className="h-3 w-3" />
                              <span>Mesa {sale.mesa_numero}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Botón de acciones */}
                      <div className="ml-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleShowDetails(sale)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Ver Detalles
                            </DropdownMenuItem>
                            {userRole === 'admin' && (
                              <DropdownMenuItem 
                                onClick={() => handleDeleteSale(sale.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Eliminar
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8">
                <div className="text-center text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium mb-2">No se encontraron ventas</p>
                  <p className="text-sm">
                    {searchTerm ? 'Intenta con otros términos de búsqueda' : 'No hay ventas registradas'}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Funciones avanzadas - Optimizado para móvil */}
      {activeTab === 'avanzadas' && (
        <PlanGate feature="sales.avanzado" fallback={<FuncionesAvanzadasRestricted />} requiredPlan="basico">
          <div className="flex-1 p-3 md:p-6">
            {!showAdvancedAnalytics ? (
              <div className="space-y-4 md:space-y-6">
                <div className="text-center">
                  <h3 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">Funciones Avanzadas</h3>
                  <p className="text-sm md:text-base text-gray-600 mb-6 md:mb-8">Accede a analytics avanzados y métricas detalladas</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => {
                    console.log('🔍 [SALES-HISTORY] Clic en "Analytics Avanzados"');
                    setShowAdvancedAnalytics(true);
                  }}>
                    <CardContent className="p-4 md:p-6 text-center">
                      <BarChart3 className="h-10 w-10 md:h-12 md:w-12 mx-auto mb-3 md:mb-4 text-blue-500" />
                      <h4 className="text-base md:text-lg font-semibold mb-2">Analytics Avanzados</h4>
                      <p className="text-xs md:text-sm text-gray-600">Métricas, KPIs y gráficas interactivas</p>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-4 md:p-6 text-center">
                      <Download className="h-10 w-10 md:h-12 md:w-12 mx-auto mb-3 md:mb-4 text-green-500" />
                      <h4 className="text-base md:text-lg font-semibold mb-2">Exportar Excel</h4>
                      <p className="text-xs md:text-sm text-gray-600">Exportación con filtros avanzados</p>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-4 md:p-6 text-center">
                      <TrendingUp className="h-10 w-10 md:h-12 md:w-12 mx-auto mb-3 md:mb-4 text-purple-500" />
                      <h4 className="text-base md:text-lg font-semibold mb-2">Tendencias</h4>
                      <p className="text-xs md:text-sm text-gray-600">Análisis de tendencias temporales</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              <div className="space-y-3 md:space-y-4">
                <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowAdvancedAnalytics(false)}
                    className="flex items-center gap-2 text-sm"
                  >
                    ← Volver
                  </Button>
                  <h3 className="text-lg md:text-xl font-bold">Analytics Avanzados</h3>
                </div>
                {(() => {
                  console.log('🔍 [SALES-HISTORY] Renderizando AdvancedAnalytics con userRole:', userRole);
                  return null;
                })()}
                {mobileInfo.isMobile ? (
                  <MobileAdvancedAnalytics userRole={userRole} />
                ) : (
                  <AdvancedAnalytics userRole={userRole} />
                )}
              </div>
            )}
          </div>
        </PlanGate>
      )}

      {/* Modales y diálogos */}
      <SaleDetailsModal
        sale={saleForDetails}
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSaleForDetails(null);
        }}
        onDelete={handleDeleteSale}
      />

      {/* Dialog de información de venta */}
      <Dialog open={isInfoDialogOpen} onOpenChange={setIsInfoDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Información de Venta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedSaleForInfo && (
              <>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">ID:</span> {selectedSaleForInfo.id}
                  </div>
                  <div>
                    <span className="font-medium">Fecha:</span> {formatDate(getSaleDate(selectedSaleForInfo) || '')}
                  </div>
                  <div>
                    <span className="font-medium">Total:</span> {formatCurrency(selectedSaleForInfo.total || 0)}
                  </div>
                  <div>
                    <span className="font-medium">Estado:</span> 
                    <Badge className="ml-2">{selectedSaleForInfo.estado || 'N/A'}</Badge>
                  </div>
                  <div>
                    <span className="font-medium">Servicio:</span> {selectedSaleForInfo.tipo_servicio || 'N/A'}
                  </div>
                  <div>
                    <span className="font-medium">Mesa:</span> {selectedSaleForInfo.mesa_numero || 'N/A'}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      setIsInfoDialogOpen(false);
                      handleShowDetails(selectedSaleForInfo);
                    }}
                    className="flex-1"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Ver Detalles
                  </Button>
                  {userRole === 'admin' && (
                    <Button
                      variant="destructive"
                      onClick={() => {
                        setIsInfoDialogOpen(false);
                        handleDeleteSale(selectedSaleForInfo.id);
                      }}
                      className="flex-1"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Eliminar
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
