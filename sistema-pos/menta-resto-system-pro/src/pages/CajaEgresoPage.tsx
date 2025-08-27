import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { categoriasEgresosApi, egresosApi, type CategoriaEgreso } from '@/services/egresosApi';
import { DollarSign } from 'lucide-react';

const CajaEgresoPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const role = user?.rol || '';

  // Restringir solo a cajero
  useEffect(() => {
    if (role !== 'cajero') {
      toast.error('Acceso limitado a cajeros');
      navigate('/');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  const [categorias, setCategorias] = useState<CategoriaEgreso[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const getLocalISODate = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const [form, setForm] = useState({
    concepto: '',
    monto: '',
    fecha_egreso: getLocalISODate(),
    id_categoria_egreso: '',
    descripcion: ''
  });

  const canSubmit = useMemo(() => {
    const montoVal = Number(form.monto);
    return (
      form.concepto.trim().length > 0 &&
      Number.isFinite(montoVal) &&
      montoVal > 0 &&
      form.fecha_egreso &&
      form.id_categoria_egreso !== ''
    );
  }, [form]);

  useEffect(() => {
    (async () => {
      try {
        const data = await categoriasEgresosApi.getAll();
        setCategorias((data || []).filter(c => c.activo));
      } catch {
        toast.error('No se pudieron cargar categorías');
      }
    })();
  }, []);

  const handleChange = (key: string, value: any) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!canSubmit) {
      toast.warning('Completa concepto, monto y categoría');
      return;
    }

    // Construir payload mínimo para egreso de caja (efectivo)
    const payload = {
      concepto: form.concepto.trim(),
      descripcion: form.descripcion?.trim() || undefined,
      monto: Number(form.monto),
      fecha_egreso: form.fecha_egreso,
      id_categoria_egreso: Number(form.id_categoria_egreso),
      metodo_pago: 'efectivo' as const,
      // Política: egresos de cajero se descuentan de caja inmediatamente
      requiere_aprobacion: false,
      // Asegurar sucursal desde el contexto/token
      id_sucursal: (user as any)?.sucursal?.id || (user as any)?.id_sucursal
    };

    try {
      setLoading(true);
      const creado = await egresosApi.create(payload as any);
      // Si no quedó pagado por defecto, marcarlo como pagado inmediatamente
      if (creado && creado.id_egreso && creado.estado !== 'pagado') {
        try { await egresosApi.marcarPagado(creado.id_egreso, 'Pago inmediato de caja'); } catch {}
      }
      toast.success('Egreso de caja registrado y descontado de caja');
      // Redirigir a Información tras un breve delay para que el toast se vea
      setTimeout(() => navigate('/info-caja'), 700);
      setForm({ concepto: '', monto: '', fecha_egreso: getLocalISODate(), id_categoria_egreso: '', descripcion: '' });
    } catch (err) {
      console.error('Error creando egreso de caja:', err);
      const anyErr = err as any;
      const serverMsg = anyErr?.response?.data?.message || anyErr?.message;
      toast.error(serverMsg ? `No se pudo registrar el egreso: ${serverMsg}` : 'No se pudo registrar el egreso');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Egreso de Caja (Cajero)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Concepto *</Label>
              <Input
                value={form.concepto}
                onChange={(e) => handleChange('concepto', e.target.value)}
                placeholder="Ej: Bolsas, pasajes, insumos menores"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Monto (Bs) *</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.monto}
                  onChange={(e) => handleChange('monto', e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label>Fecha *</Label>
                <Input
                  type="date"
                  value={form.fecha_egreso}
                  onChange={(e) => handleChange('fecha_egreso', e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label>Categoría *</Label>
              <Select
                value={form.id_categoria_egreso}
                onValueChange={(v) => handleChange('id_categoria_egreso', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map((c) => (
                    <SelectItem key={c.id_categoria_egreso} value={String(c.id_categoria_egreso)}>
                      {c.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Descripción (opcional)</Label>
              <Textarea
                rows={3}
                placeholder="Detalle breve del gasto"
                value={form.descripcion}
                onChange={(e) => handleChange('descripcion', e.target.value)}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => navigate(-1)} disabled={loading}>Cancelar</Button>
              <Button onClick={handleSubmit} disabled={!canSubmit || loading}>
                Registrar egreso
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CajaEgresoPage;


