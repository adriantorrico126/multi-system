import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { api } from '@/services/api';
import { Table, Link2, Users, XCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

interface Mesa {
  id_mesa: number;
  numero: number;
  capacidad: number;
  estado: string;
  id_sucursal: number;
}

interface GrupoMesa {
  id_grupo_mesa: number;
  mesas: Mesa[];
}

export function GrupoMesasMesero({ sucursalId, idRestaurante }: { sucursalId: number, idRestaurante: number }) {
  const queryClient = useQueryClient();
  const [selectedMesas, setSelectedMesas] = useState<number[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [mesaAEliminar, setMesaAEliminar] = useState<{ id_grupo: number, id_mesa: number } | null>(null);

  // Mesas libres
  const { data: mesasLibres = [], isLoading: loadingLibres, refetch: refetchMesas } = useQuery<Mesa[]>({
    queryKey: ['mesas-libres', sucursalId],
    queryFn: async () => {
      const res = await api.get(`/api/v1/mesas?sucursal=${sucursalId}`);
      return (res.data?.data || []).filter((m: Mesa) => m.estado === 'libre');
    },
    refetchInterval: 10000,
    enabled: !!sucursalId,
  });

  // Grupos activos
  const { data: grupos = [], isLoading: loadingGrupos, refetch: refetchGrupos } = useQuery<GrupoMesa[]>({
    queryKey: ['grupos-mesas', idRestaurante],
    queryFn: async () => {
      const res = await api.get(`/api/v1/grupos-mesas/activos?id_restaurante=${idRestaurante}`);
      return res.data?.data || [];
    },
    refetchInterval: 10000,
    enabled: !!idRestaurante,
  });

  // Crear grupo
  const crearGrupoMutation = useMutation({
    mutationFn: async (mesas: number[]) => {
      await api.post('/api/v1/grupos-mesas', {
        id_restaurante: idRestaurante,
        id_sucursal: sucursalId,
        mesas,
      });
    },
    onSuccess: () => {
      setSelectedMesas([]);
      refetchMesas();
      refetchGrupos();
    },
  });

  // Cerrar grupo
  const cerrarGrupoMutation = useMutation({
    mutationFn: async (id_grupo: number) => {
      await api.post(`/api/v1/grupos-mesas/${id_grupo}/cerrar`);
    },
    onSuccess: () => {
      refetchMesas();
      refetchGrupos();
    },
  });

  // Agregar función para remover mesa de grupo
  const removerMesaMutation = useMutation({
    mutationFn: async ({ id_grupo, id_mesa }: { id_grupo: number, id_mesa: number }) => {
      await api.delete(`/api/v1/grupos-mesas/${id_grupo}/mesas/${id_mesa}`);
    },
    onSuccess: () => {
      refetchMesas();
      refetchGrupos();
    },
  });
  function removerMesaDeGrupo(id_grupo: number, id_mesa: number) {
    removerMesaMutation.mutate({ id_grupo, id_mesa });
  }

  function handleQuitarMesa(id_grupo: number, id_mesa: number) {
    setMesaAEliminar({ id_grupo, id_mesa });
    setConfirmOpen(true);
  }
  function confirmarQuitarMesa() {
    if (mesaAEliminar) {
      removerMesaDeGrupo(mesaAEliminar.id_grupo, mesaAEliminar.id_mesa);
      setConfirmOpen(false);
      setMesaAEliminar(null);
    }
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-3 mt-8">Unir Mesas (Grupo)</h2>
      {loadingLibres ? (
        <div>Cargando mesas libres...</div>
      ) : (
        <div className="flex flex-wrap gap-3 mb-4">
          {mesasLibres.map((mesa) => (
            <button
              key={mesa.id_mesa}
              className={`px-4 py-2 rounded-full border-2 font-semibold flex items-center gap-2 shadow-sm transition-all duration-150 text-base
                ${selectedMesas.includes(mesa.id_mesa)
                  ? 'bg-blue-600 text-white border-blue-600 scale-105'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50 hover:border-blue-400'}
              `}
              onClick={() => setSelectedMesas(prev => prev.includes(mesa.id_mesa) ? prev.filter(id => id !== mesa.id_mesa) : [...prev, mesa.id_mesa])}
            >
              <Table className="w-5 h-5" /> Mesa {mesa.numero}
            </button>
          ))}
        </div>
      )}
      <Button
        onClick={() => crearGrupoMutation.mutate(selectedMesas)}
        disabled={selectedMesas.length < 2 || crearGrupoMutation.isPending}
        variant="default"
        size="lg"
        className="font-bold text-base flex items-center gap-2 px-6 py-3 mt-2 shadow-md hover:scale-105 transition-transform"
      >
        <Link2 className="w-5 h-5" /> Unir Mesas Seleccionadas
      </Button>

      <h2 className="text-xl font-bold mt-10 mb-3">Grupos Activos</h2>
      {loadingGrupos ? (
        <div>Cargando grupos...</div>
      ) : grupos.length === 0 ? (
        <div className="text-gray-500">No hay grupos activos.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {grupos.map((grupo) => (
            <div key={grupo.id_grupo_mesa} className="bg-white rounded-xl shadow-lg p-5 border border-gray-100 flex flex-col gap-3">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-6 h-6 text-blue-500" />
                <span className="font-bold text-lg text-gray-800">Grupo #{grupo.id_grupo_mesa}</span>
              </div>
              <div className="flex flex-wrap gap-2 mb-2">
                {grupo.mesas.map((mesa) => (
                  <span key={mesa.id_mesa} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-100 text-blue-800 font-semibold text-sm">
                    <Table className="w-4 h-4" /> Mesa {mesa.numero}
                    <Button size="xs" variant="ghost" className="ml-1 text-red-600 hover:bg-red-100" onClick={() => handleQuitarMesa(grupo.id_grupo_mesa, mesa.id_mesa)}>
                      Quitar
                    </Button>
                  </span>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="font-semibold flex items-center gap-2 text-red-600 border-red-300 hover:bg-red-50 hover:border-red-500 transition-all"
                onClick={() => cerrarGrupoMutation.mutate(grupo.id_grupo_mesa)}
                disabled={cerrarGrupoMutation.isPending}
              >
                <XCircle className="w-5 h-5" /> Cerrar Grupo
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Modal de confirmación */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-md w-full">
          <DialogHeader>
            <DialogTitle>¿Quitar mesa del grupo?</DialogTitle>
          </DialogHeader>
          <div>¿Estás seguro de que deseas quitar esta mesa del grupo? Esta acción no se puede deshacer.</div>
          <DialogFooter>
            <Button onClick={confirmarQuitarMesa} variant="destructive">Quitar</Button>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancelar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 