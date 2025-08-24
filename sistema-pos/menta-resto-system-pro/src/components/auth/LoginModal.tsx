import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useAuth } from '../../context/AuthContext';

interface LoginModalProps {
  onLoginSuccess: () => void;
}

export function LoginModal({ onLoginSuccess }: LoginModalProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { login } = useAuth();

  // Solo expandir al hacer click, no al salir el puntero
  const handleExpand = () => setExpanded(true);
  const handleCollapse = () => {
    // Solo colapsar si no hay datos ingresados
    if (!username && !password) {
      setExpanded(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      onLoginSuccess();
    } catch (err) {
      setError('Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  // Partículas animadas para fondo más sutiles
  const particles = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    delay: Math.random() * 3,
    duration: 3 + Math.random() * 2,
    color: i % 3 === 0 ? '#3b82f6' : i % 3 === 1 ? '#8b5cf6' : '#06b6d4',
    size: 1 + Math.random() * 2
  }));

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 overflow-hidden">
      {/* Fondo animado con gradiente profesional */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 animate-bg-gradient bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 opacity-95" />
        <div className="absolute inset-0 pointer-events-none">
          {particles.map((p) => (
            <div
              key={p.id}
              className="absolute rounded-full opacity-40 animate-particle"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: `${p.size}px`,
                height: `${p.size}px`,
                background: p.color,
                animationDelay: `${p.delay}s`,
                animationDuration: `${p.duration}s`,
                filter: `blur(0.3px)`
              }}
            />
          ))}
        </div>
      </div>

      {/* Card principal más profesional */}
      <div
        className={cn(
          'relative flex flex-col items-center justify-center transition-all duration-700 ease-out',
          expanded ? 'w-[420px] h-[500px] animate-slide-in' : 'w-[280px] h-[100px] cursor-pointer animate-slide-out',
        )}
        tabIndex={0}
        onClick={() => !expanded && handleExpand()}
        style={{ outline: 'none' }}
      >
        {/* Bordes profesionales con sombras sutiles */}
        <span className="absolute inset-0 pointer-events-none" aria-hidden>
          <svg width="100%" height="100%" className="absolute inset-0 w-full h-full">
            <rect
              x="4" y="4" width="98%" height="98%"
              rx="20" ry="20"
              fill="none"
              stroke="url(#borderGradient)"
              strokeWidth="2"
              style={{ filter: 'drop-shadow(0 4px 12px rgba(59, 130, 246, 0.15))' }}
            />
            <defs>
              <linearGradient id="borderGradient" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="50%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>
            </defs>
          </svg>
          {/* Líneas de escaneo más sutiles */}
          {expanded && (
            <div className="absolute left-0 w-full h-1/8 animate-scan-line bg-gradient-to-r from-transparent via-blue-400/30 to-transparent" style={{ top: '25%' }} />
          )}
          {expanded && (
            <div className="absolute left-0 w-full h-1/8 animate-scan-line2 bg-gradient-to-r from-transparent via-indigo-400/30 to-transparent" style={{ top: '75%' }} />
          )}
        </span>
        
        {/* Card visual más elegante */}
        <div className={cn(
          'relative z-10 flex flex-col items-center justify-center w-full h-full bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl transition-all duration-700 ease-out',
          expanded ? 'p-10' : 'p-0',
        )}>
          {/* Estado inicial: solo LOGIN */}
          {!expanded && (
            <div className="flex items-center justify-center w-full h-full">
              <div className="text-center">
                <span className="text-xl font-bold tracking-wider text-gray-800">SISTEMA POS</span>
                <div className="text-sm text-gray-500 mt-1">Iniciar Sesión</div>
              </div>
            </div>
          )}
          
          {/* Estado expandido: formulario profesional */}
          {expanded && (
            <form onSubmit={handleSubmit} className="w-full flex flex-col gap-6 animate-fade-in">
              <div className="text-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">SISTEMA POS</h2>
                <p className="text-sm text-gray-600">Ingresa tus credenciales para continuar</p>
              </div>
              
              <div className="flex flex-col gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm font-medium text-gray-700">Usuario</Label>
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="Ingresa tu usuario"
                    className="h-12 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 bg-white px-4 text-gray-800 transition-all duration-200"
                    autoComplete="username"
                    disabled={loading}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">Contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Ingresa tu contraseña"
                    className="h-12 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 bg-white px-4 text-gray-800 transition-all duration-200"
                    autoComplete="current-password"
                    disabled={loading}
                  />
                </div>
              </div>
              
              {error && (
                <div className="text-red-600 text-sm text-center bg-red-50 border border-red-200 rounded-lg p-3 animate-shake">
                  {error}
                </div>
              )}
              
              <Button
                ref={buttonRef}
                type="submit"
                disabled={loading || !username || !password}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-lg transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Iniciando sesión...</span>
                  </div>
                ) : (
                  'Iniciar Sesión'
                )}
              </Button>
              
              <div className="flex justify-between text-xs mt-4">
                <span className="text-gray-500 hover:text-blue-600 hover:underline cursor-pointer transition-colors">
                  ¿Olvidaste tu contraseña?
                </span>
                <span className="text-blue-600 hover:text-blue-700 hover:underline cursor-pointer transition-colors">
                  Soporte técnico
                </span>
              </div>
            </form>
          )}
        </div>
      </div>
      
      {/* Animaciones CSS mejoradas y más profesionales */}
      <style>{`
        @keyframes slide-in {
          from { 
            opacity: 0; 
            transform: scale(0.9) translateY(20px); 
          }
          to { 
            opacity: 1; 
            transform: scale(1) translateY(0); 
          }
        }
        @keyframes slide-out {
          from { 
            opacity: 1; 
            transform: scale(1) translateY(0); 
          }
          to { 
            opacity: 0.9; 
            transform: scale(0.95) translateY(-10px); 
          }
        }
        .animate-slide-in { 
          animation: slide-in 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards; 
        }
        .animate-slide-out { 
          animation: slide-out 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards; 
        }
        
        @keyframes fade-in {
          from { 
            opacity: 0; 
            transform: translateY(10px); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }
        .animate-fade-in { 
          animation: fade-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; 
        }
        
        @keyframes bg-gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-bg-gradient {
          background-size: 200% 200%;
          animation: bg-gradient 15s ease-in-out infinite;
        }
        
        @keyframes particle {
          0% { opacity: 0.3; transform: translateY(0) scale(1); }
          50% { opacity: 0.7; transform: translateY(-15px) scale(1.1); }
          100% { opacity: 0.3; transform: translateY(0) scale(1); }
        }
        .animate-particle { 
          animation: particle 4s ease-in-out infinite; 
        }
        
        @keyframes scan-line {
          0% { opacity: 0; left: -100%; }
          20% { opacity: 1; }
          80% { opacity: 1; left: 100%; }
          100% { opacity: 0; left: 100%; }
        }
        .animate-scan-line { 
          animation: scan-line 3s linear infinite; 
        }
        .animate-scan-line2 { 
          animation: scan-line 3s 1.5s linear infinite; 
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
          20%, 40%, 60%, 80% { transform: translateX(2px); }
        }
        .animate-shake { 
          animation: shake 0.6s ease-in-out; 
        }
      `}</style>
    </div>
  );
}

