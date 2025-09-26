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
            🔒 Funciones Avanzadas - Plan Avanzado Requerido
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-purple-700">
            Las <strong>Funciones Avanzadas</strong> están disponibles únicamente en el plan <strong>Avanzado</strong> o superior.
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
    <div className="space-y-6">
      {/* Header con pestañas */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-2">
          <Button
            variant={activeTab === 'historial' ? 'default' : 'outline'}
            onClick={() => setActiveTab('historial')}
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            Historial
          </Button>
          <Button
            variant={activeTab === 'avanzadas' ? 'default' : 'outline'}
            onClick={() => {
              console.log('🔍 [SALES-HISTORY] Clic en "Funciones Avanzadas"');
              setActiveTab('avanzadas');
            }}
            className="flex items-center gap-2"
          >
            <BarChart3 className="h-4 w-4" />
            Funciones Avanzadas
          </Button>
        </div>
      </div>

      {/* Contenido del historial */}
      {activeTab === 'historial' && (
        <div className="space-y-4">
          {/* Filtros de búsqueda */}
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-4 items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por ID, mesa, servicio, estado..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabla de ventas */}
          <Card>
            <CardHeader>
              <CardTitle>Historial de Ventas ({filteredSales.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredSales.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Servicio</TableHead>
                        <TableHead>Mesa</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSales.map((sale) => (
                        <TableRow key={sale.id}>
                          <TableCell className="font-medium">#{sale.id}</TableCell>
                          <TableCell>{formatDate(getSaleDate(sale) || '')}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{sale.tipo_servicio || 'N/A'}</Badge>
                          </TableCell>
                          <TableCell>
                            {sale.mesa_numero ? `Mesa ${sale.mesa_numero}` : '-'}
                          </TableCell>
                          <TableCell className="font-semibold">
                            {formatCurrency(sale.total || 0)}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={sale.estado === 'completada' ? 'default' : 'secondary'}
                            >
                              {sale.estado || 'N/A'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
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
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No se encontraron ventas
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Funciones avanzadas */}
      {activeTab === 'avanzadas' && (
        <PlanGate feature="analytics" fallback={<FuncionesAvanzadasRestricted />} requiredPlan="Avanzado">
          <div className="flex-1 p-6">
            {!showAdvancedAnalytics ? (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-2xl font-bold mb-4">Funciones Avanzadas</h3>
                  <p className="text-gray-600 mb-8">Accede a analytics avanzados y métricas detalladas</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => {
                    console.log('🔍 [SALES-HISTORY] Clic en "Analytics Avanzados"');
                    setShowAdvancedAnalytics(true);
                  }}>
                    <CardContent className="p-6 text-center">
                      <BarChart3 className="h-12 w-12 mx-auto mb-4 text-blue-500" />
                      <h4 className="text-lg font-semibold mb-2">Analytics Avanzados</h4>
                      <p className="text-sm text-gray-600">Métricas, KPIs y gráficas interactivas</p>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6 text-center">
                      <Download className="h-12 w-12 mx-auto mb-4 text-green-500" />
                      <h4 className="text-lg font-semibold mb-2">Exportar Excel</h4>
                      <p className="text-sm text-gray-600">Exportación con filtros avanzados</p>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6 text-center">
                      <TrendingUp className="h-12 w-12 mx-auto mb-4 text-purple-500" />
                      <h4 className="text-lg font-semibold mb-2">Tendencias</h4>
                      <p className="text-sm text-gray-600">Análisis de tendencias temporales</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-4 mb-6">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowAdvancedAnalytics(false)}
                    className="flex items-center gap-2"
                  >
                    ← Volver
                  </Button>
                  <h3 className="text-xl font-bold">Analytics Avanzados</h3>
                </div>
                {(() => {
                  console.log('🔍 [SALES-HISTORY] Renderizando AdvancedAnalytics con userRole:', userRole);
                  return null;
                })()}
                <AdvancedAnalytics userRole={userRole} />
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
