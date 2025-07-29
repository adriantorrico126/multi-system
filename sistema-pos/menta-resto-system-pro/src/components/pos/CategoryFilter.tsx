import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface Category {
  id_categoria: number;
  nombre: string;
}

interface CategoryFilterProps {
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
  isLoading: boolean;
}

export function CategoryFilter({ categories, selectedCategory, onSelectCategory, isLoading }: CategoryFilterProps) {
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Verificar si hay scroll disponible
  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  // Scroll a la izquierda
  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  // Scroll a la derecha
  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  // Verificar scroll al cargar y cuando cambian las categorías
  useEffect(() => {
    checkScroll();
    const handleResize = () => checkScroll();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [categories]);

  if (isLoading) {
    return <div>Cargando categorías...</div>;
  }

  return (
    <div className="relative w-full">
      {/* Flecha izquierda */}
      {showLeftArrow && (
        <button
          onClick={scrollLeft}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white/90 backdrop-blur-sm border border-gray-200/50 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center text-gray-600 hover:text-gray-800 scroll-arrow"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      )}

      {/* Contenedor scrollable */}
      <div
        ref={scrollContainerRef}
        className="flex gap-2 overflow-x-auto scrollbar-hide horizontal-scroll px-2"
        onScroll={checkScroll}
      >
        <Button
          variant={selectedCategory === 'all' ? 'default' : 'outline'}
          onClick={() => onSelectCategory('all')}
          className="rounded-full flex-shrink-0 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 category-button"
        >
          Todos
        </Button>
        {categories.map((category) => (
          <Button
            key={category.id_categoria}
            variant={selectedCategory === category.id_categoria.toString() ? 'default' : 'outline'}
            onClick={() => onSelectCategory(category.id_categoria.toString())}
            className="rounded-full flex-shrink-0 bg-white/80 backdrop-blur-sm border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-200 category-button"
          >
            {category.nombre}
          </Button>
        ))}
      </div>

      {/* Flecha derecha */}
      {showRightArrow && (
        <button
          onClick={scrollRight}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white/90 backdrop-blur-sm border border-gray-200/50 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center text-gray-600 hover:text-gray-800 scroll-arrow"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
