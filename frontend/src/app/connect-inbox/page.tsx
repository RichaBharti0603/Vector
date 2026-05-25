'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CTAButton } from '@/components/ui/CTAButton';

interface ConnectionStatus {
  gmail_connected: boolean;
  outlook_connected: boolean;
}

export default function ConnectInboxPage() {
  const router = useRouter();
  const [status, setStatus] = useState<ConnectionStatus>({ gmail_connected: false, outlook_connected: false });
  const [loading, setLoading] = useState(true);

  const checkStatus = async () => {
    try {
      // In production, user_id would be pulled from context/auth
      const res = await fetch('http://localhost:8000/status?user_id=user_1');
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (e) {
      console.error('Failed to fetch status', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const handleConnect = (provider: 'gmail' | 'outlook') => {
    // Redirect to backend OAuth login endpoint
    window.location.href = `http://localhost:8000/auth/${provider}/login?user_id=user_1`;
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#050505] text-white font-sans flex flex-col items-center justify-center p-6">
      {/* Background Gradient Mesh */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#0A192F] via-[#050505] to-black opacity-80 z-0"></div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-2xl bg-white/5 border border-white/10 rounded-3xl p-8 md:p-12 backdrop-blur-xl shadow-2xl"
      >
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-cyan-500">
            Connect Data Sources
          </h1>
          <p className="text-zinc-400">
            Securely link your enterprise communication channels to the Vector RL Engine. 
            All data is processed ephemerally and sensitive PII is stripped automatically.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin h-8 w-8 border-2 border-cyan-500 border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Gmail Card */}
            <div className={`p-6 rounded-2xl border transition-colors flex flex-col sm:flex-row items-center justify-between gap-4 ${status.gmail_connected ? 'bg-cyan-900/20 border-cyan-500/50' : 'bg-black/40 border-white/10 hover:border-white/20'}`}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-black font-bold text-xl">G</div>
                <div>
                  <h3 className="text-lg font-semibold">Google Workspace</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`h-2 w-2 rounded-full ${status.gmail_connected ? 'bg-cyan-500 shadow-[0_0_8px_#06b6d4]' : 'bg-zinc-600'}`}></span>
                    <span className="text-sm text-zinc-400">{status.gmail_connected ? 'Connected and watching inbox' : 'Not connected'}</span>
                  </div>
                </div>
              </div>
              <CTAButton 
                variant={status.gmail_connected ? 'secondary' : 'primary'}
                onClick={() => handleConnect('gmail')}
                disabled={status.gmail_connected}
              >
                {status.gmail_connected ? 'Connected' : 'Connect Google Account'}
              </CTAButton>
            </div>

            {/* Outlook Card */}
            <div className={`p-6 rounded-2xl border transition-colors flex flex-col sm:flex-row items-center justify-between gap-4 ${status.outlook_connected ? 'bg-cyan-900/20 border-cyan-500/50' : 'bg-black/40 border-white/10 hover:border-white/20'}`}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#0078D4] rounded-full flex items-center justify-center text-white font-bold text-xl">M</div>
                <div>
                  <h3 className="text-lg font-semibold">Microsoft Outlook</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`h-2 w-2 rounded-full ${status.outlook_connected ? 'bg-cyan-500 shadow-[0_0_8px_#06b6d4]' : 'bg-zinc-600'}`}></span>
                    <span className="text-sm text-zinc-400">{status.outlook_connected ? 'Connected and syncing' : 'Not connected'}</span>
                  </div>
                </div>
              </div>
              <CTAButton 
                variant={status.outlook_connected ? 'secondary' : 'primary'}
                onClick={() => handleConnect('outlook')}
                disabled={status.outlook_connected}
              >
                {status.outlook_connected ? 'Connected' : 'Connect Microsoft Account'}
              </CTAButton>
            </div>

          </div>
        )}

        <div className="mt-10 flex justify-center">
          <button 
            onClick={() => router.push('/')}
            className="text-sm text-zinc-500 hover:text-white transition-colors"
          >
            ← Back to System Control
          </button>
        </div>
      </motion.div>
    </div>
  );
}
