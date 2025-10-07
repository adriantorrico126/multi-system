import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  Download, 
  FileSpreadsheet, 
  FileText, 
  File, 
  Database,
  BarChart3,
  TrendingUp,
  PieChart,
  Users,
  Calendar,
  Filter,
  Zap,
  Crown,
  Star,
  CheckCircle,
  Clock,
  AlertCircle,
  Eye
} from 'lucide-react';
import { exportAnalyticsData, ExportData, ExportOptions } from '@/utils/advancedExport';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface AdvancedExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ExportData;
  onExportComplete?: (result: any) => void;
}

export const AdvancedExportModal: React.FC<AdvancedExportModalProps> = ({
  isOpen,
  onClose,
  data,
  onExportComplete
}) => {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  
  // Estados para opciones de exportación
  const [formato, setFormato] = useState<'excel' | 'pdf' | 'csv' | 'json'>('excel');
  const [tipo, setTipo] = useState<'resumen' | 'detallado' | 'analitico' | 'completo'>('completo');
  const [incluirGraficos, setIncluirGraficos] = useState(true);
  const [incluirMetricas, setIncluirMetricas] = useState(true);
  const [incluirTendencias, setIncluirTendencias] = useState(true);
  const [incluirComparativas, setIncluirComparativas] = useState(false);
  
  // Filtros
  const [filtros, setFiltros] = useState({
    sucursales: [] as number[],
    vendedores: [] as string[],
    metodosPago: [] as string[],
    productos: [] as string[],
    rangoPrecios: { min: 0, max: 10000 }
  });

  // Opciones de filtros disponibles
  const [filtrosDisponibles, setFiltrosDisponibles] = useState({
    sucursales: [] as any[],
    vendedores: [] as any[],
    metodosPago: [] as string[],
    productos: [] as any[],
    categorias: [] as string[]
  });

  // Extraer opciones de filtros de los datos
  React.useEffect(() => {
    if (data) {
      const metodosPagoUnicos = [...new Set(data.ventas.map((v: any) => v.metodo_pago).filter(Boolean))];
      const vendedoresUnicos = [...new Set(data.ventas.map((v: any) => v.vendedor_nombre).filter(Boolean))];
      const categoriasUnicas = [...new Set(data.productos.map((p: any) => p.categoria).filter(Boolean))];
      
      setFiltrosDisponibles({
        sucursales: data.sucursales,
        vendedores: vendedoresUnicos.map(nombre => ({ id: nombre, nombre })),
        metodosPago: metodosPagoUnicos,
        productos: data.productos,
        categorias: categoriasUnicas
      });
    }
  }, [data]);

  const handleExport = async () => {
    setIsExporting(true);
    setExportProgress(0);
    
    try {
      // Simular progreso
      const progressInterval = setInterval(() => {
        setExportProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);
      
      const options: ExportOptions = {
        formato,
        tipo,
        incluirGraficos,
        incluirMetricas,
        incluirTendencias,
        incluirComparativas,
        filtros
      };
      
      const result = await exportAnalyticsData(data, options);
      
      clearInterval(progressInterval);
      setExportProgress(100);
      
      if (result.success) {
        toast({
          title: "✅ Exportación Exitosa",
          description: `${result.message} - ${result.filename}`,
          duration: 5000,
        });
        
        if (onExportComplete) {
          onExportComplete(result);
        }
        
        // Cerrar modal después de un breve delay
        setTimeout(() => {
          onClose();
          setIsExporting(false);
          setExportProgress(0);
        }, 1500);
      } else {
        toast({
          title: "❌ Error en Exportación",
          description: result.message,
          variant: "destructive",
        });
        setIsExporting(false);
        setExportProgress(0);
      }
      
    } catch (error: any) {
      console.error('Error en exportación:', error);
      toast({
        title: "❌ Error",
        description: error.message || 'Error desconocido en la exportación',
        variant: "destructive",
      });
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  const getFormatoInfo = (formato: string) => {
    switch (formato) {
      case 'excel':
        return {
          icon: <FileSpreadsheet className="h-5 w-5" />,
          name: 'Excel Profesional',
          description: 'Múltiples hojas con análisis completo',
          features: ['5 hojas de análisis', 'Gráficos integrados', 'Fórmulas automáticas', 'Formato profesional'],
          color: 'text-green-600',
          bgColor: 'bg-green-50'
        };
      case 'pdf':
        return {
          icon: <FileText className="h-5 w-5" />,
          name: 'PDF Ejecutivo',
          description: 'Reporte visual para presentaciones',
          features: ['Diseño profesional', 'Gráficos de alta calidad', 'Portada ejecutiva', 'Fácil de compartir'],
          color: 'text-red-600',
          bgColor: 'bg-red-50'
        };
      case 'csv':
        return {
          icon: <File className="h-5 w-5" />,
          name: 'CSV Avanzado',
          description: 'Datos estructurados para análisis',
          features: ['Metadatos incluidos', 'Datos enriquecidos', 'Compatible con Excel', 'Fácil procesamiento'],
          color: 'text-blue-600',
          bgColor: 'bg-blue-50'
        };
      case 'json':
        return {
          icon: <Database className="h-5 w-5" />,
          name: 'JSON Estructurado',
          description: 'Datos completos para desarrolladores',
          features: ['Estructura completa', 'Metadatos detallados', 'API ready', 'Análisis programático'],
          color: 'text-purple-600',
          bgColor: 'bg-purple-50'
        };
      default:
        return {
          icon: <File className="h-5 w-5" />,
          name: 'Formato',
          description: 'Descripción',
          features: [],
          color: 'text-gray-600',
          bgColor: 'bg-gray-50'
        };
    }
  };

  const getTipoInfo = (tipo: string) => {
    switch (tipo) {
      case 'resumen':
        return {
          name: 'Resumen Ejecutivo',
          description: 'Métricas clave y KPIs principales',
          icon: <BarChart3 className="h-4 w-4" />,
          color: 'text-blue-600'
        };
      case 'detallado':
        return {
          name: 'Análisis Detallado',
          description: 'Información completa de cada venta',
          icon: <FileText className="h-4 w-4" />,
          color: 'text-green-600'
        };
      case 'analitico':
        return {
          name: 'Análisis Avanzado',
          description: 'Tendencias, comparativas y insights',
          icon: <TrendingUp className="h-4 w-4" />,
          color: 'text-purple-600'
        };
      case 'completo':
        return {
          name: 'Reporte Completo',
          description: 'Toda la información disponible',
          icon: <Crown className="h-4 w-4" />,
          color: 'text-orange-600'
        };
      default:
        return {
          name: 'Tipo',
          description: 'Descripción',
          icon: <File className="h-4 w-4" />,
          color: 'text-gray-600'
        };
    }
  };

  const formatoInfo = getFormatoInfo(formato);
  const tipoInfo = getTipoInfo(tipo);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Download className="h-6 w-6 text-blue-600" />
            Exportación Avanzada de Analytics
          </DialogTitle>
          <DialogDescription>
            Genera reportes profesionales con múltiples formatos y opciones de análisis
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información del Reporte */}
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                Información del Reporte
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-blue-700">Período:</span>
                  <p className="text-blue-600">{data.periodos.fechaInicio} - {data.periodos.fechaFin}</p>
                </div>
                <div>
                  <span className="font-medium text-blue-700">Total de Ventas:</span>
                  <p className="text-blue-600">{data.ventas.length} registros</p>
                </div>
                <div>
                  <span className="font-medium text-blue-700">Sucursales:</span>
                  <p className="text-blue-600">{data.sucursales.length} sucursales</p>
                </div>
                <div>
                  <span className="font-medium text-blue-700">Vendedores:</span>
                  <p className="text-blue-600">{data.vendedores.length} vendedores</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Selección de Formato */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                Formato de Exportación
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(['excel', 'pdf', 'csv', 'json'] as const).map((fmt) => {
                  const info = getFormatoInfo(fmt);
                  const isSelected = formato === fmt;
                  
                  return (
                    <Card 
                      key={fmt}
                      className={`cursor-pointer transition-all duration-200 ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-50 shadow-md' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setFormato(fmt)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${info.bgColor}`}>
                            <div className={info.color}>
                              {info.icon}
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold">{info.name}</h3>
                              {isSelected && <CheckCircle className="h-4 w-4 text-blue-600" />}
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{info.description}</p>
                            <div className="space-y-1">
                              {info.features.map((feature, idx) => (
                                <div key={idx} className="flex items-center gap-1 text-xs text-gray-500">
                                  <Star className="h-3 w-3" />
                                  {feature}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Tipo de Análisis */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Tipo de Análisis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={tipo} onValueChange={(value: any) => setTipo(value)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(['resumen', 'detallado', 'analitico', 'completo'] as const).map((t) => {
                    const info = getTipoInfo(t);
                    return (
                      <SelectItem key={t} value={t}>
                        <div className="flex items-center gap-2">
                          <div className={info.color}>
                            {info.icon}
                          </div>
                          <div>
                            <div className="font-medium">{info.name}</div>
                            <div className="text-xs text-gray-500">{info.description}</div>
                          </div>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Opciones Avanzadas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Opciones Avanzadas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="incluir-graficos"
                    checked={incluirGraficos}
                    onCheckedChange={setIncluirGraficos}
                  />
                  <Label htmlFor="incluir-graficos" className="flex items-center gap-2">
                    <PieChart className="h-4 w-4" />
                    Incluir Gráficos
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="incluir-metricas"
                    checked={incluirMetricas}
                    onCheckedChange={setIncluirMetricas}
                  />
                  <Label htmlFor="incluir-metricas" className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Incluir Métricas
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="incluir-tendencias"
                    checked={incluirTendencias}
                    onCheckedChange={setIncluirTendencias}
                  />
                  <Label htmlFor="incluir-tendencias" className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Incluir Tendencias
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="incluir-comparativas"
                    checked={incluirComparativas}
                    onCheckedChange={setIncluirComparativas}
                  />
                  <Label htmlFor="incluir-comparativas" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Incluir Comparativas
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Filtros Avanzados */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtros Avanzados
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Filtro por Métodos de Pago */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Métodos de Pago</Label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {filtrosDisponibles.metodosPago.map((metodo) => (
                      <div key={metodo} className="flex items-center space-x-2">
                        <Checkbox
                          id={`metodo-${metodo}`}
                          checked={filtros.metodosPago.includes(metodo)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFiltros(prev => ({
                                ...prev,
                                metodosPago: [...prev.metodosPago, metodo]
                              }));
                            } else {
                              setFiltros(prev => ({
                                ...prev,
                                metodosPago: prev.metodosPago.filter(m => m !== metodo)
                              }));
                            }
                          }}
                        />
                        <Label htmlFor={`metodo-${metodo}`} className="text-sm">
                          {metodo}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Filtro por Vendedores */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Vendedores</Label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {filtrosDisponibles.vendedores.map((vendedor) => (
                      <div key={vendedor.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`vendedor-${vendedor.id}`}
                          checked={filtros.vendedores.includes(vendedor.nombre)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFiltros(prev => ({
                                ...prev,
                                vendedores: [...prev.vendedores, vendedor.nombre]
                              }));
                            } else {
                              setFiltros(prev => ({
                                ...prev,
                                vendedores: prev.vendedores.filter(v => v !== vendedor.nombre)
                              }));
                            }
                          }}
                        />
                        <Label htmlFor={`vendedor-${vendedor.id}`} className="text-sm">
                          {vendedor.nombre}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Filtro por Categorías */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Categorías de Productos</Label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {filtrosDisponibles.categorias.map((categoria) => (
                      <div key={categoria} className="flex items-center space-x-2">
                        <Checkbox
                          id={`categoria-${categoria}`}
                          checked={filtros.productos.includes(categoria)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFiltros(prev => ({
                                ...prev,
                                productos: [...prev.productos, categoria]
                              }));
                            } else {
                              setFiltros(prev => ({
                                ...prev,
                                productos: prev.productos.filter(p => p !== categoria)
                              }));
                            }
                          }}
                        />
                        <Label htmlFor={`categoria-${categoria}`} className="text-sm">
                          {categoria}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Rango de Precios */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Rango de Precios</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="precio-min" className="text-xs">Mínimo</Label>
                      <Input
                        id="precio-min"
                        type="number"
                        value={filtros.rangoPrecios.min}
                        onChange={(e) => setFiltros(prev => ({
                          ...prev,
                          rangoPrecios: { ...prev.rangoPrecios, min: Number(e.target.value) }
                        }))}
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="precio-max" className="text-xs">Máximo</Label>
                      <Input
                        id="precio-max"
                        type="number"
                        value={filtros.rangoPrecios.max}
                        onChange={(e) => setFiltros(prev => ({
                          ...prev,
                          rangoPrecios: { ...prev.rangoPrecios, max: Number(e.target.value) }
                        }))}
                        className="text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vista Previa */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Vista Previa del Reporte
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`p-4 rounded-lg border-2 border-dashed ${formatoInfo.bgColor} border-gray-300`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className={formatoInfo.color}>
                    {formatoInfo.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold">{formatoInfo.name}</h3>
                    <p className="text-sm text-gray-600">{formatoInfo.description}</p>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Período: {data.periodos.fechaInicio} - {data.periodos.fechaFin}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Total de registros: {data.ventas.length} ventas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Tipo de análisis: {tipoInfo.name}</span>
                  </div>
                  {incluirGraficos && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Gráficos y visualizaciones incluidas</span>
                    </div>
                  )}
                  {incluirMetricas && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Métricas y KPIs detallados</span>
                    </div>
                  )}
                  {incluirTendencias && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Análisis de tendencias</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Progreso de Exportación */}
          {isExporting && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blue-600 animate-spin" />
                    <span className="font-medium text-blue-700">Generando reporte...</span>
                  </div>
                  <Progress value={exportProgress} className="w-full" />
                  <p className="text-sm text-blue-600">
                    {exportProgress < 30 && 'Preparando datos...'}
                    {exportProgress >= 30 && exportProgress < 60 && 'Procesando información...'}
                    {exportProgress >= 60 && exportProgress < 90 && 'Generando archivo...'}
                    {exportProgress >= 90 && 'Finalizando exportación...'}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose} disabled={isExporting}>
            Cancelar
          </Button>
          <Button 
            onClick={handleExport} 
            disabled={isExporting}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isExporting ? (
              <>
                <Clock className="h-4 w-4 mr-2 animate-spin" />
                Exportando...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Generar Reporte
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
