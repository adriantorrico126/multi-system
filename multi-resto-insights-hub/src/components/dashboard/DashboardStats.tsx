import { useEffect, useState } from 'react';
import { apiFetch } from '@/services/api';
import { useAuth } from '@/context/AuthContext';

const DashboardStats: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await apiFetch<any>('/dashboard/stats', {}, token || undefined);
        setStats(data);
      } catch (err: any) {
        setError(err.message || 'Error al cargar estadísticas del dashboard.');
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchStats();
  }, [token]);

  return (
    <div className="space-y-6">
      {loading && <div className="text-center text-blue-600">Cargando estadísticas...</div>}
      {error && <div className="text-center text-red-600">{error}</div>}
    </div>
  );
};

export default DashboardStats; 