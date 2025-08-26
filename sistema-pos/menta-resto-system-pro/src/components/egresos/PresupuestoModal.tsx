import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';

import { 
  type PresupuestoEgreso, 
  type CategoriaEgreso 
} from '../../services/egresosApi';

interface PresupuestoModalProps {
  open: boolean;
  onClose: () => void;
  presupuesto?: PresupuestoEgreso;
  categorias: CategoriaEgreso[];
  mode: 'create' | 'edit';
  onSave: (presupuestoData: Partial<PresupuestoEgreso>) => void;
}

export const PresupuestoModal: React.FC<PresupuestoModalProps> = ({
  open,
  onClose,
  presupuesto,
  categorias,
  mode,
  onSave
}) => {
  const [formData, setFormData] = useState({
    id_categoria_egreso: 0,
    anio: new Date().getFullYear(),
    mes: undefined as number | undefined,
    monto_presupuestado: 0,
    activo: true
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (presupuesto && mode === 'edit') {
      setFormData({
        id_categoria_egreso: presupuesto.id_categoria_egreso,
        anio: presupuesto.anio,
        mes: presupuesto.mes,
        monto_presupuestado: presupuesto.monto_presupuestado,
        activo: presupuesto.activo
      });
    } else {
      setFormData({
        id_categoria_egreso: 0,
        anio: new Date().getFullYear(),
        mes: undefined,
        monto_presupuestado: 0,
        activo: true
      });
    }
    setErrors({});
  }, [presupuesto, mode, open]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.id_categoria_egreso || formData.id_categoria_egreso === 0) {
      newErrors.id_categoria_egreso = 'Debe seleccionar una categoría';
    }

    if (!formData.anio || formData.anio < 2020 || formData.anio > 2030) {
      newErrors.anio = 'El año debe estar entre 2020 y 2030';
    }

    if (!formData.monto_presupuestado || formData.monto_presupuestado <= 0) {
      newErrors.monto_presupuestado = 'El monto debe ser mayor a 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) return;

    const dataToSave = {
      ...formData,
      id_categoria_egreso: Number(formData.id_categoria_egreso),
      monto_presupuestado: Number(formData.monto_presupuestado),
      mes: formData.mes || null
    };

    onSave(dataToSave);
  };

  const meses = [
    { valor: 1, nombre: 'Enero' },
    { valor: 2, nombre: 'Febrero' },
    { valor: 3, nombre: 'Marzo' },
    { valor: 4, nombre: 'Abril' },
    { valor: 5, nombre: 'Mayo' },
    { valor: 6, nombre: 'Junio' },
    { valor: 7, nombre: 'Julio' },
    { valor: 8, nombre: 'Agosto' },
    { valor: 9, nombre: 'Septiembre' },
    { valor: 10, nombre: 'Octubre' },
    { valor: 11, nombre: 'Noviembre' },
    { valor: 12, nombre: 'Diciembre' }
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Nuevo Presupuesto' : 'Editar Presupuesto'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="categoria">Categoría *</Label>
            <Select
              value={formData.id_categoria_egreso?.toString() || ''}
              onValueChange={(value) => handleInputChange('id_categoria_egreso', parseInt(value))}
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="anio">Año *</Label>
              <Input
                id="anio"
                type="number"
                min="2020"
                max="2030"
                value={formData.anio}
                onChange={(e) => handleInputChange('anio', parseInt(e.target.value) || new Date().getFullYear())}
              />
              {errors.anio && (
                <p className="text-sm text-red-500 mt-1">{errors.anio}</p>
              )}
            </div>

            <div>
              <Label htmlFor="mes">Mes</Label>
              <Select
                value={formData.mes?.toString() || ''}
                onValueChange={(value) => handleInputChange('mes', value ? parseInt(value) : undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Anual" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Presupuesto Anual</SelectItem>
                  {meses.map((mes) => (
                    <SelectItem key={mes.valor} value={mes.valor.toString()}>
                      {mes.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="monto">Monto Presupuestado (Bs) *</Label>
            <Input
              id="monto"
              type="number"
              step="0.01"
              min="0"
              value={formData.monto_presupuestado}
              onChange={(e) => handleInputChange('monto_presupuestado', parseFloat(e.target.value) || 0)}
              placeholder="0.00"
            />
            {errors.monto_presupuestado && (
              <p className="text-sm text-red-500 mt-1">{errors.monto_presupuestado}</p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="activo"
              checked={formData.activo}
              onCheckedChange={(checked) => handleInputChange('activo', checked)}
            />
            <Label htmlFor="activo">Presupuesto activo</Label>
          </div>

          {/* Preview */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">Vista previa:</p>
            <div className="text-sm">
              <div><strong>Período:</strong> {formData.mes ? meses.find(m => m.valor === formData.mes)?.nombre : 'Anual'} {formData.anio}</div>
              <div><strong>Monto:</strong> Bs {formData.monto_presupuestado.toFixed(2)}</div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            {mode === 'create' ? 'Crear Presupuesto' : 'Guardar Cambios'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
