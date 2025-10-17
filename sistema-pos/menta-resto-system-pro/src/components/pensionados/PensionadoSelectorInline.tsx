import React, { useState, useEffect } from 'react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';
import { Search, CheckCircle, AlertCircle, Loader2, Calendar } from 'lucide-react';
import {
  obtenerPensionadosActivos,
  verificarConsumo,
  formatearFecha,
  obtenerColorEstado
} from '../../services/pensionadosApi';
import type { Pensionado, TipoComida } from '../../types/pensionados';

interface PensionadoSelectorInlineProps {
  onSeleccionar: (pensionado: Pensionado | null, verificacion: any) => void;
  tipoComida?: TipoComida;
}

export const PensionadoSelectorInline: React.FC<PensionadoSelectorInlineProps> = ({
  onSeleccionar,
  tipoComida = 'almuerzo'
}) => {
  const [loading, setLoading] = useState(false);
  const [verificando, setVerificando] = useState(false);
  const [pensionados, setPensionados] = useState<Pensionado[]>([]);
  const [pensionadosFiltrados, setPensionadosFiltrados] = useState<Pensionado[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [pensionadoSeleccionado, setPensionadoSeleccionado] = useState<Pensionado | null>(null);
  const [verificacionResult, setVerificacionResult] = useState<any>(null);

  useEffect(() => {
    cargarPensionadosActivos();
  }, []);

  useEffect(() => {
    filtrarPensionados();
  }, [pensionados, searchTerm]);

  const cargarPensionadosActivos = async () => {
    try {
      setLoading(true);
      const response = await obtenerPensionadosActivos();
      if (response.success && response.data) {
        setPensionados(response.data);
      }
    } catch (error: any) {
      console.error('Error al cargar pensionados:', error);
      toast.error('Error al cargar pensionados activos');
    } finally {
      setLoading(false);
    }
  };

  const filtrarPensionados = () => {
    if (!searchTerm) {
      setPensionadosFiltrados(pensionados);
      return;
    }

    const filtrados = pensionados.filter(p =>
      p.nombre_cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.documento_identidad?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setPensionadosFiltrados(filtrados);
  };

  const handleSeleccionar = async (pensionado: Pensionado) => {
    setPensionadoSeleccionado(pensionado);
    setVerificacionResult(null);

    // Verificar automáticamente si puede consumir
    try {
      setVerificando(true);
      const response = await verificarConsumo(
        pensionado.id_pensionado,
        new Date().toISOString().split('T')[0],
        tipoComida
      );

      if (response.success && response.data) {
        setVerificacionResult(response.data);
        onSeleccionar(pensionado, response.data);
      }
    } catch (error: any) {
      toast.error('Error al verificar consumo');
      console.error(error);
      onSeleccionar(null, null);
    } finally {
      setVerificando(false);
    }
  };

  return (
    <div className="space-y-3 p-4 border border-purple-200 rounded-lg bg-purple-50">
      <Label className="text-sm sm:text-base font-semibold text-purple-900">
        Seleccionar Pensionado
      </Label>

      {/* Buscador */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Buscar por nombre o documento..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 h-9"
        />
      </div>

      {/* Lista de pensionados */}
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
          </div>
        ) : pensionadosFiltrados.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-sm text-gray-500">No hay pensionados activos</p>
          </div>
        ) : (
          pensionadosFiltrados.map((pensionado) => (
            <button
              key={pensionado.id_pensionado}
              onClick={() => handleSeleccionar(pensionado)}
              className={`w-full p-3 border rounded-lg text-left transition-all text-sm ${
                pensionadoSeleccionado?.id_pensionado === pensionado.id_pensionado
                  ? 'border-purple-500 bg-purple-100'
                  : 'border-gray-200 hover:border-purple-300 bg-white'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-900">{pensionado.nombre_cliente}</span>
                    {pensionadoSeleccionado?.id_pensionado === pensionado.id_pensionado && (
                      <CheckCircle className="h-4 w-4 text-purple-600" />
                    )}
                  </div>
                  {pensionado.documento_identidad && (
                    <p className="text-xs text-gray-600">CI: {pensionado.documento_identidad}</p>
                  )}
                </div>
                <Badge className={`${obtenerColorEstado(pensionado.estado)} text-xs`}>
                  {pensionado.estado}
                </Badge>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Resultado de verificación */}
      {verificando && (
        <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
          <span className="text-xs text-blue-700">Verificando disponibilidad...</span>
        </div>
      )}

      {verificacionResult && !verificando && pensionadoSeleccionado && (
        verificacionResult.puede_consumir ? (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-green-900 text-sm">✅ Puede consumir</p>
                <p className="text-xs text-green-700 mt-1">
                  Consumos hoy: {verificacionResult.consumos_hoy} / {verificacionResult.limite_dia}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-red-900 text-sm">❌ No puede consumir</p>
                <p className="text-xs text-red-700 mt-1">{verificacionResult.motivo}</p>
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
};

