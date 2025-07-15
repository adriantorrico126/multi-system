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
        onClick={() => onSelectCategory('all')}
        className="rounded-full"
      >
        Todos
      </Button>
      {categories.map((category) => (
        <Button
          key={category.id_categoria}
          variant={selectedCategory === category.id_categoria.toString() ? 'default' : 'outline'}
          onClick={() => onSelectCategory(category.id_categoria.toString())}
          className="rounded-full"
        >
          {category.nombre}
        </Button>
      ))}
    </div>
  );
}
