import { useEffect, useState } from 'react';
import { apiFetch } from '@/services/api';
import { useAuth } from '@/context/AuthContext';

const PlanManagement: React.FC = () => {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  useEffect(() => {
    const fetchPlans = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await apiFetch<any[]>('/planes', {}, token || undefined);
        setPlans(data);
      } catch (err: any) {
        setError(err.message || 'Error al cargar planes.');
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchPlans();
  }, [token]);

  return (
    <div className="space-y-6">
      {loading && <div className="text-center text-blue-600">Cargando planes...</div>}
      {error && <div className="text-center text-red-600">{error}</div>}
      {/* The rest of the component's JSX would go here */}
    </div>
  );
};

export default PlanManagement; 