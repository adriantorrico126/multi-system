import { Button } from '@/components/ui/button';

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
  if (isLoading) {
    return <div>Cargando categorías...</div>;
  }

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      <Button
        variant={selectedCategory === 'all' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onSelectCategory('all')}
        className={selectedCategory === 'all' ? 'bg-green-600 hover:bg-green-700' : ''}
      >
        Todos
      </Button>
      {categories.map((category) => (
        <Button
          key={category.id_categoria}
          variant={selectedCategory === category.id_categoria.toString() ? 'default' : 'outline'}
          size="sm"
          onClick={() => onSelectCategory(category.id_categoria.toString())}
          className={selectedCategory === category.id_categoria.toString() ? 'bg-green-600 hover:bg-green-700' : ''}
        >
          {category.nombre}
        </Button>
      ))}
    </div>
  );
}
