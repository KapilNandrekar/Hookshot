import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import GhostFibers from '../components/GhostFibers';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    const { status, data } = await api.signup(email, password);

    if (status === 201) {
      const loginRes = await api.login(email, password);
      setLoading(false);
      if (loginRes.status === 200 && loginRes.data?.token) {
        login(loginRes.data.token, email);
        navigate('/dashboard');
        return;
      }
      navigate('/login');
    } else {
      setLoading(false);
      toast.error(data?.error || 'Signup failed.');
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center p-6 overflow-hidden bg-background">
      <div className="absolute inset-0 z-0">
       <GhostFibers
  lineColor="#140E35"
  glowColor="#3437A0"
  speed={0.2}
  scale={2}
  rotationSpeed={0.25}
  layers={4}
  brightness={2}
  blueBoost={1.25}
  vignette={0.8}
  grain={0.05}
  dpr={1}
/>
      </div>
<Card className="relative z-10 w-full max-w-sm bg-card/40! backdrop-blur-md">
        <CardHeader>
          <div className="text-primary font-semibold text-sm mb-1">🪝 Hookshot</div>
          <h1 className="text-xl font-semibold">Create your account</h1>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-white/5! border-white/20! text-white! placeholder:text-white/40! focus-visible:border-[#5B8FF9]! focus-visible:ring-[#5B8FF9]/40!" style={{ backgroundColor: 'transparent' }}/>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="bg-white/5! border-white/20! text-white! placeholder:text-white/40! focus-visible:border-[#5B8FF9]! focus-visible:ring-[#5B8FF9]/40!" style={{ backgroundColor: 'transparent' }} />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating account…' : 'Sign up'}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              Already have an account? <Link to="/login" className="text-primary hover:underline">Log in</Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

