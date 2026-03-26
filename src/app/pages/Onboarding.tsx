import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';

export default function Onboarding() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      navigate('/painel', { replace: true });
    }, 150);

    return () => window.clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center text-white">
      <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-4">
        <RefreshCw className="h-5 w-5 animate-spin text-emerald-400" />
        Redirecionando para o painel...
      </div>
    </div>
  );
}