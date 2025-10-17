import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from 'sonner';
import { X, Save, Loader2 } from 'lucide-react';
import {
  crearPensionado,
  actualizarPensionado
} from '../../services/pensionadosApi';
import type {
  Pensionado,
  CrearPensionadoData,
  TipoCliente,
  TipoPeriodo
} from '../../types/pensionados';

interface PensionadoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  pensionado?: Pensionado | null;
  modoEdicion?: boolean;
}

export const PensionadoFormModal: React.FC<PensionadoFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  pensionado,
  modoEdicion = false
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CrearPensionadoData>({
    nombre_cliente: '',
    tipo_cliente: 'individual',
    documento_identidad: '',
    telefono: '',
    email: '',
    direccion: '',
    fecha_inicio: new Date().toISOString().split('T')[0],
    fecha_fin: '',
    tipo_periodo: 'semanas',
    cantidad_periodos: 1,
    incluye_almuerzo: true,
    incluye_cena: false,
    incluye_desayuno: false,
    max_platos_dia: 1,
    descuento_aplicado: 0
  });

  useEffect(() => {
    if (pensionado && modoEdicion) {
      setFormData({
        nombre_cliente: pensionado.nombre_cliente,
        tipo_cliente: pensionado.tipo_cliente,
        documento_identidad: pensionado.documento_identidad || '',
        telefono: pensionado.telefono || '',
        email: pensionado.email || '',
        direccion: pensionado.direccion || '',
        fecha_inicio: pensionado.fecha_inicio.split('T')[0],
        fecha_fin: pensionado.fecha_fin.split('T')[0],
        tipo_periodo: pensionado.tipo_periodo,
        cantidad_periodos: pensionado.cantidad_periodos,
        incluye_almuerzo: pensionado.incluye_almuerzo,
        incluye_cena: pensionado.incluye_cena,
        incluye_desayuno: pensionado.incluye_desayuno,
        max_platos_dia: pensionado.max_platos_dia,
        descuento_aplicado: pensionado.descuento_aplicado
      });
    }
  }, [pensionado, modoEdicion]);

  const handleChange = (field: keyof CrearPensionadoData, value: any) => {
    // Manejar campos numéricos para evitar NaN
    if (field === 'cantidad_periodos' || field === 'max_platos_dia') {
      const numValue = value === '' ? 1 : parseInt(value);
      setFormData(prev => ({ ...prev, [field]: isNaN(numValue) ? 1 : numValue }));
    } else if (field === 'descuento_aplicado') {
      const numValue = value === '' ? 0 : parseFloat(value);
      setFormData(prev => ({ ...prev, [field]: isNaN(numValue) ? 0 : numValue }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones
    if (!formData.nombre_cliente.trim()) {
      toast.error('El nombre del cliente es obligatorio');
      return;
    }

    if (!formData.fecha_inicio || !formData.fecha_fin) {
      toast.error('Las fechas de inicio y fin son obligatorias');
      return;
    }

    if (new Date(formData.fecha_fin) <= new Date(formData.fecha_inicio)) {
      toast.error('La fecha de fin debe ser posterior a la fecha de inicio');
      return;
    }

    try {
      setLoading(true);

      if (modoEdicion && pensionado) {
        const response = await actualizarPensionado(pensionado.id_pensionado, formData);
        if (response.success) {
          toast.success('Pensionado actualizado correctamente');
          onSuccess();
        }
      } else {
        const response = await crearPensionado(formData);
        if (response.success) {
          toast.success('Pensionado creado correctamente');
          onSuccess();
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al guardar pensionado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {modoEdicion ? 'Editar Pensionado' : 'Nuevo Pensionado'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información del Cliente */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Información del Cliente</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nombre_cliente">Nombre del Cliente *</Label>
                <Input
                  id="nombre_cliente"
                  value={formData.nombre_cliente}
                  onChange={(e) => handleChange('nombre_cliente', e.target.value)}
                  placeholder="Nombre completo"
                  required
                />
              </div>

              <div>
                <Label htmlFor="tipo_cliente">Tipo de Cliente</Label>
                <Select
                  value={formData.tipo_cliente}
                  onValueChange={(value) => handleChange('tipo_cliente', value as TipoCliente)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Individual</SelectItem>
                    <SelectItem value="corporativo">Corporativo</SelectItem>
                    <SelectItem value="evento">Evento</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="documento_identidad">Documento de Identidad</Label>
                <Input
                  id="documento_identidad"
                  value={formData.documento_identidad}
                  onChange={(e) => handleChange('documento_identidad', e.target.value)}
                  placeholder="CI o NIT"
                />
              </div>

              <div>
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  value={formData.telefono}
                  onChange={(e) => handleChange('telefono', e.target.value)}
                  placeholder="Número de teléfono"
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="correo@ejemplo.com"
                />
              </div>

              <div>
                <Label htmlFor="direccion">Dirección</Label>
                <Input
                  id="direccion"
                  value={formData.direccion}
                  onChange={(e) => handleChange('direccion', e.target.value)}
                  placeholder="Dirección completa"
                />
              </div>
            </div>
          </div>

          {/* Información del Contrato */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Información del Contrato</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fecha_inicio">Fecha de Inicio *</Label>
                <Input
                  id="fecha_inicio"
                  type="date"
                  value={formData.fecha_inicio}
                  onChange={(e) => handleChange('fecha_inicio', e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="fecha_fin">Fecha de Fin *</Label>
                <Input
                  id="fecha_fin"
                  type="date"
                  value={formData.fecha_fin}
                  onChange={(e) => handleChange('fecha_fin', e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="tipo_periodo">Tipo de Período</Label>
                <Select
                  value={formData.tipo_periodo}
                  onValueChange={(value) => handleChange('tipo_periodo', value as TipoPeriodo)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="semanas">Semanas</SelectItem>
                    <SelectItem value="meses">Meses</SelectItem>
                    <SelectItem value="años">Años</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="cantidad_periodos">Cantidad de Períodos</Label>
                <Input
                  id="cantidad_periodos"
                  type="number"
                  min="1"
                  value={formData.cantidad_periodos || 1}
                  onChange={(e) => handleChange('cantidad_periodos', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="max_platos_dia">Máx. Platos por Día</Label>
                <Input
                  id="max_platos_dia"
                  type="number"
                  min="1"
                  value={formData.max_platos_dia || 1}
                  onChange={(e) => handleChange('max_platos_dia', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="descuento_aplicado">Descuento (%)</Label>
                <Input
                  id="descuento_aplicado"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.descuento_aplicado || 0}
                  onChange={(e) => handleChange('descuento_aplicado', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Servicios Incluidos */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Servicios Incluidos</h3>
            
            <div className="flex flex-col space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="incluye_desayuno"
                  checked={formData.incluye_desayuno}
                  onChange={(e) => handleChange('incluye_desayuno', e.target.checked)}
                  className="h-4 w-4"
                />
                <Label htmlFor="incluye_desayuno" className="cursor-pointer">
                  Incluye Desayuno
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="incluye_almuerzo"
                  checked={formData.incluye_almuerzo}
                  onChange={(e) => handleChange('incluye_almuerzo', e.target.checked)}
                  className="h-4 w-4"
                />
                <Label htmlFor="incluye_almuerzo" className="cursor-pointer">
                  Incluye Almuerzo
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="incluye_cena"
                  checked={formData.incluye_cena}
                  onChange={(e) => handleChange('incluye_cena', e.target.checked)}
                  className="h-4 w-4"
                />
                <Label htmlFor="incluye_cena" className="cursor-pointer">
                  Incluye Cena
                </Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {modoEdicion ? 'Actualizar' : 'Crear'}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

