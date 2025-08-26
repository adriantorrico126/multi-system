import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

import { type CategoriaEgreso } from '../../services/egresosApi';

interface CategoriaModalProps {
  open: boolean;
  onClose: () => void;
  categoria?: CategoriaEgreso;
  mode: 'create' | 'edit';
  onSave: (categoriaData: Partial<CategoriaEgreso>) => void;
}

const coloresPredeterminados = [
  { nombre: 'Azul', valor: '#3B82F6' },
  { nombre: 'Verde', valor: '#10B981' },
  { nombre: 'Amarillo', valor: '#F59E0B' },
  { nombre: 'Púrpura', valor: '#8B5CF6' },
  { nombre: 'Rojo', valor: '#EF4444' },
  { nombre: 'Gris', valor: '#6B7280' },
  { nombre: 'Índigo', valor: '#6366F1' },
  { nombre: 'Rosa', valor: '#EC4899' },
  { nombre: 'Verde Azulado', valor: '#14B8A6' },
  { nombre: 'Naranja', valor: '#F97316' }
];

const iconosPredeterminados = [
  'DollarSign', 'CreditCard', 'Banknote', 'Wallet', 'PiggyBank',
  'ShoppingCart', 'Package', 'Truck', 'Home', 'Zap',
  'Users', 'Settings', 'FileText', 'Calendar', 'Building',
  'Wrench', 'Shield', 'BookOpen', 'Monitor', 'MoreHorizontal'
];

export const CategoriaModal: React.FC<CategoriaModalProps> = ({
  open,
  onClose,
  categoria,
  mode,
  onSave
}) => {
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    color: '#3B82F6',
    icono: 'DollarSign'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (categoria && mode === 'edit') {
      setFormData({
        nombre: categoria.nombre,
        descripcion: categoria.descripcion || '',
        color: categoria.color,
        icono: categoria.icono
      });
    } else {
      setFormData({
        nombre: '',
        descripcion: '',
        color: '#3B82F6',
        icono: 'DollarSign'
      });
    }
    setErrors({});
  }, [categoria, mode, open]);

  const handleInputChange = (field: string, value: string) => {
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

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    } else if (formData.nombre.length < 2) {
      newErrors.nombre = 'El nombre debe tener al menos 2 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) return;
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Nueva Categoría' : 'Editar Categoría'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="nombre">Nombre *</Label>
            <Input
              id="nombre"
              value={formData.nombre}
              onChange={(e) => handleInputChange('nombre', e.target.value)}
              placeholder="Nombre de la categoría"
            />
            {errors.nombre && (
              <p className="text-sm text-red-500 mt-1">{errors.nombre}</p>
            )}
          </div>

          <div>
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea
              id="descripcion"
              value={formData.descripcion}
              onChange={(e) => handleInputChange('descripcion', e.target.value)}
              placeholder="Descripción opcional"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="color">Color</Label>
            <div className="flex space-x-2 mt-2">
              {coloresPredeterminados.map((color) => (
                <button
                  key={color.valor}
                  type="button"
                  className={`w-8 h-8 rounded-full border-2 ${
                    formData.color === color.valor ? 'border-gray-800' : 'border-gray-300'
                  }`}
                  style={{ backgroundColor: color.valor }}
                  onClick={() => handleInputChange('color', color.valor)}
                  title={color.nombre}
                />
              ))}
            </div>
            <Input
              className="mt-2"
              value={formData.color}
              onChange={(e) => handleInputChange('color', e.target.value)}
              placeholder="#3B82F6"
            />
          </div>

          <div>
            <Label htmlFor="icono">Icono</Label>
            <Select
              value={formData.icono}
              onValueChange={(value) => handleInputChange('icono', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {iconosPredeterminados.map((icono) => (
                  <SelectItem key={icono} value={icono}>
                    {icono}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Preview */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">Vista previa:</p>
            <div className="flex items-center space-x-2">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: formData.color }}
              />
              <span className="font-medium">{formData.nombre || 'Nombre de categoría'}</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            {mode === 'create' ? 'Crear Categoría' : 'Guardar Cambios'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
