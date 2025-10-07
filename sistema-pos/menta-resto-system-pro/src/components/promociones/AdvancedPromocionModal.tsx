import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  Calendar, 
  Clock, 
  Percent, 
  DollarSign, 
  Tag, 
  Users, 
  MapPin, 
  Target, 
  Zap, 
  Crown, 
  Star, 
  CheckCircle, 
  AlertCircle,
  Info,
  TrendingUp,
  BarChart3,
  Settings,
  Eye,
  Save,
  X
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface AdvancedPromocionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (promocionData: any) => void;
  promocion?: any;
  productos: any[];
  sucursales: any[];
  mode: 'create' | 'edit';
}

export const AdvancedPromocionModal: React.FC<AdvancedPromocionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  promocion,
  productos,
  sucursales,
  mode
}) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('basico');
  const [isSaving, setIsSaving] = useState(false);

  // Estados del formulario
  const [formData, setFormData] = useState({
    // Información básica
    nombre: '',
    descripcion: '',
    tipo: 'porcentaje' as 'porcentaje' | 'monto_fijo' | 'precio_fijo' | 'x_uno_gratis' | 'combo',
    valor: 0,
    id_producto: 0,
    
    // Fechas y horarios
    fecha_inicio: '',
    fecha_fin: '',
    hora_inicio: '00:00',
    hora_fin: '23:59',
    aplicar_horarios: false,
    
    // Configuración avanzada
    limite_usos: 0,
    limite_usos_por_cliente: 0,
    monto_minimo: 0,
    monto_maximo: 0,
    productos_minimos: 0,
    productos_maximos: 0,
    
    // Asignación
    sucursales: [] as number[],
    aplicar_todas_sucursales: true,
    
    // Estado y configuración
    activa: true,
    destacada: false,
    requiere_codigo: false,
    codigo_promocion: '',
    
    // Analytics y seguimiento
    objetivo_ventas: 0,
    objetivo_ingresos: 0,
    categoria_objetivo: '',
    segmento_cliente: 'todos' as 'todos' | 'nuevos' | 'recurrentes' | 'vip'
  });

  // Inicializar datos si es edición
  useEffect(() => {
    if (mode === 'edit' && promocion) {
      setFormData({
        nombre: promocion.nombre || '',
        descripcion: promocion.descripcion || '',
        tipo: promocion.tipo || 'porcentaje',
        valor: promocion.valor || 0,
        id_producto: promocion.id_producto || 0,
        fecha_inicio: promocion.fecha_inicio || '',
        fecha_fin: promocion.fecha_fin || '',
        hora_inicio: promocion.hora_inicio || '00:00',
        hora_fin: promocion.hora_fin || '23:59',
        aplicar_horarios: promocion.aplicar_horarios || false,
        limite_usos: promocion.limite_usos || 0,
        limite_usos_por_cliente: promocion.limite_usos_por_cliente || 0,
        monto_minimo: promocion.monto_minimo || 0,
        monto_maximo: promocion.monto_maximo || 0,
        productos_minimos: promocion.productos_minimos || 0,
        productos_maximos: promocion.productos_maximos || 0,
        sucursales: promocion.sucursales || [],
        aplicar_todas_sucursales: promocion.aplicar_todas_sucursales !== false,
        activa: promocion.activa !== false,
        destacada: promocion.destacada || false,
        requiere_codigo: promocion.requiere_codigo || false,
        codigo_promocion: promocion.codigo_promocion || '',
        objetivo_ventas: promocion.objetivo_ventas || 0,
        objetivo_ingresos: promocion.objetivo_ingresos || 0,
        categoria_objetivo: promocion.categoria_objetivo || '',
        segmento_cliente: promocion.segmento_cliente || 'todos'
      });
    } else {
      // Resetear para creación
      setFormData({
        nombre: '',
        descripcion: '',
        tipo: 'porcentaje',
        valor: 0,
        id_producto: 0,
        fecha_inicio: format(new Date(), 'yyyy-MM-dd'),
        fecha_fin: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
        hora_inicio: '00:00',
        hora_fin: '23:59',
        aplicar_horarios: false,
        limite_usos: 0,
        limite_usos_por_cliente: 0,
        monto_minimo: 0,
        monto_maximo: 0,
        productos_minimos: 0,
        productos_maximos: 0,
        sucursales: [],
        aplicar_todas_sucursales: true,
        activa: true,
        destacada: false,
        requiere_codigo: false,
        codigo_promocion: '',
        objetivo_ventas: 0,
        objetivo_ingresos: 0,
        categoria_objetivo: '',
        segmento_cliente: 'todos'
      });
    }
  }, [mode, promocion, isOpen]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Validaciones
      if (!formData.nombre.trim()) {
        toast({
          title: "Error",
          description: "El nombre de la promoción es obligatorio",
          variant: "destructive",
        });
        return;
      }

      if (!formData.fecha_inicio || !formData.fecha_fin) {
        toast({
          title: "Error",
          description: "Las fechas de inicio y fin son obligatorias",
          variant: "destructive",
        });
        return;
      }

      if (new Date(formData.fecha_fin) <= new Date(formData.fecha_inicio)) {
        toast({
          title: "Error",
          description: "La fecha de fin debe ser posterior a la fecha de inicio",
          variant: "destructive",
        });
        return;
      }

      if (formData.aplicar_horarios && formData.hora_inicio >= formData.hora_fin) {
        toast({
          title: "Error",
          description: "La hora de fin debe ser posterior a la hora de inicio",
          variant: "destructive",
        });
        return;
      }

      if (formData.valor <= 0) {
        toast({
          title: "Error",
          description: "El valor de la promoción debe ser mayor a 0",
          variant: "destructive",
        });
        return;
      }

      if (formData.id_producto === 0) {
        toast({
          title: "Error",
          description: "Debe seleccionar un producto",
          variant: "destructive",
        });
        return;
      }

      // Generar código automático si no se proporciona
      const codigoFinal = formData.requiere_codigo && !formData.codigo_promocion
        ? `PROMO${Date.now().toString().slice(-6)}`
        : formData.codigo_promocion;

      const promocionData = {
        ...formData,
        codigo_promocion: codigoFinal,
        id_promocion: mode === 'edit' ? promocion.id_promocion : undefined
      };

      await onSave(promocionData);
      
      toast({
        title: "✅ Éxito",
        description: `Promoción ${mode === 'edit' ? 'actualizada' : 'creada'} exitosamente`,
      });
      
      onClose();
    } catch (error) {
      console.error('Error guardando promoción:', error);
      toast({
        title: "❌ Error",
        description: "Error al guardar la promoción",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getTipoInfo = (tipo: string) => {
    switch (tipo) {
      case 'porcentaje':
        return {
          icon: <Percent className="h-4 w-4" />,
          label: 'Porcentaje',
          description: 'Descuento porcentual sobre el precio',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50'
        };
      case 'monto_fijo':
        return {
          icon: <DollarSign className="h-4 w-4" />,
          label: 'Monto Fijo',
          description: 'Descuento en cantidad fija',
          color: 'text-green-600',
          bgColor: 'bg-green-50'
        };
      case 'precio_fijo':
        return {
          icon: <Tag className="h-4 w-4" />,
          label: 'Precio Fijo',
          description: 'Precio final fijo',
          color: 'text-purple-600',
          bgColor: 'bg-purple-50'
        };
      case 'x_uno_gratis':
        return {
          icon: <Star className="h-4 w-4" />,
          label: 'X Uno Gratis',
          description: 'Promoción tipo 2x1, 3x2, etc.',
          color: 'text-orange-600',
          bgColor: 'bg-orange-50'
        };
      case 'combo':
        return {
          icon: <Target className="h-4 w-4" />,
          label: 'Combo',
          description: 'Promoción por combinación de productos',
          color: 'text-red-600',
          bgColor: 'bg-red-50'
        };
      default:
        return {
          icon: <Tag className="h-4 w-4" />,
          label: 'Tipo',
          description: 'Descripción',
          color: 'text-gray-600',
          bgColor: 'bg-gray-50'
        };
    }
  };

  const tipoInfo = getTipoInfo(formData.tipo);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Crown className="h-6 w-6 text-purple-600" />
            {mode === 'edit' ? 'Editar Promoción Avanzada' : 'Crear Promoción Avanzada'}
          </DialogTitle>
          <DialogDescription>
            Sistema profesional de promociones con análisis avanzado y configuración detallada
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="basico" className="flex items-center gap-1">
              <Info className="h-4 w-4" />
              <span className="hidden sm:inline">Básico</span>
            </TabsTrigger>
            <TabsTrigger value="horarios" className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">Horarios</span>
            </TabsTrigger>
            <TabsTrigger value="avanzado" className="flex items-center gap-1">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Avanzado</span>
            </TabsTrigger>
            <TabsTrigger value="asignacion" className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              <span className="hidden sm:inline">Asignación</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-1">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
          </TabsList>

          {/* Pestaña: Información Básica */}
          <TabsContent value="basico" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5 text-blue-600" />
                  Información Básica
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre de la Promoción *</Label>
                    <Input
                      id="nombre"
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      placeholder="Ej: Descuento 20% en Hamburguesas"
                      className="font-medium"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="descripcion">Descripción</Label>
                    <Input
                      id="descripcion"
                      value={formData.descripcion}
                      onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                      placeholder="Descripción detallada de la promoción"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tipo">Tipo de Promoción *</Label>
                    <Select
                      value={formData.tipo}
                      onValueChange={(value: any) => setFormData({ ...formData, tipo: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="porcentaje">
                          <div className="flex items-center gap-2">
                            <Percent className="h-4 w-4 text-blue-600" />
                            <div>
                              <div className="font-medium">Porcentaje</div>
                              <div className="text-xs text-gray-500">Descuento porcentual</div>
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="monto_fijo">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-green-600" />
                            <div>
                              <div className="font-medium">Monto Fijo</div>
                              <div className="text-xs text-gray-500">Descuento en cantidad fija</div>
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="precio_fijo">
                          <div className="flex items-center gap-2">
                            <Tag className="h-4 w-4 text-purple-600" />
                            <div>
                              <div className="font-medium">Precio Fijo</div>
                              <div className="text-xs text-gray-500">Precio final fijo</div>
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="x_uno_gratis">
                          <div className="flex items-center gap-2">
                            <Star className="h-4 w-4 text-orange-600" />
                            <div>
                              <div className="font-medium">X Uno Gratis</div>
                              <div className="text-xs text-gray-500">Promoción 2x1, 3x2, etc.</div>
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="combo">
                          <div className="flex items-center gap-2">
                            <Target className="h-4 w-4 text-red-600" />
                            <div>
                              <div className="font-medium">Combo</div>
                              <div className="text-xs text-gray-500">Promoción por combinación</div>
                            </div>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="valor">
                      Valor {formData.tipo === 'porcentaje' ? '(%)' : '(Bs)'} *
                    </Label>
                    <Input
                      id="valor"
                      type="text"
                      value={formData.valor}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Permitir solo números y punto decimal
                        if (value === '' || /^\d*\.?\d*$/.test(value)) {
                          setFormData({ ...formData, valor: value === '' ? 0 : Number(value) });
                        }
                      }}
                      placeholder={formData.tipo === 'porcentaje' ? '20' : '5.00'}
                      className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="producto">Producto *</Label>
                  <Select
                    value={formData.id_producto.toString()}
                    onValueChange={(value) => setFormData({ ...formData, id_producto: Number(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar producto" />
                    </SelectTrigger>
                    <SelectContent>
                      {productos.map((producto) => (
                        <SelectItem key={producto.id} value={producto.id.toString()}>
                          <div className="flex items-center justify-between w-full">
                            <span>{producto.name}</span>
                            <span className="text-sm text-gray-500 ml-2">
                              Bs {producto.price}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Vista previa del tipo seleccionado */}
                <Card className={`border-2 ${tipoInfo.bgColor} border-opacity-50`}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${tipoInfo.bgColor}`}>
                        <div className={tipoInfo.color}>
                          {tipoInfo.icon}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold">{tipoInfo.label}</h4>
                        <p className="text-sm text-gray-600">{tipoInfo.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pestaña: Horarios y Fechas */}
          <TabsContent value="horarios" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-orange-600" />
                  Configuración de Horarios
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fecha_inicio">Fecha de Inicio *</Label>
                    <Input
                      id="fecha_inicio"
                      type="date"
                      value={formData.fecha_inicio}
                      onChange={(e) => setFormData({ ...formData, fecha_inicio: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fecha_fin">Fecha de Fin *</Label>
                    <Input
                      id="fecha_fin"
                      type="date"
                      value={formData.fecha_fin}
                      onChange={(e) => setFormData({ ...formData, fecha_fin: e.target.value })}
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="aplicar-horarios"
                      checked={formData.aplicar_horarios}
                      onCheckedChange={(checked) => setFormData({ ...formData, aplicar_horarios: checked })}
                    />
                    <Label htmlFor="aplicar-horarios" className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Aplicar Horarios Específicos
                    </Label>
                  </div>

                  {formData.aplicar_horarios && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
                      <div className="space-y-2">
                        <Label htmlFor="hora_inicio">Hora de Inicio</Label>
                        <Input
                          id="hora_inicio"
                          type="time"
                          value={formData.hora_inicio}
                          onChange={(e) => setFormData({ ...formData, hora_inicio: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="hora_fin">Hora de Fin</Label>
                        <Input
                          id="hora_fin"
                          type="time"
                          value={formData.hora_fin}
                          onChange={(e) => setFormData({ ...formData, hora_fin: e.target.value })}
                        />
                      </div>

                      <div className="col-span-full">
                        <div className="flex items-center gap-2 p-3 bg-white rounded-lg border">
                          <Info className="h-4 w-4 text-orange-600" />
                          <div className="text-sm">
                            <p className="font-medium text-orange-800">Promoción por Horarios</p>
                            <p className="text-orange-600">
                              La promoción solo será válida entre las {formData.hora_inicio} y {formData.hora_fin} 
                              en las fechas seleccionadas
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Vista previa de vigencia */}
                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-blue-800 mb-2">Vigencia de la Promoción</h4>
                    <div className="space-y-1 text-sm text-blue-700">
                      <p><strong>Desde:</strong> {formData.fecha_inicio} {formData.aplicar_horarios ? `a las ${formData.hora_inicio}` : ''}</p>
                      <p><strong>Hasta:</strong> {formData.fecha_fin} {formData.aplicar_horarios ? `a las ${formData.hora_fin}` : ''}</p>
                      {formData.aplicar_horarios && (
                        <p><strong>Horarios:</strong> Solo válida entre {formData.hora_inicio} y {formData.hora_fin}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pestaña: Configuración Avanzada */}
          <TabsContent value="avanzado" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-purple-600" />
                  Configuración Avanzada
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Límites de Uso */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-800">Límites de Uso</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="limite_usos">Límite Total de Usos</Label>
                      <Input
                        id="limite_usos"
                        type="text"
                        value={formData.limite_usos}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '' || /^\d*$/.test(value)) {
                            setFormData({ ...formData, limite_usos: value === '' ? 0 : Number(value) });
                          }
                        }}
                        placeholder="0 = Sin límite"
                        className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <p className="text-xs text-gray-500">Número máximo de veces que se puede usar esta promoción</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="limite_usos_cliente">Límite por Cliente</Label>
                      <Input
                        id="limite_usos_cliente"
                        type="text"
                        value={formData.limite_usos_por_cliente}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '' || /^\d*$/.test(value)) {
                            setFormData({ ...formData, limite_usos_por_cliente: value === '' ? 0 : Number(value) });
                          }
                        }}
                        placeholder="0 = Sin límite"
                        className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <p className="text-xs text-gray-500">Máximo de veces que un cliente puede usar esta promoción</p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Montos Mínimos y Máximos */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-800">Montos de Aplicación</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="monto_minimo">Monto Mínimo de Compra (Bs)</Label>
                      <Input
                        id="monto_minimo"
                        type="text"
                        value={formData.monto_minimo}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '' || /^\d*\.?\d*$/.test(value)) {
                            setFormData({ ...formData, monto_minimo: value === '' ? 0 : Number(value) });
                          }
                        }}
                        placeholder="0 = Sin mínimo"
                        className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="monto_maximo">Monto Máximo de Descuento (Bs)</Label>
                      <Input
                        id="monto_maximo"
                        type="text"
                        value={formData.monto_maximo}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '' || /^\d*\.?\d*$/.test(value)) {
                            setFormData({ ...formData, monto_maximo: value === '' ? 0 : Number(value) });
                          }
                        }}
                        placeholder="0 = Sin máximo"
                        className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Configuración de Estado */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-800">Estado y Configuración</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="activa"
                        checked={formData.activa}
                        onCheckedChange={(checked) => setFormData({ ...formData, activa: checked })}
                      />
                      <Label htmlFor="activa" className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Promoción Activa
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="destacada"
                        checked={formData.destacada}
                        onCheckedChange={(checked) => setFormData({ ...formData, destacada: checked })}
                      />
                      <Label htmlFor="destacada" className="flex items-center gap-2">
                        <Star className="h-4 w-4" />
                        Promoción Destacada
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="requiere-codigo"
                        checked={formData.requiere_codigo}
                        onCheckedChange={(checked) => setFormData({ ...formData, requiere_codigo: checked })}
                      />
                      <Label htmlFor="requiere-codigo" className="flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Requiere Código
                      </Label>
                    </div>
                  </div>

                  {formData.requiere_codigo && (
                    <div className="space-y-2">
                      <Label htmlFor="codigo_promocion">Código de Promoción</Label>
                      <Input
                        id="codigo_promocion"
                        value={formData.codigo_promocion}
                        onChange={(e) => setFormData({ ...formData, codigo_promocion: e.target.value.toUpperCase() })}
                        placeholder="Dejar vacío para generar automáticamente"
                        className="font-mono"
                      />
                      <p className="text-xs text-gray-500">
                        Los clientes necesitarán ingresar este código para aplicar la promoción
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pestaña: Asignación */}
          <TabsContent value="asignacion" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-green-600" />
                  Asignación de Sucursales
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="aplicar-todas"
                    checked={formData.aplicar_todas_sucursales}
                    onCheckedChange={(checked) => setFormData({ ...formData, aplicar_todas_sucursales: checked })}
                  />
                  <Label htmlFor="aplicar-todas" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Aplicar a Todas las Sucursales
                  </Label>
                </div>

                {!formData.aplicar_todas_sucursales && (
                  <div className="space-y-3">
                    <Label>Sucursales Específicas</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-48 overflow-y-auto">
                      {sucursales.map((sucursal) => (
                        <div key={sucursal.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`sucursal-${sucursal.id}`}
                            checked={formData.sucursales.includes(sucursal.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setFormData(prev => ({
                                  ...prev,
                                  sucursales: [...prev.sucursales, sucursal.id]
                                }));
                              } else {
                                setFormData(prev => ({
                                  ...prev,
                                  sucursales: prev.sucursales.filter(id => id !== sucursal.id)
                                }));
                              }
                            }}
                          />
                          <Label htmlFor={`sucursal-${sucursal.id}`} className="text-sm">
                            {sucursal.nombre}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Card className="border-green-200 bg-green-50">
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-green-800 mb-2">Asignación Actual</h4>
                    <p className="text-sm text-green-700">
                      {formData.aplicar_todas_sucursales 
                        ? 'La promoción se aplicará en todas las sucursales'
                        : `La promoción se aplicará en ${formData.sucursales.length} sucursal(es) seleccionada(s)`
                      }
                    </p>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pestaña: Analytics y Objetivos */}
          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-indigo-600" />
                  Analytics y Objetivos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Objetivos de la Promoción */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-800">Objetivos de la Promoción</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="objetivo_ventas">Objetivo de Ventas</Label>
                      <Input
                        id="objetivo_ventas"
                        type="text"
                        value={formData.objetivo_ventas}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '' || /^\d*$/.test(value)) {
                            setFormData({ ...formData, objetivo_ventas: value === '' ? 0 : Number(value) });
                          }
                        }}
                        placeholder="Número de ventas objetivo"
                        className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <p className="text-xs text-gray-500">Número de ventas que se espera generar</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="objetivo_ingresos">Objetivo de Ingresos (Bs)</Label>
                      <Input
                        id="objetivo_ingresos"
                        type="text"
                        value={formData.objetivo_ingresos}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '' || /^\d*\.?\d*$/.test(value)) {
                            setFormData({ ...formData, objetivo_ingresos: value === '' ? 0 : Number(value) });
                          }
                        }}
                        placeholder="Monto de ingresos objetivo"
                        className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <p className="text-xs text-gray-500">Ingresos esperados por esta promoción</p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Segmentación */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-800">Segmentación de Clientes</h4>
                  <div className="space-y-2">
                    <Label htmlFor="segmento_cliente">Segmento Objetivo</Label>
                    <Select
                      value={formData.segmento_cliente}
                      onValueChange={(value: any) => setFormData({ ...formData, segmento_cliente: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            <div>
                              <div className="font-medium">Todos los Clientes</div>
                              <div className="text-xs text-gray-500">Sin restricción de segmento</div>
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="nuevos">
                          <div className="flex items-center gap-2">
                            <Star className="h-4 w-4" />
                            <div>
                              <div className="font-medium">Clientes Nuevos</div>
                              <div className="text-xs text-gray-500">Primera compra</div>
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="recurrentes">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" />
                            <div>
                              <div className="font-medium">Clientes Recurrentes</div>
                              <div className="text-xs text-gray-500">Más de 3 compras</div>
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="vip">
                          <div className="flex items-center gap-2">
                            <Crown className="h-4 w-4" />
                            <div>
                              <div className="font-medium">Clientes VIP</div>
                              <div className="text-xs text-gray-500">Clientes premium</div>
                            </div>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Vista previa de objetivos */}
                <Card className="border-indigo-200 bg-indigo-50">
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-indigo-800 mb-3">Resumen de Objetivos</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-indigo-700"><strong>Ventas Objetivo:</strong> {formData.objetivo_ventas || 'No definido'}</p>
                        <p className="text-indigo-700"><strong>Ingresos Objetivo:</strong> Bs {formData.objetivo_ingresos || '0.00'}</p>
                      </div>
                      <div>
                        <p className="text-indigo-700"><strong>Segmento:</strong> {formData.segmento_cliente}</p>
                        <p className="text-indigo-700"><strong>Estado:</strong> {formData.activa ? 'Activa' : 'Inactiva'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isSaving ? (
              <>
                <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {mode === 'edit' ? 'Actualizar Promoción' : 'Crear Promoción'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
