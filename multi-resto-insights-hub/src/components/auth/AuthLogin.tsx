
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { 
  Shield, 
  Lock, 
  User, 
  Info, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Fingerprint,
  Smartphone,
  Key,
  Globe,
  Monitor,
  Wifi,
  MapPin,
  Calendar,
  Activity
} from "lucide-react";
import { apiFetch } from "@/services/api";
import { useAuth } from "@/context/AuthContext";

interface AuthLoginProps {
  onLogin: (authenticated: boolean) => void;
  onRoleChange: (role: string) => void;
}

interface LoginAttempt {
  timestamp: Date;
  success: boolean;
  ip?: string;
  userAgent?: string;
}

interface SecurityInfo {
  ip: string;
  location: string;
  device: string;
  browser: string;
  timestamp: Date;
}

interface PasswordStrength {
  score: number;
  feedback: string[];
  color: string;
}

export const AuthLogin: React.FC<AuthLoginProps> = ({ onLogin, onRoleChange }) => {
  // Estados básicos
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('admin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  
  // Estados de seguridad avanzada
  const [loginAttempts, setLoginAttempts] = useState<LoginAttempt[]>([]);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockTimeRemaining, setBlockTimeRemaining] = useState(0);
  const [rememberMe, setRememberMe] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({ score: 0, feedback: [], color: 'red' });
  const [securityInfo, setSecurityInfo] = useState<SecurityInfo | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [capsLockOn, setCapsLockOn] = useState(false);
  
  // Estados para recuperación de contraseña
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [resetStep, setResetStep] = useState<'email' | 'code' | 'password'>('email');
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);
  const [resetToken, setResetToken] = useState<string | null>(null);
  
  // Refs
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const twoFactorRef = useRef<HTMLInputElement>(null);
  
  const { login } = useAuth();


  // Funciones de seguridad
  const checkPasswordStrength = (pwd: string): PasswordStrength => {
    let score = 0;
    const feedback: string[] = [];
    
    if (pwd.length >= 8) score += 1;
    else feedback.push('Mínimo 8 caracteres');
    
    if (/[a-z]/.test(pwd)) score += 1;
    else feedback.push('Incluir minúsculas');
    
    if (/[A-Z]/.test(pwd)) score += 1;
    else feedback.push('Incluir mayúsculas');
    
    if (/[0-9]/.test(pwd)) score += 1;
    else feedback.push('Incluir números');
    
    if (/[^a-zA-Z0-9]/.test(pwd)) score += 1;
    else feedback.push('Incluir símbolos');
    
    let color = 'red';
    if (score >= 4) color = 'green';
    else if (score >= 3) color = 'yellow';
    else if (score >= 2) color = 'orange';
    
    return { score, feedback, color };
  };

  const getSecurityInfo = async (): Promise<SecurityInfo> => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const { ip } = await response.json();
      
      return {
        ip,
        location: 'La Paz, Bolivia', // En producción usar geolocalización real
        device: /Mobile|Android|iPhone|iPad/.test(navigator.userAgent) ? 'Móvil' : 'Escritorio',
        browser: navigator.userAgent.includes('Chrome') ? 'Chrome' : 
                navigator.userAgent.includes('Firefox') ? 'Firefox' : 
                navigator.userAgent.includes('Safari') ? 'Safari' : 'Otro',
        timestamp: new Date()
      };
    } catch {
      return {
        ip: '127.0.0.1',
        location: 'Ubicación desconocida',
        device: 'Desconocido',
        browser: 'Desconocido',
        timestamp: new Date()
      };
    }
  };

  const addLoginAttempt = (success: boolean, ip?: string) => {
    const attempt: LoginAttempt = {
      timestamp: new Date(),
      success,
      ip,
      userAgent: navigator.userAgent
    };
    
    setLoginAttempts(prev => [attempt, ...prev.slice(0, 4)]);
    
    if (!success) {
      const recentFailures = loginAttempts.filter(
        a => !a.success && Date.now() - a.timestamp.getTime() < 15 * 60 * 1000
      ).length;
      
      if (recentFailures >= 2) {
        setIsBlocked(true);
        setBlockTimeRemaining(300); // 5 minutos
      }
    }
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const detectCapsLock = (e: React.KeyboardEvent) => {
    setCapsLockOn(e.getModifierState('CapsLock'));
  };

  // Funciones para recuperación de contraseña
  const handlePasswordResetRequest = async () => {
    if (!validateEmail(resetEmail)) {
      setResetError('Por favor ingresa un email válido.');
      return;
    }

    setResetLoading(true);
    setResetError(null);
    setResetSuccess(null);

    try {
      const data = await apiFetch<{ message: string; resetToken?: string; verificationCode?: string }>(
        '/auth/request-password-reset',
        {
          method: 'POST',
          body: JSON.stringify({ email: resetEmail }),
        }
      );

      setResetToken(data.resetToken || null);
      setResetSuccess(`Se ha enviado un código de verificación a tu correo electrónico.${data.verificationCode ? ` Código de prueba: ${data.verificationCode}` : ''}`);
      setResetStep('code');
      
    } catch (err: any) {
      setResetError(err.message || 'Error al solicitar recuperación de contraseña.');
    } finally {
      setResetLoading(false);
    }
  };

  const handleCodeVerification = async () => {
    if (resetCode.length !== 6) {
      setResetError('El código de verificación debe tener 6 dígitos.');
      return;
    }

    if (!resetToken) {
      setResetError('Token de verificación no válido. Inicia el proceso nuevamente.');
      return;
    }

    setResetLoading(true);
    setResetError(null);

    try {
      const data = await apiFetch<{ message: string; passwordChangeToken: string }>(
        '/auth/verify-reset-code',
        {
          method: 'POST',
          body: JSON.stringify({ 
            token: resetToken, 
            code: resetCode 
          }),
        }
      );

      setResetToken(data.passwordChangeToken); // Actualizar token para el cambio de contraseña
      setResetSuccess('Código verificado correctamente. Ahora puedes cambiar tu contraseña.');
      setResetStep('password');
      
    } catch (err: any) {
      setResetError(err.message || 'Código de verificación incorrecto. Intenta nuevamente.');
    } finally {
      setResetLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      setResetError('Las contraseñas no coinciden.');
      return;
    }

    const strength = checkPasswordStrength(newPassword);
    if (strength.score < 3) {
      setResetError('La nueva contraseña debe ser más segura. Mínimo score 3/5.');
      return;
    }

    if (!resetToken) {
      setResetError('Token de verificación no válido. Inicia el proceso nuevamente.');
      return;
    }

    setResetLoading(true);
    setResetError(null);

    try {
      const data = await apiFetch<{ message: string }>(
        '/auth/reset-password',
        {
          method: 'POST',
          body: JSON.stringify({ 
            token: resetToken, 
            newPassword 
          }),
        }
      );

      setResetSuccess('Contraseña actualizada exitosamente. Ya puedes iniciar sesión.');
      
      // Resetear el formulario después de 3 segundos
      setTimeout(() => {
        setShowPasswordReset(false);
        setResetStep('email');
        setResetEmail('');
        setResetCode('');
        setNewPassword('');
        setConfirmPassword('');
        setResetToken(null);
        setResetSuccess(null);
        setResetError(null);
      }, 3000);
      
    } catch (err: any) {
      setResetError(err.message || 'Error al cambiar la contraseña.');
    } finally {
      setResetLoading(false);
    }
  };

  const resetPasswordReset = () => {
    setShowPasswordReset(false);
    setResetStep('email');
    setResetEmail('');
    setResetCode('');
    setNewPassword('');
    setConfirmPassword('');
    setResetToken(null);
    setResetSuccess(null);
    setResetError(null);
    setResetLoading(false);
  };

  const handleLogin = async () => {
    if (isBlocked) {
      setError(`Cuenta bloqueada por seguridad. Intenta en ${Math.ceil(blockTimeRemaining / 60)} minutos.`);
      return;
    }

    if (!validateEmail(email)) {
      setError('Por favor ingresa un email válido.');
      return;
    }

    if (passwordStrength.score < 2) {
      setError('La contraseña no cumple con los requisitos mínimos de seguridad.');
      return;
    }

    setError(null);
    setLoading(true);
    
    try {
      const secInfo = await getSecurityInfo();
      
      const data = await apiFetch<{ token: string; user: any; requiresTwoFactor?: boolean }>(
        '/auth/login',
        {
          method: 'POST',
          body: JSON.stringify({ 
            email, 
            password,
            securityInfo: secInfo,
            rememberMe
          }),
        }
      );

      if (data.requiresTwoFactor) {
        setShowTwoFactor(true);
        setTwoFactorEnabled(true);
        addLoginAttempt(false, secInfo.ip);
        setError('Se requiere autenticación de dos factores. Revisa tu dispositivo móvil.');
        return;
      }

      // Login exitoso
      addLoginAttempt(true, secInfo.ip);
      login(data.token, data.user);
      onRoleChange(data.user.rol_nombre || role);
      
      // Guardar en localStorage si "Recordarme" está activado
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
        localStorage.setItem('lastLoginTime', new Date().toISOString());
      }
      
      onLogin(true);
      
    } catch (err: any) {
      const secInfo = await getSecurityInfo();
      addLoginAttempt(false, secInfo.ip);
      setError(err.message || 'Credenciales incorrectas. Verifica tu email y contraseña.');
    } finally {
      setLoading(false);
    }
  };

  const handleTwoFactorSubmit = async () => {
    if (twoFactorCode.length !== 6) {
      setError('El código de verificación debe tener 6 dígitos.');
      return;
    }

    setLoading(true);
    try {
      const data = await apiFetch<{ token: string; user: any }>(
        '/auth/verify-2fa',
        {
          method: 'POST',
          body: JSON.stringify({ email, code: twoFactorCode }),
        }
      );

      const secInfo = await getSecurityInfo();
      addLoginAttempt(true, secInfo.ip);
      login(data.token, data.user);
      onRoleChange(data.user.rol_nombre || role);
      onLogin(true);
      
    } catch (err: any) {
      setError('Código de verificación incorrecto.');
    } finally {
      setLoading(false);
    }
  };


  // useEffect para inicialización
  useEffect(() => {
    const initializeAuth = async () => {
      // Cargar email recordado
      const rememberedEmail = localStorage.getItem('rememberedEmail');
      if (rememberedEmail) {
        setEmail(rememberedEmail);
        setRememberMe(true);
      }

      // Obtener información de seguridad
      const secInfo = await getSecurityInfo();
      setSecurityInfo(secInfo);
      setIsInitialLoad(false);
    };

    initializeAuth();
  }, []);

  // useEffect para el manejo de contraseñas
  useEffect(() => {
    if (password) {
      setPasswordStrength(checkPasswordStrength(password));
    } else {
      setPasswordStrength({ score: 0, feedback: [], color: 'red' });
    }
  }, [password]);

  // useEffect para el contador de bloqueo
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isBlocked && blockTimeRemaining > 0) {
      interval = setInterval(() => {
        setBlockTimeRemaining(prev => {
          if (prev <= 1) {
            setIsBlocked(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isBlocked, blockTimeRemaining]);

  // useEffect para enfocar campos
  useEffect(() => {
    if (showTwoFactor && twoFactorRef.current) {
      twoFactorRef.current.focus();
    } else if (!isInitialLoad && emailRef.current) {
      emailRef.current.focus();
    }
  }, [showTwoFactor, isInitialLoad]);

  // Manejo de teclas
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (showTwoFactor) {
        handleTwoFactorSubmit();
      } else {
        handleLogin();
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Efectos de fondo */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-900 to-slate-900"></div>
      <div className="absolute top-0 left-0 w-full h-full bg-grid-white/[0.02] bg-[size:50px_50px]"></div>
      
      <div className="relative z-10 w-full max-w-lg">
        {/* Panel de Información de Seguridad */}
        {securityInfo && !isInitialLoad && (
          <Card className="mb-6 bg-slate-800/30 backdrop-blur-md border-slate-700/50 shadow-xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <Globe className="h-4 w-4 text-blue-400" />
                  <span className="text-slate-300">IP: {securityInfo.ip}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-green-400" />
                  <span className="text-slate-300">{securityInfo.location}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Monitor className="h-4 w-4 text-purple-400" />
                  <span className="text-slate-300">{securityInfo.device}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Panel Principal de Login */}
        <Card className="shadow-2xl border-slate-700/50 bg-slate-800/50 backdrop-blur-md relative overflow-hidden">
          {/* Efectos decorativos */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-500/5 rounded-full translate-y-12 -translate-x-12"></div>
          
          <CardHeader className="relative z-10 text-center space-y-6 pb-6">
            {/* Logo y Branding */}
            <div className="mx-auto w-24 h-24 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-3xl flex items-center justify-center border border-blue-500/30 shadow-lg">
              <Shield className="h-12 w-12 text-blue-400" />
          </div>
            
            <div className="space-y-2">
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                ForkastBI Admin
          </CardTitle>
              <CardDescription className="text-slate-300 text-lg">
                Centro de Administración Empresarial
          </CardDescription>
              <div className="flex items-center justify-center space-x-2 text-sm text-slate-400">
                <Activity className="h-4 w-4 text-green-400" />
                <span>Sistema Activo</span>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              </div>
            </div>
        </CardHeader>
        
          <CardContent className="relative z-10 space-y-6">
            {/* Alertas de Seguridad */}
            {isBlocked && (
              <Alert className="bg-red-900/20 border-red-500/30">
                <AlertTriangle className="h-4 w-4 text-red-400" />
                <AlertDescription className="text-red-300">
                  <div className="flex items-center justify-between">
                    <span>Cuenta bloqueada por seguridad</span>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4" />
                      <span className="font-mono">{Math.floor(blockTimeRemaining / 60)}:{(blockTimeRemaining % 60).toString().padStart(2, '0')}</span>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {capsLockOn && (
              <Alert className="bg-amber-900/20 border-amber-500/30">
                <Key className="h-4 w-4 text-amber-400" />
                <AlertDescription className="text-amber-300">
                  Bloq Mayús está activado
                </AlertDescription>
              </Alert>
            )}

            {/* Panel de Información de Acceso */}
            <Card className="bg-blue-900/20 border border-blue-500/30 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2 text-blue-300 font-medium">
                  <Info className="h-5 w-5" />
                  Información de Acceso
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-3 bg-slate-800/50 rounded-lg border border-slate-600/50">
                    <Shield className="h-5 w-5 text-blue-400" />
                    <div>
                      <p className="text-white font-medium">Sistema de Administración Seguro</p>
                      <p className="text-slate-400 text-sm">Acceso restringido solo para personal autorizado</p>
                    </div>
            </div>
                  
                  <div className="flex items-center space-x-3 p-3 bg-slate-800/50 rounded-lg border border-slate-600/50">
                    <Fingerprint className="h-5 w-5 text-green-400" />
                    <div>
                      <p className="text-white font-medium">Autenticación Multi-Factor</p>
                      <p className="text-slate-400 text-sm">Protección adicional con verificación de dos pasos</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-3 bg-slate-800/50 rounded-lg border border-slate-600/50">
                    <Activity className="h-5 w-5 text-purple-400" />
                    <div>
                      <p className="text-white font-medium">Monitoreo de Seguridad</p>
                      <p className="text-slate-400 text-sm">Registro y auditoría de todos los accesos</p>
                </div>
                </div>
              </div>

                <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-4">
                  <div className="flex items-center space-x-2 text-amber-300 text-sm mb-2">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="font-medium">¿Necesitas Acceso?</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <p className="text-amber-400">
                      Para obtener credenciales de acceso al sistema:
                    </p>
                    <ul className="text-amber-300 space-y-1 ml-4">
                      <li>• Contacta al administrador del sistema</li>
                      <li>• Proporciona tu información de identificación</li>
                      <li>• Espera la aprobación y asignación de credenciales</li>
                      <li>• Configura la autenticación de dos factores</li>
                    </ul>
                  </div>
          </div>

                <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-3">
                  <div className="flex items-center space-x-2 text-green-300 text-sm">
                    <CheckCircle className="h-4 w-4" />
                    <span className="font-medium">Sistema de Prueba Activo</span>
                  </div>
                  <p className="text-green-400 text-xs mt-1">
                    Este es un entorno de desarrollo. Las credenciales están configuradas en el backend.
                  </p>
                </div>
              </CardContent>
            </Card>

            {!showTwoFactor ? (
              /* Formulario Principal de Login */
              <div className="space-y-5">
                {/* Campo de Email */}
            <div className="space-y-2">
                  <Label htmlFor="email" className="text-white font-medium flex items-center space-x-2">
                    <User className="h-4 w-4 text-blue-400" />
                    <span>Email Administrativo</span>
              </Label>
              <div className="relative">
                    <User className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <Input
                      ref={emailRef}
                  id="email"
                  type="email"
                      placeholder="tu.email@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                      onKeyDown={handleKeyPress}
                      className="pl-12 h-12 bg-slate-700/50 border-slate-600/50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-white placeholder-slate-400 transition-all duration-200"
                      disabled={isBlocked}
                />
                    {email && validateEmail(email) && (
                      <CheckCircle className="absolute right-3 top-3 h-5 w-5 text-green-400" />
                    )}
              </div>
            </div>
            
                {/* Campo de Contraseña */}
            <div className="space-y-2">
                  <Label htmlFor="password" className="text-white font-medium flex items-center space-x-2">
                    <Lock className="h-4 w-4 text-blue-400" />
                    <span>Contraseña Segura</span>
              </Label>
              <div className="relative">
                    <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <Input
                      ref={passwordRef}
                  id="password"
                  type={showPassword ? "text" : "password"}
                      placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={(e) => {
                        detectCapsLock(e);
                        handleKeyPress(e);
                      }}
                      className="pl-12 pr-12 h-12 bg-slate-700/50 border-slate-600/50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-white placeholder-slate-400 transition-all duration-200"
                      disabled={isBlocked}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 h-5 w-5 text-slate-400 hover:text-slate-300 transition-colors"
                >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
                  
                  {/* Indicador de Fortaleza de Contraseña */}
                  {password && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Fortaleza de contraseña</span>
                        <span className={`font-medium ${
                          passwordStrength.color === 'green' ? 'text-green-400' :
                          passwordStrength.color === 'yellow' ? 'text-yellow-400' :
                          passwordStrength.color === 'orange' ? 'text-orange-400' : 'text-red-400'
                        }`}>
                          {passwordStrength.score === 5 ? 'Muy Fuerte' :
                           passwordStrength.score === 4 ? 'Fuerte' :
                           passwordStrength.score === 3 ? 'Media' :
                           passwordStrength.score === 2 ? 'Débil' : 'Muy Débil'}
                        </span>
                      </div>
                      <Progress 
                        value={(passwordStrength.score / 5) * 100} 
                        className="h-2"
                      />
                      {passwordStrength.feedback.length > 0 && (
                        <div className="text-xs text-slate-400">
                          Sugerencias: {passwordStrength.feedback.join(', ')}
                        </div>
                      )}
                    </div>
                  )}
            </div>
            
                {/* Campo de Nivel de Acceso */}
            <div className="space-y-2">
                  <Label htmlFor="role" className="text-white font-medium flex items-center space-x-2">
                    <Shield className="h-4 w-4 text-blue-400" />
                    <span>Nivel de Acceso</span>
              </Label>
              <Select value={role} onValueChange={setRole}>
                    <SelectTrigger className="h-12 bg-slate-700/50 border-slate-600/50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-white">
                  <SelectValue placeholder="Selecciona tu nivel de acceso" />
                </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="admin" className="text-white hover:bg-slate-700">
                        <div className="flex items-center space-x-2">
                          <Shield className="h-4 w-4 text-red-400" />
                          <span>Super Administrador</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="manager" className="text-white hover:bg-slate-700">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-blue-400" />
                          <span>Administrador de Soporte</span>
                        </div>
                      </SelectItem>
                </SelectContent>
              </Select>
                </div>

                {/* Opciones Adicionales */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="remember" 
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                    />
                    <Label htmlFor="remember" className="text-sm text-slate-300 cursor-pointer">
                      Recordarme
                    </Label>
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 text-xs"
                      onClick={() => setShowPasswordReset(true)}
                    >
                      ¿Olvidaste tu contraseña?
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 text-xs"
                      onClick={() => window.open('mailto:admin@forkastbi.com?subject=Solicitud de Acceso - ForkastBI Admin', '_blank')}
                    >
                      Solicitar Acceso
                    </Button>
            </div>
          </div>
          
                {/* Botón de Login */}
          <Button 
            onClick={handleLogin}
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!email || !password || loading || isBlocked}
                >
                  <div className="flex items-center justify-center space-x-2">
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Verificando credenciales...</span>
                      </>
                    ) : (
                      <>
                        <Shield className="h-5 w-5" />
                        <span>Acceder al Sistema</span>
                      </>
                    )}
                  </div>
                </Button>
              </div>
            ) : (
              /* Formulario de Autenticación de Dos Factores */
              <div className="space-y-5">
                <div className="text-center space-y-3">
                  <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-2xl flex items-center justify-center border border-green-500/30">
                    <Smartphone className="h-8 w-8 text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Verificación de Seguridad</h3>
                    <p className="text-slate-300 text-sm">Ingresa el código de 6 dígitos de tu aplicación de autenticación</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="twoFactorCode" className="text-white font-medium flex items-center space-x-2">
                    <Key className="h-4 w-4 text-green-400" />
                    <span>Código de Verificación</span>
                  </Label>
                  <div className="relative">
                    <Key className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                    <Input
                      ref={twoFactorRef}
                      id="twoFactorCode"
                      type="text"
                      placeholder="000000"
                      value={twoFactorCode}
                      onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      onKeyDown={handleKeyPress}
                      className="pl-12 h-12 bg-slate-700/50 border-slate-600/50 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 text-white placeholder-slate-400 text-center text-lg font-mono tracking-widest transition-all duration-200"
                      maxLength={6}
                    />
                    {twoFactorCode.length === 6 && (
                      <CheckCircle className="absolute right-3 top-3 h-5 w-5 text-green-400" />
                    )}
                  </div>
                </div>

                <div className="flex space-x-3">
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setShowTwoFactor(false);
                      setTwoFactorCode('');
                      setError(null);
                    }}
                    className="flex-1 h-12 bg-slate-700/50 hover:bg-slate-600 text-white border-slate-600/50"
                  >
                    Volver
                  </Button>
                  <Button 
                    onClick={handleTwoFactorSubmit}
                    className="flex-1 h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-[1.02] shadow-lg"
                    disabled={twoFactorCode.length !== 6 || loading}
                  >
                    {loading ? 'Verificando...' : 'Verificar'}
          </Button>
                </div>
              </div>
            )}

            {/* Mensajes de Error */}
          {error && (
              <Alert className="bg-red-900/20 border-red-500/30">
                <AlertTriangle className="h-4 w-4 text-red-400" />
                <AlertDescription className="text-red-300">{error}</AlertDescription>
              </Alert>
            )}

            {/* Historial de Intentos de Login */}
            {loginAttempts.length > 0 && (
              <Card className="bg-slate-800/30 border-slate-700/50">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2 text-slate-300 font-medium text-sm">
                    <Clock className="h-4 w-4" />
                    Actividad Reciente
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {loginAttempts.slice(0, 3).map((attempt, index) => (
                    <div key={index} className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        {attempt.success ? (
                          <CheckCircle className="h-3 w-3 text-green-400" />
                        ) : (
                          <AlertTriangle className="h-3 w-3 text-red-400" />
                        )}
                        <span className="text-slate-300">
                          {attempt.success ? 'Login exitoso' : 'Login fallido'}
                        </span>
                      </div>
                      <span className="text-slate-400">
                        {attempt.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Footer de Seguridad */}
            <div className="space-y-3">
              <div className="flex items-center justify-center space-x-4 text-xs text-slate-400">
                <div className="flex items-center space-x-1">
                  <Wifi className="h-3 w-3 text-green-400" />
                  <span>Conexión Segura</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Shield className="h-3 w-3 text-blue-400" />
                  <span>SSL/TLS</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Activity className="h-3 w-3 text-purple-400" />
                  <span>Monitoreo 24/7</span>
                </div>
              </div>
              
              <div className="text-center text-sm text-slate-400 border-t border-slate-700/50 pt-3">
                <div className="flex items-center justify-center space-x-2">
                  <Shield className="h-4 w-4 text-blue-400" />
                  <span>🔒 Sistema de administración empresarial - ForkastBI</span>
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Versión 2.4.1 • Última actualización: {new Date().toLocaleDateString()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Modal de Recuperación de Contraseña */}
        {showPasswordReset && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md bg-slate-800/90 backdrop-blur-md border-slate-700/50 shadow-2xl">
              <CardHeader className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-2xl flex items-center justify-center border border-blue-500/30">
                  {resetStep === 'email' && <Key className="h-8 w-8 text-blue-400" />}
                  {resetStep === 'code' && <Smartphone className="h-8 w-8 text-green-400" />}
                  {resetStep === 'password' && <Lock className="h-8 w-8 text-purple-400" />}
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-white">
                    {resetStep === 'email' && 'Recuperar Contraseña'}
                    {resetStep === 'code' && 'Verificar Código'}
                    {resetStep === 'password' && 'Nueva Contraseña'}
                  </CardTitle>
                  <CardDescription className="text-slate-300">
                    {resetStep === 'email' && 'Ingresa tu email para recibir un código de verificación'}
                    {resetStep === 'code' && 'Ingresa el código de 6 dígitos enviado a tu email'}
                    {resetStep === 'password' && 'Crea una nueva contraseña segura'}
                  </CardDescription>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Alertas */}
                {resetError && (
                  <Alert className="bg-red-900/20 border-red-500/30">
                    <AlertTriangle className="h-4 w-4 text-red-400" />
                    <AlertDescription className="text-red-300">{resetError}</AlertDescription>
                  </Alert>
                )}

                {resetSuccess && (
                  <Alert className="bg-green-900/20 border-green-500/30">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <AlertDescription className="text-green-300">{resetSuccess}</AlertDescription>
                  </Alert>
                )}

                {/* Paso 1: Solicitar Email */}
                {resetStep === 'email' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="resetEmail" className="text-white font-medium flex items-center space-x-2">
                        <User className="h-4 w-4 text-blue-400" />
                        <span>Email Administrativo</span>
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                        <Input
                          id="resetEmail"
                          type="email"
                          placeholder="tu.email@empresa.com"
                          value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)}
                          className="pl-12 h-12 bg-slate-700/50 border-slate-600/50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-white placeholder-slate-400"
                        />
                        {resetEmail && validateEmail(resetEmail) && (
                          <CheckCircle className="absolute right-3 top-3 h-5 w-5 text-green-400" />
                        )}
                      </div>
                    </div>

                    <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
                      <div className="flex items-center space-x-2 text-blue-300 text-sm">
                        <Info className="h-4 w-4" />
                        <span className="font-medium">Proceso de Verificación</span>
                      </div>
                      <p className="text-blue-400 text-xs mt-1">
                        Te enviaremos un código de 6 dígitos a tu correo electrónico para verificar tu identidad.
                      </p>
                    </div>

                    <div className="flex space-x-3">
                      <Button 
                        variant="outline"
                        onClick={resetPasswordReset}
                        className="flex-1 h-12 bg-slate-700/50 hover:bg-slate-600 text-white border-slate-600/50"
                      >
                        Cancelar
                      </Button>
                      <Button 
                        onClick={handlePasswordResetRequest}
                        className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all duration-300"
                        disabled={!resetEmail || !validateEmail(resetEmail) || resetLoading}
                      >
                        {resetLoading ? 'Enviando...' : 'Enviar Código'}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Paso 2: Verificar Código */}
                {resetStep === 'code' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="resetCode" className="text-white font-medium flex items-center space-x-2">
                        <Smartphone className="h-4 w-4 text-green-400" />
                        <span>Código de Verificación</span>
                      </Label>
                      <div className="relative">
                        <Key className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                        <Input
                          id="resetCode"
                          type="text"
                          placeholder="000000"
                          value={resetCode}
                          onChange={(e) => setResetCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          className="pl-12 h-12 bg-slate-700/50 border-slate-600/50 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 text-white placeholder-slate-400 text-center text-lg font-mono tracking-widest"
                          maxLength={6}
                        />
                        {resetCode.length === 6 && (
                          <CheckCircle className="absolute right-3 top-3 h-5 w-5 text-green-400" />
                        )}
                      </div>
                    </div>

                    <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-3">
                      <div className="flex items-center space-x-2 text-green-300 text-sm">
                        <CheckCircle className="h-4 w-4" />
                        <span className="font-medium">Código Enviado</span>
                      </div>
                      <p className="text-green-400 text-xs mt-1">
                        Hemos enviado un código de verificación a: {resetEmail}
                      </p>
                      <p className="text-green-400 text-xs mt-1">
                        Para pruebas, usa: <span className="font-mono bg-green-800/30 px-1 rounded">123456</span>
                      </p>
                    </div>

                    <div className="flex space-x-3">
                      <Button 
                        variant="outline"
                        onClick={() => setResetStep('email')}
                        className="flex-1 h-12 bg-slate-700/50 hover:bg-slate-600 text-white border-slate-600/50"
                      >
                        Volver
                      </Button>
                      <Button 
                        onClick={handleCodeVerification}
                        className="flex-1 h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-xl transition-all duration-300"
                        disabled={resetCode.length !== 6 || resetLoading}
                      >
                        {resetLoading ? 'Verificando...' : 'Verificar'}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Paso 3: Nueva Contraseña */}
                {resetStep === 'password' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="newPassword" className="text-white font-medium flex items-center space-x-2">
                        <Lock className="h-4 w-4 text-purple-400" />
                        <span>Nueva Contraseña</span>
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                        <Input
                          id="newPassword"
                          type="password"
                          placeholder="••••••••••••"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="pl-12 h-12 bg-slate-700/50 border-slate-600/50 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-white placeholder-slate-400"
                        />
                      </div>
                      
                      {/* Indicador de Fortaleza para Nueva Contraseña */}
                      {newPassword && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-400">Fortaleza de contraseña</span>
                            <span className={`font-medium ${
                              checkPasswordStrength(newPassword).color === 'green' ? 'text-green-400' :
                              checkPasswordStrength(newPassword).color === 'yellow' ? 'text-yellow-400' :
                              checkPasswordStrength(newPassword).color === 'orange' ? 'text-orange-400' : 'text-red-400'
                            }`}>
                              {checkPasswordStrength(newPassword).score === 5 ? 'Muy Fuerte' :
                               checkPasswordStrength(newPassword).score === 4 ? 'Fuerte' :
                               checkPasswordStrength(newPassword).score === 3 ? 'Media' :
                               checkPasswordStrength(newPassword).score === 2 ? 'Débil' : 'Muy Débil'}
                            </span>
                          </div>
                          <Progress 
                            value={(checkPasswordStrength(newPassword).score / 5) * 100} 
                            className="h-2"
                          />
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-white font-medium flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-purple-400" />
                        <span>Confirmar Contraseña</span>
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                        <Input
                          id="confirmPassword"
                          type="password"
                          placeholder="••••••••••••"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="pl-12 h-12 bg-slate-700/50 border-slate-600/50 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-white placeholder-slate-400"
                        />
                        {confirmPassword && newPassword === confirmPassword && (
                          <CheckCircle className="absolute right-3 top-3 h-5 w-5 text-green-400" />
                        )}
                      </div>
                    </div>

                    <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-3">
                      <div className="flex items-center space-x-2 text-purple-300 text-sm">
                        <Lock className="h-4 w-4" />
                        <span className="font-medium">Requisitos de Seguridad</span>
                      </div>
                      <ul className="text-purple-400 text-xs mt-1 space-y-1">
                        <li>• Mínimo 8 caracteres</li>
                        <li>• Al menos una mayúscula y una minúscula</li>
                        <li>• Al menos un número y un símbolo</li>
                        <li>• Score mínimo de seguridad: 3/5</li>
                      </ul>
                    </div>

                    <div className="flex space-x-3">
                      <Button 
                        variant="outline"
                        onClick={() => setResetStep('code')}
                        className="flex-1 h-12 bg-slate-700/50 hover:bg-slate-600 text-white border-slate-600/50"
                      >
                        Volver
                      </Button>
                      <Button 
                        onClick={handlePasswordChange}
                        className="flex-1 h-12 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white font-semibold rounded-xl transition-all duration-300"
                        disabled={!newPassword || !confirmPassword || newPassword !== confirmPassword || checkPasswordStrength(newPassword).score < 3 || resetLoading}
                      >
                        {resetLoading ? 'Actualizando...' : 'Cambiar Contraseña'}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Botón de Cerrar */}
                <div className="flex justify-center pt-4 border-t border-slate-700/50">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={resetPasswordReset}
                    className="text-slate-400 hover:text-slate-300"
                  >
                    Cerrar
                  </Button>
          </div>
        </CardContent>
      </Card>
          </div>
        )}
      </div>
    </div>
  );
};
