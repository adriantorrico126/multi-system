import { useState, useCallback, useMemo, useEffect } from 'react';
import { Product, CartItem } from '@/types/restaurant';
import { useQuery } from '@tanstack/react-query';
import { getPromocionesActivas } from '@/services/api';

export function useCart() {
  // Cargar carrito desde localStorage al inicializar
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const savedCart = localStorage.getItem('pos-cart');
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (error) {
      console.error('Error loading cart from localStorage, clearing cart:', error);
      // Si hay un error al parsear, limpiar el carrito corrupto
      localStorage.removeItem('pos-cart');
      return [];
    }
  });
  
  const [appliedPromociones, setAppliedPromociones] = useState<any[]>(() => {
    try {
      const savedPromociones = localStorage.getItem('pos-applied-promociones');
      return savedPromociones ? JSON.parse(savedPromociones) : [];
    } catch (error) {
      console.error('Error loading promociones from localStorage, clearing promociones:', error);
      // Si hay un error al parsear, limpiar las promociones corruptas
      localStorage.removeItem('pos-applied-promociones');
      return [];
    }
  });

  // Guardar carrito en localStorage cada vez que cambie
  useEffect(() => {
    try {
      localStorage.setItem('pos-cart', JSON.stringify(cart));
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
    }
  }, [cart]);

  // Guardar promociones en localStorage cada vez que cambien
  useEffect(() => {
    try {
      localStorage.setItem('pos-applied-promociones', JSON.stringify(appliedPromociones));
    } catch (error) {
      console.error('Error saving promociones to localStorage:', error);
    }
  }, [appliedPromociones]);

  const { data: promociones = [] } = useQuery({
    queryKey: ['promociones-activas'],
    queryFn: getPromocionesActivas,
  });

  const addToCart = useCallback((product: Product, notes?: string) => {
    setCart((currentCart) => {
      const existingItem = currentCart.find((item) => 
        (item.originalId === product.id || item.id === product.id) && item.notes === notes
      );
      if (existingItem) {
        return currentCart.map((item) =>
          (item.originalId === product.id || item.id === product.id) && item.notes === notes 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      
      const cartItemId = `${product.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const precioOriginal = product.price_original || product.price;
      const precioConDescuento = product.price;
      const tieneDescuentoBackend = product.price_original && product.price_original !== product.price;
      
      const newItem = { 
        ...product, 
        id: cartItemId, 
        originalId: product.id, 
        originalPrice: precioOriginal, 
        price: precioConDescuento, 
        quantity: 1, 
        notes: notes || '' 
      };
      
      if (!tieneDescuentoBackend) {
        const promocionesAplicables = promociones.filter(promocion => 
          promocion.id_producto.toString() === product.id || 
          promocion.id_producto === parseInt(product.id)
        );
        
        if (promocionesAplicables.length > 0) {
          const promocion = promocionesAplicables[0];
          let newPrice = precioOriginal;
          
          switch (promocion.tipo) {
            case 'porcentaje':
              newPrice = precioOriginal * (1 - promocion.valor / 100);
              break;
            case 'monto_fijo':
              newPrice = Math.max(0, precioOriginal - promocion.valor);
              break;
            case 'precio_fijo':
              newPrice = promocion.valor;
              break;
            default:
              newPrice = precioOriginal;
          }
          
          const itemConPromocion = {
            ...newItem,
            price: newPrice,
            originalPrice: precioOriginal,
            appliedPromocion: promocion
          };
          
          setAppliedPromociones(prev => [...prev, promocion]);
          
          return [...currentCart, itemConPromocion];
        }
      } else {
        if (product.promotion_applied) {
          setAppliedPromociones(prev => [...prev, product.promotion_applied]);
        }
      }
      
      return [...currentCart, newItem];
    });
  }, [promociones]);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity === 0) {
      setCart((currentCart) => currentCart.filter((item) => item.id !== id));
      return;
    }
    setCart((currentCart) => currentCart.map((item) => (item.id === id ? { 
      ...item, 
      quantity,
      originalPrice: item.originalPrice || item.price
    } : item)));
  }, []);

  const removeFromCart = useCallback((id: string) => {
    setCart((currentCart) => currentCart.filter((item) => item.id !== id));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    setAppliedPromociones([]);
    // Limpiar también del localStorage
    try {
      localStorage.removeItem('pos-cart');
      localStorage.removeItem('pos-applied-promociones');
    } catch (error) {
      console.error('Error clearing cart from localStorage:', error);
    }
  }, []);

  // 🛡️ Nueva función para limpiar carrito solo después de venta exitosa
  const clearCartAfterSale = useCallback(() => {
    console.log('🛒 Limpiando carrito después de venta exitosa');
    clearCart();
  }, [clearCart]);

  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.originalPrice || item.price) * item.quantity, 0);
  }, [cart]);

  const totalDescuentos = useMemo(() => {
    return cart.reduce((sum, item) => {
      const descuento = (item.originalPrice || item.price) - item.price;
      return sum + descuento * item.quantity;
    }, 0);
  }, [cart]);

  const total = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cart]);

  return {
    cart,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    clearCartAfterSale, // 🛡️ Nueva función exportada
    subtotal,
    totalDescuentos,
    total,
    appliedPromociones,
  };
}
