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

  // Para mobile: expandir también al hacer click en el card
  const handleExpand = () => setExpanded(true);
  const handleCollapse = () => setExpanded(false);

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

  // Partículas animadas para fondo
  const particles = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    delay: Math.random() * 2,
    duration: 2 + Math.random() * 2,
    color: i % 2 === 0 ? '#00eaff' : '#ff2d75',
    size: 2 + Math.random() * 3
  }));

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 overflow-hidden">
      {/* Fondo animado con gradiente y partículas */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 animate-bg-gradient bg-gradient-to-br from-white via-blue-50 to-pink-50 opacity-90" />
        <div className="absolute inset-0 pointer-events-none">
          {particles.map((p) => (
            <div
              key={p.id}
              className="absolute rounded-full opacity-60 animate-particle"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: `${p.size}px`,
                height: `${p.size}px`,
                background: p.color,
                animationDelay: `${p.delay}s`,
                animationDuration: `${p.duration}s`,
                filter: `blur(0.5px)`
              }}
            />
          ))}
        </div>
      </div>

      {/* Card principal */}
      <div
        className={cn(
          'relative flex flex-col items-center justify-center transition-all duration-500',
          expanded ? 'w-[370px] h-[440px] animate-flip-in' : 'w-[220px] h-[80px] cursor-pointer animate-flip-out',
        )}
        tabIndex={0}
        onMouseEnter={handleExpand}
        onMouseLeave={handleCollapse}
        onFocus={handleExpand}
        onClick={() => !expanded && handleExpand()}
        style={{ outline: 'none' }}
      >
        {/* Bordes animados y esquinas cortadas */}
        <span className="absolute inset-0 pointer-events-none" aria-hidden>
          <svg width="100%" height="100%" className="absolute inset-0 w-full h-full">
            <rect
              x="6" y="6" width="calc(100% - 12)" height="calc(100% - 12)"
              rx="24" ry="24"
              fill="none"
              stroke="url(#borderGradient)"
              strokeWidth="3"
              style={{ filter: 'drop-shadow(0 0 8px #00eaff) drop-shadow(0 0 8px #ff2d75)' }}
            />
            <defs>
              <linearGradient id="borderGradient" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#00eaff" />
                <stop offset="50%" stopColor="#fff" />
                <stop offset="100%" stopColor="#ff2d75" />
              </linearGradient>
            </defs>
          </svg>
          {/* Líneas de escaneo animadas */}
          {expanded && (
            <div className="absolute left-0 w-full h-1/6 animate-scan-line bg-gradient-to-r from-transparent via-blue-300/60 to-transparent" style={{ top: '22%' }} />
          )}
          {expanded && (
            <div className="absolute left-0 w-full h-1/6 animate-scan-line2 bg-gradient-to-r from-transparent via-pink-300/60 to-transparent" style={{ top: '68%' }} />
          )}
        </span>
        {/* Card visual */}
        <div className={cn(
          'relative z-10 flex flex-col items-center justify-center w-full h-full bg-white rounded-2xl shadow-2xl transition-all duration-500',
          expanded ? 'p-8' : 'p-0',
        )}>
          {/* Estado inicial: solo LOGIN */}
          {!expanded && (
            <div className="flex items-center justify-center w-full h-full">
              <span className="text-lg font-semibold tracking-widest text-gray-800">LOGIN</span>
            </div>
          )}
          {/* Estado expandido: formulario */}
          {expanded && (
            <form onSubmit={handleSubmit} className="w-full flex flex-col gap-6 animate-fade-in">
              <h2 className="text-center text-2xl font-bold tracking-widest text-gray-800 mb-2">LOGIN</h2>
              <div className="flex flex-col gap-3">
                <Label htmlFor="username" className="text-sm text-gray-700">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Username"
                  className="h-11 rounded-lg border border-gray-300 focus:border-blue-400 focus:ring-blue-200 bg-white px-4 text-gray-800"
                  autoComplete="username"
                  disabled={loading}
                />
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="password" className="text-sm text-gray-700">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Password"
                  className="h-11 rounded-lg border border-gray-300 focus:border-blue-400 focus:ring-blue-200 bg-white px-4 text-gray-800"
                  autoComplete="current-password"
                  disabled={loading}
                />
              </div>
              {error && (
                <div className="text-red-600 text-sm animate-shake">{error}</div>
              )}
              <Button
                ref={buttonRef}
                type="submit"
                disabled={loading || !username || !password}
                className="w-full h-11 rounded-lg bg-cyan-400 hover:bg-cyan-500 text-white font-semibold shadow-md transition-all duration-200 animate-pulse-btn"
              >
                {loading ? 'Loading...' : 'Sign in'}
              </Button>
              <div className="flex justify-between text-xs mt-2">
                <span className="text-gray-400 hover:underline cursor-pointer">Forgot Password</span>
                <span className="text-pink-500 hover:underline cursor-pointer">Sign up</span>
              </div>
            </form>
          )}
        </div>
      </div>
      {/* Animaciones CSS para fondo, bordes, partículas, scan lines y botón */}
      <style>{`
        @keyframes border-expand {
          0% { box-shadow: 0 0 0 2px #fff, 0 0 8px 1px #00eaff, 0 0 8px 1px #ff2d75; }
          100% { box-shadow: 0 0 0 2px #fff, 0 0 16px 2px #00eaff, 0 0 16px 2px #ff2d75; }
        }
        @keyframes border-idle {
          0%, 100% { box-shadow: 0 0 0 2px #fff, 0 0 8px 1px #00eaff, 0 0 8px 1px #ff2d75; }
        }
        .animate-border-expand { animation: border-expand 0.5s forwards; }
        .animate-border-idle { animation: border-idle 0.5s forwards; }
        @keyframes fade-in {
          from { opacity: 0; transform: scale(0.98); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in { animation: fade-in 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
        @keyframes flip-in {
          from { transform: rotateY(40deg) scale(0.95); opacity: 0.7; }
          to { transform: rotateY(0deg) scale(1); opacity: 1; }
        }
        @keyframes flip-out {
          from { transform: rotateY(0deg) scale(1); opacity: 1; }
          to { transform: rotateY(40deg) scale(0.95); opacity: 0.7; }
        }
        .animate-flip-in { animation: flip-in 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-flip-out { animation: flip-out 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
        @keyframes bg-gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-bg-gradient {
          background-size: 200% 200%;
          animation: bg-gradient 8s ease-in-out infinite;
        }
        @keyframes particle {
          0% { opacity: 0.5; transform: translateY(0); }
          50% { opacity: 1; transform: translateY(-10px); }
          100% { opacity: 0.5; transform: translateY(0); }
        }
        .animate-particle { animation: particle 3s ease-in-out infinite; }
        @keyframes scan-line {
          0% { opacity: 0; left: -100%; }
          10% { opacity: 1; }
          50% { opacity: 1; left: 100%; }
          100% { opacity: 0; left: 100%; }
        }
        .animate-scan-line { animation: scan-line 2.2s linear infinite; }
        .animate-scan-line2 { animation: scan-line 2.2s 1.1s linear infinite; }
        @keyframes pulse-btn {
          0%, 100% { box-shadow: 0 0 0 0 #00eaff44; }
          50% { box-shadow: 0 0 16px 4px #00eaff88; }
        }
        .animate-pulse-btn { animation: pulse-btn 1.6s infinite; }
      `}</style>
    </div>
  );
}

