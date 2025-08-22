import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/services/api";
import { Users, Plus, ShieldCheck } from "lucide-react";

type AdminUser = {
  id_usuario: number;
  nombre: string;
  email: string;
  rol_id: number;
  activo: boolean;
  creado_en?: string;
};

type AdminRole = {
  id_rol: number;
  nombre: string;
  descripcion?: string | null;
  permisos?: any;
};

export const AdminUsers: React.FC = () => {
  const { token } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ nombre: '', email: '', password: '', rol_id: 1 });

  const rolesById = useMemo(() => {
    const map: Record<number, AdminRole> = {};
    roles.forEach(r => { map[r.id_rol] = r; });
    return map;
  }, [roles]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const t = token || undefined;
      const [adminsRes, rolesRes] = await Promise.all([
        apiFetch<{ data: AdminUser[] }>(`/admin-users`, {}, t),
        apiFetch<{ data: AdminRole[] }>(`/roles-admin`, {}, t),
      ]);
      setAdmins(adminsRes.data || []);
      setRoles(rolesRes.data || []);
    } catch (e: any) {
      setError(e.message || 'Error al cargar administradores.');
      setAdmins([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) load();
  }, [token]);

  const handleCreate = async () => {
    try {
      if (!form.nombre || !form.email || !form.password || !form.rol_id) {
        toast({ title: 'Validación', description: 'Todos los campos son obligatorios.' });
        return;
      }
      setCreating(true);
      await apiFetch(`/admin-users`, {
        method: 'POST',
        body: JSON.stringify(form)
      }, token || undefined);
      toast({ title: 'Listo', description: 'Administrador creado.' });
      setOpen(false);
      setForm({ nombre: '', email: '', password: '', rol_id: roles[0]?.id_rol || 1 });
      load();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'No se pudo crear el usuario.' });
    } finally {
      setCreating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5"/>Usuarios Administradores</CardTitle>
            <CardDescription>Gestiona los usuarios de la consola admin</CardDescription>
          </div>
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4 mr-2"/> Nuevo Admin
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading && <div className="text-sm text-slate-600">Cargando...</div>}
        {error && <div className="text-sm text-red-600">{error}</div>}
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Creado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {admins.map(a => (
                <TableRow key={a.id_usuario}>
                  <TableCell className="font-medium">{a.nombre}</TableCell>
                  <TableCell>{a.email}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-slate-500"/>
                      <span>{rolesById[a.rol_id]?.nombre || `Rol ${a.rol_id}`}</span>
                    </div>
                  </TableCell>
                  <TableCell>{a.activo ? <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Activo</Badge> : <Badge variant="secondary">Inactivo</Badge>}</TableCell>
                  <TableCell>{a.creado_en ? new Date(a.creado_en).toLocaleString() : '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nuevo Usuario Admin</DialogTitle>
            <DialogDescription>Crear un usuario con acceso a la consola admin</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm">Nombre</label>
              <Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm">Email</label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm">Password</label>
              <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm">Rol</label>
              <Select value={String(form.rol_id)} onValueChange={(v) => setForm({ ...form, rol_id: Number(v) })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un rol" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map(r => (
                    <SelectItem key={r.id_rol} value={String(r.id_rol)}>{r.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={creating}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={creating}>{creating ? 'Creando...' : 'Crear'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};


