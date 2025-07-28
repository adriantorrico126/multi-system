import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/services/api';
import { CalendarDays, User, Users, CheckCircle, XCircle, Plus, Clock, Trash2 } from 'lucide-react';

interface Reserva {
  id_reserva: number;
  id_mesa: number;
  nombre_cliente: string;
  telefono_cliente: string;
  email_cliente: string;
  fecha_hora_inicio: string;
  fecha_hora_fin: string;
  numero_personas: number;
  estado: string;
  observaciones?: string;
  mesa_numero?: number;
}

interface Mesa {
  id_mesa: number;
  numero: number;
  capacidad: number;
  estado: string;
}

export function ReservasMesero({ sucursalId, idRestaurante, userId }: { sucursalId: number, idRestaurante: number, userId: number }) {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<any>({});
  const [selectedMesa, setSelectedMesa] = useState<number | null>(null);

  // Reservas próximas
  const { data: reservas = [], isLoading: loadingReservas, refetch } = useQuery<Reserva[]>({
    queryKey: ['reservas', sucursalId],
    queryFn: async () => {
      const res = await api.get(`/api/v1/reservas?id_sucursal=${sucursalId}&estado=pendiente`);
      return res.data?.data || [];
    },
    refetchInterval: 20000,
    enabled: !!sucursalId,
  });

  // Mesas libres para reservar
  const { data: mesasLibres = [] } = useQuery<Mesa[]>({
    queryKey: ['mesas-libres', sucursalId],
    queryFn: async () => {
      const res = await api.get(`/api/v1/mesas?sucursal=${sucursalId}&estado=libre`);
      return res.data?.data || [];
    },
    enabled: !!sucursalId,
  });

  // Crear reserva
  const crearReservaMutation = useMutation({
    mutationFn: async (data: any) => {
      await api.post('/api/v1/reservas', data);
    },
    onSuccess: () => {
      setModalOpen(false);
      setForm({});
      setSelectedMesa(null);
      refetch();
      queryClient.invalidateQueries(['reservas', sucursalId]);
    },
  });

  // Actualizar estado
  const actualizarReservaMutation = useMutation({
    mutationFn: async ({ id_reserva, estado }: { id_reserva: number, estado: string }) => {
      await api.patch(`/api/v1/reservas/${id_reserva}`, { estado });
    },
    onSuccess: () => {
      refetch();
    },
  });

  // Eliminar reserva
  const eliminarReservaMutation = useMutation({
    mutationFn: async (id_reserva: number) => {
      await api.delete(`/api/v1/reservas/${id_reserva}`);
    },
    onSuccess: () => {
      refetch();
    },
  });

  // Form handlers
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCreateReserva = () => {
    if (!selectedMesa) return;
    crearReservaMutation.mutate({
      id_restaurante: idRestaurante,
      id_sucursal: sucursalId,
      id_mesa: selectedMesa,
      nombre_cliente: form.nombre_cliente,
      telefono_cliente: form.telefono_cliente,
      email_cliente: form.email_cliente,
      fecha_hora_inicio: form.fecha_hora_inicio,
      fecha_hora_fin: form.fecha_hora_fin,
      numero_personas: form.numero_personas,
      observaciones: form.observaciones,
      registrado_por: userId,
    });
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Reservas Próximas</h2>
        <Button variant="default" size="lg" className="font-bold flex items-center gap-2" onClick={() => setModalOpen(true)}>
          <Plus className="w-5 h-5" /> Nueva Reserva
        </Button>
      </div>
      {loadingReservas ? (
        <div>Cargando reservas...</div>
      ) : reservas.length === 0 ? (
        <div className="text-gray-500">No hay reservas próximas.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reservas.map((reserva) => (
            <Card key={reserva.id_reserva} className="rounded-xl shadow-lg border border-gray-100 bg-white flex flex-col justify-between">
              <CardHeader className="pb-2 flex flex-row items-center gap-2">
                <CalendarDays className="w-6 h-6 text-blue-500" />
                <CardTitle className="text-lg font-bold">Mesa {reserva.mesa_numero || reserva.id_mesa}</CardTitle>
                <Badge className={`ml-auto px-3 py-1 rounded-full text-xs font-semibold ${reserva.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-800' : reserva.estado === 'cumplida' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{reserva.estado}</Badge>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-gray-700"><User className="w-4 h-4" /> {reserva.nombre_cliente}</div>
                <div className="flex items-center gap-2 text-gray-700"><Users className="w-4 h-4" /> {reserva.numero_personas} personas</div>
                <div className="flex items-center gap-2 text-gray-700"><Clock className="w-4 h-4" /> {new Date(reserva.fecha_hora_inicio).toLocaleString()} - {new Date(reserva.fecha_hora_fin).toLocaleTimeString()}</div>
                {reserva.telefono_cliente && <div className="flex items-center gap-2 text-gray-500 text-sm"><span>📞</span> {reserva.telefono_cliente}</div>}
                {reserva.email_cliente && <div className="flex items-center gap-2 text-gray-500 text-sm"><span>✉️</span> {reserva.email_cliente}</div>}
                {reserva.observaciones && <div className="text-gray-500 text-xs italic">{reserva.observaciones}</div>}
                <div className="flex gap-2 mt-2">
                  {reserva.estado === 'pendiente' && (
                    <Button size="sm" variant="outline" className="text-green-700 border-green-300 hover:bg-green-50 hover:border-green-500" onClick={() => actualizarReservaMutation.mutate({ id_reserva: reserva.id_reserva, estado: 'cumplida' })}>
                      <CheckCircle className="w-4 h-4 mr-1" /> Cumplida
                    </Button>
                  )}
                  {reserva.estado === 'pendiente' && (
                    <Button size="sm" variant="outline" className="text-red-700 border-red-300 hover:bg-red-50 hover:border-red-500" onClick={() => actualizarReservaMutation.mutate({ id_reserva: reserva.id_reserva, estado: 'cancelada' })}>
                      <XCircle className="w-4 h-4 mr-1" /> Cancelar
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" className="text-gray-400 hover:text-red-600" onClick={() => eliminarReservaMutation.mutate(reserva.id_reserva)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      {/* Modal para nueva reserva */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg w-full">
          <DialogHeader>
            <DialogTitle>Nueva Reserva</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <label className="font-semibold">Mesa</label>
            <div className="flex flex-wrap gap-2">
              {mesasLibres.map((mesa) => (
                <button
                  key={mesa.id_mesa}
                  className={`px-4 py-2 rounded-full border-2 font-semibold flex items-center gap-2 shadow-sm transition-all duration-150 text-base
                    ${selectedMesa === mesa.id_mesa ? 'bg-blue-600 text-white border-blue-600 scale-105' : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50 hover:border-blue-400'}
                  `}
                  onClick={() => setSelectedMesa(mesa.id_mesa)}
                >
                  <Users className="w-5 h-5" /> Mesa {mesa.numero}
                </button>
              ))}
            </div>
            <label className="font-semibold mt-2">Nombre del Cliente</label>
            <Input name="nombre_cliente" value={form.nombre_cliente || ''} onChange={handleFormChange} placeholder="Nombre completo" />
            <label className="font-semibold mt-2">Teléfono</label>
            <Input name="telefono_cliente" value={form.telefono_cliente || ''} onChange={handleFormChange} placeholder="Teléfono" />
            <label className="font-semibold mt-2">Email</label>
            <Input name="email_cliente" value={form.email_cliente || ''} onChange={handleFormChange} placeholder="Email" />
            <label className="font-semibold mt-2">Fecha y Hora de Inicio</label>
            <Input name="fecha_hora_inicio" type="datetime-local" value={form.fecha_hora_inicio || ''} onChange={handleFormChange} />
            <label className="font-semibold mt-2">Fecha y Hora de Fin</label>
            <Input name="fecha_hora_fin" type="datetime-local" value={form.fecha_hora_fin || ''} onChange={handleFormChange} />
            <label className="font-semibold mt-2">Número de Personas</label>
            <Input name="numero_personas" type="number" min={1} value={form.numero_personas || ''} onChange={handleFormChange} />
            <label className="font-semibold mt-2">Observaciones</label>
            <Textarea name="observaciones" value={form.observaciones || ''} onChange={handleFormChange} rows={2} />
          </div>
          <DialogFooter>
            <Button onClick={handleCreateReserva} disabled={!selectedMesa || crearReservaMutation.isPending} className="font-bold flex items-center gap-2">
              <CheckCircle className="w-5 h-5" /> Guardar Reserva
            </Button>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 