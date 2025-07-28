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
import { Search, Edit, Trash2, FileText, Download, Calendar, Filter, BarChart3, TrendingUp, DollarSign, Users, Package, Building, CreditCard, Tag, Settings } from 'lucide-react';
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
import { EditSaleModal } from './EditSaleModal';
import { getBranches, getProducts, getPaymentMethods, getUsers } from '@/services/api';

interface SalesHistoryProps {
  sales: Sale[];
  onEditSale: (sale: Sale) => void;
  onDeleteSale: (saleId: string) => void;
  userRole: 'cajero' | 'admin' | 'cocinero';
}

export function SalesHistory({ sales, onEditSale, onDeleteSale, userRole }: SalesHistoryProps) {
  const [activeTab, setActiveTab] = useState<'historial' | 'avanzadas'>('historial');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
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

  const handleEditSale = (sale: Sale) => {
    setSelectedSale(sale);
  };

  const handleSaveEdit = (updatedSale: Sale) => {
    onEditSale(updatedSale);
    setSelectedSale(null);
  };

  const handleDeleteSale = (saleId: string) => {
    onDeleteSale(saleId);
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
      const filtros = {
        fecha_inicio: fechaInicioPdf,
        fecha_fin: fechaFinPdf,
        sucursal: sucursalPdf || null,
        producto: null,
        metodo_pago: null,
        cajero: null
      };

      const ventas = await exportVentasFiltradas(filtros);
      
      const doc = new jsPDF();
      
      // Título
      doc.setFontSize(20);
      doc.text('Reporte de Ventas', 105, 20, { align: 'center' });
      
      // Información del reporte
      doc.setFontSize(12);
      doc.text(`Período: ${fechaInicioPdf} a ${fechaFinPdf}`, 20, 35);
      doc.text(`Total de ventas: ${ventas.length}`, 20, 45);
      
      // Tabla de ventas
      const headers = [['ID', 'Fecha', 'Cajero', 'Sucursal', 'Total', 'Método Pago']];
      const data = ventas.map(venta => [
        venta.id.toString(),
        formatDate(venta.timestamp),
        venta.cashier,
        venta.branch,
        `Bs${venta.total.toFixed(2)}`,
        venta.paymentMethod
      ]);
      
      (doc as any).autoTable({
        head: headers,
        body: data,
        startY: 55,
        styles: {
          fontSize: 10,
          cellPadding: 3
        },
        headStyles: {
          fillColor: [59, 130, 246],
          textColor: 255
        }
      });
      
      const fileName = `reporte_ventas_${fechaInicioPdf}_a_${fechaFinPdf}.pdf`;
      doc.save(fileName);
      
      toast({
        title: "PDF generado",
        description: `Se generó el reporte PDF con ${ventas.length} ventas`,
      });
    } catch (error) {
      console.error('Error al generar PDF:', error);
      toast({
        title: "Error al generar PDF",
        description: "No se pudo generar el reporte PDF",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Función para formatear fechas
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
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
                    <TableCell className="max-w-xs truncate">
                      {sale.items.map(item => `${item.name} x${item.quantity}`).join(' ')}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditSale(sale)}
                          className="rounded-lg transition-all duration-200"
                        >
                          <Edit className="h-4 w-4" />
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
          
          {selectedSale && (
            <EditSaleModal
              sale={selectedSale}
              onSave={handleSaveEdit}
              onCancel={() => setSelectedSale(null)}
            />
          )}
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
                      Exportar a PDF
                    </CardTitle>
                    <CardDescription>
                      Genera un reporte PDF detallado de las ventas
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
                          Generando PDF...
                        </>
                      ) : (
                        <>
                          <FileText className="h-4 w-4 mr-2" />
                          Exportar a PDF
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
