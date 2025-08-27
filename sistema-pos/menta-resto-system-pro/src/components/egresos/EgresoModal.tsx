import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';
import { Separator } from '../ui/separator';
import {
  Calendar,
  DollarSign,
  FileText,
  Building,
  CreditCard,
  User,
  Clock,
  CheckCircle
} from 'lucide-react';

import {
  type Egreso,
  type CategoriaEgreso,
  egresosUtils
} from '../../services/egresosApi';

interface EgresoModalProps {
  open: boolean;
  onClose: () => void;
  egreso?: Egreso;
  categorias: CategoriaEgreso[];
  mode: 'create' | 'edit' | 'view';
  onSave: (egresoData: Partial<Egreso>) => void;
}

export const EgresoModal: React.FC<EgresoModalProps> = ({
  open,
  onClose,
  egreso,
  categorias,
  mode,
  onSave
}) => {
  const getLocalISODate = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const [formData, setFormData] = useState<Partial<Egreso>>({
    concepto: '',
    descripcion: '',
    monto: 0,
    fecha_egreso: getLocalISODate(),
    id_categoria_egreso: 0,
    metodo_pago: 'efectivo',
    proveedor_nombre: '',
    proveedor_documento: '',
    proveedor_telefono: '',
    proveedor_email: '',
    numero_factura: '',
    numero_recibo: '',
    numero_comprobante: '',
    es_deducible: true,
    numero_autorizacion_fiscal: '',
    codigo_control: '',
    es_recurrente: false,
    frecuencia_recurrencia: undefined
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (egreso && (mode === 'edit' || mode === 'view')) {
      setFormData({
        concepto: egreso.concepto,
        descripcion: egreso.descripcion || '',
        monto: egreso.monto,
        fecha_egreso: egreso.fecha_egreso.split('T')[0],
        id_categoria_egreso: egreso.id_categoria_egreso,
        metodo_pago: egreso.metodo_pago,
        proveedor_nombre: egreso.proveedor_nombre || '',
        proveedor_documento: egreso.proveedor_documento || '',
        proveedor_telefono: egreso.proveedor_telefono || '',
        proveedor_email: egreso.proveedor_email || '',
        numero_factura: egreso.numero_factura || '',
        numero_recibo: egreso.numero_recibo || '',
        numero_comprobante: egreso.numero_comprobante || '',
        es_deducible: egreso.es_deducible,
        numero_autorizacion_fiscal: egreso.numero_autorizacion_fiscal || '',
        codigo_control: egreso.codigo_control || '',
        es_recurrente: egreso.es_recurrente,
        frecuencia_recurrencia: egreso.frecuencia_recurrencia
      });
    } else {
      // Reset form for create mode
      setFormData({
        concepto: '',
        descripcion: '',
        monto: 0,
        fecha_egreso: getLocalISODate(),
        id_categoria_egreso: 0,
        metodo_pago: 'efectivo',
        proveedor_nombre: '',
        proveedor_documento: '',
        proveedor_telefono: '',
        proveedor_email: '',
        numero_factura: '',
        numero_recibo: '',
        numero_comprobante: '',
        es_deducible: true,
        numero_autorizacion_fiscal: '',
        codigo_control: '',
        es_recurrente: false,
        frecuencia_recurrencia: undefined
      });
    }
    setErrors({});
  }, [egreso, mode, open]);

  const handleInputChange = (field: keyof Partial<Egreso>, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.concepto?.trim()) {
      newErrors.concepto = 'El concepto es requerido';
    }

    if (!formData.monto || formData.monto <= 0) {
      newErrors.monto = 'El monto debe ser mayor a 0';
    }

    if (!formData.fecha_egreso) {
      newErrors.fecha_egreso = 'La fecha es requerida';
    }

    if (!formData.id_categoria_egreso || formData.id_categoria_egreso === 0) {
      newErrors.id_categoria_egreso = 'Debe seleccionar una categoría';
    }

    if (formData.proveedor_email && !isValidEmail(formData.proveedor_email)) {
      newErrors.proveedor_email = 'Email no válido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSave = () => {
    if (!validateForm()) return;

    const dataToSave = {
      ...formData,
      monto: Number(formData.monto),
      id_categoria_egreso: Number(formData.id_categoria_egreso)
    };

    onSave(dataToSave);
  };

  const isViewMode = mode === 'view';
  const selectedCategoria = categorias.find(c => c.id_categoria_egreso === formData.id_categoria_egreso);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5" />
            <span>
              {mode === 'create' && 'Nuevo Egreso'}
              {mode === 'edit' && 'Editar Egreso'}
              {mode === 'view' && 'Detalles del Egreso'}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Columna izquierda - Información básica */}
          <div className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4 flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  Información Básica
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="concepto">Concepto *</Label>
                    <Input
                      id="concepto"
                      value={formData.concepto}
                      onChange={(e) => handleInputChange('concepto', e.target.value)}
                      disabled={isViewMode}
                      placeholder="Descripción del gasto"
                    />
                    {errors.concepto && (
                      <p className="text-sm text-red-500 mt-1">{errors.concepto}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="descripcion">Descripción</Label>
                    <Textarea
                      id="descripcion"
                      value={formData.descripcion}
                      onChange={(e) => handleInputChange('descripcion', e.target.value)}
                      disabled={isViewMode}
                      placeholder="Detalles adicionales del gasto"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="monto">Monto (Bs) *</Label>
                      <Input
                        id="monto"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.monto}
                        onChange={(e) => handleInputChange('monto', parseFloat(e.target.value) || 0)}
                        disabled={isViewMode}
                        placeholder="0.00"
                      />
                      {errors.monto && (
                        <p className="text-sm text-red-500 mt-1">{errors.monto}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="fecha">Fecha del Egreso *</Label>
                      <Input
                        id="fecha"
                        type="date"
                        value={formData.fecha_egreso}
                        onChange={(e) => handleInputChange('fecha_egreso', e.target.value)}
                        disabled={isViewMode}
                      />
                      {errors.fecha_egreso && (
                        <p className="text-sm text-red-500 mt-1">{errors.fecha_egreso}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="categoria">Categoría *</Label>
                    <Select
                      value={formData.id_categoria_egreso?.toString() || ''}
                      onValueChange={(value) => handleInputChange('id_categoria_egreso', parseInt(value))}
                      disabled={isViewMode}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        {categorias.map((categoria) => (
                          <SelectItem 
                            key={categoria.id_categoria_egreso} 
                            value={categoria.id_categoria_egreso.toString()}
                          >
                            <div className="flex items-center space-x-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: categoria.color }}
                              />
                              <span>{categoria.nombre}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.id_categoria_egreso && (
                      <p className="text-sm text-red-500 mt-1">{errors.id_categoria_egreso}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="metodo-pago">Método de Pago</Label>
                    <Select
                      value={formData.metodo_pago}
                      onValueChange={(value) => handleInputChange('metodo_pago', value)}
                      disabled={isViewMode}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="efectivo">Efectivo</SelectItem>
                        <SelectItem value="tarjeta_debito">Tarjeta de Débito</SelectItem>
                        <SelectItem value="tarjeta_credito">Tarjeta de Crédito</SelectItem>
                        <SelectItem value="transferencia">Transferencia</SelectItem>
                        <SelectItem value="cheque">Cheque</SelectItem>
                        <SelectItem value="otros">Otros</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Columna derecha - Información del proveedor y documentos */}
          <div className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4 flex items-center">
                  <Building className="h-4 w-4 mr-2" />
                  Información del Proveedor
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="proveedor-nombre">Nombre del Proveedor</Label>
                    <Input
                      id="proveedor-nombre"
                      value={formData.proveedor_nombre}
                      onChange={(e) => handleInputChange('proveedor_nombre', e.target.value)}
                      disabled={isViewMode}
                      placeholder="Nombre o razón social"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="proveedor-documento">Documento/NIT</Label>
                      <Input
                        id="proveedor-documento"
                        value={formData.proveedor_documento}
                        onChange={(e) => handleInputChange('proveedor_documento', e.target.value)}
                        disabled={isViewMode}
                        placeholder="CI/NIT"
                      />
                    </div>

                    <div>
                      <Label htmlFor="proveedor-telefono">Teléfono</Label>
                      <Input
                        id="proveedor-telefono"
                        value={formData.proveedor_telefono}
                        onChange={(e) => handleInputChange('proveedor_telefono', e.target.value)}
                        disabled={isViewMode}
                        placeholder="Número de contacto"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="proveedor-email">Email</Label>
                    <Input
                      id="proveedor-email"
                      type="email"
                      value={formData.proveedor_email}
                      onChange={(e) => handleInputChange('proveedor_email', e.target.value)}
                      disabled={isViewMode}
                      placeholder="correo@ejemplo.com"
                    />
                    {errors.proveedor_email && (
                      <p className="text-sm text-red-500 mt-1">{errors.proveedor_email}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4 flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  Documentos de Respaldo
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="numero-factura">Número de Factura</Label>
                    <Input
                      id="numero-factura"
                      value={formData.numero_factura}
                      onChange={(e) => handleInputChange('numero_factura', e.target.value)}
                      disabled={isViewMode}
                      placeholder="Número de factura"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="numero-recibo">Número de Recibo</Label>
                      <Input
                        id="numero-recibo"
                        value={formData.numero_recibo}
                        onChange={(e) => handleInputChange('numero_recibo', e.target.value)}
                        disabled={isViewMode}
                        placeholder="Número de recibo"
                      />
                    </div>

                    <div>
                      <Label htmlFor="numero-comprobante">Comprobante</Label>
                      <Input
                        id="numero-comprobante"
                        value={formData.numero_comprobante}
                        onChange={(e) => handleInputChange('numero_comprobante', e.target.value)}
                        disabled={isViewMode}
                        placeholder="Número de comprobante"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="autorizacion-fiscal">Autorización Fiscal</Label>
                      <Input
                        id="autorizacion-fiscal"
                        value={formData.numero_autorizacion_fiscal}
                        onChange={(e) => handleInputChange('numero_autorizacion_fiscal', e.target.value)}
                        disabled={isViewMode}
                        placeholder="Número de autorización"
                      />
                    </div>

                    <div>
                      <Label htmlFor="codigo-control">Código de Control</Label>
                      <Input
                        id="codigo-control"
                        value={formData.codigo_control}
                        onChange={(e) => handleInputChange('codigo_control', e.target.value)}
                        disabled={isViewMode}
                        placeholder="Código de control"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4">Opciones Adicionales</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="es-deducible"
                      checked={formData.es_deducible}
                      onCheckedChange={(checked) => handleInputChange('es_deducible', checked)}
                      disabled={isViewMode}
                    />
                    <Label htmlFor="es-deducible">Es deducible de impuestos</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="es-recurrente"
                      checked={formData.es_recurrente}
                      onCheckedChange={(checked) => handleInputChange('es_recurrente', checked)}
                      disabled={isViewMode}
                    />
                    <Label htmlFor="es-recurrente">Es un gasto recurrente</Label>
                  </div>

                  {formData.es_recurrente && (
                    <div>
                      <Label htmlFor="frecuencia">Frecuencia de Recurrencia</Label>
                      <Select
                        value={formData.frecuencia_recurrencia || ''}
                        onValueChange={(value) => handleInputChange('frecuencia_recurrencia', value)}
                        disabled={isViewMode}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar frecuencia" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="diario">Diario</SelectItem>
                          <SelectItem value="semanal">Semanal</SelectItem>
                          <SelectItem value="mensual">Mensual</SelectItem>
                          <SelectItem value="anual">Anual</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Información adicional en modo vista */}
        {isViewMode && egreso && (
          <>
            <Separator />
            <div className="space-y-4">
              <h3 className="font-semibold">Información del Sistema</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Estado:</span>
                  <Badge className="ml-2" style={{ backgroundColor: egresosUtils.getEstadoColor(egreso.estado) }}>
                    {egreso.estado.toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <span className="text-gray-500">Registrado por:</span>
                  <span className="ml-2">{egreso.registrado_por_nombre}</span>
                </div>
                <div>
                  <span className="text-gray-500">Fecha de registro:</span>
                  <span className="ml-2">{egresosUtils.formatDate(egreso.created_at)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Sucursal:</span>
                  <span className="ml-2">{egreso.sucursal_nombre}</span>
                </div>
              </div>

              {egreso.aprobado_por_nombre && (
                <div className="text-sm">
                  <span className="text-gray-500">Aprobado por:</span>
                  <span className="ml-2">{egreso.aprobado_por_nombre}</span>
                  {egreso.fecha_aprobacion && (
                    <span className="ml-2 text-gray-400">
                      ({egresosUtils.formatDate(egreso.fecha_aprobacion)})
                    </span>
                  )}
                </div>
              )}

              {egreso.comentario_aprobacion && (
                <div className="text-sm">
                  <span className="text-gray-500">Comentario:</span>
                  <p className="mt-1 text-gray-700 bg-gray-50 p-2 rounded">
                    {egreso.comentario_aprobacion}
                  </p>
                </div>
              )}
            </div>
          </>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {isViewMode ? 'Cerrar' : 'Cancelar'}
          </Button>
          {!isViewMode && (
            <Button onClick={handleSave}>
              {mode === 'create' ? 'Crear Egreso' : 'Guardar Cambios'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
