import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { Dumbbell } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await login(email, password);
      toast.success('¡Bienvenido!');
      navigate('/dashboard');
    } catch (error) {
      toast.error('Email o contraseña incorrectos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2" data-testid="login-page">
      {/* Left side - Form */}
      <div className="flex items-center justify-center p-8 bg-zinc-950">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-2">
            <div className="flex items-center gap-3 mb-8">
              <Dumbbell className="w-10 h-10 text-white" />
              <h1 className="text-4xl font-bold uppercase tracking-tight text-white font-heading">
                Lontso Fitness
              </h1>
            </div>
            <h2 className="text-2xl font-semibold text-zinc-400 font-heading uppercase tracking-wide">
              Iniciar Sesión
            </h2>
            <p className="text-sm text-zinc-500">
              Accede a tu panel de control de dietas
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6" data-testid="login-form">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs uppercase tracking-wider text-zinc-500 font-bold">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="rounded-none border-zinc-800 bg-zinc-950/50 focus:ring-1 focus:ring-white focus:border-white h-12"
                data-testid="email-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs uppercase tracking-wider text-zinc-500 font-bold">
                Contraseña
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="rounded-none border-zinc-800 bg-zinc-950/50 focus:ring-1 focus:ring-white focus:border-white h-12"
                data-testid="password-input"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full rounded-none bg-white text-black hover:bg-zinc-200 font-bold uppercase tracking-wide h-12 transition-transform active:scale-95"
              data-testid="login-submit-button"
            >
              {loading ? 'Iniciando...' : 'Entrar'}
            </Button>
          </form>
        </div>
      </div>

      {/* Right side - Image */}
      <div 
        className="hidden lg:block bg-cover bg-center relative"
        style={{ 
          backgroundImage: 'url(https://images.unsplash.com/photo-1689877020200-403d8542d95d?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D)',
          filter: 'grayscale(100%)'
        }}
      >
        <div className="absolute inset-0 bg-black/40"></div>
      </div>
    </div>
  );
};

export default Login;
