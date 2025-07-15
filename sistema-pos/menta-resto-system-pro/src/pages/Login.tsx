import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { login } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { Loader2, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🔐 Login: Formulario enviado');
    console.log('🔐 Login: Username:', username);
    console.log('🔐 Login: Password:', password ? '[HIDDEN]' : '[EMPTY]');
    
    if (!username || !password) {
      console.log('🔐 Login: Campos vacíos detectados');
      toast({
        title: 'Error',
        description: 'Por favor completa todos los campos.',
        variant: 'destructive',
      });
      return;
    }

    console.log('🔐 Login: Iniciando proceso de login...');
    setIsLoading(true);
    
    try {
      console.log('🔐 Login: Llamando a función login...');
      const userData = await login(username, password);
      console.log('🔐 Login: Respuesta exitosa:', userData);
      
      // Guardar usuario en localStorage
      localStorage.setItem('currentUser', JSON.stringify(userData));
      console.log('🔐 Login: Usuario guardado en localStorage');
      
      // Actualizar contexto de autenticación
      setUser(userData);
      console.log('🔐 Login: Contexto de autenticación actualizado');
      
      toast({
        title: '¡Bienvenido!',
        description: `Hola ${userData.nombre}, has iniciado sesión correctamente.`,
      });
      
      console.log('🔐 Login: Redirigiendo al dashboard...');
      // Redirigir al dashboard
      navigate('/');
      
    } catch (error: any) {
      console.log('🔐 Login: Error capturado:', error);
      console.error('Error en login:', error);
      
      let errorMessage = 'Error al iniciar sesión.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: 'Error de autenticación',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
              <span className="text-white text-2xl font-bold">🍽️</span>
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Sistema POS
            </CardTitle>
            <p className="text-gray-600 mt-2">
              Inicia sesión para acceder al sistema
            </p>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium text-gray-700">
                  Usuario
                </Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Ingresa tu usuario"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full"
                  disabled={isLoading}
                  autoComplete="username"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Contraseña
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Ingresa tu contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pr-10"
                    disabled={isLoading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Iniciando sesión...
                  </>
                ) : (
                  'Iniciar Sesión'
                )}
              </Button>
            </form>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                Credenciales de prueba:
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Usuario: admin | Contraseña: admin123
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 