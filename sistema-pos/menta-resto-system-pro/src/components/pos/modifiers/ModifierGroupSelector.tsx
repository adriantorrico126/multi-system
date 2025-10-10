import React, { useState, useEffect } from 'react';
import { Check, AlertCircle, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Modifier {
  id_modificador: number;
  nombre_modificador: string;
  descripcion?: string;
  precio_extra: number;
  precio_final: number;
  imagen_url?: string;
  calorias?: number;
  es_vegetariano?: boolean;
  es_vegano?: boolean;
  contiene_gluten?: boolean;
  alergenos?: string[];
  estado_stock: 'disponible' | 'stock_bajo' | 'sin_stock';
  orden_display: number;
}

interface ModifierGroup {
  id_grupo_modificador: number;
  grupo_nombre: string;
  grupo_descripcion?: string;
  grupo_tipo: 'seleccion_unica' | 'seleccion_multiple' | 'cantidad_variable';
  min_selecciones: number;
  max_selecciones: number | null;
  es_obligatorio: boolean;
  modificadores: Modifier[];
}

interface ModifierGroupSelectorProps {
  group: ModifierGroup;
  selectedModifiers: number[];
  onSelectionChange: (groupId: number, modifierId: number, action: 'add' | 'remove' | 'set', quantity?: number) => void;
  modifierQuantities: Record<number, number>;
}

export function ModifierGroupSelector({
  group,
  selectedModifiers,
  onSelectionChange,
  modifierQuantities
}: ModifierGroupSelectorProps) {
  const [validationError, setValidationError] = useState<string | null>(null);

  // Validar selección
  useEffect(() => {
    const selectedInGroup = group.modificadores.filter(m => 
      selectedModifiers.includes(m.id_modificador)
    ).length;

    if (group.es_obligatorio && selectedInGroup < group.min_selecciones) {
      setValidationError(`Debe seleccionar al menos ${group.min_selecciones}`);
    } else if (group.max_selecciones && selectedInGroup > group.max_selecciones) {
      setValidationError(`No puede seleccionar más de ${group.max_selecciones}`);
    } else {
      setValidationError(null);
    }
  }, [selectedModifiers, group]);

  const renderModifier = (modifier: Modifier) => {
    const isSelected = selectedModifiers.includes(modifier.id_modificador);
    const quantity = modifierQuantities[modifier.id_modificador] || 1;
    const isAvailable = modifier.estado_stock !== 'sin_stock';

    return (
      <Card
        key={modifier.id_modificador}
        className={`p-3 sm:p-4 transition-all cursor-pointer ${
          isSelected ? 'border-2 border-primary bg-primary/5' : 'border'
        } ${!isAvailable ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'}`}
        onClick={() => {
          if (!isAvailable) return;
          
          if (group.grupo_tipo === 'seleccion_multiple') {
            onSelectionChange(
              group.id_grupo_modificador,
              modifier.id_modificador,
              isSelected ? 'remove' : 'add'
            );
          } else if (group.grupo_tipo === 'seleccion_unica') {
            onSelectionChange(
              group.id_grupo_modificador,
              modifier.id_modificador,
              'set'
            );
          }
        }}
      >
        <div className="flex items-start gap-3">
          {/* Checkbox/Radio para selección */}
          <div className="pt-1">
            {group.grupo_tipo === 'seleccion_unica' ? (
              <RadioGroupItem
                value={String(modifier.id_modificador)}
                id={`mod-${modifier.id_modificador}`}
                disabled={!isAvailable}
              />
            ) : group.grupo_tipo === 'seleccion_multiple' ? (
              <Checkbox
                id={`mod-${modifier.id_modificador}`}
                checked={isSelected}
                disabled={!isAvailable}
              />
            ) : null}
          </div>

          {/* Imagen (opcional) */}
          {modifier.imagen_url && (
            <img
              src={modifier.imagen_url}
              alt={modifier.nombre_modificador}
              className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded"
            />
          )}

          {/* Información del modificador */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <Label
                  htmlFor={`mod-${modifier.id_modificador}`}
                  className="font-semibold cursor-pointer text-sm sm:text-base"
                >
                  {modifier.nombre_modificador}
                </Label>
                {modifier.descripcion && (
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                    {modifier.descripcion}
                  </p>
                )}
              </div>

              <div className="text-right flex-shrink-0">
                <p className="font-bold text-primary text-sm sm:text-base whitespace-nowrap">
                  {modifier.precio_final > 0 ? `+Bs ${modifier.precio_final.toFixed(2)}` : 'Gratis'}
                </p>
                {modifier.precio_extra !== modifier.precio_final && modifier.precio_final < modifier.precio_extra && (
                  <p className="text-xs line-through text-gray-400">
                    Bs {modifier.precio_extra.toFixed(2)}
                  </p>
                )}
              </div>
            </div>

            {/* Información nutricional y características */}
            <div className="flex flex-wrap gap-1 mt-2">
              {modifier.es_vegano && (
                <Badge variant="outline" className="text-xs bg-green-50 border-green-200">
                  🌱 Vegano
                </Badge>
              )}
              {modifier.es_vegetariano && !modifier.es_vegano && (
                <Badge variant="outline" className="text-xs bg-green-50 border-green-200">
                  🥬 Vegetariano
                </Badge>
              )}
              {modifier.contiene_gluten === false && (
                <Badge variant="outline" className="text-xs bg-blue-50 border-blue-200">
                  Sin Gluten
                </Badge>
              )}
              {modifier.calorias && (
                <Badge variant="outline" className="text-xs">
                  {modifier.calorias} kcal
                </Badge>
              )}
              {modifier.estado_stock === 'stock_bajo' && (
                <Badge variant="outline" className="text-xs bg-yellow-50 border-yellow-300">
                  ⚠️ Pocas unidades
                </Badge>
              )}
            </div>

            {/* Alergenos */}
            {modifier.alergenos && modifier.alergenos.length > 0 && (
              <div className="flex items-center gap-1 mt-2">
                <AlertCircle className="w-3 h-3 text-orange-500 flex-shrink-0" />
                <span className="text-xs text-orange-600">
                  Contiene: {modifier.alergenos.join(', ')}
                </span>
              </div>
            )}

            {/* Control de cantidad para tipo cantidad_variable */}
            {group.grupo_tipo === 'cantidad_variable' && isSelected && (
              <div className="flex items-center gap-2 mt-3">
                <Label className="text-sm">Cantidad:</Label>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const newQuantity = Math.max(1, quantity - 1);
                      onSelectionChange(
                        group.id_grupo_modificador,
                        modifier.id_modificador,
                        'set',
                        newQuantity
                      );
                    }}
                    className="px-2 py-1 border rounded hover:bg-gray-100"
                  >
                    -
                  </button>
                  <Input
                    type="number"
                    min="1"
                    max={modifier.stock_disponible || 999}
                    value={quantity}
                    onChange={(e) => {
                      e.stopPropagation();
                      const newQuantity = parseInt(e.target.value) || 1;
                      onSelectionChange(
                        group.id_grupo_modificador,
                        modifier.id_modificador,
                        'set',
                        newQuantity
                      );
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-16 text-center"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const newQuantity = quantity + 1;
                      onSelectionChange(
                        group.id_grupo_modificador,
                        modifier.id_modificador,
                        'set',
                        newQuantity
                      );
                    }}
                    className="px-2 py-1 border rounded hover:bg-gray-100"
                  >
                    +
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-3">
      {/* Título del grupo */}
      <div>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="font-bold text-base sm:text-lg">
            {group.grupo_nombre}
            {group.es_obligatorio && (
              <span className="text-red-500 ml-1">*</span>
            )}
          </h3>
          
          {/* Información de selección */}
          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
            {group.grupo_tipo === 'seleccion_unica' ? (
              <Badge variant="outline" className="text-xs">Selecciona 1</Badge>
            ) : group.grupo_tipo === 'seleccion_multiple' ? (
              <Badge variant="outline" className="text-xs">
                {group.max_selecciones 
                  ? `Máx. ${group.max_selecciones}` 
                  : 'Múltiple'}
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs">Cantidad variable</Badge>
            )}
          </div>
        </div>

        {/* Descripción */}
        {group.grupo_descripcion && (
          <p className="text-xs sm:text-sm text-gray-600 mt-1">
            {group.grupo_descripcion}
          </p>
        )}

        {/* Error de validación */}
        {validationError && (
          <div className="flex items-center gap-2 mt-2 text-xs sm:text-sm text-red-600 bg-red-50 p-2 rounded">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{validationError}</span>
          </div>
        )}
      </div>

      {/* Lista de modificadores */}
      <div className="space-y-2">
        {group.grupo_tipo === 'seleccion_unica' ? (
          <RadioGroup
            value={
              selectedModifiers.find(id => 
                group.modificadores.some(m => m.id_modificador === id)
              )?.toString() || ''
            }
          >
            <div className="space-y-2">
              {group.modificadores.map(renderModifier)}
            </div>
          </RadioGroup>
        ) : (
          group.modificadores.map(renderModifier)
        )}
        
        {group.modificadores.length === 0 && (
          <p className="text-sm text-gray-400 italic py-2">
            No hay modificadores disponibles en este grupo
          </p>
        )}
      </div>
    </div>
  );
}

