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
import { getBranches, getProducts, getPaymentMethods, getUsers } from '@/services/api';

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
  const [loadingExport, setLoadingExport] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const { toast } = useToast();

  // Nuevo estado para exportación avanzada
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [sucursal, setSucursal] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const [fechaInicioPdf, setFechaInicioPdf] = useState('');
  const [fechaFinPdf, setFechaFinPdf] = useState('');
  const [sucursalPdf, setSucursalPdf] = useState('');

  useEffect(() => {
    // Cargar datos para filtros avanzados
    const loadFilterData = async () => {
      try {
        // Aquí se cargarían los datos para los filtros si fuera necesario
      } catch (error) {
        console.error('Error cargando datos de filtros:', error);
      }
    };
    loadFilterData();
  }, []);

  const filteredSales = sales.filter(sale => {
    const searchLower = searchTerm.toLowerCase();
    return (
      sale.id.toString().includes(searchLower) ||
      sale.cashier.toLowerCase().includes(searchLower) ||
      sale.items.some(item => item.name.toLowerCase().includes(searchLower))
    );
  });

  const handleDeleteSale = (saleId: string) => {
    onDeleteSale(saleId);
  };

  const handleShowDetails = (sale: Sale) => {
    setSaleForDetails(sale);
    setShowDetailsModal(true);
  };

  // --- Exportación avanzada ---
  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      const filtros = {
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        sucursal: sucursal || null,
        producto: null,
        metodo_pago: null,
        cajero: null
      };

      const ventas = await exportVentasFiltradas(filtros);
      
      // Mapear datos para Excel
      const datosExcel = ventas.map(venta => ({
        ID: venta.id,
        Fecha: formatDate(venta.timestamp),
        Cajero: venta.cashier,
        Sucursal: venta.branch,
        Total: venta.total,
        Método_Pago: venta.paymentMethod,
        Productos: venta.items.map(item => `${item.name} x${item.quantity}`).join(', ')
      }));

      const ws = XLSX.utils.json_to_sheet(datosExcel);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Ventas');
      
      const fileName = `ventas_${fechaInicio}_a_${fechaFin}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      toast({
        title: "Exportación exitosa",
        description: `Se exportaron ${ventas.length} ventas a Excel`,
      });
    } catch (error) {
      console.error('Error al exportar a Excel:', error);
      toast({
        title: "Error en la exportación",
        description: "No se pudo exportar a Excel",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      console.log('🔄 Iniciando generación de informe profesional...');
      
      // Validar fechas
      if (!fechaInicioPdf || !fechaFinPdf) {
        toast({
          title: "Error",
          description: "Debe seleccionar fecha de inicio y fin",
          variant: "destructive",
        });
        return;
      }

      const filtros = {
        fecha_inicio: fechaInicioPdf,
        fecha_fin: fechaFinPdf,
        id_sucursal: sucursalPdf ? parseInt(sucursalPdf) : null,
        producto: null,
        metodo_pago: null,
        cajero: null
      };

      console.log('📋 Filtros para informe:', filtros);

      const ventas = await exportVentasFiltradas(filtros);
      console.log('✅ Ventas obtenidas para informe:', ventas.length);
      console.log('🔍 Primera venta para debug:', JSON.stringify(ventas[0], null, 2));
      
      if (ventas.length === 0) {
        toast({
          title: "Sin datos",
          description: "No hay ventas para el período seleccionado",
          variant: "destructive",
        });
        return;
      }

      // Importar jsPDF dinámicamente
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      
      // ===== PÁGINA 1: RESUMEN EJECUTIVO =====
      
      // Título principal
      doc.setFontSize(24);
      doc.setTextColor(44, 62, 80);
      doc.text('INFORME DE VENTAS', 105, 25, { align: 'center' });
      
      // Subtítulo
      doc.setFontSize(14);
      doc.setTextColor(52, 73, 94);
      doc.text('Análisis Profesional de Rendimiento Comercial', 105, 35, { align: 'center' });
      
      // Información del período
      doc.setFontSize(12);
      doc.setTextColor(44, 62, 80);
      doc.text(`Período de Análisis: ${fechaInicioPdf} a ${fechaFinPdf}`, 20, 50);
      doc.text(`Fecha de Generación: ${new Date().toLocaleDateString('es-ES')}`, 20, 60);
      
      // Estadísticas principales
      const totalGeneral = ventas.reduce((sum, venta) => sum + parseFloat(venta.total || 0), 0);
      const promedioVenta = totalGeneral / ventas.length;
      const ventaMaxima = Math.max(...ventas.map(v => parseFloat(v.total || 0)));
      const ventaMinima = Math.min(...ventas.map(v => parseFloat(v.total || 0)));
      
      // Resumen ejecutivo
      doc.setFontSize(16);
      doc.setTextColor(41, 128, 185);
      doc.text('RESUMEN EJECUTIVO', 20, 80);
      
      doc.setFontSize(12);
      doc.setTextColor(44, 62, 80);
      doc.text(`• Total de Transacciones: ${ventas.length} ventas`, 25, 95);
      doc.text(`• Ingresos Totales: Bs${totalGeneral.toFixed(2)}`, 25, 105);
      doc.text(`• Promedio por Venta: Bs${promedioVenta.toFixed(2)}`, 25, 115);
      doc.text(`• Venta Máxima: Bs${ventaMaxima.toFixed(2)}`, 25, 125);
      doc.text(`• Venta Mínima: Bs${ventaMinima.toFixed(2)}`, 25, 135);
      
      // Análisis por método de pago
      const metodosPago: { [key: string]: number } = {};
      ventas.forEach(venta => {
        // Manejar tanto paymentmethod (minúsculas) como paymentMethod (camelCase)
        const metodo = venta.paymentmethod || venta.paymentMethod || venta['paymentMethod'] || 'No especificado';
        metodosPago[metodo] = (metodosPago[metodo] || 0) + parseFloat(venta.total || 0);
      });
      
      doc.setFontSize(16);
      doc.setTextColor(41, 128, 185);
      doc.text('DISTRIBUCIÓN POR MÉTODO DE PAGO', 20, 155);
      
      let yPos = 170;
      Object.entries(metodosPago).forEach(([metodo, total]) => {
        const porcentaje = ((total / totalGeneral) * 100).toFixed(1);
        doc.setFontSize(11);
        doc.setTextColor(44, 62, 80);
        doc.text(`• ${metodo}: Bs${total.toFixed(2)} (${porcentaje}%)`, 25, yPos);
        yPos += 8;
      });
      
      // Análisis por cajero
      const cajeros: { [key: string]: { total: number; ventas: number } } = {};
      ventas.forEach(venta => {
        const cajero = venta.cashier || 'No especificado';
        if (!cajeros[cajero]) {
          cajeros[cajero] = { total: 0, ventas: 0 };
        }
        cajeros[cajero].total += parseFloat(venta.total || 0);
        cajeros[cajero].ventas += 1;
      });
      
      doc.setFontSize(16);
      doc.setTextColor(41, 128, 185);
      doc.text('RENDIMIENTO POR CAJERO', 20, yPos + 10);
      
      yPos += 25;
      Object.entries(cajeros).forEach(([cajero, datos]) => {
        const promedio = datos.total / datos.ventas;
        doc.setFontSize(11);
        doc.setTextColor(44, 62, 80);
        doc.text(`• ${cajero}: ${datos.ventas} ventas, Bs${datos.total.toFixed(2)} (promedio: Bs${promedio.toFixed(2)})`, 25, yPos);
        yPos += 8;
      });
      
      // ===== PÁGINA 2: ANÁLISIS DETALLADO =====
      doc.addPage();
      
      doc.setFontSize(20);
      doc.setTextColor(44, 62, 80);
      doc.text('ANÁLISIS DETALLADO', 105, 25, { align: 'center' });
      
      // Análisis temporal
      const ventasPorDia = {};
      ventas.forEach(venta => {
        const fecha = formatDate(venta.timestamp).split(' ')[0];
        if (!ventasPorDia[fecha]) {
          ventasPorDia[fecha] = { total: 0, ventas: 0 };
        }
        ventasPorDia[fecha].total += parseFloat(venta.total || 0);
        ventasPorDia[fecha].ventas += 1;
      });
      
      doc.setFontSize(16);
      doc.setTextColor(41, 128, 185);
      doc.text('EVOLUCIÓN DIARIA', 20, 45);
      
      let yPos2 = 60;
      Object.entries(ventasPorDia).sort().forEach(([fecha, datos]) => {
        doc.setFontSize(11);
        doc.setTextColor(44, 62, 80);
        doc.text(`• ${fecha}: ${datos.ventas} ventas - Bs${datos.total.toFixed(2)}`, 25, yPos2);
        yPos2 += 8;
      });
      
      // Top productos (si hay datos de items)
      if (ventas.some(v => v.items && v.items.length > 0)) {
        const productos = {};
        ventas.forEach(venta => {
          venta.items?.forEach(item => {
            const nombre = item.name || 'Producto desconocido';
            productos[nombre] = (productos[nombre] || 0) + (item.quantity || 0);
          });
        });
        
        const topProductos = Object.entries(productos)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 10);
        
        doc.setFontSize(16);
        doc.setTextColor(41, 128, 185);
        doc.text('PRODUCTOS MÁS VENDIDOS', 20, yPos2 + 20);
        
        yPos2 += 35;
        topProductos.forEach(([producto, cantidad]) => {
          doc.setFontSize(11);
          doc.setTextColor(44, 62, 80);
          doc.text(`• ${producto}: ${cantidad} unidades`, 25, yPos2);
          yPos2 += 8;
        });
      }
      
      // ===== PÁGINA 3: CONCLUSIONES Y RECOMENDACIONES =====
      doc.addPage();
      
      doc.setFontSize(20);
      doc.setTextColor(44, 62, 80);
      doc.text('CONCLUSIONES Y RECOMENDACIONES', 105, 25, { align: 'center' });
      
      // Conclusiones automáticas
      const mejorCajero = Object.entries(cajeros).reduce((a, b) => 
        a[1].total > b[1].total ? a : b
      );
      
      const mejorMetodo = Object.entries(metodosPago).reduce((a, b) => 
        a[1] > b[1] ? a : b
      );
      
      doc.setFontSize(16);
      doc.setTextColor(41, 128, 185);
      doc.text('CONCLUSIONES PRINCIPALES', 20, 45);
      
      doc.setFontSize(12);
      doc.setTextColor(44, 62, 80);
      doc.text(`• El cajero más productivo fue ${mejorCajero[0]} con Bs${mejorCajero[1].total.toFixed(2)}`, 25, 60);
      doc.text(`• El método de pago más utilizado fue ${mejorMetodo[0]}`, 25, 70);
      doc.text(`• El promedio de venta de Bs${promedioVenta.toFixed(2)} indica un buen rendimiento`, 25, 80);
      doc.text(`• Se procesaron ${ventas.length} transacciones exitosas`, 25, 90);
      
      // Recomendaciones
      doc.setFontSize(16);
      doc.setTextColor(41, 128, 185);
      doc.text('RECOMENDACIONES', 20, 115);
      
      doc.setFontSize(12);
      doc.setTextColor(44, 62, 80);
      doc.text(`• Mantener el método de pago ${mejorMetodo[0]} como opción principal`, 25, 130);
      doc.text(`• Replicar las mejores prácticas del cajero ${mejorCajero[0]}`, 25, 140);
      doc.text(`• Considerar promociones para aumentar el ticket promedio`, 25, 150);
      doc.text(`• Analizar productos de menor venta para optimizar inventario`, 25, 160);
      
      // Pie de página
      doc.setFontSize(10);
      doc.setTextColor(128, 128, 128);
      doc.text(`Informe generado automáticamente el ${new Date().toLocaleDateString('es-ES')} a las ${new Date().toLocaleTimeString('es-ES')}`, 105, 280, { align: 'center' });
      
      // Guardar archivo
      const fileName = `informe_ventas_${fechaInicioPdf}_a_${fechaFinPdf}.pdf`;
      console.log('💾 Guardando informe profesional:', fileName);
      
      doc.save(fileName);
      
      toast({
        title: "Informe profesional generado",
        description: `Se generó el informe PDF con análisis detallado de ${ventas.length} ventas. Total: Bs${totalGeneral.toFixed(2)}`,
      });
      
    } catch (error) {
      console.error('❌ Error al generar informe:', error);
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      toast({
        title: "Error al generar informe",
        description: `Error: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Función para formatear fechas
  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  function formatTime(date: Date) {
    return format(date, 'HH:mm:ss');
  }

  function mapVentaToExport(v: any) {
    return {
      ID: v.id_venta,
      Fecha: v.fecha,
      Cajero: v.cajero,
      Sucursal: v.sucursal,
      Total: v.total,
      'Método de Pago': v.metodo_pago,
      Productos: (v.productos || []).map((p: any) => `${p.nombre} x${p.cantidad}`).join('; ')
    };
  }

  // --- Renderizado ---
  return (
    <div className="h-full flex flex-col">
      {userRole === 'admin' && (
        <div className="flex gap-2 border-b border-gray-200/50 bg-gradient-to-r from-gray-50/80 to-white/80 px-6 pt-4 pb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveTab('historial')}
            className={activeTab === 'historial' ? 'bg-blue-50 border-blue-200 text-blue-700' : ''}
          >
            <FileText className="h-4 w-4 mr-2" />
            Historial de Ventas
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveTab('avanzadas')}
            className={activeTab === 'avanzadas' ? 'bg-blue-50 border-blue-200 text-blue-700' : ''}
          >
            <Settings className="h-4 w-4 mr-2" />
            Funciones Avanzadas
          </Button>
        </div>
      )}
      
      {activeTab === 'historial' && (
        <div className="flex-1 flex flex-col">
          <div className="flex items-center justify-between p-6 border-b border-gray-200/50 bg-gradient-to-r from-gray-50/50 to-white/50">
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Historial de Ventas ({filteredSales.length})
              </h2>
              <p className="text-gray-600 text-sm mt-1">Gestiona y revisa todas las transacciones</p>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por ID, cajero o producto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-80"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-auto p-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Fecha/Hora</TableHead>
                  <TableHead>Cajero</TableHead>
                  <TableHead>Sucursal</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Pago</TableHead>
                  <TableHead>Productos</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell className="font-medium">#{sale.id}</TableCell>
                    <TableCell>{formatDate(sale.timestamp)}</TableCell>
                    <TableCell>{sale.cashier}</TableCell>
                    <TableCell>{sale.branch}</TableCell>
                    <TableCell>
                      <Badge variant="success" className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
                        Bs{sale.total.toFixed(2)}
                      </Badge>
                    </TableCell>
                    <TableCell>{sale.paymentMethod}</TableCell>
                    <TableCell className="max-w-xs">
                      <div className="text-sm text-gray-900">
                        {sale.items.length <= 2 
                          ? sale.items.map(item => `${item.name} x${item.quantity}`).join(' ')
                          : `${sale.items.slice(0, 2).map(item => `${item.name} x${item.quantity}`).join(' ')} +${sale.items.length - 2} más`
                        }
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleShowDetails(sale)}
                          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
                        >
                          <Eye className="h-4 w-4" />
                          Detalles
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteSale(sale.id)}
                          className="rounded-lg transition-all duration-200"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filteredSales.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No se encontraron ventas
              </div>
            )}
          </div>
          
          {/* Modal de Detalles de Venta */}
          <SaleDetailsModal
            sale={saleForDetails}
            isOpen={showDetailsModal}
            onClose={() => {
              setShowDetailsModal(false);
              setSaleForDetails(null);
            }}
            onDelete={handleDeleteSale}
          />
        </div>
      )}

      {activeTab === 'avanzadas' && (
        <div className="flex-1 p-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-4">
                Exportación Avanzada
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileSpreadsheet className="h-5 w-5" />
                      Exportar a Excel
                    </CardTitle>
                    <CardDescription>
                      Exporta las ventas filtradas a formato Excel (.xlsx)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="fechaInicio" className="block text-sm font-semibold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2">
                        Fecha de Inicio
                      </Label>
                      <input
                        type="date"
                        id="fechaInicio"
                        value={fechaInicio}
                        onChange={(e) => setFechaInicio(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-white/80 backdrop-blur-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
                      />
                    </div>
                    <div>
                      <Label htmlFor="fechaFin" className="block text-sm font-semibold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2">
                        Fecha de Fin
                      </Label>
                      <input
                        type="date"
                        id="fechaFin"
                        value={fechaFin}
                        onChange={(e) => setFechaFin(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-white/80 backdrop-blur-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
                      />
                    </div>
                    <div>
                      <Label htmlFor="sucursal" className="block text-sm font-semibold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2">
                        Sucursal
                      </Label>
                      <select
                        id="sucursal"
                        value={sucursal}
                        onChange={(e) => setSucursal(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-white/80 backdrop-blur-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
                      >
                        <option value="">Todas las sucursales</option>
                        <option value="1">Sucursal 16 de Julio</option>
                        <option value="2">Sucursal Centro</option>
                      </select>
                    </div>
                    <Button
                      onClick={handleExportExcel}
                      disabled={isExporting}
                      className="w-full"
                    >
                      {isExporting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Exportando...
                        </>
                      ) : (
                        <>
                          <FileSpreadsheet className="h-4 w-4 mr-2" />
                          Exportar a Excel
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Generar Informe Profesional
                    </CardTitle>
                    <CardDescription>
                      Crea un informe detallado con análisis, estadísticas y recomendaciones
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="fechaInicioPdf" className="block text-sm font-semibold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2">
                        Fecha de Inicio
                      </Label>
                      <input
                        type="date"
                        id="fechaInicioPdf"
                        value={fechaInicioPdf}
                        onChange={(e) => setFechaInicioPdf(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-white/80 backdrop-blur-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
                      />
                    </div>
                    <div>
                      <Label htmlFor="fechaFinPdf" className="block text-sm font-semibold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2">
                        Fecha de Fin
                      </Label>
                      <input
                        type="date"
                        id="fechaFinPdf"
                        value={fechaFinPdf}
                        onChange={(e) => setFechaFinPdf(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-white/80 backdrop-blur-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
                      />
                    </div>
                    <div>
                      <Label htmlFor="sucursalPdf" className="block text-sm font-semibold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2">
                        Sucursal
                      </Label>
                      <select
                        id="sucursalPdf"
                        value={sucursalPdf}
                        onChange={(e) => setSucursalPdf(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-white/80 backdrop-blur-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
                      >
                        <option value="">Todas las sucursales</option>
                        <option value="1">Sucursal 16 de Julio</option>
                        <option value="2">Sucursal Centro</option>
                      </select>
                    </div>
                    <Button
                      onClick={handleExportPDF}
                      disabled={isExporting}
                      variant="outline"
                      className="w-full"
                    >
                      {isExporting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Generando reporte...
                        </>
                      ) : (
                        <>
                          <FileText className="h-4 w-4 mr-2" />
                          Generar Informe Profesional
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
