import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// =====================================================
// TIPOS DE DATOS PARA EXPORTACIÓN
// =====================================================

export interface ExportData {
  ventas: any[];
  productos: any[];
  vendedores: any[];
  sucursales: any[];
  metodosPago: any[];
  periodos: {
    fechaInicio: string;
    fechaFin: string;
    tipo: 'dia' | 'semana' | 'mes' | 'personalizado';
  };
}

export interface ExportOptions {
  formato: 'excel' | 'pdf' | 'csv' | 'json';
  tipo: 'resumen' | 'detallado' | 'analitico' | 'completo';
  incluirGraficos: boolean;
  incluirMetricas: boolean;
  incluirTendencias: boolean;
  incluirComparativas: boolean;
  filtros: {
    sucursales?: number[];
    vendedores?: string[];
    metodosPago?: string[];
    productos?: string[];
    rangoPrecios?: { min: number; max: number };
  };
}

// =====================================================
// EXPORTACIÓN A EXCEL PROFESIONAL
// =====================================================

export const exportToExcel = async (data: ExportData, options: ExportOptions) => {
  try {
    // Importar xlsx dinámicamente
    const XLSX = await import('xlsx');
    
    const workbook = XLSX.utils.book_new();
    const fechaExportacion = format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es });
    
    // =====================================================
    // HOJA 1: RESUMEN EJECUTIVO
    // =====================================================
    
    const resumenData = [
      ['REPORTE DE VENTAS - RESUMEN EJECUTIVO'],
      [''],
      ['Fecha de Exportación:', fechaExportacion],
      ['Período Analizado:', `${data.periodos.fechaInicio} - ${data.periodos.fechaFin}`],
      ['Tipo de Análisis:', options.tipo.toUpperCase()],
      [''],
      ['MÉTRICAS GENERALES'],
      ['Total de Ventas:', data.ventas.length],
      ['Ingresos Totales:', `Bs ${data.ventas.reduce((sum, v) => sum + (Number(v.total) || 0), 0).toFixed(2)}`],
      ['Ticket Promedio:', `Bs ${(data.ventas.reduce((sum, v) => sum + (Number(v.total) || 0), 0) / data.ventas.length || 0).toFixed(2)}`],
      ['Vendedores Activos:', data.vendedores.length],
      ['Sucursales Analizadas:', data.sucursales.length],
      [''],
      ['DISTRIBUCIÓN POR MÉTODO DE PAGO'],
      ...data.metodosPago.map(mp => [
        mp.metodo_pago,
        `Bs ${(Number(mp.total) || 0).toFixed(2)}`,
        `${mp.porcentaje || 0}%`
      ]),
      [''],
      ['TOP 10 PRODUCTOS MÁS VENDIDOS'],
      ['Producto', 'Cantidad', 'Ingresos', 'Porcentaje'],
      ...data.productos.slice(0, 10).map(p => [
        p.nombre_producto,
        p.cantidad_vendida,
        `Bs ${(Number(p.ingresos_totales) || 0).toFixed(2)}`,
        `${p.porcentaje || 0}%`
      ])
    ];
    
    const resumenSheet = XLSX.utils.aoa_to_sheet(resumenData);
    
    // Aplicar estilos al resumen
    resumenSheet['!cols'] = [
      { wch: 30 }, // Columna A
      { wch: 20 }, // Columna B
      { wch: 15 }, // Columna C
      { wch: 12 }  // Columna D
    ];
    
    XLSX.utils.book_append_sheet(workbook, resumenSheet, 'Resumen Ejecutivo');
    
    // =====================================================
    // HOJA 2: VENTAS DETALLADAS
    // =====================================================
    
    const ventasHeaders = [
      'ID Venta',
      'Fecha',
      'Hora',
      'Sucursal',
      'Vendedor',
      'Mesa/Delivery',
      'Tipo Servicio',
      'Método de Pago',
      'Subtotal',
      'Descuentos',
      'Total',
      'Productos',
      'Observaciones',
      'Estado',
      'Factura NIT',
      'Razón Social'
    ];
    
    const ventasData = data.ventas.map(venta => [
      venta.id_venta,
      format(new Date(venta.fecha), 'dd/MM/yyyy', { locale: es }),
      format(new Date(venta.fecha), 'HH:mm:ss', { locale: es }),
      venta.sucursal_nombre || 'N/A',
      venta.vendedor_nombre || 'N/A',
      venta.mesa_numero || 'Delivery',
      venta.tipo_servicio || 'N/A',
      venta.metodo_pago || 'N/A',
      `Bs ${(Number(venta.subtotal) || 0).toFixed(2)}`,
      `Bs ${(Number(venta.descuentos) || 0).toFixed(2)}`,
      `Bs ${(Number(venta.total) || 0).toFixed(2)}`,
      venta.productos?.map((p: any) => `${p.nombre} x${p.cantidad}`).join('; ') || '',
      venta.observaciones || '',
      venta.estado || 'N/A',
      venta.factura_nit || '',
      venta.razon_social || ''
    ]);
    
    const ventasSheet = XLSX.utils.aoa_to_sheet([ventasHeaders, ...ventasData]);
    
    // Aplicar estilos a ventas
    ventasSheet['!cols'] = [
      { wch: 12 }, // ID Venta
      { wch: 12 }, // Fecha
      { wch: 10 }, // Hora
      { wch: 20 }, // Sucursal
      { wch: 20 }, // Vendedor
      { wch: 15 }, // Mesa/Delivery
      { wch: 15 }, // Tipo Servicio
      { wch: 15 }, // Método de Pago
      { wch: 12 }, // Subtotal
      { wch: 12 }, // Descuentos
      { wch: 12 }, // Total
      { wch: 50 }, // Productos
      { wch: 30 }, // Observaciones
      { wch: 12 }, // Estado
      { wch: 15 }, // Factura NIT
      { wch: 25 }  // Razón Social
    ];
    
    XLSX.utils.book_append_sheet(workbook, ventasSheet, 'Ventas Detalladas');
    
    // =====================================================
    // HOJA 3: ANÁLISIS DE PRODUCTOS
    // =====================================================
    
    const productosHeaders = [
      'Producto',
      'Categoría',
      'Cantidad Vendida',
      'Ingresos Totales',
      'Precio Promedio',
      'Ticket Promedio',
      'Ventas Asociadas',
      'Porcentaje del Total',
      'Tendencia',
      'Stock Actual',
      'Estado'
    ];
    
    const productosData = data.productos.map(producto => [
      producto.nombre_producto,
      producto.categoria || 'Sin categoría',
      producto.cantidad_vendida,
      `Bs ${(Number(producto.ingresos_totales) || 0).toFixed(2)}`,
      `Bs ${(Number(producto.precio_promedio) || 0).toFixed(2)}`,
      `Bs ${(Number(producto.ticket_promedio) || 0).toFixed(2)}`,
      producto.ventas_asociadas,
      `${producto.porcentaje || 0}%`,
      producto.tendencia || 'Estable',
      producto.stock_actual || 'N/A',
      producto.estado || 'Activo'
    ]);
    
    const productosSheet = XLSX.utils.aoa_to_sheet([productosHeaders, ...productosData]);
    
    // Aplicar estilos a productos
    productosSheet['!cols'] = [
      { wch: 30 }, // Producto
      { wch: 20 }, // Categoría
      { wch: 15 }, // Cantidad Vendida
      { wch: 15 }, // Ingresos Totales
      { wch: 15 }, // Precio Promedio
      { wch: 15 }, // Ticket Promedio
      { wch: 15 }, // Ventas Asociadas
      { wch: 15 }, // Porcentaje
      { wch: 12 }, // Tendencia
      { wch: 12 }, // Stock Actual
      { wch: 12 }  // Estado
    ];
    
    XLSX.utils.book_append_sheet(workbook, productosSheet, 'Análisis de Productos');
    
    // =====================================================
    // HOJA 4: ANÁLISIS DE VENDEDORES
    // =====================================================
    
    const vendedoresHeaders = [
      'Vendedor',
      'Sucursal',
      'Total Ventas',
      'Ingresos Generados',
      'Ticket Promedio',
      'Ventas por Día',
      'Productos Vendidos',
      'Eficiencia',
      'Ranking',
      'Estado'
    ];
    
    const vendedoresData = data.vendedores.map((vendedor, index) => [
      vendedor.nombre_vendedor,
      vendedor.sucursal_nombre || 'N/A',
      vendedor.total_ventas,
      `Bs ${(Number(vendedor.ingresos_generados) || 0).toFixed(2)}`,
      `Bs ${(Number(vendedor.ticket_promedio) || 0).toFixed(2)}`,
      vendedor.ventas_por_dia?.toFixed(2) || '0',
      vendedor.productos_vendidos || 0,
      `${vendedor.eficiencia || 0}%`,
      `#${index + 1}`,
      vendedor.estado || 'Activo'
    ]);
    
    const vendedoresSheet = XLSX.utils.aoa_to_sheet([vendedoresHeaders, ...vendedoresData]);
    
    // Aplicar estilos a vendedores
    vendedoresSheet['!cols'] = [
      { wch: 25 }, // Vendedor
      { wch: 20 }, // Sucursal
      { wch: 12 }, // Total Ventas
      { wch: 15 }, // Ingresos Generados
      { wch: 15 }, // Ticket Promedio
      { wch: 15 }, // Ventas por Día
      { wch: 15 }, // Productos Vendidos
      { wch: 12 }, // Eficiencia
      { wch: 10 }, // Ranking
      { wch: 12 }  // Estado
    ];
    
    XLSX.utils.book_append_sheet(workbook, vendedoresSheet, 'Análisis de Vendedores');
    
    // =====================================================
    // HOJA 5: TENDENCIAS Y COMPARATIVAS
    // =====================================================
    
    if (options.incluirTendencias) {
      const tendenciasHeaders = [
        'Período',
        'Ventas',
        'Ingresos',
        'Ticket Promedio',
        'Crecimiento Ventas',
        'Crecimiento Ingresos',
        'Tendencia',
        'Observaciones'
      ];
      
      // Generar datos de tendencias (ejemplo)
      const tendenciasData = [
        ['Semana 1', '100', 'Bs 5,000.00', 'Bs 50.00', '0%', '0%', 'Base', 'Período base'],
        ['Semana 2', '120', 'Bs 6,000.00', 'Bs 50.00', '+20%', '+20%', 'Crecimiento', 'Mejora en ventas'],
        ['Semana 3', '110', 'Bs 5,500.00', 'Bs 50.00', '-8%', '-8%', 'Descenso', 'Día festivo'],
        ['Semana 4', '130', 'Bs 6,500.00', 'Bs 50.00', '+18%', '+18%', 'Recuperación', 'Promoción activa']
      ];
      
      const tendenciasSheet = XLSX.utils.aoa_to_sheet([tendenciasHeaders, ...tendenciasData]);
      
      // Aplicar estilos a tendencias
      tendenciasSheet['!cols'] = [
        { wch: 15 }, // Período
        { wch: 12 }, // Ventas
        { wch: 15 }, // Ingresos
        { wch: 15 }, // Ticket Promedio
        { wch: 15 }, // Crecimiento Ventas
        { wch: 15 }, // Crecimiento Ingresos
        { wch: 15 }, // Tendencia
        { wch: 30 }  // Observaciones
      ];
      
      XLSX.utils.book_append_sheet(workbook, tendenciasSheet, 'Tendencias');
    }
    
    // =====================================================
    // GENERAR Y DESCARGAR ARCHIVO
    // =====================================================
    
    const filename = `Reporte_Ventas_${format(new Date(), 'yyyyMMdd_HHmmss', { locale: es })}.xlsx`;
    XLSX.writeFile(workbook, filename);
    
    return {
      success: true,
      filename,
      message: 'Reporte Excel generado exitosamente'
    };
    
  } catch (error) {
    console.error('Error generando Excel:', error);
    return {
      success: false,
      error: error.message,
      message: 'Error al generar reporte Excel'
    };
  }
};

// =====================================================
// EXPORTACIÓN A PDF PROFESIONAL
// =====================================================

export const exportToPDF = async (data: ExportData, options: ExportOptions) => {
  try {
    // Importar jsPDF dinámicamente
    const jsPDF = (await import('jspdf')).default;
    const doc = new jsPDF();
    
    const fechaExportacion = format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // =====================================================
    // PORTADA PROFESIONAL
    // =====================================================
    
    // Fondo degradado (simulado con rectángulos)
    doc.setFillColor(59, 130, 246); // Azul
    doc.rect(0, 0, pageWidth, 60, 'F');
    
    // Título principal
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('REPORTE DE VENTAS', pageWidth / 2, 25, { align: 'center' });
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'normal');
    doc.text('Análisis Profesional y Detallado', pageWidth / 2, 40, { align: 'center' });
    
    // Información del reporte
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    
    let yPosition = 80;
    doc.text(`Fecha de Exportación: ${fechaExportacion}`, 20, yPosition);
    yPosition += 10;
    doc.text(`Período Analizado: ${data.periodos.fechaInicio} - ${data.periodos.fechaFin}`, 20, yPosition);
    yPosition += 10;
    doc.text(`Tipo de Análisis: ${options.tipo.toUpperCase()}`, 20, yPosition);
    yPosition += 10;
    doc.text(`Total de Registros: ${data.ventas.length} ventas`, 20, yPosition);
    
    // =====================================================
    // RESUMEN EJECUTIVO
    // =====================================================
    
    yPosition += 30;
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(59, 130, 246);
    doc.text('RESUMEN EJECUTIVO', 20, yPosition);
    
    yPosition += 15;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    
    const totalIngresos = data.ventas.reduce((sum, v) => sum + (Number(v.total) || 0), 0);
    const ticketPromedio = totalIngresos / data.ventas.length || 0;
    
    doc.text(`• Total de Ventas: ${data.ventas.length}`, 20, yPosition);
    yPosition += 10;
    doc.text(`• Ingresos Totales: Bs ${totalIngresos.toFixed(2)}`, 20, yPosition);
    yPosition += 10;
    doc.text(`• Ticket Promedio: Bs ${ticketPromedio.toFixed(2)}`, 20, yPosition);
    yPosition += 10;
    doc.text(`• Vendedores Activos: ${data.vendedores.length}`, 20, yPosition);
    yPosition += 10;
    doc.text(`• Sucursales Analizadas: ${data.sucursales.length}`, 20, yPosition);
    
    // =====================================================
    // DISTRIBUCIÓN POR MÉTODO DE PAGO
    // =====================================================
    
    yPosition += 20;
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(59, 130, 246);
    doc.text('DISTRIBUCIÓN POR MÉTODO DE PAGO', 20, yPosition);
    
    yPosition += 15;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    
    data.metodosPago.forEach(mp => {
      doc.text(`• ${mp.metodo_pago}: Bs ${(Number(mp.total) || 0).toFixed(2)} (${mp.porcentaje || 0}%)`, 20, yPosition);
      yPosition += 8;
    });
    
    // =====================================================
    // TOP PRODUCTOS
    // =====================================================
    
    yPosition += 10;
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(59, 130, 246);
    doc.text('TOP 10 PRODUCTOS MÁS VENDIDOS', 20, yPosition);
    
    yPosition += 15;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    
    data.productos.slice(0, 10).forEach((producto, index) => {
      doc.text(`${index + 1}. ${producto.nombre_producto}`, 20, yPosition);
      doc.text(`   Cantidad: ${producto.cantidad_vendida} | Ingresos: Bs ${(Number(producto.ingresos_totales) || 0).toFixed(2)}`, 25, yPosition + 5);
      yPosition += 12;
    });
    
    // =====================================================
    // PIE DE PÁGINA
    // =====================================================
    
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text('Generado por Sistema POS Profesional', pageWidth / 2, pageHeight - 20, { align: 'center' });
    doc.text(`Página 1 de 1 - ${fechaExportacion}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    
    // =====================================================
    // GENERAR Y DESCARGAR ARCHIVO
    // =====================================================
    
    const filename = `Reporte_Ventas_${format(new Date(), 'yyyyMMdd_HHmmss', { locale: es })}.pdf`;
    doc.save(filename);
    
    return {
      success: true,
      filename,
      message: 'Reporte PDF generado exitosamente'
    };
    
  } catch (error) {
    console.error('Error generando PDF:', error);
    return {
      success: false,
      error: error.message,
      message: 'Error al generar reporte PDF'
    };
  }
};

// =====================================================
// EXPORTACIÓN CSV MEJORADA
// =====================================================

export const exportToCSVAdvanced = (data: ExportData, options: ExportOptions) => {
  try {
    const fechaExportacion = format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es });
    
    // =====================================================
    // ENCABEZADOS PROFESIONALES
    // =====================================================
    
    const headers = [
      'ID_Venta',
      'Fecha',
      'Hora',
      'Sucursal',
      'Vendedor',
      'Mesa_Delivery',
      'Tipo_Servicio',
      'Metodo_Pago',
      'Subtotal',
      'Descuentos',
      'Total',
      'Productos_Detalle',
      'Cantidad_Productos',
      'Observaciones',
      'Estado',
      'Factura_NIT',
      'Razon_Social',
      'Tiempo_Preparacion',
      'Prioridad',
      'Categoria_Principal'
    ];
    
    // =====================================================
    // DATOS ENRIQUECIDOS
    // =====================================================
    
    const csvData = data.ventas.map(venta => {
      const productos = venta.productos || [];
      const categoriaPrincipal = productos.length > 0 ? productos[0].categoria || 'Sin categoría' : 'Sin categoría';
      
      return [
        venta.id_venta,
        format(new Date(venta.fecha), 'dd/MM/yyyy', { locale: es }),
        format(new Date(venta.fecha), 'HH:mm:ss', { locale: es }),
        venta.sucursal_nombre || 'N/A',
        venta.vendedor_nombre || 'N/A',
        venta.mesa_numero || 'Delivery',
        venta.tipo_servicio || 'N/A',
        venta.metodo_pago || 'N/A',
        (Number(venta.subtotal) || 0).toFixed(2),
        (Number(venta.descuentos) || 0).toFixed(2),
        (Number(venta.total) || 0).toFixed(2),
        productos.map((p: any) => `${p.nombre} x${p.cantidad}`).join('; '),
        productos.length,
        venta.observaciones || '',
        venta.estado || 'N/A',
        venta.factura_nit || '',
        venta.razon_social || '',
        venta.tiempo_preparacion || 'N/A',
        venta.prioridad || 'Normal',
        categoriaPrincipal
      ];
    });
    
    // =====================================================
    // METADATOS DEL REPORTE
    // =====================================================
    
    const metadata = [
      ['METADATOS DEL REPORTE'],
      ['Fecha de Exportación', fechaExportacion],
      ['Período Analizado', `${data.periodos.fechaInicio} - ${data.periodos.fechaFin}`],
      ['Tipo de Análisis', options.tipo.toUpperCase()],
      ['Total de Registros', data.ventas.length.toString()],
      ['Ingresos Totales', data.ventas.reduce((sum, v) => sum + (Number(v.total) || 0), 0).toFixed(2)],
      [''],
      ['DATOS DETALLADOS']
    ];
    
    // =====================================================
    // GENERAR CONTENIDO CSV
    // =====================================================
    
    const csvContent = [
      ...metadata.map(row => row.map(field => `"${field}"`).join(',')),
      headers.map(field => `"${field}"`).join(','),
      ...csvData.map(row => row.map(field => `"${field}"`).join(','))
    ].join('\n');
    
    // =====================================================
    // CREAR Y DESCARGAR ARCHIVO
    // =====================================================
    
    const BOM = '\uFEFF';
    const csvWithBOM = BOM + csvContent;
    
    const blob = new Blob([csvWithBOM], { 
      type: 'text/csv;charset=utf-8;' 
    });
    
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Reporte_Ventas_Avanzado_${format(new Date(), 'yyyyMMdd_HHmmss', { locale: es })}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    return {
      success: true,
      filename: `Reporte_Ventas_Avanzado_${format(new Date(), 'yyyyMMdd_HHmmss', { locale: es })}.csv`,
      message: 'Reporte CSV avanzado generado exitosamente'
    };
    
  } catch (error) {
    console.error('Error generando CSV avanzado:', error);
    return {
      success: false,
      error: error.message,
      message: 'Error al generar reporte CSV avanzado'
    };
  }
};

// =====================================================
// EXPORTACIÓN JSON ESTRUCTURADA
// =====================================================

export const exportToJSON = (data: ExportData, options: ExportOptions) => {
  try {
    const fechaExportacion = format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es });
    
    const jsonData = {
      metadata: {
        fecha_exportacion: fechaExportacion,
        periodo: {
          fecha_inicio: data.periodos.fechaInicio,
          fecha_fin: data.periodos.fechaFin,
          tipo: data.periodos.tipo
        },
        opciones: options,
        total_registros: data.ventas.length,
        version: '2.0'
      },
      resumen: {
        total_ventas: data.ventas.length,
        ingresos_totales: data.ventas.reduce((sum, v) => sum + (Number(v.total) || 0), 0),
        ticket_promedio: data.ventas.reduce((sum, v) => sum + (Number(v.total) || 0), 0) / data.ventas.length || 0,
        vendedores_activos: data.vendedores.length,
        sucursales_analizadas: data.sucursales.length
      },
      distribucion_metodos_pago: data.metodosPago,
      top_productos: data.productos.slice(0, 20),
      analisis_vendedores: data.vendedores,
      ventas_detalladas: data.ventas,
      sucursales: data.sucursales
    };
    
    const jsonString = JSON.stringify(jsonData, null, 2);
    
    const blob = new Blob([jsonString], { 
      type: 'application/json;charset=utf-8;' 
    });
    
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Reporte_Ventas_JSON_${format(new Date(), 'yyyyMMdd_HHmmss', { locale: es })}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    return {
      success: true,
      filename: `Reporte_Ventas_JSON_${format(new Date(), 'yyyyMMdd_HHmmss', { locale: es })}.json`,
      message: 'Reporte JSON generado exitosamente'
    };
    
  } catch (error) {
    console.error('Error generando JSON:', error);
    return {
      success: false,
      error: error.message,
      message: 'Error al generar reporte JSON'
    };
  }
};

// =====================================================
// FUNCIÓN PRINCIPAL DE EXPORTACIÓN
// =====================================================

export const exportAnalyticsData = async (
  data: ExportData, 
  options: ExportOptions
): Promise<{ success: boolean; filename?: string; message: string; error?: string }> => {
  
  console.log('🚀 Iniciando exportación avanzada:', { formato: options.formato, tipo: options.tipo });
  
  switch (options.formato) {
    case 'excel':
      return await exportToExcel(data, options);
    case 'pdf':
      return await exportToPDF(data, options);
    case 'csv':
      return exportToCSVAdvanced(data, options);
    case 'json':
      return exportToJSON(data, options);
    default:
      return {
        success: false,
        message: 'Formato de exportación no soportado'
      };
  }
};
