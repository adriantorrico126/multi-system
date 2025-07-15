import { useState } from 'react';
import { Sale } from '@/types/restaurant';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Edit, Trash2, Search, FileText } from 'lucide-react';
import { EditSaleModal } from './EditSaleModal';
import { useEffect } from 'react';
import { exportVentasFiltradas } from '@/services/api';
import { exportSalesToCSV } from '@/utils/csvExport';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { getBranches, getProducts, getPaymentMethods, getUsers } from '@/services/api';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';

interface SalesHistoryProps {
  sales: Sale[];
  onEditSale: (sale: Sale) => void;
  onDeleteSale: (saleId: string) => void;
  userRole: 'cajero' | 'admin' | 'cocinero';
}

export function SalesHistory({ sales, onEditSale, onDeleteSale, userRole }: SalesHistoryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [activeTab, setActiveTab] = useState<'historial' | 'avanzadas'>('historial');

  // Filtros avanzados
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [branches, setBranches] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [selectedPayment, setSelectedPayment] = useState<string>('');
  const [selectedCajero, setSelectedCajero] = useState<string>('');
  const [loadingExport, setLoadingExport] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  useEffect(() => {
    if (userRole === 'admin' && activeTab === 'avanzadas') {
      getBranches().then(setBranches);
      getProducts().then(setProducts);
      getPaymentMethods().then(setPaymentMethods);
      getUsers().then(setUsers);
    }
  }, [userRole, activeTab]);

  const filteredSales = sales.filter(sale => 
    sale.id.includes(searchTerm) ||
    sale.cashier.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.items.some(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleEditSale = (sale: Sale) => {
    setSelectedSale(sale);
  };

  const handleSaveEdit = (editedSale: Sale) => {
    onEditSale(editedSale);
    setSelectedSale(null);
  };

  // --- Exportación avanzada ---
  const handleExport = async (format: 'csv' | 'xlsx' | 'pdf') => {
    setLoadingExport(true);
    setExportError(null);
    try {
      if (!dateRange?.from || !dateRange?.to) {
        setExportError('Debe seleccionar un rango de fechas.');
        setLoadingExport(false);
        return;
      }
      const filtros: any = {
        fecha_inicio: formatDate(dateRange.from),
        fecha_fin: formatDate(dateRange.to),
      };
      if (selectedBranch) filtros.id_sucursal = Number(selectedBranch);
      if (selectedProduct) filtros.id_producto = Number(selectedProduct);
      if (selectedPayment) filtros.metodo_pago = selectedPayment;
      if (selectedCajero) filtros.cajero = selectedCajero;
      const ventas = await exportVentasFiltradas(filtros);
      if (ventas.length === 0) {
        setExportError('No hay ventas para exportar con los filtros seleccionados.');
        setLoadingExport(false);
        return;
      }
      if (format === 'csv') {
        exportSalesToCSV(ventas, `ventas_export_${filtros.fecha_inicio}_a_${filtros.fecha_fin}.csv`);
      } else if (format === 'xlsx') {
        const ws = XLSX.utils.json_to_sheet(ventas.map(mapVentaToExport));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Ventas');
        XLSX.writeFile(wb, `ventas_export_${filtros.fecha_inicio}_a_${filtros.fecha_fin}.xlsx`);
      } else if (format === 'pdf') {
        const doc = new jsPDF();
        // Encabezados
        const headers = [
          'ID', 'Fecha', 'Hora', 'Cajero', 'Sucursal', 'Total', 'Método de Pago', 'Productos'
        ];
        const rows = ventas.map((v: any) => [
          v.id_venta,
          v.fecha ? formatDate(new Date(v.fecha)) : '',
          v.fecha ? formatTime(new Date(v.fecha)) : '',
          v.cajero,
          v.sucursal_nombre,
          v.total,
          v.metodo_pago,
          (v.productos || []).map((p: any) => `${p.nombre} x${p.cantidad}`).join('; ')
        ]);
        (doc as any).autoTable({ head: [headers], body: rows });
        doc.save(`ventas_export_${filtros.fecha_inicio}_a_${filtros.fecha_fin}.pdf`);
      }
    } catch (err: any) {
      setExportError('Error al exportar: ' + (err?.message || 'Error desconocido.'));
    } finally {
      setLoadingExport(false);
    }
  };

  function formatDate(date: Date) {
    return format(date, 'yyyy-MM-dd');
  }
  function formatTime(date: Date) {
    return format(date, 'HH:mm:ss');
  }
  function mapVentaToExport(v: any) {
    return {
      ID: v.id_venta,
      Fecha: v.fecha ? formatDate(new Date(v.fecha)) : '',
      Hora: v.fecha ? formatTime(new Date(v.fecha)) : '',
      Cajero: v.cajero,
      Sucursal: v.sucursal_nombre,
      Total: v.total,
      'Método de Pago': v.metodo_pago,
      Productos: (v.productos || []).map((p: any) => `${p.nombre} x${p.cantidad}`).join('; ')
    };
  }

  // --- Renderizado ---
  return (
    <Card>
      {userRole === 'admin' && (
        <div className="flex gap-2 border-b bg-gray-50 px-6 pt-4">
          <Button
            variant={activeTab === 'historial' ? 'default' : 'outline'}
            onClick={() => setActiveTab('historial')}
            className="rounded-t-lg"
          >
            Historial de Ventas
          </Button>
          <Button
            variant={activeTab === 'avanzadas' ? 'default' : 'outline'}
            onClick={() => setActiveTab('avanzadas')}
            className="rounded-t-lg"
          >
            Funciones Avanzadas
          </Button>
        </div>
      )}
      {activeTab === 'historial' && (
        <>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Historial de Ventas ({sales.length})
            </CardTitle>
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por ID, cajero o producto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
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
                      <TableCell className="font-mono text-xs">{sale.id}</TableCell>
                      <TableCell className="text-xs">
                        {sale.timestamp.toLocaleDateString()}<br/>
                        {sale.timestamp.toLocaleTimeString()}
                      </TableCell>
                      <TableCell>{sale.cashier}</TableCell>
                      <TableCell>{sale.branch}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-green-100 text-green-700">
                          <span translate="no">Bs</span> {sale.total.toFixed(2)}
                        </Badge>
                      </TableCell>
                      <TableCell>{sale.paymentMethod}</TableCell>
                      <TableCell className="max-w-40">
                        <div className="text-xs">
                          {sale.items.map((item) => (
                            <div key={item.id}>{item.name} x{item.quantity}</div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {(userRole === 'admin' || sale.timestamp.toDateString() === new Date().toDateString()) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditSale(sale)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          )}
                          {userRole === 'admin' && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => onDeleteSale(sale.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {filteredSales.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No se encontraron ventas
              </div>
            )}
          </CardContent>
          {selectedSale && (
            <EditSaleModal
              sale={selectedSale}
              onSave={handleSaveEdit}
              onCancel={() => setSelectedSale(null)}
            />
          )}
        </>
      )}
      {activeTab === 'avanzadas' && userRole === 'admin' && (
        <CardContent>
          <div className="max-w-3xl mx-auto p-6 space-y-8">
            <h2 className="text-xl font-bold mb-4">Exportar Ventas Avanzado</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Rango de Fechas</label>
                <Input
                  type="date"
                  value={dateRange?.from ? formatDate(dateRange.from) : ''}
                  onChange={e => setDateRange(r => ({ ...r, from: new Date(e.target.value) }))}
                  className="mb-2 w-full"
                />
                <Input
                  type="date"
                  value={dateRange?.to ? formatDate(dateRange.to) : ''}
                  onChange={e => setDateRange(r => ({ ...r, to: new Date(e.target.value) }))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Sucursal</label>
                <select
                  className="w-full border rounded px-2 py-2 mb-2"
                  value={selectedBranch}
                  onChange={e => setSelectedBranch(e.target.value)}
                >
                  <option value="">Todas</option>
                  {branches.map(b => (
                    <option key={b.id_sucursal} value={b.id_sucursal}>{b.nombre}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Producto</label>
                <select
                  className="w-full border rounded px-2 py-2 mb-2"
                  value={selectedProduct}
                  onChange={e => setSelectedProduct(e.target.value)}
                >
                  <option value="">Todos</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Método de Pago</label>
                <select
                  className="w-full border rounded px-2 py-2 mb-2"
                  value={selectedPayment}
                  onChange={e => setSelectedPayment(e.target.value)}
                >
                  <option value="">Todos</option>
                  {paymentMethods.map(pm => (
                    <option key={pm.descripcion} value={pm.descripcion}>{pm.descripcion}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Cajero</label>
                <select
                  className="w-full border rounded px-2 py-2 mb-2"
                  value={selectedCajero}
                  onChange={e => setSelectedCajero(e.target.value)}
                >
                  <option value="">Todos</option>
                  {users.filter(u => u.rol === 'cajero' || u.rol === 'admin').map(u => (
                    <option key={u.username} value={u.username}>{u.nombre} ({u.username})</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex flex-col md:flex-row justify-center items-center gap-4 mt-8">
              <Button onClick={() => handleExport('csv')} disabled={loadingExport} className="w-48">
                Exportar CSV
              </Button>
              <Button onClick={() => handleExport('xlsx')} disabled={loadingExport} className="w-48">
                Exportar XLSX
              </Button>
              <Button onClick={() => handleExport('pdf')} disabled={loadingExport} className="w-48">
                Exportar PDF
              </Button>
            </div>
            {loadingExport && <div className="text-blue-600 text-center">Exportando...</div>}
            {exportError && <div className="text-red-600 text-center">{exportError}</div>}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
