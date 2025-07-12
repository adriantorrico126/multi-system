import { useState } from 'react';
import { Sale } from '@/types/restaurant';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Edit, Trash2, Search, FileText } from 'lucide-react';
import { EditSaleModal } from './EditSaleModal';

interface SalesHistoryProps {
  sales: Sale[];
  onEditSale: (sale: Sale) => void;
  onDeleteSale: (saleId: string) => void;
  userRole: 'cajero' | 'admin' | 'gerente' | 'cocinero';
}

export function SalesHistory({ sales, onEditSale, onDeleteSale, userRole }: SalesHistoryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

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

  return (
    <Card>
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
                      {sale.items.map((item, idx) => (
                        <div key={idx}>{item.name} x{item.quantity}</div>
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
    </Card>
  );
}
