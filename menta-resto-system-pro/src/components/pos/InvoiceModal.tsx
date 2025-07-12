import { useState } from 'react';
import { Sale, InvoiceData } from '@/types/restaurant';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Printer } from 'lucide-react';
import { generateInvoiceNumber } from '@/utils/csvExport';

interface InvoiceModalProps {
  sale: Sale;
  onClose: () => void;
}

export function InvoiceModal({ sale, onClose }: InvoiceModalProps) {
  const [invoiceData, setInvoiceData] = useState<InvoiceData>(
    sale.invoiceData || { nit: '', businessName: '', customerName: '' }
  );

  const invoiceNumber = generateInvoiceNumber();
  const currentDate = new Date().toLocaleDateString('es-BO');

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Crear contenido HTML para la factura
    const invoiceHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Factura ${invoiceNumber}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .company-name { font-size: 24px; font-weight: bold; color: #059669; }
        .invoice-details { display: flex; justify-content: space-between; margin-bottom: 20px; }
        .customer-info { margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f8f9fa; }
        .total { text-align: right; font-weight: bold; font-size: 18px; }
        .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="company-name">MENTA RESTOBAR</div>
        <div>Restaurante Vegetariano</div>
        <div>${sale.branch}</div>
      </div>
      
      <div class="invoice-details">
        <div>
          <strong>Factura N°:</strong> ${invoiceNumber}<br>
          <strong>Fecha:</strong> ${currentDate}
        </div>
        <div>
          <strong>Cajero:</strong> ${sale.cashier}<br>
          <strong>Método de Pago:</strong> ${sale.paymentMethod}
        </div>
      </div>
      
      ${invoiceData.nit ? `
      <div class="customer-info">
        <strong>DATOS DEL CLIENTE</strong><br>
        NIT: ${invoiceData.nit}<br>
        Razón Social: ${invoiceData.businessName}<br>
        ${invoiceData.customerName ? `Nombre: ${invoiceData.customerName}` : ''}
      </div>
      ` : ''}
      
      <table>
        <thead>
          <tr>
            <th>Descripción</th>
            <th>Cantidad</th>
            <th>Precio Unit.</th>
            <th>Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${sale.items.map((item, index) => `
            <tr>
              <td>${item.name}</td>
              <td>${item.quantity}</td>
              <td><span translate="no">Bs</span> ${item.price.toFixed(2)}</td>
              <td><span translate="no">Bs</span> ${(item.price * item.quantity).toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="total">
        <strong>TOTAL: <span translate="no">Bs</span> ${sale.total.toFixed(2)}</strong>
      </div>
      
      <div class="footer">
        Gracias por su preferencia<br>
        Menta Restobar - Comida Vegetariana Saludable
      </div>
    </body>
    </html>
    `;

    const blob = new Blob([invoiceHTML], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `factura_${invoiceNumber}.html`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
        <CardHeader className="text-center border-b">
          <div className="flex justify-center mb-2">
            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">M</span>
            </div>
          </div>
          <CardTitle className="text-green-700 text-xl">MENTA RESTOBAR</CardTitle>
          <p className="text-sm text-gray-600">Restaurante Vegetariano</p>
          <p className="text-sm text-gray-600">{sale.branch}</p>
        </CardHeader>
        
        <CardContent className="space-y-6 p-6">
          {/* Información de la factura */}
          <div className="flex justify-between text-sm">
            <div>
              <p><strong>Factura N°:</strong> {invoiceNumber}</p>
              <p><strong>Fecha:</strong> {currentDate}</p>
            </div>
            <div className="text-right">
              <p><strong>Cajero:</strong> {sale.cashier}</p>
              <p><strong>Método de Pago:</strong> {sale.paymentMethod}</p>
            </div>
          </div>

          <Separator />

          {/* Datos del cliente (si hay facturación) */}
          {sale.invoiceData && (
            <>
              <div>
                <h3 className="font-semibold mb-2">DATOS DEL CLIENTE</h3>
                <div className="space-y-1 text-sm">
                  <p><strong>NIT:</strong> {sale.invoiceData.nit}</p>
                  <p><strong>Razón Social:</strong> {sale.invoiceData.businessName}</p>
                  {sale.invoiceData.customerName && (
                    <p><strong>Nombre:</strong> {sale.invoiceData.customerName}</p>
                  )}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Detalle de productos */}
          <div>
            <h3 className="font-semibold mb-3">DETALLE DE LA VENTA</h3>
            <div className="space-y-2">
              {sale.items.map((item, index) => (
                <div key={item.id + '-' + (item.notes || '') + '-' + index} className="flex justify-between items-center py-2 border-b border-gray-100">
                  <div className="flex-1">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-gray-600">{item.quantity} x <span translate="no">Bs</span> {item.price.toFixed(2)}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary">
                      <span translate="no">Bs</span> {(item.price * item.quantity).toFixed(2)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Total */}
          <div className="text-right">
            <div className="text-2xl font-bold text-green-600">
              TOTAL: <span translate="no">Bs</span> {sale.total.toFixed(2)}
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cerrar
            </Button>
            <Button onClick={handlePrint} variant="outline" className="flex-1">
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
            </Button>
            <Button onClick={handleDownload} className="flex-1 bg-green-600 hover:bg-green-700">
              <Download className="h-4 w-4 mr-2" />
              Descargar
            </Button>
          </div>

          {/* Pie de factura */}
          <div className="text-center text-sm text-gray-500 pt-4 border-t">
            <p>Gracias por su preferencia</p>
            <p>Menta Restobar - Comida Vegetariana Saludable</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
