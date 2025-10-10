import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Loader2, ShoppingCart, AlertCircle } from 'lucide-react';
import { ModifierGroupSelector } from './ModifierGroupSelector';
import { ModifierSummary } from './ModifierSummary';
import { api } from '@/services/api';

interface Product {
  id_producto?: number;
  id?: string; // Compatibilidad con Product del sistema
  nombre?: string;
  name?: string; // Compatibilidad con Product del sistema
  precio?: number;
  price?: number; // Compatibilidad con Product del sistema
  imagen_url?: string;
}

interface ModifierModalProps {
  product: Product | null;
  open: boolean;
  onClose: () => void;
  onAddToCart: (product: Product, notes: string, modifiers: any[]) => void;
}

export function ModifierModal({
  product,
  open,
  onClose,
  onAddToCart
}: ModifierModalProps) {
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedModifiers, setSelectedModifiers] = useState<number[]>([]);
  const [modifierQuantities, setModifierQuantities] = useState<Record<number, number>>({});
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Helper para obtener el ID del producto (compatibilidad con diferentes formatos)
  const getProductId = (): number | undefined => {
    if (!product) return undefined;
    if (product.id_producto) return product.id_producto;
    if (product.id) return parseInt(product.id);
    return undefined;
  };

  // Helper para obtener el nombre del producto
  const getProductName = (): string => {
    if (!product) return '';
    return product.nombre || product.name || '';
  };

  // Helper para obtener el precio del producto
  const getProductPrice = (): number => {
    if (!product) return 0;
    return product.precio || product.price || 0;
  };

  // Helper para parsear modificadores de forma segura
  const parseModificadores = (modificadores: any): any[] => {
    if (typeof modificadores === 'string') {
      try {
        return JSON.parse(modificadores || '[]');
      } catch (e) {
        console.error('Error al parsear modificadores:', e);
        return [];
      }
    }
    return modificadores || [];
  };

  // Reiniciar estado al abrir/cerrar
  useEffect(() => {
    if (open && product) {
      loadModifierGroups();
    } else {
      // Limpiar al cerrar
      setGroups([]);
      setSelectedModifiers([]);
      setModifierQuantities({});
      setNotes('');
      setValidationError(null);
    }
  }, [open, getProductId()]);

  const loadModifierGroups = async () => {
    const productId = getProductId();
    if (!product || !productId) return;
    
    setLoading(true);
    try {
      console.log('🔍 Cargando grupos de modificadores para producto ID:', productId);
      
      // Primero intentar cargar grupos
      const gruposResponse = await api.get(
        `/modificadores/producto/${productId}/grupos`
      );
      
      const gruposData = gruposResponse.data.data || [];
      
      // Si no hay grupos, intentar cargar modificadores simples
      if (gruposData.length === 0) {
        console.log('📋 No hay grupos, intentando cargar modificadores simples...');
        try {
          const modsResponse = await api.get(
            `/modificadores/producto/${productId}`
          );
          
          const modificadores = modsResponse.data.modificadores || [];
          
          if (modificadores.length > 0) {
            console.log(`✅ ${modificadores.length} modificadores simples encontrados`);
            // Crear un grupo virtual para los modificadores simples
            const grupoVirtual = {
              id_grupo_modificador: 0,
              nombre_grupo: 'Extras',
              tipo_seleccion: 'multiple',
              minimo_seleccion: 0,
              maximo_seleccion: modificadores.length,
              modificadores: JSON.stringify(modificadores)
            };
            setGroups([grupoVirtual]);
          } else {
            console.log('ℹ️ No hay modificadores disponibles, cerrando modal...');
            handleAddToCartWithoutModifiers();
          }
        } catch (modsError) {
          console.error('Error al cargar modificadores simples:', modsError);
          handleAddToCartWithoutModifiers();
        }
      } else {
        console.log(`✅ ${gruposData.length} grupos de modificadores encontrados`);
        setGroups(gruposData);
      }
    } catch (error) {
      console.error('Error al cargar grupos de modificadores:', error);
      // En caso de error, intentar cerrar el modal
      handleAddToCartWithoutModifiers();
    } finally {
      setLoading(false);
    }
  };

  const handleSelectionChange = (
    groupId: number,
    modifierId: number,
    action: 'add' | 'remove' | 'set',
    quantity?: number
  ) => {
    if (action === 'add') {
      setSelectedModifiers(prev => [...prev, modifierId]);
      setModifierQuantities(prev => ({ ...prev, [modifierId]: quantity || 1 }));
    } else if (action === 'remove') {
      setSelectedModifiers(prev => prev.filter(id => id !== modifierId));
      setModifierQuantities(prev => {
        const newQuantities = { ...prev };
        delete newQuantities[modifierId];
        return newQuantities;
      });
    } else if (action === 'set') {
      // Para selección única, reemplazar todas las selecciones de ese grupo
      const group = groups.find(g => g.id_grupo_modificador === groupId);
      if (group) {
        const groupModifierIds = parseModificadores(group.modificadores)
          .map((m: any) => m.id_modificador);
        setSelectedModifiers(prev => 
          [...prev.filter(id => !groupModifierIds.includes(id)), modifierId]
        );
        setModifierQuantities(prev => ({ ...prev, [modifierId]: quantity || 1 }));
      }
    }
    
    // Limpiar error de validación al cambiar selección
    setValidationError(null);
  };

  const validateSelection = () => {
    // Validar grupos obligatorios
    for (const group of groups) {
      const modificadoresGrupo = parseModificadores(group.modificadores);
      const selectedInGroup = modificadoresGrupo.filter((m: any) => 
        selectedModifiers.includes(m.id_modificador)
      ).length;

      if (group.es_obligatorio && selectedInGroup < group.min_selecciones) {
        setValidationError(
          `Debe seleccionar al menos ${group.min_selecciones} opción(es) en "${group.grupo_nombre}"`
        );
        return false;
      }

      if (group.max_selecciones && selectedInGroup > group.max_selecciones) {
        setValidationError(
          `No puede seleccionar más de ${group.max_selecciones} opción(es) en "${group.grupo_nombre}"`
        );
        return false;
      }
    }

    setValidationError(null);
    return true;
  };

  const handleAddToCart = () => {
    if (!product) return;

    // Validar selección
    if (!validateSelection()) {
      return;
    }

    // Preparar modificadores seleccionados
    const selectedModifiersData = selectedModifiers.map(id => {
      // Buscar modificador en los grupos
      let modifier: any = null;
      for (const group of groups) {
        const mods = parseModificadores(group.modificadores);
        modifier = mods.find((m: any) => m.id_modificador === id);
        if (modifier) break;
      }
      
      return {
        id_modificador: id,
        nombre_modificador: modifier?.nombre_modificador || '',
        precio_aplicado: modifier?.precio_final || modifier?.precio_extra || 0,
        cantidad: modifierQuantities[id] || 1
      };
    });

    onAddToCart(product, notes, selectedModifiersData);
    onClose();
  };

  const handleAddToCartWithoutModifiers = () => {
    if (!product) return;
    onAddToCart(product, '', []);
    onClose();
  };

  // Calcular precio total
  const calculateTotal = () => {
    if (!product) return 0;
    
    const modifiersTotal = selectedModifiers.reduce((total, id) => {
      let modifier: any = null;
      for (const group of groups) {
        const mods = parseModificadores(group.modificadores);
        modifier = mods.find((m: any) => m.id_modificador === id);
        if (modifier) break;
      }
      
      if (modifier) {
        const precio = modifier.precio_final !== undefined ? modifier.precio_final : modifier.precio_extra;
        return total + (precio * (modifierQuantities[id] || 1));
      }
      return total;
    }, 0);

    return getProductPrice() + modifiersTotal;
  };

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl flex items-center gap-2">
            Personaliza tu pedido
          </DialogTitle>
          <DialogDescription className="text-base font-semibold text-gray-700">
            {getProductName()}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-1">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
                <p className="text-sm text-gray-500">Cargando opciones...</p>
              </div>
            </div>
          ) : groups.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">
                Este producto no tiene modificadores configurados
              </p>
              <Button onClick={handleAddToCartWithoutModifiers}>
                <ShoppingCart className="w-4 h-4 mr-2" />
                Agregar al carrito
              </Button>
            </div>
          ) : (
            <div className="space-y-6 pb-4">
              {/* Grupos de modificadores */}
              {groups.map((group, index) => {
                // Parsear modificadores de forma segura
                const modificadores = parseModificadores(group.modificadores);
                
                const groupData = {
                  ...group,
                  modificadores
                };
                
                return (
                  <div key={group.id_grupo_modificador}>
                    <ModifierGroupSelector
                      group={groupData}
                      selectedModifiers={selectedModifiers}
                      onSelectionChange={handleSelectionChange}
                      modifierQuantities={modifierQuantities}
                    />
                    {index < groups.length - 1 && <Separator className="my-6" />}
                  </div>
                );
              })}

              {/* Notas especiales */}
              <div className="pt-2">
                <label className="font-semibold block mb-2 text-sm">
                  Notas especiales (opcional)
                </label>
                <Textarea
                  placeholder="Ej: Sin cebolla, cocción término medio, bien cocido, etc."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="resize-none text-sm"
                />
              </div>

              {/* Error de validación */}
              {validationError && (
                <Alert variant="destructive" className="animate-in slide-in-from-top-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{validationError}</AlertDescription>
                </Alert>
              )}

              {/* Resumen */}
              {selectedModifiers.length > 0 && (
                <ModifierSummary
                  productName={getProductName()}
                  productPrice={getProductPrice()}
                  selectedModifiers={selectedModifiers.map(id => {
                    let modifier: any = null;
                    for (const group of groups) {
                      const mods = parseModificadores(group.modificadores);
                      modifier = mods.find((m: any) => m.id_modificador === id);
                      if (modifier) break;
                    }
                    return {
                      id_modificador: id,
                      nombre_modificador: modifier?.nombre_modificador || '',
                      precio_aplicado: modifier?.precio_final !== undefined 
                        ? modifier.precio_final 
                        : (modifier?.precio_extra || 0),
                      cantidad: modifierQuantities[id] || 1
                    };
                  })}
                  total={calculateTotal()}
                />
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 mt-4">
          <Button variant="outline" onClick={onClose} type="button">
            Cancelar
          </Button>
          <Button 
            onClick={handleAddToCart} 
            disabled={loading}
            type="button"
            className="min-w-[200px]"
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            Agregar - Bs {calculateTotal().toFixed(2)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

