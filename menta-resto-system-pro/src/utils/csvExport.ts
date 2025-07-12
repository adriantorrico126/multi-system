
export const exportSalesToCSV = (sales: any[], filename: string) => {
  // Crear encabezados en español
  const headers = [
    'ID',
    'Fecha',
    'Hora', 
    'Cajero',
    'Sucursal',
    'Total',
    'Metodo de Pago',
    'Productos',
    'Factura NIT',
    'Razon Social'
  ];

  // Convertir datos asegurando codificación correcta
  const csvData = sales.map(sale => {
    const fecha = sale.timestamp.toLocaleDateString('es-BO');
    const hora = sale.timestamp.toLocaleTimeString('es-BO', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    
    const productos = sale.items
      .map((item: any) => `${item.name} x${item.quantity}`)
      .join('; ');

    return [
      sale.id,
      fecha,
      hora,
      sale.cashier,
      sale.branch,
      sale.total.toFixed(2),
      sale.paymentMethod,
      productos,
      sale.invoiceData?.nit || '',
      sale.invoiceData?.businessName || ''
    ];
  });

  // Combinar encabezados y datos
  const csvContent = [headers, ...csvData]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n');

  // Crear BOM para UTF-8 (soluciona problemas de codificación)
  const BOM = '\uFEFF';
  const csvWithBOM = BOM + csvContent;

  // Crear y descargar archivo
  const blob = new Blob([csvWithBOM], { 
    type: 'text/csv;charset=utf-8;' 
  });
  
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const generateInvoiceNumber = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const time = String(now.getTime()).slice(-6);
  
  return `FAC-${year}${month}${day}-${time}`;
};
