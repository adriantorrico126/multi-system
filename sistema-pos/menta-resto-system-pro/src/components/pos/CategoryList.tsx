import React, { useEffect, useState, useMemo } from 'react';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { Plus, Edit, Trash, Tag } from 'lucide-react';

interface Category {
  id_categoria: number;
  nombre: string;
  activo?: boolean;
}

const CategoryList: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const { toast } = useToast();

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

  const filteredCategories = useMemo(() => {
    return categories.filter(cat =>
      cat.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [categories, searchTerm]);

  const addMutation = useMutation({
    mutationFn: (nombre: string) => createCategory({ nombre }),
    onSuccess: async (data: any) => {
      toast({ title: 'Categoría creada', description: 'Se agregó correctamente.' });
      setAddOpen(false);
      setNewCatName('');
      try {
        const refreshed = await getCategories();
        setCategories(refreshed);
      } catch {}
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'No se pudo crear la categoría.';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, nombre }: { id: number; nombre: string }) => updateCategory(id, { nombre }),
    onSuccess: async (data: any) => {
      toast({ title: 'Categoría actualizada', description: 'Se actualizó correctamente.' });
      setEditOpen(false);
      setEditingCategory(null);
      setNewCatName('');
      try {
        const refreshed = await getCategories();
        setCategories(refreshed);
      } catch {}
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'No se pudo actualizar la categoría.';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (categoryId: number) => deleteCategory(categoryId),
    onSuccess: async (data: any) => {
      toast({ title: 'Categoría eliminada', description: 'Se eliminó correctamente.' });
      setDeleteOpen(false);
      setCategoryToDelete(null);
      try {
        const refreshed = await getCategories();
        setCategories(refreshed);
      } catch {}
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'No se pudo eliminar la categoría.';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    }
  });

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setNewCatName(category.nombre);
    setEditOpen(true);
  };

  const handleDelete = (category: Category) => {
    setCategoryToDelete(category);
    setDeleteOpen(true);
  };

  const handleConfirmEdit = () => {
    if (!editingCategory || !newCatName.trim()) {
      toast({ title: 'Validación', description: 'Ingresa un nombre válido.', variant: 'destructive' });
      return;
    }
    updateMutation.mutate({ id: editingCategory.id_categoria, nombre: newCatName.trim() });
  };

  const handleConfirmDelete = () => {
    if (!categoryToDelete) return;
    deleteMutation.mutate(categoryToDelete.id_categoria);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Gestión de Categorías
            </CardTitle>
            <Button onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Agregar Categoría
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Input
                placeholder="Buscar categorías..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
              <Tag className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            </div>
          </div>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2 text-gray-600">Cargando categorías...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">{error}</div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCategories.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-gray-500">
                        {searchTerm ? 'No se encontraron categorías que coincidan con la búsqueda.' : 'No hay categorías registradas.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCategories.map((cat) => (
                      <TableRow key={cat.id_categoria}>
                        <TableCell className="font-medium flex items-center gap-2">
                          <Tag className="h-4 w-4 text-gray-500" />
                          {cat.nombre}
                        </TableCell>
                        <TableCell>
                          <Badge variant={cat.activo !== false ? "default" : "secondary"}>
                            {cat.activo !== false ? "Activa" : "Inactiva"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleEdit(cat)}
                              disabled={updateMutation.isPending}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-red-600 hover:text-red-700"
                              onClick={() => handleDelete(cat)}
                              disabled={deleteMutation.isPending}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog para agregar categoría */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent aria-describedby="add-category-description">
          <DialogHeader>
            <DialogTitle>Nueva Categoría</DialogTitle>
          </DialogHeader>
          <div id="add-category-description" className="sr-only">
            Formulario para agregar una nueva categoría
          </div>
          <div className="space-y-3">
            <Input
              placeholder="Nombre de la categoría"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancelar</Button>
            <Button onClick={() => {
              const name = newCatName.trim();
              if (!name) {
                toast({ title: 'Validación', description: 'Ingresa un nombre.', variant: 'destructive' });
                return;
              }
              addMutation.mutate(name);
            }} disabled={addMutation.isPending}>
              {addMutation.isPending ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para editar categoría */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent aria-describedby="edit-category-description">
          <DialogHeader>
            <DialogTitle>Editar Categoría</DialogTitle>
          </DialogHeader>
          <div id="edit-category-description" className="sr-only">
            Formulario para editar una categoría existente
          </div>
          <div className="space-y-3">
            <Input
              placeholder="Nombre de la categoría"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setEditOpen(false);
              setEditingCategory(null);
              setNewCatName('');
            }}>Cancelar</Button>
            <Button onClick={handleConfirmEdit} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Actualizando...' : 'Actualizar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para confirmar eliminación */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent aria-describedby="delete-category-description">
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
          </DialogHeader>
          <div id="delete-category-description" className="sr-only">
            Confirmación para eliminar una categoría
          </div>
          <div className="space-y-3">
            <p className="text-gray-600">
              ¿Estás seguro de que quieres eliminar la categoría "{categoryToDelete?.nombre}"?
            </p>
            <p className="text-sm text-red-600">
              Esta acción no se puede deshacer y puede afectar los productos asociados.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setDeleteOpen(false);
              setCategoryToDelete(null);
            }}>Cancelar</Button>
            <Button 
              variant="destructive" 
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CategoryList; 