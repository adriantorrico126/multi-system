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
import { getBranches, getProducts, getPaymentMethods, getUsers } from '@/services/api';
import { usePlan } from '@/context/PlanContext';
import { ProfessionalRestrictionMessage } from '@/components/plan/ProfessionalRestrictionMessage';

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
  
  // Hook para verificar acceso a funciones avanzadas
  const { hasFeature, currentPlan } = usePlan();
  
  // Verificar si el usuario tiene acceso a funciones avanzadas de ventas
  const hasAdvancedSalesAccess = hasFeature('sales.avanzado');

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

  const openInfoDialog = (sale: Sale) => {
    setSelectedSaleForInfo(sale);
    setIsInfoDialogOpen(true);
  };

  // --- Exportación avanzada ---
  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      // Validar fechas
      if (!fechaInicio || !fechaFin) {
        toast({
          title: "Error",
          description: "Debe seleccionar fecha de inicio y fin",
          variant: "destructive",
        });
        return;
      }

      const filtros = {
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        sucursal: sucursal || null,
        producto: null,
        metodo_pago: null,
        cajero: null
      };

      const ventas = await exportVentasFiltradas(filtros);
      
      if (ventas.length === 0) {
        toast({
          title: "Sin datos",
          description: "No hay ventas para el período seleccionado",
          variant: "destructive",
        });
        return;
      }

      // ===== CREAR WORKBOOK PROFESIONAL =====
      const wb = XLSX.utils.book_new();
      
      // ===== HOJA 1: RESUMEN EJECUTIVO =====
      const resumenData = [
        ['INFORME DE VENTAS - RESUMEN EJECUTIVO'],
        [''],
        ['Período de Análisis:', `${fechaInicio} a ${fechaFin}`],
        ['Fecha de Generación:', new Date().toLocaleDateString('es-ES')],
        ['Hora de Generación:', new Date().toLocaleTimeString('es-ES')],
        [''],
        ['MÉTRICAS GENERALES'],
        ['Total de Transacciones:', ventas.length],
        ['Ingresos Totales:', `Bs${ventas.reduce((sum, v) => sum + parseFloat(v.total || 0), 0).toFixed(2)}`],
        ['Promedio por Venta:', `Bs${(ventas.reduce((sum, v) => sum + parseFloat(v.total || 0), 0) / ventas.length).toFixed(2)}`],
        ['Venta Máxima:', `Bs${Math.max(...ventas.map(v => parseFloat(v.total || 0))).toFixed(2)}`],
        ['Venta Mínima:', `Bs${Math.min(...ventas.map(v => parseFloat(v.total || 0))).toFixed(2)}`],
        [''],
        ['DISTRIBUCIÓN POR MÉTODO DE PAGO'],
        ['Método', 'Cantidad', 'Total (Bs)', 'Porcentaje'],
        ...Object.entries(
          ventas.reduce((acc, v) => {
            const metodo = v.paymentmethod || v.paymentMethod || 'No especificado';
            if (!acc[metodo]) acc[metodo] = { cantidad: 0, total: 0 };
            acc[metodo].cantidad += 1;
            acc[metodo].total += parseFloat(v.total || 0);
            return acc;
          }, {} as Record<string, { cantidad: number; total: number }>)
        ).map(([metodo, datos]) => [
          metodo,
          datos.cantidad,
          datos.total.toFixed(2),
          `${((datos.total / ventas.reduce((sum, v) => sum + parseFloat(v.total || 0), 0)) * 100).toFixed(1)}%`
        ]),
        [''],
        ['RENDIMIENTO POR CAJERO'],
        ['Cajero', 'Ventas', 'Total (Bs)', 'Promedio (Bs)'],
        ...Object.entries(
          ventas.reduce((acc, v) => {
            const cajero = v.cashier || 'No especificado';
            if (!acc[cajero]) acc[cajero] = { ventas: 0, total: 0 };
            acc[cajero].ventas += 1;
            acc[cajero].total += parseFloat(v.total || 0);
            return acc;
          }, {} as Record<string, { ventas: number; total: number }>)
        ).map(([cajero, datos]) => [
          cajero,
          datos.ventas,
          datos.total.toFixed(2),
          (datos.total / datos.ventas).toFixed(2)
        ])
      ];

      const wsResumen = XLSX.utils.aoa_to_sheet(resumenData);
      
      // Aplicar estilos al resumen
      wsResumen['!cols'] = [
        { width: 25 }, // Columna 1
        { width: 20 }, // Columna 2
        { width: 15 }, // Columna 3
        { width: 15 }  // Columna 4
      ];

      // Aplicar estilos a celdas específicas
      const range = XLSX.utils.decode_range(wsResumen['!ref'] || 'A1');
      for (let R = range.s.r; R <= range.e.r; R++) {
        for (let C = range.s.c; C <= range.e.c; C++) {
          const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
          if (!wsResumen[cellAddress]) continue;
          
          // Estilo para títulos principales
          if (R === 0) {
            wsResumen[cellAddress].s = {
              font: { bold: true, size: 18, color: { rgb: "FFFFFF" } },
              fill: { fgColor: { rgb: "1E3A8A" } },
              alignment: { horizontal: "center", vertical: "center" }
            };
          }
          // Estilo para subtítulos de sección
          else if (R === 2 || R === 6 || R === 13 || R === 20) {
            wsResumen[cellAddress].s = {
              font: { bold: true, size: 14, color: { rgb: "FFFFFF" } },
              fill: { fgColor: { rgb: "3B82F6" } },
              alignment: { horizontal: "left", vertical: "center" }
            };
          }
          // Estilo para encabezados de tabla
          else if (R === 14 || R === 21) {
            wsResumen[cellAddress].s = {
              font: { bold: true, size: 12, color: { rgb: "FFFFFF" } },
              fill: { fgColor: { rgb: "10B981" } },
              alignment: { horizontal: "center", vertical: "center" },
              border: {
                top: { style: "medium", color: { rgb: "000000" } },
                bottom: { style: "medium", color: { rgb: "000000" } },
                left: { style: "medium", color: { rgb: "000000" } },
                right: { style: "medium", color: { rgb: "000000" } }
              }
            };
          }
          // Estilo para datos con colores alternados
          else if (R > 14 || R > 21) {
            const isEvenRow = R % 2 === 0;
            wsResumen[cellAddress].s = {
              font: { bold: false, size: 11 },
              fill: { fgColor: { rgb: isEvenRow ? "F8FAFC" : "FFFFFF" } },
              border: {
                top: { style: "thin", color: { rgb: "E2E8F0" } },
                bottom: { style: "thin", color: { rgb: "E2E8F0" } },
                left: { style: "thin", color: { rgb: "E2E8F0" } },
                right: { style: "thin", color: { rgb: "E2E8F0" } }
              },
              alignment: { vertical: "center" }
            };
            
            // Estilo especial para valores numéricos importantes
            if (C === 2 && (R === 8 || R === 9 || R === 10 || R === 11)) {
              wsResumen[cellAddress].s.font = { bold: true, size: 12, color: { rgb: "059669" } };
              wsResumen[cellAddress].s.fill = { fgColor: { rgb: "D1FAE5" } };
            }
            
            // Estilo para porcentajes
            if (C === 3 && R > 14 && R <= 18) {
              wsResumen[cellAddress].s.font = { bold: true, color: { rgb: "DC2626" } };
            }
          }
        }
      }

      XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen Ejecutivo');

      // ===== HOJA 2: DETALLE COMPLETO DE VENTAS =====
      const detalleData = [
        // ENCABEZADOS PRINCIPALES
        ['DETALLE COMPLETO DE VENTAS - ANÁLISIS PROFESIONAL'],
        [''],
        // ENCABEZADOS DE COLUMNAS
        [
          'ID_VENTA',
          'FECHA',
          'HORA',
          'TIMESTAMP_COMPLETO',
          'CAJERO',
          'SUCURSAL',
          'MESA_NUMERO',
          'TIPO_SERVICIO',
          'ESTADO_VENTA',
          'SUBTOTAL',
          'DESCUENTOS',
          'TOTAL_FINAL',
          'METODO_PAGO',
          'CANTIDAD_PRODUCTOS',
          'PRODUCTOS_DETALLE',
          'NOTAS_OBSERVACIONES',
          'CATEGORIA_PRINCIPAL',
          'VALOR_PROMEDIO_PRODUCTO',
          'INDICADOR_PROMOCION',
          'MES',
          'DIA_SEMANA',
          'HORA_PICO',
          'SEGMENTO_CLIENTE'
        ]
      ];

              // DATOS NORMALIZADOS PARA ANÁLISIS
        ventas.forEach((venta, index) => {
          const fecha = new Date(venta.timestamp);
          const productos = venta.items || [];
          const total = parseFloat(venta.total || 0);
          const subtotal = venta.subtotal || total;
          const descuentos = subtotal - total;
          
          // Calcular métricas adicionales
          const cantidadProductos = productos.reduce((sum, p) => sum + (p.quantity || 0), 0);
          const valorPromedioProducto = cantidadProductos > 0 ? total / cantidadProductos : 0;
          const categoriaPrincipal = productos.length > 0 ? (productos[0].category && productos[0].category !== 'null' && productos[0].category !== 'undefined' && productos[0].category !== 'sin categoria' ? productos[0].category : 'Sin Categoría') : 'Sin productos';
          const tienePromocion = descuentos > 0 ? 'SÍ' : 'NO';
          const mes = fecha.toLocaleDateString('es-ES', { month: 'long' });
          const diaSemana = fecha.toLocaleDateString('es-ES', { weekday: 'long' });
          const hora = fecha.getHours();
        const horaPico = (hora >= 12 && hora <= 14) || (hora >= 19 && hora <= 21) ? 'SÍ' : 'NO';
        const segmentoCliente = total > 100 ? 'ALTO' : total > 50 ? 'MEDIO' : 'BAJO';

        detalleData.push([
          venta.id,
          fecha.toLocaleDateString('es-ES'),
          fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
          venta.timestamp,
          venta.cashier || 'No especificado',
          venta.branch || 'No especificado',
          venta.mesaNumero || venta.mesa_numero || 'N/A',
          venta.tipoServicio || venta.tipo_servicio || 'N/A',
          venta.estado || 'N/A',
          subtotal.toFixed(2),
          descuentos.toFixed(2),
          total.toFixed(2),
          venta.paymentmethod || venta.paymentMethod || 'No especificado',
          cantidadProductos,
          productos.map(p => `${p.name} (x${p.quantity})`).join('; '),
          venta.observaciones || venta.notes || '',
          categoriaPrincipal,
          valorPromedioProducto.toFixed(2),
          tienePromocion,
          mes,
          diaSemana,
          horaPico,
          segmentoCliente
        ]);
      });

      const wsDetalle = XLSX.utils.aoa_to_sheet(detalleData);
      
      // Aplicar estilos profesionales al detalle
      wsDetalle['!cols'] = [
        { width: 12 }, // ID_VENTA
        { width: 12 }, // FECHA
        { width: 10 }, // HORA
        { width: 20 }, // TIMESTAMP_COMPLETO
        { width: 15 }, // CAJERO
        { width: 15 }, // SUCURSAL
        { width: 12 }, // MESA_NUMERO
        { width: 15 }, // TIPO_SERVICIO
        { width: 15 }, // ESTADO_VENTA
        { width: 12 }, // SUBTOTAL
        { width: 12 }, // DESCUENTOS
        { width: 12 }, // TOTAL_FINAL
        { width: 15 }, // METODO_PAGO
        { width: 18 }, // CANTIDAD_PRODUCTOS
        { width: 40 }, // PRODUCTOS_DETALLE
        { width: 25 }, // NOTAS_OBSERVACIONES
        { width: 18 }, // TIEMPO_PREPARACION
        { width: 20 }, // CATEGORIA_PRINCIPAL
        { width: 22 }, // VALOR_PROMEDIO_PRODUCTO
        { width: 18 }, // INDICADOR_PROMOCION
        { width: 12 }, // MES
        { width: 15 }, // DIA_SEMANA
        { width: 12 }, // HORA_PICO
        { width: 15 }  // SEGMENTO_CLIENTE
      ];

      // Aplicar estilos a todas las celdas del detalle
      const detalleRange = XLSX.utils.decode_range(wsDetalle['!ref'] || 'A1');
      for (let R = detalleRange.s.r; R <= detalleRange.e.r; R++) {
        for (let C = detalleRange.s.c; C <= detalleRange.e.c; C++) {
          const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
          if (!wsDetalle[cellAddress]) continue;
          
          // Estilo para título principal
          if (R === 0) {
            wsDetalle[cellAddress].s = {
              font: { bold: true, size: 18, color: { rgb: "FFFFFF" } },
              fill: { fgColor: { rgb: "1E3A8A" } },
              alignment: { horizontal: "center", vertical: "center" }
            };
          }
          // Estilo para encabezados de columnas
          else if (R === 2) {
            wsDetalle[cellAddress].s = {
              font: { bold: true, size: 12, color: { rgb: "FFFFFF" } },
              fill: { fgColor: { rgb: "7C3AED" } },
              alignment: { horizontal: "center", vertical: "center" },
              border: {
                top: { style: "medium", color: { rgb: "000000" } },
                bottom: { style: "medium", color: { rgb: "000000" } },
                left: { style: "medium", color: { rgb: "000000" } },
                right: { style: "medium", color: { rgb: "000000" } }
              }
            };
          }
          // Estilo para datos con colores alternados
          else if (R > 2) {
            const isEvenRow = R % 2 === 0;
            wsDetalle[cellAddress].s = {
              font: { bold: false, size: 10 },
              fill: { fgColor: { rgb: isEvenRow ? "F8FAFC" : "FFFFFF" } },
              border: {
                top: { style: "thin", color: { rgb: "E2E8F0" } },
                bottom: { style: "thin", color: { rgb: "E2E8F0" } },
                left: { style: "thin", color: { rgb: "E2E8F0" } },
                right: { style: "thin", color: { rgb: "E2E8F0" } }
              },
              alignment: { vertical: "center" }
            };
            
            // Estilo especial para columnas numéricas importantes
            if ([8, 9, 10, 12, 18].includes(C)) { // SUBTOTAL, DESCUENTOS, TOTAL_FINAL, CANTIDAD_PRODUCTOS, VALOR_PROMEDIO_PRODUCTO
              wsDetalle[cellAddress].s.alignment = { horizontal: "right", vertical: "center" };
              wsDetalle[cellAddress].s.font = { bold: true, color: { rgb: "059669" } };
              wsDetalle[cellAddress].s.fill = { fgColor: { rgb: "D1FAE5" } };
            }
            
            // Estilo especial para columnas de texto largo
            if ([13, 14, 15].includes(C)) { // PRODUCTOS_DETALLE, NOTAS_OBSERVACIONES, TIEMPO_PREPARACION
              wsDetalle[cellAddress].s.alignment = { horizontal: "left", vertical: "center" };
            }
            
            // Estilo especial para ID de venta
            if (C === 0) {
              wsDetalle[cellAddress].s.font = { bold: true, color: { rgb: "DC2626" } };
              wsDetalle[cellAddress].s.fill = { fgColor: { rgb: "FEE2E2" } };
            }
            
            // Estilo especial para totales
            if (C === 10) { // TOTAL_FINAL
              wsDetalle[cellAddress].s.font = { bold: true, size: 11, color: { rgb: "1E40AF" } };
              wsDetalle[cellAddress].s.fill = { fgColor: { rgb: "DBEAFE" } };
            }
          }
        }
      }

      // Agregar filtros automáticos
      wsDetalle['!autofilter'] = { ref: `A3:${XLSX.utils.encode_col(detalleRange.e.c)}3` };

      XLSX.utils.book_append_sheet(wb, wsDetalle, 'Detalle Completo');

      // ===== HOJA 3: ANÁLISIS POR PRODUCTOS =====
      const productosData = [
        ['ANÁLISIS DETALLADO POR PRODUCTOS'],
        [''],
        ['PRODUCTO', 'CATEGORÍA', 'CANTIDAD_VENDIDA', 'TOTAL_VENTAS', 'PRECIO_PROMEDIO', 'FRECUENCIA_VENTA', 'RENDIMIENTO']
      ];

      // Agrupar productos para análisis
      const productosAgrupados = {};
      ventas.forEach(venta => {
        venta.items?.forEach(item => {
          const key = item.name;
          if (!productosAgrupados[key]) {
            productosAgrupados[key] = {
              categoria: item.category || 'Sin categoría',
              cantidad: 0,
              total: 0,
              precioPromedio: 0,
              frecuencia: 0
            };
          }
          productosAgrupados[key].cantidad += item.quantity || 0;
          productosAgrupados[key].total += (item.price || 0) * (item.quantity || 0);
          productosAgrupados[key].frecuencia += 1;
        });
      });

      // Calcular métricas adicionales
      Object.keys(productosAgrupados).forEach(producto => {
        const datos = productosAgrupados[producto];
        datos.precioPromedio = datos.total / datos.cantidad;
        
        // Calcular rendimiento (1-5 estrellas basado en ventas)
        const rendimiento = datos.total > 1000 ? '⭐⭐⭐⭐⭐' : 
                           datos.total > 500 ? '⭐⭐⭐⭐' : 
                           datos.total > 200 ? '⭐⭐⭐' : 
                           datos.total > 100 ? '⭐⭐' : '⭐';
        
        productosData.push([
          producto,
          datos.categoria,
          datos.cantidad,
          datos.total.toFixed(2),
          datos.precioPromedio.toFixed(2),
          datos.frecuencia,
          rendimiento
        ]);
      });

      // Ordenar por total de ventas
      productosData.splice(3); // Mantener encabezados
      Object.entries(productosAgrupados)
        .sort(([,a], [,b]) => b.total - a.total)
        .forEach(([producto, datos]) => {
          const rendimiento = datos.total > 1000 ? '⭐⭐⭐⭐⭐' : 
                             datos.total > 500 ? '⭐⭐⭐⭐' : 
                             datos.total > 200 ? '⭐⭐⭐' : 
                             datos.total > 100 ? '⭐⭐' : '⭐';
          
          productosData.push([
            producto,
            datos.categoria,
            datos.cantidad,
            datos.total.toFixed(2),
            datos.precioPromedio.toFixed(2),
            datos.frecuencia,
            rendimiento
          ]);
        });

      const wsProductos = XLSX.utils.aoa_to_sheet(productosData);
      
      // Aplicar estilos a la hoja de productos
      wsProductos['!cols'] = [
        { width: 30 }, // PRODUCTO
        { width: 20 }, // CATEGORÍA
        { width: 18 }, // CANTIDAD_VENDIDA
        { width: 15 }, // TOTAL_VENTAS
        { width: 18 }, // PRECIO_PROMEDIO
        { width: 18 }, // FRECUENCIA_VENTA
        { width: 15 }  // RENDIMIENTO
      ];

      // Aplicar estilos
      const productosRange = XLSX.utils.decode_range(wsProductos['!ref'] || 'A1');
      for (let R = productosRange.s.r; R <= productosRange.e.r; R++) {
        for (let C = productosRange.s.c; C <= productosRange.e.c; C++) {
          const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
          if (!wsProductos[cellAddress]) continue;
          
          if (R === 0) {
            wsProductos[cellAddress].s = {
              font: { bold: true, size: 18, color: { rgb: "FFFFFF" } },
              fill: { fgColor: { rgb: "059669" } },
              alignment: { horizontal: "center", vertical: "center" }
            };
          } else if (R === 2) {
            wsProductos[cellAddress].s = {
              font: { bold: true, size: 12, color: { rgb: "FFFFFF" } },
              fill: { fgColor: { rgb: "10B981" } },
              alignment: { horizontal: "center", vertical: "center" },
              border: {
                top: { style: "medium", color: { rgb: "000000" } },
                bottom: { style: "medium", color: { rgb: "000000" } },
                left: { style: "medium", color: { rgb: "000000" } },
                right: { style: "medium", color: { rgb: "000000" } }
              }
            };
          } else if (R > 2) {
            const isEvenRow = R % 2 === 0;
            wsProductos[cellAddress].s = {
              font: { bold: false, size: 11 },
              fill: { fgColor: { rgb: isEvenRow ? "F0FDF4" : "FFFFFF" } },
              border: {
                top: { style: "thin", color: { rgb: "D1FAE5" } },
                bottom: { style: "thin", color: { rgb: "D1FAE5" } },
                left: { style: "thin", color: { rgb: "D1FAE5" } },
                right: { style: "thin", color: { rgb: "D1FAE5" } }
              },
              alignment: { vertical: "center" }
            };
            
            // Alineación especial para columnas numéricas
            if ([2, 3, 4, 5].includes(C)) {
              wsProductos[cellAddress].s.alignment = { horizontal: "right", vertical: "center" };
              wsProductos[cellAddress].s.font = { bold: true, color: { rgb: "059669" } };
            }
            
            // Estilo especial para rendimiento (estrellas)
            if (C === 6) {
              wsProductos[cellAddress].s.font = { bold: true, size: 12, color: { rgb: "F59E0B" } };
              wsProductos[cellAddress].s.alignment = { horizontal: "center", vertical: "center" };
            }
            
            // Estilo especial para productos top (primeras 3 filas)
            if (R <= 5) {
              wsProductos[cellAddress].s.font = { bold: true, size: 12 };
              wsProductos[cellAddress].s.fill = { fgColor: { rgb: "FEF3C7" } };
            }
          }
        }
      }

      // Agregar filtros automáticos
      wsProductos['!autofilter'] = { ref: `A3:${XLSX.utils.encode_col(productosRange.e.c)}3` };

      XLSX.utils.book_append_sheet(wb, wsProductos, 'Análisis Productos');

      // ===== HOJA 4: MÉTRICAS TEMPORALES =====
      const metricasData = [
        ['ANÁLISIS TEMPORAL Y TENDENCIAS'],
        [''],
        ['FECHA', 'DÍA_SEMANA', 'VENTAS_DEL_DÍA', 'TOTAL_DEL_DÍA', 'PROMEDIO_DEL_DÍA', 'PRODUCTOS_VENDIDOS', 'TENDENCIA']
      ];

      // Agrupar por fecha
      const ventasPorFecha = {};
      ventas.forEach(venta => {
        const fecha = new Date(venta.timestamp).toLocaleDateString('es-ES');
        if (!ventasPorFecha[fecha]) {
          ventasPorFecha[fecha] = {
            ventas: 0,
            total: 0,
            productos: 0
          };
        }
        ventasPorFecha[fecha].ventas += 1;
        ventasPorFecha[fecha].total += parseFloat(venta.total || 0);
        ventasPorFecha[fecha].productos += (venta.items || []).reduce((sum, item) => sum + (item.quantity || 0), 0);
      });

      // Calcular tendencias
      const fechas = Object.keys(ventasPorFecha).sort();
      fechas.forEach((fecha, index) => {
        const datos = ventasPorFecha[fecha];
        const promedio = datos.total / datos.ventas;
        const diaSemana = new Date(fecha.split('/').reverse().join('-')).toLocaleDateString('es-ES', { weekday: 'long' });
        
        // Calcular tendencia
        let tendencia = '→';
        if (index > 0) {
          const datosAnterior = ventasPorFecha[fechas[index - 1]];
          const promedioAnterior = datosAnterior.total / datosAnterior.ventas;
          if (promedio > promedioAnterior * 1.1) tendencia = '↗️';
          else if (promedio < promedioAnterior * 0.9) tendencia = '↘️';
        }
        
        metricasData.push([
          fecha,
          diaSemana,
          datos.ventas,
          datos.total.toFixed(2),
          promedio.toFixed(2),
          datos.productos,
          tendencia
        ]);
      });

      const wsMetricas = XLSX.utils.aoa_to_sheet(metricasData);
      
      // Aplicar estilos
      wsMetricas['!cols'] = [
        { width: 15 }, // FECHA
        { width: 15 }, // DÍA_SEMANA
        { width: 15 }, // VENTAS_DEL_DÍA
        { width: 15 }, // TOTAL_DEL_DÍA
        { width: 18 }, // PROMEDIO_DEL_DÍA
        { width: 20 }, // PRODUCTOS_VENDIDOS
        { width: 12 }  // TENDENCIA
      ];

      // Aplicar estilos similares
      const metricasRange = XLSX.utils.decode_range(wsMetricas['!ref'] || 'A1');
      for (let R = metricasRange.s.r; R <= metricasRange.e.r; R++) {
        for (let C = metricasRange.s.c; C <= metricasRange.e.c; C++) {
          const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
          if (!wsMetricas[cellAddress]) continue;
          
          if (R === 0) {
            wsMetricas[cellAddress].s = {
              font: { bold: true, size: 18, color: { rgb: "FFFFFF" } },
              fill: { fgColor: { rgb: "7C2D12" } },
              alignment: { horizontal: "center", vertical: "center" }
            };
          } else if (R === 2) {
            wsMetricas[cellAddress].s = {
              font: { bold: true, size: 12, color: { rgb: "FFFFFF" } },
              fill: { fgColor: { rgb: "EA580C" } },
              alignment: { horizontal: "center", vertical: "center" },
              border: {
                top: { style: "medium", color: { rgb: "000000" } },
                bottom: { style: "medium", color: { rgb: "000000" } },
                left: { style: "medium", color: { rgb: "000000" } },
                right: { style: "medium", color: { rgb: "000000" } }
              }
            };
          } else if (R > 2) {
            const isEvenRow = R % 2 === 0;
            wsMetricas[cellAddress].s = {
              font: { bold: false, size: 11 },
              fill: { fgColor: { rgb: isEvenRow ? "FEF3C7" : "FFFFFF" } },
              border: {
                top: { style: "thin", color: { rgb: "FED7AA" } },
                bottom: { style: "thin", color: { rgb: "FED7AA" } },
                left: { style: "thin", color: { rgb: "FED7AA" } },
                right: { style: "thin", color: { rgb: "FED7AA" } }
              },
              alignment: { vertical: "center" }
            };
            
            // Alineación para columnas numéricas
            if ([2, 3, 4, 5].includes(C)) {
              wsMetricas[cellAddress].s.alignment = { horizontal: "right", vertical: "center" };
              wsMetricas[cellAddress].s.font = { bold: true, color: { rgb: "7C2D12" } };
            }
            
            // Estilo especial para tendencias
            if (C === 6) {
              wsMetricas[cellAddress].s.font = { bold: true, size: 14, color: { rgb: "DC2626" } };
              wsMetricas[cellAddress].s.alignment = { horizontal: "center", vertical: "center" };
            }
            
            // Estilo especial para días de mayor venta
            if (C === 3 && R > 2) { // TOTAL_DEL_DÍA
              const total = parseFloat(wsMetricas[cellAddress].v || '0');
              if (total > 100) {
                wsMetricas[cellAddress].s.font = { bold: true, color: { rgb: "059669" } };
                wsMetricas[cellAddress].s.fill = { fgColor: { rgb: "D1FAE5" } };
              }
            }
          }
        }
      }

      // Agregar filtros automáticos
      wsMetricas['!autofilter'] = { ref: `A3:${XLSX.utils.encode_col(metricasRange.e.c)}3` };

      XLSX.utils.book_append_sheet(wb, wsMetricas, 'Métricas Temporales');

      // ===== HOJA 5: VENTAS NORMALIZADAS =====
      const ventasNormalizadasData = [
        ['VENTAS NORMALIZADAS - ANÁLISIS AVANZADO'],
        [''],
        ['ID_VENTA', 'FECHA', 'HORA', 'CAJERO', 'MESA', 'TIPO_SERVICIO', 'METODO_PAGO', 'TOTAL_VENTA', 'CANTIDAD_PRODUCTOS', 'PRODUCTOS_AGRUPADOS', 'CATEGORIAS', 'SUBTOTAL', 'DESCUENTOS', 'ESTADO', 'OBSERVACIONES', 'PROMOCIONES_APLICADAS', 'MES', 'DIA_SEMANA', 'HORA_PICO', 'SEGMENTO_CLIENTE', 'RENDIMIENTO_VENTA']
      ];

      // Procesar ventas de forma normalizada (una fila por venta)
      ventas.forEach(venta => {
        const fecha = new Date(venta.timestamp);
        const productos = venta.items || [];
        const total = parseFloat(venta.total || 0);
        const subtotal = venta.subtotal || total;
        const descuentos = subtotal - total;
        
        // Agrupar productos por nombre y sumar cantidades
        const productosAgrupados = {};
        productos.forEach(p => {
          const nombre = p.name || p.nombre_producto || 'Producto sin nombre';
          if (productosAgrupados[nombre]) {
            productosAgrupados[nombre] += p.quantity || 0;
          } else {
            productosAgrupados[nombre] = p.quantity || 0;
          }
        });
        
        // Crear lista de productos agrupados
        const productosLista = Object.entries(productosAgrupados)
          .map(([nombre, cantidad]) => `${nombre} (x${cantidad})`)
          .join('; ');
        
        // Obtener categorías únicas
        const categorias = [...new Set(productos.map(p => {
          const cat = p.category || p.categoria;
          return cat && cat !== 'null' && cat !== 'undefined' && cat !== 'sin categoria' ? cat : 'Sin Categoría';
        }))].join(', ');
        
        // Calcular métricas adicionales
        const cantidadProductos = productos.reduce((sum, p) => sum + (p.quantity || 0), 0);
        const mes = fecha.toLocaleDateString('es-ES', { month: 'long' });
        const diaSemana = fecha.toLocaleDateString('es-ES', { weekday: 'long' });
        const hora = fecha.getHours();
        const horaPico = (hora >= 12 && hora <= 14) || (hora >= 19 && hora <= 21) ? 'SÍ' : 'NO';
        const segmentoCliente = total > 100 ? 'ALTO' : total > 50 ? 'MEDIO' : 'BAJO';
        const rendimiento = total > 100 ? '⭐⭐⭐' : total > 50 ? '⭐⭐' : '⭐';
        
        // Obtener promociones aplicadas
        const promociones = venta.promociones || [];
        const promocionesAplicadas = promociones.length > 0 
          ? promociones.map(p => p.nombre || p.name).join(', ')
          : 'Sin promociones';
        
        ventasNormalizadasData.push([
          venta.id || venta.id_venta,
          fecha.toLocaleDateString('es-ES'),
          fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
          venta.cashier || venta.cajero || 'No especificado',
          venta.mesaNumero || venta.mesa_numero || venta.mesa || 'N/A',
          venta.tipoServicio || venta.tipo_servicio || 'N/A',
          venta.paymentmethod || venta.paymentMethod || venta.metodo_pago || 'No especificado',
          total.toFixed(2),
          cantidadProductos,
          productosLista,
          categorias,
          subtotal.toFixed(2),
          descuentos.toFixed(2),
          venta.estado || 'COMPLETADA',
          venta.observaciones || venta.notes || '',
          promocionesAplicadas,
          mes,
          diaSemana,
          horaPico,
          segmentoCliente,
          rendimiento
        ]);
      });

      const wsVentasNormalizadas = XLSX.utils.aoa_to_sheet(ventasNormalizadasData);
      
      // Aplicar estilos
      wsVentasNormalizadas['!cols'] = [
        { width: 12 }, // ID_VENTA
        { width: 12 }, // FECHA
        { width: 10 }, // HORA
        { width: 15 }, // CAJERO
        { width: 10 }, // MESA
        { width: 15 }, // TIPO_SERVICIO
        { width: 15 }, // METODO_PAGO
        { width: 12 }, // TOTAL_VENTA
        { width: 15 }, // CANTIDAD_PRODUCTOS
        { width: 40 }, // PRODUCTOS_AGRUPADOS
        { width: 20 }, // CATEGORIAS
        { width: 12 }, // SUBTOTAL
        { width: 12 }, // DESCUENTOS
        { width: 12 }, // ESTADO
        { width: 25 }, // OBSERVACIONES
        { width: 12 }, // PROMOCIONES_APLICADAS
        { width: 12 }, // MES
        { width: 15 }, // DIA_SEMANA
        { width: 10 }, // HORA_PICO
        { width: 15 }, // SEGMENTO_CLIENTE
        { width: 15 }  // RENDIMIENTO_VENTA
      ];

      // Aplicar estilos
      const ventasNormRange = XLSX.utils.decode_range(wsVentasNormalizadas['!ref'] || 'A1');
      for (let R = ventasNormRange.s.r; R <= ventasNormRange.e.r; R++) {
        for (let C = ventasNormRange.s.c; C <= ventasNormRange.e.c; C++) {
          const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
          if (!wsVentasNormalizadas[cellAddress]) continue;
          
          if (R === 0) {
            wsVentasNormalizadas[cellAddress].s = {
              font: { bold: true, size: 18, color: { rgb: "FFFFFF" } },
              fill: { fgColor: { rgb: "DC2626" } },
              alignment: { horizontal: "center", vertical: "center" }
            };
          } else if (R === 2) {
            wsVentasNormalizadas[cellAddress].s = {
              font: { bold: true, size: 12, color: { rgb: "FFFFFF" } },
              fill: { fgColor: { rgb: "EF4444" } },
              alignment: { horizontal: "center", vertical: "center" },
              border: {
                top: { style: "medium", color: { rgb: "000000" } },
                bottom: { style: "medium", color: { rgb: "000000" } },
                left: { style: "medium", color: { rgb: "000000" } },
                right: { style: "medium", color: { rgb: "000000" } }
              }
            };
          } else if (R > 2) {
            const isEvenRow = R % 2 === 0;
                         wsVentasNormalizadas[cellAddress].s = {
               font: { bold: false, size: 10 },
               fill: { fgColor: { rgb: isEvenRow ? "FEE2E2" : "FFFFFF" } },
               border: {
                 top: { style: "thin", color: { rgb: "FECACA" } },
                 bottom: { style: "thin", color: { rgb: "FECACA" } },
                 left: { style: "thin", color: { rgb: "FECACA" } },
                 right: { style: "thin", color: { rgb: "FECACA" } }
               },
               alignment: { vertical: "center" }
             };
            
            // Estilo especial para totales
            if (C === 7) { // TOTAL_VENTA
              wsVentasNormalizadas[cellAddress].s.font = { bold: true, size: 11, color: { rgb: "059669" } };
              wsVentasNormalizadas[cellAddress].s.fill = { fgColor: { rgb: "D1FAE5" } };
            }
            
            // Estilo especial para rendimiento
            if (C === 20) { // RENDIMIENTO_VENTA
              wsVentasNormalizadas[cellAddress].s.font = { bold: true, size: 14, color: { rgb: "F59E0B" } };
              wsVentasNormalizadas[cellAddress].s.alignment = { horizontal: "center", vertical: "center" };
            }
            
            // Estilo especial para productos agrupados
            if (C === 9) { // PRODUCTOS_AGRUPADOS
              wsVentasNormalizadas[cellAddress].s.font = { size: 9 };
              wsVentasNormalizadas[cellAddress].s.alignment = { horizontal: "left", vertical: "center" };
            }
          }
        }
      }

      XLSX.utils.book_append_sheet(wb, wsVentasNormalizadas, 'Ventas Normalizadas');

      // ===== CONFIGURAR PROPIEDADES DEL WORKBOOK =====
      wb.Props = {
        Title: `Informe de Ventas Profesional - ${fechaInicio} a ${fechaFin}`,
        Subject: 'Análisis detallado de ventas para toma de decisiones',
        Author: 'Sistema POS Profesional',
        Company: 'Restaurante',
        Category: 'Reporte de Ventas',
        Keywords: 'ventas, análisis, reporte, restaurante, pos',
        Comments: 'Reporte generado automáticamente con análisis profesional y datos normalizados para análisis futuros'
      };

      // ===== GUARDAR ARCHIVO =====
      const fileName = `Informe_Ventas_Profesional_${fechaInicio.replace(/-/g, '')}_a_${fechaFin.replace(/-/g, '')}_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.xlsx`;
      
      XLSX.writeFile(wb, fileName);
      
      toast({
        title: "✅ Excel Profesional Generado",
        description: `Se exportaron ${ventas.length} ventas en formato profesional con ${wb.SheetNames.length} hojas de análisis`,
      });
      
    } catch (error) {
      console.error('❌ Error al exportar Excel profesional:', error);
      toast({
        title: "❌ Error en la Exportación",
        description: `Error: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      console.log('🔄 Iniciando generación de informe LaTeX profesional...');
      
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

      console.log('📋 Filtros para informe LaTeX:', filtros);

      const ventas = await exportVentasFiltradas(filtros);
      console.log('✅ Ventas obtenidas para informe LaTeX:', ventas.length);
      
      if (ventas.length === 0) {
        toast({
          title: "Sin datos",
          description: "No hay ventas para el período seleccionado",
          variant: "destructive",
        });
        return;
      }

      // ===== ANÁLISIS ESTADÍSTICO AVANZADO =====
      const totalVentas = ventas.length;
      const totalIngresos = ventas.reduce((sum, v) => sum + parseFloat(v.total || 0), 0);
      const promedioVenta = totalIngresos / totalVentas;
      const ventasArray = ventas.map(v => parseFloat(v.total || 0));
      
      // Estadísticas descriptivas avanzadas
      const ventaMaxima = Math.max(...ventasArray);
      const ventaMinima = Math.min(...ventasArray);
      const mediana = ventasArray.sort((a, b) => a - b)[Math.floor(ventasArray.length / 2)];
      
      // Desviación estándar
      const varianza = ventasArray.reduce((sum, val) => sum + Math.pow(val - promedioVenta, 2), 0) / totalVentas;
      const desviacionEstandar = Math.sqrt(varianza);
      
      // Coeficiente de variación
      const coeficienteVariacion = (desviacionEstandar / promedioVenta) * 100;
      
      // Análisis de distribución
      const ventasOrdenadas = [...ventasArray].sort((a, b) => a - b);
      const q1 = ventasOrdenadas[Math.floor(totalVentas * 0.25)];
      const q3 = ventasOrdenadas[Math.floor(totalVentas * 0.75)];
      const rangoIntercuartil = q3 - q1;
      
      // Análisis temporal avanzado
      const ventasPorDia = {};
      const ventasPorHora = {};
      const ventasPorDiaSemana = {};
      
      ventas.forEach(venta => {
        const fecha = new Date(venta.timestamp);
        const dia = fecha.toLocaleDateString('es-ES');
        const hora = fecha.getHours();
        const diaSemana = fecha.toLocaleDateString('es-ES', { weekday: 'long' });
        
        // Ventas por día
        if (!ventasPorDia[dia]) ventasPorDia[dia] = { total: 0, ventas: 0 };
        ventasPorDia[dia].total += parseFloat(venta.total || 0);
        ventasPorDia[dia].ventas += 1;
        
        // Ventas por hora
        if (!ventasPorHora[hora]) ventasPorHora[hora] = { total: 0, ventas: 0 };
        ventasPorHora[hora].total += parseFloat(venta.total || 0);
        ventasPorHora[hora].ventas += 1;
        
        // Ventas por día de la semana
        if (!ventasPorDiaSemana[diaSemana]) ventasPorDiaSemana[diaSemana] = { total: 0, ventas: 0 };
        ventasPorDiaSemana[diaSemana].total += parseFloat(venta.total || 0);
        ventasPorDiaSemana[diaSemana].ventas += 1;
      });
      
      // Análisis de métodos de pago con estadísticas
      const metodosPago = {};
      ventas.forEach(venta => {
        const metodo = venta.paymentmethod || venta.paymentMethod || venta.metodo_pago || 'No especificado';
        if (!metodosPago[metodo]) metodosPago[metodo] = { total: 0, ventas: 0, promedio: 0 };
        metodosPago[metodo].total += parseFloat(venta.total || 0);
        metodosPago[metodo].ventas += 1;
      });
      
      // Calcular promedios por método de pago
      Object.keys(metodosPago).forEach(metodo => {
        metodosPago[metodo].promedio = metodosPago[metodo].total / metodosPago[metodo].ventas;
      });
      
      // Análisis de cajeros con métricas de rendimiento
      const cajeros = {};
      ventas.forEach(venta => {
        const cajero = venta.cashier || venta.cajero || 'No especificado';
        if (!cajeros[cajero]) cajeros[cajero] = { total: 0, ventas: 0, promedio: 0, productos: 0 };
        cajeros[cajero].total += parseFloat(venta.total || 0);
        cajeros[cajero].ventas += 1;
        cajeros[cajero].productos += (venta.items || []).reduce((sum, item) => sum + (item.quantity || 0), 0);
      });
      
      // Calcular métricas por cajero
      Object.keys(cajeros).forEach(cajero => {
        cajeros[cajero].promedio = cajeros[cajero].total / cajeros[cajero].ventas;
        cajeros[cajero].productosPorVenta = cajeros[cajero].productos / cajeros[cajero].ventas;
      });
      
      // Análisis de productos con estadísticas
      const productos = {};
      ventas.forEach(venta => {
        (venta.items || []).forEach(item => {
          const nombre = item.name || item.nombre_producto || 'Producto desconocido';
          if (!productos[nombre]) productos[nombre] = { cantidad: 0, total: 0, ventas: 0 };
          productos[nombre].cantidad += item.quantity || 0;
          productos[nombre].total += (item.quantity || 0) * (item.price || item.precio || 0);
          productos[nombre].ventas += 1;
        });
      });
      
      // Top productos por rendimiento
      const topProductos = Object.entries(productos)
        .sort(([,a], [,b]) => b.total - a.total)
        .slice(0, 10);
      
      // ===== GENERAR LATEX =====
      const latexContent = generateLaTeXReport({
        fechaInicio: fechaInicioPdf,
        fechaFin: fechaFinPdf,
        totalVentas,
        totalIngresos,
        promedioVenta,
        ventaMaxima,
        ventaMinima,
        mediana,
        desviacionEstandar,
        coeficienteVariacion,
        q1,
        q3,
        rangoIntercuartil,
        ventasPorDia,
        ventasPorHora,
        ventasPorDiaSemana,
        metodosPago,
        cajeros,
        topProductos,
        ventas: ventas.slice(0, 50) // Solo las primeras 50 para el análisis
      });
      
      // ===== GENERAR PDF DIRECTO CON JSPDF =====
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF('p', 'mm', 'a4');
      
      // Configuración de página
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      const margin = 25;
      const contentWidth = pageWidth - (2 * margin) - 15; // Reducir 15mm para evitar desbordamiento
      
      // ===== PÁGINA 1: PORTADA EJECUTIVA =====
      
      // Fondo de portada (ajustado a la hoja)
      doc.setFillColor(30, 58, 138); // Azul corporativo
      doc.rect(0, 0, pageWidth, pageHeight, 'F');
      
      // Logo/Emblema (círculo decorativo centrado)
      doc.setFillColor(255, 255, 255);
      doc.circle(pageWidth / 2, 70, 25, 'F');
      
      // Título principal (ajustado)
      doc.setFontSize(28);
      doc.setTextColor(255, 255, 255);
      doc.text('INFORME DE VENTAS', pageWidth / 2, 110, { align: 'center' });
      
      // Subtítulo
      doc.setFontSize(16);
      doc.setTextColor(219, 234, 254);
      doc.text('Análisis Estadístico y Reporte Ejecutivo', pageWidth / 2, 130, { align: 'center' });
      
      // Información del período
      doc.setFontSize(12);
      doc.setTextColor(255, 255, 255);
      doc.text(`Período: ${fechaInicioPdf} a ${fechaFinPdf}`, pageWidth / 2, 160, { align: 'center' });
      doc.text(`Generado: ${new Date().toLocaleDateString('es-ES')}`, pageWidth / 2, 175, { align: 'center' });
      
      // Métricas destacadas en cajas (ajustadas)
      const metricBoxes = [
        { label: 'TOTAL VENTAS', value: totalVentas.toString(), x: margin + 10, y: 200 },
        { label: 'INGRESOS TOTALES', value: `Bs ${totalIngresos.toFixed(2)}`, x: margin + 70, y: 200 },
        { label: 'PROMEDIO', value: `Bs ${promedioVenta.toFixed(2)}`, x: margin + 130, y: 200 }
      ];
      
      metricBoxes.forEach(box => {
        // Fondo de la caja
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(box.x, box.y, 50, 20, 3, 3, 'F');
        
        // Borde
        doc.setDrawColor(59, 130, 246);
        doc.setLineWidth(0.5);
        doc.roundedRect(box.x, box.y, 50, 20, 3, 3, 'D');
        
        // Texto
        doc.setFontSize(8);
        doc.setTextColor(30, 58, 138);
        doc.text(box.label, box.x + 25, box.y + 6, { align: 'center' });
        
        doc.setFontSize(9);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(30, 58, 138);
        doc.text(box.value, box.x + 25, box.y + 14, { align: 'center' });
      });
      
      // Pie de página
      doc.setFontSize(10);
      doc.setTextColor(219, 234, 254);
      doc.text('Sistema POS Profesional - Informe Ejecutivo', pageWidth / 2, pageHeight - 20, { align: 'center' });
      
      // ===== PÁGINA 2: RESUMEN EJECUTIVO =====
      doc.addPage();
      
      // Encabezado de página
      doc.setFillColor(30, 58, 138);
      doc.rect(0, 0, pageWidth, 25, 'F');
      
      doc.setFontSize(16);
      doc.setTextColor(255, 255, 255);
      doc.text('RESUMEN EJECUTIVO', pageWidth / 2, 15, { align: 'center' });
      
      // Contenido narrativo
      let yPosition = 45;
      
      // Título de sección
      doc.setFontSize(14);
      doc.setTextColor(30, 58, 138);
      doc.setFont(undefined, 'bold');
      doc.text('VISIÓN GENERAL DEL PERÍODO', margin, yPosition);
      yPosition += 20;
      
      // Párrafo narrativo
      doc.setFontSize(11);
      doc.setTextColor(51, 65, 85);
      doc.setFont(undefined, 'normal');
      
      const introText = `Durante el período analizado, el sistema procesó un total de ${totalVentas} transacciones comerciales, generando ingresos totales de Bs ${totalIngresos.toFixed(2)}. El rendimiento promedio por venta se estableció en Bs ${promedioVenta.toFixed(2)}, demostrando la capacidad del negocio para mantener una base de clientes consistente.`;
      
      // Dividir texto en líneas que quepan en la página
      const introLines = doc.splitTextToSize(introText, contentWidth);
      doc.text(introLines, margin, yPosition);
      yPosition += introLines.length * 7 + 15;
      
      // Métricas clave en formato narrativo
      doc.setFontSize(14);
      doc.setTextColor(30, 58, 138);
      doc.setFont(undefined, 'bold');
      doc.text('MÉTRICAS CLAVE DE RENDIMIENTO', margin, yPosition);
      yPosition += 20;
      
      doc.setFontSize(11);
      doc.setTextColor(51, 65, 85);
      doc.setFont(undefined, 'normal');
      
      const metricasText = [
        `• Volumen de Transacciones: ${totalVentas} ventas procesadas exitosamente`,
        `• Ingresos Generados: Bs ${totalIngresos.toFixed(2)} en ingresos totales`,
        `• Valor Promedio: Bs ${promedioVenta.toFixed(2)} por transacción`,
        `• Rango de Ventas: Desde Bs ${ventaMinima.toFixed(2)} hasta Bs ${ventaMaxima.toFixed(2)}`,
        `• Consistencia: ${coeficienteVariacion < 50 ? 'Baja variabilidad' : 'Alta variabilidad'} en los montos de venta`
      ];
      
      metricasText.forEach(text => {
        doc.text(text, margin, yPosition);
        yPosition += 12;
      });
      
      // ===== PÁGINA 3: ANÁLISIS ESTADÍSTICO PROFUNDO =====
      doc.addPage();
      
      // Encabezado
      doc.setFillColor(30, 58, 138);
      doc.rect(0, 0, pageWidth, 25, 'F');
      
      doc.setFontSize(16);
      doc.setTextColor(255, 255, 255);
      doc.text('ANÁLISIS ESTADÍSTICO PROFUNDO', pageWidth / 2, 15, { align: 'center' });
      
      yPosition = 45;
      
      // Título de sección
      doc.setFontSize(14);
      doc.setTextColor(30, 58, 138);
      doc.setFont(undefined, 'bold');
      doc.text('COMPRENSIÓN DE LA DISTRIBUCIÓN DE VENTAS', margin, yPosition);
      yPosition += 20;
      
      // Análisis narrativo de estadísticas
      doc.setFontSize(11);
      doc.setTextColor(51, 65, 85);
      doc.setFont(undefined, 'normal');
      
      const distribucionText = `El análisis estadístico revela que las ventas siguen una distribución ${Math.abs(promedioVenta - mediana) > desviacionEstandar * 0.5 ? 'asimétrica' : 'relativamente simétrica'}, con una mediana de Bs ${mediana.toFixed(2)} que se compara con la media de Bs ${promedioVenta.toFixed(2)}. La desviación estándar de Bs ${desviacionEstandar.toFixed(2)} indica la variabilidad inherente en el comportamiento de compra de los clientes.`;
      
      const distribucionLines = doc.splitTextToSize(distribucionText, contentWidth);
      doc.text(distribucionLines, margin, yPosition);
      yPosition += distribucionLines.length * 7 + 15;
      
      // Interpretación del coeficiente de variación
      doc.setFontSize(14);
      doc.setTextColor(30, 58, 138);
      doc.setFont(undefined, 'bold');
      doc.text('ANÁLISIS DE VARIABILIDAD', margin, yPosition);
      yPosition += 20;
      
      doc.setFontSize(11);
      doc.setTextColor(51, 65, 85);
      doc.setFont(undefined, 'normal');
      
      const variabilidadText = `El coeficiente de variación del ${coeficienteVariacion.toFixed(2)}% ${coeficienteVariacion > 50 ? 'indica una alta variabilidad en los montos de venta, sugiriendo que el negocio atiende a segmentos de clientes muy diversos con patrones de consumo significativamente diferentes. Esta diversidad puede representar tanto oportunidades de segmentación como desafíos en la planificación de inventario.' : 'sugiere una variabilidad moderada en las ventas, indicando un comportamiento de compra relativamente consistente entre los clientes. Esta estabilidad facilita la planificación operativa y la gestión de inventario.'}`;
      
      const variabilidadLines = doc.splitTextToSize(variabilidadText, contentWidth);
      doc.text(variabilidadLines, margin, yPosition);
      yPosition += variabilidadLines.length * 7 + 15;
      
      // Análisis de cuartiles
      doc.setFontSize(14);
      doc.setTextColor(30, 58, 138);
      doc.setFont(undefined, 'bold');
      doc.text('ANÁLISIS DE CUARTILES Y DISTRIBUCIÓN', margin, yPosition);
      yPosition += 20;
      
      doc.setFontSize(11);
      doc.setTextColor(51, 65, 85);
      doc.setFont(undefined, 'normal');
      
      const cuartilesText = `El análisis de cuartiles revela que el 25% de las ventas más bajas están por debajo de Bs ${q1.toFixed(2)}, mientras que el 75% de las ventas más altas están por encima de Bs ${q3.toFixed(2)}. El rango intercuartil de Bs ${rangoIntercuartil.toFixed(2)} representa el 50% central de las transacciones, proporcionando una medida robusta de la dispersión de las ventas que no se ve afectada por valores extremos.`;
      
      const cuartilesLines = doc.splitTextToSize(cuartilesText, contentWidth);
      doc.text(cuartilesLines, margin, yPosition);
      
      // ===== PÁGINA 4: ANÁLISIS TEMPORAL NARRATIVO =====
      doc.addPage();
      
      // Encabezado
      doc.setFillColor(30, 58, 138);
      doc.rect(0, 0, pageWidth, 25, 'F');
      
      doc.setFontSize(16);
      doc.setTextColor(255, 255, 255);
      doc.text('ANÁLISIS TEMPORAL Y PATRONES ESTACIONALES', pageWidth / 2, 15, { align: 'center' });
      
      yPosition = 45;
      
      // Análisis por día de la semana
      doc.setFontSize(14);
      doc.setTextColor(30, 58, 138);
      doc.setFont(undefined, 'bold');
      doc.text('PATRONES POR DÍA DE LA SEMANA', margin, yPosition);
      yPosition += 20;
      
      doc.setFontSize(11);
      doc.setTextColor(51, 65, 85);
      doc.setFont(undefined, 'normal');
      
      // Encontrar el día con más ventas
      const diaMasVentas = Object.entries(ventasPorDiaSemana).reduce((a, b) => a[1].ventas > b[1].ventas ? a : b);
      const diaMenosVentas = Object.entries(ventasPorDiaSemana).reduce((a, b) => a[1].ventas < b[1].ventas ? a : b);
      
      const patronesDiaText = `El análisis de patrones por día de la semana revela que ${diaMasVentas[0]} emerge como el día de mayor actividad comercial, con ${diaMasVentas[1].ventas} transacciones y un volumen de Bs ${diaMasVentas[1].total.toFixed(2)}. En contraste, ${diaMenosVentas[0]} presenta la menor actividad, con ${diaMenosVentas[1].ventas} ventas por un total de Bs ${diaMenosVentas[1].total.toFixed(2)}. Esta variación sugiere patrones de comportamiento del consumidor que pueden ser aprovechados para optimizar horarios de personal y promociones.`;
      
      const patronesDiaLines = doc.splitTextToSize(patronesDiaText, contentWidth);
      doc.text(patronesDiaLines, margin, yPosition);
      yPosition += patronesDiaLines.length * 7 + 15;
      
      // Análisis por hora del día
      doc.setFontSize(14);
      doc.setTextColor(30, 58, 138);
      doc.setFont(undefined, 'bold');
      doc.text('ANÁLISIS DE PUNTOS PICO POR HORA', margin, yPosition);
      yPosition += 20;
      
      doc.setFontSize(11);
      doc.setTextColor(51, 65, 85);
      doc.setFont(undefined, 'normal');
      
      // Encontrar la hora con más ventas
      const horaMasVentas = Object.entries(ventasPorHora).reduce((a, b) => a[1].ventas > b[1].ventas ? a : b);
      
      const patronesHoraText = `El análisis por hora del día identifica que las ${horaMasVentas[0]}:00 horas representan el pico de actividad comercial, con ${horaMasVentas[1].ventas} transacciones y un volumen de Bs ${horaMasVentas[1].total.toFixed(2)}. Este patrón temporal sugiere que los clientes tienden a concentrar sus visitas en horarios específicos, lo que puede ser aprovechado para optimizar la asignación de personal y mejorar la experiencia del cliente durante estos períodos de alta demanda.`;
      
      const patronesHoraLines = doc.splitTextToSize(patronesHoraText, contentWidth);
      doc.text(patronesHoraLines, margin, yPosition);
      
      // ===== PÁGINA 5: ANÁLISIS DE MÉTODOS DE PAGO =====
      doc.addPage();
      
      // Encabezado
      doc.setFillColor(30, 58, 138);
      doc.rect(0, 0, pageWidth, 25, 'F');
      
      doc.setFontSize(16);
      doc.setTextColor(255, 255, 255);
      doc.text('ANÁLISIS DE MÉTODOS DE PAGO Y COMPORTAMIENTO DEL CLIENTE', pageWidth / 2, 15, { align: 'center' });
      
      yPosition = 45;
      
      // Análisis narrativo de métodos de pago
      doc.setFontSize(14);
      doc.setTextColor(30, 58, 138);
      doc.setFont(undefined, 'bold');
      doc.text('PREFERENCIAS DE PAGO Y SU IMPACTO', margin, yPosition);
      yPosition += 20;
      
      doc.setFontSize(11);
      doc.setTextColor(51, 65, 85);
      doc.setFont(undefined, 'normal');
      
      // Encontrar el método más popular
      const metodoMasPopular = Object.entries(metodosPago).reduce((a, b) => a[1].ventas > b[1].ventas ? a : b);
      const porcentajeMetodoPopular = ((metodoMasPopular[1].total / totalIngresos) * 100).toFixed(1);
      
      const metodosPagoText = `El análisis de métodos de pago revela que ${metodoMasPopular[0]} es la opción preferida por los clientes, representando ${metodoMasPopular[1].ventas} transacciones (${porcentajeMetodoPopular}% del total de ingresos) y generando Bs ${metodoMasPopular[1].total.toFixed(2)}. Esta preferencia sugiere que los clientes valoran la conveniencia y seguridad que ofrece este método de pago, lo que puede ser aprovechado para optimizar la experiencia de transacción y reducir tiempos de espera.`;
      
      const metodosPagoLines = doc.splitTextToSize(metodosPagoText, contentWidth);
      doc.text(metodosPagoLines, margin, yPosition);
      yPosition += metodosPagoLines.length * 7 + 15;
      
      // Análisis de valor promedio por método
      doc.setFontSize(14);
      doc.setTextColor(30, 58, 138);
      doc.setFont(undefined, 'bold');
      doc.text('VALOR PROMEDIO POR MÉTODO DE PAGO', margin, yPosition);
      yPosition += 20;
      
      doc.setFontSize(11);
      doc.setTextColor(51, 65, 85);
      doc.setFont(undefined, 'normal');
      
      // Encontrar el método con mayor valor promedio
      const metodoMayorPromedio = Object.entries(metodosPago).reduce((a, b) => a[1].promedio > b[1].promedio ? a : b);
      
      const valorPromedioText = `El análisis del valor promedio por transacción según el método de pago revela que ${metodoMayorPromedio[0]} presenta el mayor ticket promedio con Bs ${metodoMayorPromedio[1].promedio.toFixed(2)}, ${metodoMayorPromedio[1].promedio > promedioVenta ? 'superando' : 'estando por debajo del'} promedio general del negocio (Bs ${promedioVenta.toFixed(2)}). Esta información es valiosa para diseñar estrategias de promoción y optimizar la mezcla de productos ofrecidos según el método de pago preferido.`;
      
      const valorPromedioLines = doc.splitTextToSize(valorPromedioText, contentWidth);
      doc.text(valorPromedioLines, margin, yPosition);
      
      // ===== PÁGINA 6: ANÁLISIS DE PRODUCTOS =====
      doc.addPage();
      
      // Encabezado
      doc.setFillColor(30, 58, 138);
      doc.rect(0, 0, pageWidth, 25, 'F');
      
      doc.setFontSize(16);
      doc.setTextColor(255, 255, 255);
      doc.text('ANÁLISIS DE PRODUCTOS Y MIX DE VENTAS', pageWidth / 2, 15, { align: 'center' });
      
      yPosition = 45;
      
      // Análisis del top de productos
      doc.setFontSize(14);
      doc.setTextColor(30, 58, 138);
      doc.setFont(undefined, 'bold');
      doc.text('PRODUCTOS DE ALTO RENDIMIENTO', margin, yPosition);
      yPosition += 20;
      
      doc.setFontSize(11);
      doc.setTextColor(51, 65, 85);
      doc.setFont(undefined, 'normal');
      
      const topProducto = topProductos[0];
      const segundoProducto = topProductos[1];
      
      const productosTopText = `El análisis de rendimiento por producto identifica que "${topProducto[0]}" emerge como el producto estrella del período, generando Bs ${topProducto[1].total.toFixed(2)} en ventas a través de ${topProducto[1].cantidad} unidades vendidas en ${topProducto[1].ventas} transacciones. En segundo lugar, "${segundoProducto[0]}" contribuye con Bs ${segundoProducto[1].total.toFixed(2)} en ventas, demostrando la diversidad del catálogo de productos.`;
      
      const productosTopLines = doc.splitTextToSize(productosTopText, contentWidth);
      doc.text(productosTopLines, margin, yPosition);
      yPosition += productosTopLines.length * 7 + 15;
      
      // Análisis de la mezcla de productos
      doc.setFontSize(14);
      doc.setTextColor(30, 58, 138);
      doc.setFont(undefined, 'bold');
      doc.text('DIVERSIFICACIÓN Y BALANCE DEL CATÁLOGO', margin, yPosition);
      yPosition += 20;
      
      doc.setFontSize(11);
      doc.setTextColor(51, 65, 85);
      doc.setFont(undefined, 'normal');
      
      const totalProductosVendidos = topProductos.reduce((sum, [, info]) => sum + info.cantidad, 0);
      const porcentajeTop10 = ((topProductos.reduce((sum, [, info]) => sum + info.total, 0) / totalIngresos) * 100).toFixed(1);
      
      const diversificacionText = `La diversificación del catálogo se refleja en que los 10 productos principales representan ${porcentajeTop10}% de los ingresos totales, con ${totalProductosVendidos} unidades vendidas. Esta concentración sugiere que el negocio tiene un portafolio de productos bien definido, pero también presenta oportunidades para expandir la oferta y reducir la dependencia de productos específicos.`;
      
      const diversificacionLines = doc.splitTextToSize(diversificacionText, contentWidth);
      doc.text(diversificacionLines, margin, yPosition);
      
      // ===== PÁGINA 7: CONCLUSIONES Y RECOMENDACIONES =====
      doc.addPage();
      
      // Encabezado
      doc.setFillColor(30, 58, 138);
      doc.rect(0, 0, pageWidth, 25, 'F');
      
      doc.setFontSize(16);
      doc.setTextColor(255, 255, 255);
      doc.text('CONCLUSIONES Y RECOMENDACIONES ESTRATÉGICAS', pageWidth / 2, 15, { align: 'center' });
      
      yPosition = 45;
      
      // Insights principales
      doc.setFontSize(14);
      doc.setTextColor(30, 58, 138);
      doc.setFont(undefined, 'bold');
      doc.text('INSIGHTS PRINCIPALES DEL ANÁLISIS', margin, yPosition);
      yPosition += 20;
      
      doc.setFontSize(11);
      doc.setTextColor(51, 65, 85);
      doc.setFont(undefined, 'normal');
      
      const insightsText = [
        `• El negocio mantiene un volumen consistente de ${totalVentas} transacciones con un valor promedio estable de Bs ${promedioVenta.toFixed(2)}`,
        `• La variabilidad en las ventas (${coeficienteVariacion.toFixed(2)}%) ${coeficienteVariacion > 50 ? 'sugiere oportunidades de segmentación de clientes' : 'indica estabilidad operativa'}`,
        `• Los patrones temporales muestran picos claros en ${diaMasVentas[0]} y a las ${horaMasVentas[0]}:00 horas`,
        `• ${metodoMasPopular[0]} domina como método de pago preferido, representando ${porcentajeMetodoPopular}% de los ingresos`,
        `• El producto "${topProducto[0]}" lidera el rendimiento con Bs ${topProducto[1].total.toFixed(2)} en ventas`
      ];
      
      insightsText.forEach(text => {
        // Dividir texto en líneas que quepan en la página
        const lines = doc.splitTextToSize(text, contentWidth);
        doc.text(lines, margin, yPosition);
        yPosition += lines.length * 7 + 8;
      });
      
      yPosition += 20;
      
      // Recomendaciones estratégicas
      doc.setFontSize(14);
      doc.setTextColor(30, 58, 138);
      doc.setFont(undefined, 'bold');
      doc.text('RECOMENDACIONES ESTRATÉGICAS PRIORITARIAS', margin, yPosition);
      yPosition += 20;
      
      doc.setFontSize(11);
      doc.setTextColor(51, 65, 85);
      doc.setFont(undefined, 'normal');
      
      const recomendacionesText = [
        `1. OPTIMIZACIÓN DE HORARIOS: Ajustar la asignación de personal para maximizar la cobertura durante los picos de ${diaMasVentas[0]} y las ${horaMasVentas[0]}:00 horas`,
        `2. ESTRATEGIA DE PRODUCTOS: Desarrollar promociones y paquetes alrededor de "${topProducto[0]}" para capitalizar su popularidad`,
        `3. EXPERIENCIA DE PAGO: Optimizar el proceso de ${metodoMasPopular[0]} para reducir tiempos de transacción y mejorar la satisfacción del cliente`,
        `4. SEGMENTACIÓN DE CLIENTES: Implementar estrategias diferenciadas basadas en los patrones de variabilidad identificados`,
        `5. EXPANSIÓN DE CATÁLOGO: Desarrollar productos complementarios a los top performers para diversificar la oferta`
      ];
      
      recomendacionesText.forEach(text => {
        // Dividir texto en líneas que quepan en la página con margen adecuado
        const lines = doc.splitTextToSize(text, contentWidth);
        doc.text(lines, margin, yPosition);
        yPosition += lines.length * 7 + 8;
      });
      
      yPosition += 20;
      
      // Próximos pasos
      doc.setFontSize(14);
      doc.setTextColor(30, 58, 138);
      doc.setFont(undefined, 'bold');
      doc.text('PRÓXIMOS PASOS RECOMENDADOS', margin, yPosition);
      yPosition += 20;
      
      doc.setFontSize(11);
      doc.setTextColor(51, 65, 85);
      doc.setFont(undefined, 'normal');
      
      const proximosPasosText = [
        `• Implementar monitoreo continuo de las métricas clave identificadas`,
        `• Establecer alertas para desviaciones significativas en patrones de venta`,
        `• Programar revisión mensual de este análisis para identificar tendencias`,
        `• Considerar análisis de correlación con variables externas (clima, eventos, etc.)`,
        `• Desarrollar dashboard ejecutivo para seguimiento en tiempo real`
      ];
      
      proximosPasosText.forEach(text => {
        // Dividir texto en líneas que quepan en la página
        const lines = doc.splitTextToSize(text, contentWidth);
        doc.text(lines, margin, yPosition);
        yPosition += lines.length * 7 + 8;
      });
      
      // Verificar si hay suficiente espacio para la siguiente sección
      if (yPosition > pageHeight - 80) {
        doc.addPage();
        yPosition = 45;
        
        // Encabezado de la nueva página
        doc.setFillColor(30, 58, 138);
        doc.rect(0, 0, pageWidth, 25, 'F');
        
        doc.setFontSize(16);
        doc.setTextColor(255, 255, 255);
        doc.text('IMPLEMENTACIÓN Y SEGUIMIENTO', pageWidth / 2, 15, { align: 'center' });
        
        yPosition = 45;
      }
      
      // Añadir información adicional para completar la página
      yPosition += 20;
      
      doc.setFontSize(14);
      doc.setTextColor(30, 58, 138);
      doc.setFont(undefined, 'bold');
      doc.text('IMPLEMENTACIÓN Y SEGUIMIENTO', margin, yPosition);
      yPosition += 20;
      
      doc.setFontSize(11);
      doc.setTextColor(51, 65, 85);
      doc.setFont(undefined, 'normal');
      
      const implementacionText = [
        `• Asignar responsables para cada recomendación estratégica`,
        `• Establecer métricas de seguimiento y KPIs de éxito`,
        `• Programar revisiones quincenales del progreso`,
        `• Documentar lecciones aprendidas y ajustes necesarios`,
        `• Compartir resultados con el equipo de gestión`
      ];
      
      implementacionText.forEach(text => {
        // Dividir texto en líneas que quepan en la página
        const lines = doc.splitTextToSize(text, contentWidth);
        doc.text(lines, margin, yPosition);
        yPosition += lines.length * 7 + 8;
      });
      
      // Añadir sección final para completar el informe
      yPosition += 20;
      
      doc.setFontSize(14);
      doc.setTextColor(30, 58, 138);
      doc.setFont(undefined, 'bold');
      doc.text('CIERRE Y PRÓXIMAS ACCIONES', margin, yPosition);
      yPosition += 20;
      
      doc.setFontSize(11);
      doc.setTextColor(51, 65, 85);
      doc.setFont(undefined, 'normal');
      
      const cierreText = [
        `• Este informe proporciona una base sólida para la toma de decisiones estratégicas`,
        `• Las recomendaciones deben ser implementadas de manera gradual y medible`,
        `• Se recomienda revisar y actualizar este análisis cada mes`,
        `• Mantener comunicación constante con el equipo sobre el progreso`,
        `• Celebrar los éxitos y aprender de los desafíos encontrados`
      ];
      
      cierreText.forEach(text => {
        // Dividir texto en líneas que quepan en la página
        const lines = doc.splitTextToSize(text, contentWidth);
        doc.text(lines, margin, yPosition);
        yPosition += lines.length * 7 + 8;
      });
      
      // ===== GUARDAR PDF =====
      const fileName = `Informe_Ventas_Profesional_${fechaInicioPdf.replace(/-/g, '')}_a_${fechaFinPdf.replace(/-/g, '')}.pdf`;
      doc.save(fileName);
      
      toast({
        title: "✅ PDF Profesional Generado",
        description: `Informe ejecutivo narrativo con ${doc.getNumberOfPages()} páginas creado exitosamente`,
      });
      
    } catch (error) {
      console.error('❌ Error al generar informe LaTeX:', error);
      toast({
        title: "❌ Error en la Generación LaTeX",
        description: `Error: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Función para generar reporte LaTeX profesional
  const generateLaTeXReport = (data: any) => {
    return `\\documentclass[12pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[spanish]{babel}
\\usepackage{geometry}
\\usepackage{graphicx}
\\usepackage{booktabs}
\\usepackage{longtable}
\\usepackage{array}
\\usepackage{parskip}
\\usepackage{enumitem}
\\usepackage{color}
\\usepackage{xcolor}
\\usepackage{fancyhdr}
\\usepackage{titlesec}
\\usepackage{float}
\\usepackage{amsmath}
\\usepackage{amssymb}

\\geometry{margin=2.5cm}
\\setlength{\\parindent}{0pt}

% Configuración de colores corporativos
\\definecolor{corporateBlue}{RGB}{30, 58, 138}
\\definecolor{lightBlue}{RGB}{59, 130, 246}
\\definecolor{darkGray}{RGB}{51, 65, 85}

% Configuración de encabezados
\\titleformat{\\section}{\\Large\\bfseries\\color{corporateBlue}}{\\thesection}{1em}{}
\\titleformat{\\subsection}{\\large\\bfseries\\color{lightBlue}}{\\thesubsection}{1em}{}

% Configuración de página
\\pagestyle{fancy}
\\fancyhf{}
\\fancyhead[L]{\\color{corporateBlue}\\textbf{Informe de Ventas - Análisis Estadístico}}
\\fancyhead[R]{\\color{corporateBlue}\\textbf{Página \\thepage}}
\\renewcommand{\\headrulewidth}{0.4pt}
\\renewcommand{\\headrule}{\\hbox to\\headwidth{\\color{corporateBlue}\\leaders\\hrule height \\headrulewidth\\hfill}}

\\begin{document}

% Portada
\\begin{titlepage}
\\centering
\\vspace*{2cm}
{\\Huge\\color{corporateBlue}\\textbf{INFORME DE VENTAS}}\\\\[0.5cm]
{\\Large\\color{lightBlue}\\textbf{Análisis Estadístico y Reporte Ejecutivo}}\\\\[1cm]
{\\large\\textbf{Período: ${data.fechaInicio} a ${data.fechaFin}}}\\\\[0.5cm]
{\\large\\textbf{Fecha de Generación: ${new Date().toLocaleDateString('es-ES')}}}\\\\[2cm]

% Métricas destacadas en cajas
\\begin{center}
\\begin{tabular}{|c|c|c|}
\\hline
\\rowcolor{corporateBlue}\\color{white}\\textbf{Total Ventas} & \\color{white}\\textbf{Ingresos Totales} & \\color{white}\\textbf{Promedio por Venta} \\\\
\\hline
\\textbf{${data.totalVentas}} & \\textbf{Bs ${data.totalIngresos.toFixed(2)} } & \\textbf{Bs ${data.promedioVenta.toFixed(2)} } \\\\
\\hline
\\end{tabular}
\\end{center}

\\vfill
{\\large\\color{darkGray}\\textbf{Sistema POS Profesional - Informe Ejecutivo}}
\\end{titlepage}

\\newpage
\\tableofcontents
\\newpage

% Resumen Ejecutivo
\\section{Resumen Ejecutivo}
Este informe presenta un análisis estadístico completo y profesional de las ventas del período ${data.fechaInicio} a ${data.fechaFin}, proporcionando insights valiosos para la toma de decisiones estratégicas.

\\subsection{Métricas Clave de Negocio}
\\begin{itemize}[leftmargin=2em]
\\item \\textbf{Total de Transacciones:} ${data.totalVentas} ventas procesadas
\\item \\textbf{Ingresos Totales:} Bs ${data.totalIngresos.toFixed(2)}
\\item \\textbf{Promedio por Venta:} Bs ${data.promedioVenta.toFixed(2)}
\\item \\textbf{Venta Máxima:} Bs ${data.ventaMaxima.toFixed(2)}
\\item \\textbf{Venta Mínima:} Bs ${data.ventaMinima.toFixed(2)}
\\end{itemize}

% Análisis Estadístico Avanzado
\\section{Análisis Estadístico Avanzado}

\\subsection{Estadísticas Descriptivas}
\\begin{center}
\\begin{tabular}{|l|c|}
\\hline
\\rowcolor{corporateBlue}\\color{white}\\textbf{Métrica} & \\color{white}\\textbf{Valor} \\\\
\\hline
Media & Bs ${data.promedioVenta.toFixed(2)} \\\\
\\hline
Mediana & Bs ${data.mediana.toFixed(2)} \\\\
\\hline
Desviación Estándar & Bs ${data.desviacionEstandar.toFixed(2)} \\\\
\\hline
Coeficiente de Variación & ${data.coeficienteVariacion.toFixed(2)}\\% \\\\
\\hline
Primer Cuartil (Q1) & Bs ${data.q1.toFixed(2)} \\\\
\\hline
Tercer Cuartil (Q3) & Bs ${data.q3.toFixed(2)} \\\\
\\hline
Rango Intercuartil & Bs ${data.rangoIntercuartil.toFixed(2)} \\\\
\\hline
\\end{tabular}
\\end{center}

\\subsection{Interpretación de Métricas}
\\begin{itemize}[leftmargin=2em]
\\item \\textbf{Coeficiente de Variación:} ${data.coeficienteVariacion.toFixed(2)}\\% indica ${data.coeficienteVariacion > 50 ? 'alta' : 'moderada'} variabilidad en las ventas
\\item \\textbf{Distribución:} La diferencia entre media y mediana sugiere ${Math.abs(data.promedioVenta - data.mediana) > data.desviacionEstandar * 0.5 ? 'asimetría' : 'distribución relativamente simétrica'}
\\item \\textbf{Consistencia:} El rango intercuartil representa el 50\\% central de las ventas
\\end{itemize}

% Análisis Temporal
\\section{Análisis Temporal y Estacionalidad}

\\subsection{Distribución por Día de la Semana}
\\begin{center}
\\begin{tabular}{|l|c|c|c|}
\\hline
\\rowcolor{corporateBlue}\\color{white}\\textbf{Día} & \\color{white}\\textbf{Ventas} & \\color{white}\\textbf{Total (Bs)} & \\color{white}\\textbf{Promedio} \\\\
\\hline
${Object.entries(data.ventasPorDiaSemana).map(([dia, info]: [string, any]) => 
  `${dia} & ${info.ventas} & Bs ${info.total.toFixed(2)} & Bs ${(info.total/info.ventas).toFixed(2)}`
).join(' \\\\\n')}
\\hline
\\end{tabular}
\\end{center}

\\subsection{Análisis por Hora del Día}
\\begin{center}
\\begin{tabular}{|l|c|c|c|}
\\hline
\\rowcolor{corporateBlue}\\color{white}\\textbf{Hora} & \\color{white}\\textbf{Ventas} & \\color{white}\\textbf{Total (Bs)} & \\color{white}\\textbf{Promedio} \\\\
\\hline
${Object.entries(data.ventasPorHora).sort(([a], [b]) => parseInt(a) - parseInt(b)).map(([hora, info]: [string, any]) => 
  `${hora}:00 & ${info.ventas} & Bs ${info.total.toFixed(2)} & Bs ${(info.total/info.ventas).toFixed(2)}`
).join(' \\\\\n')}
\\hline
\\end{tabular}
\\end{center}

% Análisis de Métodos de Pago
\\section{Análisis de Métodos de Pago}

\\subsection{Distribución y Rendimiento}
\\begin{center}
\\begin{tabular}{|l|c|c|c|c|}
\\hline
\\rowcolor{corporateBlue}\\color{white}\\textbf{Método} & \\color{white}\\textbf{Ventas} & \\color{white}\\textbf{Total (Bs)} & \\color{white}\\textbf{Promedio} & \\color{white}\\textbf{\\% del Total} \\\\
\\hline
${Object.entries(data.metodosPago).map(([metodo, info]: [string, any]) => {
  const porcentaje = ((info.total / data.totalIngresos) * 100).toFixed(1);
  return `${metodo} & ${info.ventas} & Bs ${info.total.toFixed(2)} & Bs ${info.promedio.toFixed(2)} & ${porcentaje}\\%`;
}).join(' \\\\\n')}
\\hline
\\end{tabular}
\\end{center}

% Análisis de Rendimiento por Cajero
\\section{Análisis de Rendimiento por Cajero}

\\subsection{Métricas de Productividad}
\\begin{center}
\\begin{tabular}{|l|c|c|c|c|}
\\hline
\\rowcolor{corporateBlue}\\color{white}\\textbf{Cajero} & \\color{white}\\textbf{Ventas} & \\color{white}\\textbf{Total (Bs)} & \\color{white}\\textbf{Promedio} & \\color{white}\\textbf{Productos/Venta} \\\\
\\hline
${Object.entries(data.cajeros).map(([cajero, info]: [string, any]) => 
  `${cajero} & ${info.ventas} & Bs ${info.total.toFixed(2)} & Bs ${info.promedio.toFixed(2)} & ${info.productosPorVenta.toFixed(1)}`
).join(' \\\\\n')}
\\hline
\\end{tabular}
\\end{center}

% Análisis de Productos
\\section{Análisis de Productos y Mix de Ventas}

\\subsection{Top 10 Productos por Rendimiento}
\\begin{center}
\\begin{tabular}{|l|c|c|c|c|}
\\hline
\\rowcolor{corporateBlue}\\color{white}\\textbf{Producto} & \\color{white}\\textbf{Cantidad} & \\color{white}\\textbf{Total (Bs)} & \\color{white}\\textbf{Ventas} & \\color{white}\\textbf{Rendimiento} \\\\
\\hline
${data.topProductos.map(([producto, info]: [string, any], index: number) => {
  const rendimiento = index < 3 ? '⭐⭐⭐' : index < 7 ? '⭐⭐' : '⭐';
  return `${producto} & ${info.cantidad} & Bs ${info.total.toFixed(2)} & ${info.ventas} & ${rendimiento}`;
}).join(' \\\\\n')}
\\hline
\\end{tabular}
\\end{center}

% Conclusiones y Recomendaciones
\\section{Conclusiones y Recomendaciones Estratégicas}

\\subsection{Insights Principales}
\\begin{itemize}[leftmargin=2em]
\\item \\textbf{Rendimiento General:} El sistema procesó ${data.totalVentas} transacciones con un promedio de Bs ${data.promedioVenta.toFixed(2)} por venta
\\item \\textbf{Consistencia:} ${data.coeficienteVariacion < 50 ? 'Baja variabilidad' : 'Alta variabilidad'} en los montos de venta sugiere ${data.coeficienteVariacion < 50 ? 'estabilidad' : 'oportunidades de optimización'}
\\item \\textbf{Distribución Temporal:} Se identificaron patrones claros en la distribución por día y hora
\\end{itemize}

\\subsection{Recomendaciones Estratégicas}
\\begin{enumerate}[leftmargin=2em]
\\item \\textbf{Optimización de Horarios:} Ajustar personal según los picos de venta identificados
\\item \\textbf{Capacitación:} Replicar las mejores prácticas de los cajeros más productivos
\\item \\textbf{Productos:} Focalizar promociones en los productos de mayor rendimiento
\\item \\textbf{Métodos de Pago:} Optimizar la experiencia del método de pago más utilizado
\\end{enumerate}

\\subsection{Próximos Pasos}
\\begin{itemize}[leftmargin=2em]
\\item Implementar monitoreo continuo de las métricas clave
\\item Establecer alertas para desviaciones significativas
\\item Programar revisión mensual de este análisis
\\item Considerar análisis de correlación con variables externas
\\end{itemize}

% Apéndice Técnico
\\section{Apéndice Técnico}

\\subsection{Metodología del Análisis}
Este informe utiliza métodos estadísticos estándar para el análisis de datos comerciales:
\\begin{itemize}[leftmargin=2em]
\\item \\textbf{Estadística Descriptiva:} Medidas de tendencia central y dispersión
\\item \\textbf{Análisis de Distribución:} Cuartiles y análisis de variabilidad
\\item \\textbf{Segmentación:} Análisis por múltiples dimensiones (tiempo, método de pago, cajero)
\\item \\textbf{Benchmarking:} Comparación de rendimiento entre diferentes segmentos
\\end{itemize}

\\subsection{Definiciones Técnicas}
\\begin{itemize}[leftmargin=2em]
\\item \\textbf{Coeficiente de Variación:} Medida de variabilidad relativa (CV = σ/μ × 100)
\\item \\textbf{Rango Intercuartil:} Diferencia entre Q3 y Q1, representa el 50\\% central
\\item \\textbf{Mediana:} Valor que divide la distribución en dos partes iguales
\\end{itemize}

\\vfill
\\begin{center}
\\color{darkGray}\\textbf{Informe generado automáticamente por el Sistema POS Profesional}\\\\
\\small{Análisis estadístico y reporte ejecutivo de nivel corporativo}
\\end{center}

\\end{document}`;
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
        <div className="flex flex-col sm:flex-row gap-2 border-b border-gray-200/50 bg-gradient-to-r from-gray-50/80 to-white/80 px-3 sm:px-6 pt-4 pb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveTab('historial')}
            className={`w-full sm:w-auto ${activeTab === 'historial' ? 'bg-blue-50 border-blue-200 text-blue-700' : ''}`}
          >
            <FileText className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Historial de Ventas</span>
            <span className="sm:hidden">Historial</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveTab('avanzadas')}
            className={`w-full sm:w-auto ${activeTab === 'avanzadas' ? 'bg-blue-50 border-blue-200 text-blue-700' : ''}`}
          >
            <Settings className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Funciones Avanzadas</span>
            <span className="sm:hidden">Avanzadas</span>
          </Button>
        </div>
      )}
      
      {activeTab === 'historial' && (
        <div className="flex-1 flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-6 border-b border-gray-200/50 bg-gradient-to-r from-gray-50/50 to-white/50 gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Historial de Ventas ({filteredSales.length})
              </h2>
              <p className="text-gray-600 text-sm mt-1 hidden sm:block">Gestiona y revisa todas las transacciones</p>
            </div>
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por ID, cajero o producto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full sm:w-80"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-auto p-3 sm:p-6">
            {mobileInfo.isMobile ? (
              // Vista móvil: Tarjetas en lugar de tabla
              <div className="space-y-4">
                {filteredSales.map((sale) => (
                  <Card key={sale.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="font-mono text-sm">
                              #{sale.id}
                            </Badge>
                            <Badge variant="success" className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
                              Bs{sale.total.toFixed(2)}
                            </Badge>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openInfoDialog(sale)}
                              className="lg:hidden p-1 h-6 w-6 hover:bg-blue-100 text-blue-600 hover:text-blue-700"
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">
                            <Calendar className="h-3 w-3 inline mr-1" />
                            {formatDate(sale.timestamp)}
                          </p>
                          <p className="text-sm text-gray-600 mb-1">
                            <Users className="h-3 w-3 inline mr-1" />
                            {sale.cashier}
                          </p>
                          <p className="text-sm text-gray-600 mb-1">
                            <Building className="h-3 w-3 inline mr-1" />
                            {sale.branch}
                          </p>
                          <p className="text-sm text-gray-600 mb-2">
                            <CreditCard className="h-3 w-3 inline mr-1" />
                            {sale.paymentMethod}
                          </p>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleShowDetails(sale)}
                            className="flex items-center gap-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
                          >
                            <Eye className="h-3 w-3" />
                            <span className="hidden sm:inline">Ver</span>
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteSale(sale.id)}
                            className="flex items-center gap-1"
                          >
                            <Trash2 className="h-3 w-3" />
                            <span className="hidden sm:inline">Eliminar</span>
                          </Button>
                        </div>
                      </div>
                      
                      <div className="border-t pt-3">
                        <div className="flex items-center gap-2 mb-2">
                          <CreditCard className="h-3 w-3 text-gray-500" />
                          <span className="text-xs text-gray-600">{sale.paymentMethod}</span>
                        </div>
                        <div className="text-xs text-gray-700">
                          <Package className="h-3 w-3 inline mr-1" />
                          {sale.items.length <= 2 
                            ? sale.items.map(item => `${item.name} x${item.quantity}`).join(', ')
                            : `${sale.items.slice(0, 2).map(item => `${item.name} x${item.quantity}`).join(', ')} +${sale.items.length - 2} más`
                          }
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              // Vista desktop: Tabla tradicional
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead className="hidden lg:table-cell">Fecha/Hora</TableHead>
                    <TableHead className="hidden lg:table-cell">Cajero</TableHead>
                    <TableHead className="hidden lg:table-cell">Sucursal</TableHead>
                    <TableHead className="hidden lg:table-cell">Total</TableHead>
                    <TableHead className="hidden lg:table-cell">Pago</TableHead>
                    <TableHead className="hidden lg:table-cell">Productos</TableHead>
                    <TableHead className="text-right hidden lg:table-cell">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="truncate">#{sale.id}</span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => openInfoDialog(sale)}
                                className="lg:hidden p-1 h-6 w-6 hover:bg-blue-100 text-blue-600 hover:text-blue-700"
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                            </div>
                            <div className="lg:hidden mt-1 space-y-1">
                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                <Calendar className="h-3 w-3" />
                                <span className="truncate">{formatDate(sale.timestamp)}</span>
                              </div>
                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                <Users className="h-3 w-3" />
                                <span className="truncate">{sale.cashier}</span>
                              </div>
                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                <Building className="h-3 w-3" />
                                <span className="truncate">{sale.branch}</span>
                              </div>
                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                <CreditCard className="h-3 w-3" />
                                <span className="truncate">{sale.paymentMethod}</span>
                              </div>
                              <Badge variant="success" className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs">
                                Bs{sale.total.toFixed(2)}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">{formatDate(sale.timestamp)}</TableCell>
                      <TableCell className="hidden lg:table-cell">{sale.cashier}</TableCell>
                      <TableCell className="hidden lg:table-cell">{sale.branch}</TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Badge variant="success" className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
                          Bs{sale.total.toFixed(2)}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">{sale.paymentMethod}</TableCell>
                      <TableCell className="max-w-xs hidden lg:table-cell">
                        <div className="text-sm text-gray-900">
                          {sale.items.length <= 2 
                            ? sale.items.map(item => `${item.name} x${item.quantity}`).join(' ')
                            : `${sale.items.slice(0, 2).map(item => `${item.name} x${item.quantity}`).join(' ')} +${sale.items.length - 2} más`
                          }
                        </div>
                      </TableCell>
                      <TableCell className="text-right hidden lg:table-cell">
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
            )}
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
        hasAdvancedSalesAccess ? (
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
        ) : (
          <ProfessionalRestrictionMessage />
        )
      )}

      {/* Modal de información de venta */}
      <Dialog open={isInfoDialogOpen} onOpenChange={setIsInfoDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Información de Venta
            </DialogTitle>
          </DialogHeader>
          {selectedSaleForInfo && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">ID de Venta</label>
                <p className="text-lg font-semibold text-gray-900">#{selectedSaleForInfo.id}</p>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Fecha y Hora</label>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <p className="text-sm text-gray-900">{formatDate(selectedSaleForInfo.timestamp)}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Cajero</label>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-gray-500" />
                  <p className="text-sm text-gray-900">{selectedSaleForInfo.cashier}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Sucursal</label>
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-gray-500" />
                  <p className="text-sm text-gray-900">{selectedSaleForInfo.branch}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Método de Pago</label>
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-gray-500" />
                  <p className="text-sm text-gray-900">{selectedSaleForInfo.paymentMethod}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Total</label>
                <Badge variant="success" className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
                  Bs{selectedSaleForInfo.total.toFixed(2)}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Productos</label>
                <div className="space-y-1">
                  {selectedSaleForInfo.items.map((item, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <Package className="h-3 w-3 text-gray-500" />
                      <span className="text-gray-900">{item.name} x{item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsInfoDialogOpen(false);
                setSelectedSaleForInfo(null);
              }}
              className="w-full sm:w-auto"
            >
              Cerrar
            </Button>
            {selectedSaleForInfo && (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsInfoDialogOpen(false);
                    handleShowDetails(selectedSaleForInfo);
                  }}
                  className="w-full sm:w-auto"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Ver Detalles
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setIsInfoDialogOpen(false);
                    handleDeleteSale(selectedSaleForInfo.id);
                  }}
                  className="w-full sm:w-auto"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
