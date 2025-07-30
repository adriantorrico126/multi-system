
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Lock, User, Info } from "lucide-react";
import { apiFetch } from "@/services/api";
import { useAuth } from "@/context/AuthContext";

interface AuthLoginProps {
  onLogin: (authenticated: boolean) => void;
  onRoleChange: (role: string) => void;
}

export const AuthLogin: React.FC<AuthLoginProps> = ({ onLogin, onRoleChange }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('admin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();

  const demoCredentials = [
    { 
      role: 'admin', 
      email: 'admin@possolutions.com', 
      password: 'admin123', 
      description: 'Super Administrador - Acceso completo al sistema' 
    },
    { 
      role: 'manager', 
      email: 'soporte@possolutions.com', 
      password: 'soporte123', 
      description: 'Administrador de Soporte - Gestión de tickets y restaurantes' 
    }
  ];

  const handleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const data = await apiFetch<{ token: string; user: any }>(
        '/auth/login',
        {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        }
      );
      login(data.token, data.user);
      onRoleChange(data.user.rol_nombre || role);
      onLogin(true);
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (credentials: typeof demoCredentials[0]) => {
    setEmail(credentials.email);
    setPassword(credentials.password);
    setRole(credentials.role);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-0">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center">
            <Shield className="h-10 w-10 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-800">
            Admin Central POS
          </CardTitle>
          <CardDescription className="text-slate-600">
            Sistema de Administración Centralizada
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Credenciales de Demo */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 text-blue-700 font-medium">
              <Info className="h-4 w-4" />
              Credenciales de Administrador
            </div>
            {demoCredentials.map((cred, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <div className="font-medium text-slate-700 capitalize">
                      {cred.role === 'admin' ? 'Super Administrador' : 'Admin Soporte'}
                    </div>
                    <div className="text-slate-500 text-xs">{cred.description}</div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fillCredentials(cred)}
                    className="text-xs"
                  >
                    Usar
                  </Button>
                </div>
                <div className="text-xs text-slate-600 font-mono bg-white px-2 py-1 rounded border">
                  {cred.email} / {cred.password}
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700 font-medium">
                Email Administrativo
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@possolutions.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 border-slate-300 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-700 font-medium">
                Contraseña
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 border-slate-300 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="role" className="text-slate-700 font-medium">
                Nivel de Acceso
              </Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="border-slate-300 focus:border-blue-500">
                  <SelectValue placeholder="Selecciona tu nivel de acceso" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Super Administrador</SelectItem>
                  <SelectItem value="manager">Administrador de Soporte</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <Button 
            onClick={handleLogin}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 rounded-lg transition-all duration-200 transform hover:scale-105"
            disabled={!email || !password || loading}
          >
            {loading ? 'Accediendo...' : 'Acceder al Sistema'}
          </Button>
          {error && (
            <div className="text-red-600 text-sm text-center mt-2">{error}</div>
          )}
          
          <div className="text-center text-sm text-slate-500">
            🔒 Sistema de administración centralizada - POS Solutions Inc.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
