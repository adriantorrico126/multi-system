import React, { useEffect, useState } from 'react';
import { getCategories } from '../../services/api';

const CategoryList: React.FC = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getCategories();
        setCategories(data);
      } catch (err) {
        setError('Error al obtener categorías');
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  if (loading) return <div>Cargando categorías...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div>
      <h2>Categorías</h2>
      <ul>
        {categories.map((cat) => (
          <li key={cat.id_categoria}>{cat.nombre}</li>
        ))}
      </ul>
    </div>
  );
};

export default CategoryList; 