'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { CTAButton } from '@/components/ui/CTAButton';
import { AmbientButterflyLayer } from '@/components/butterfly/AmbientButterflyLayer';
import { useButterflyManager } from '@/components/butterfly/useButterflyManager';
import { Butterfly } from '@/components/butterfly/Butterfly';

export default function LandingPage() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const { butterflies, spawnButterfly, removeButterfly } = useButterflyManager();

  // Watch Simulation Mode Logic
  useEffect(() => {
    if (!isSimulating) return;

    // Start local event generator
    const interval = setInterval(() => {
      const randomEvent = Math.random() > 0.8 ? 'VECTOR_ESCALATION' : 'VECTOR_CLASSIFIED';
      spawnButterfly(randomEvent);
    }, 2500);

    return () => clearInterval(interval);
  }, [isSimulating, spawnButterfly]);

  const handleStartDemo = async () => {
    // Fire and forget, mock endpoint for now
    try {
      await fetch('/api/demo/start', { method: 'POST' }).catch(() => {});
    } catch (e) {}
    
    router.push('/overlay'); // Or /dashboard based on preference
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#050505] text-white font-sans selection:bg-cyan-500/30">
      {/* Background Gradient Mesh */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#0A192F] via-[#050505] to-black opacity-80 z-0"></div>
      
      {/* Radar Sweep Line (Bonus) */}
      <div className="absolute inset-0 z-0 overflow-hidden opacity-20 pointer-events-none">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/2 left-1/2 w-[150vw] h-[150vw] -translate-x-1/2 -translate-y-1/2 origin-center rounded-full bg-[conic-gradient(from_0deg,transparent_0deg,transparent_320deg,rgba(0,255,255,0.1)_360deg)]"
        />
        {/* Radar grid circles */}
        <div className="absolute top-1/2 left-1/2 w-[40vw] h-[40vw] -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-500/10" />
        <div className="absolute top-1/2 left-1/2 w-[80vw] h-[80vw] -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-500/10" />
      </div>

      {/* Ambient Butterfly Layer */}
      <AmbientButterflyLayer />

      {/* Active Butterflies Layer (Simulation) */}
      {butterflies.map((b) => (
        <Butterfly key={b.id} data={b} onComplete={removeButterfly} />
      ))}

      {/* System Status Indicator (Bonus) */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 2 }}
        className="absolute top-6 left-6 z-50 flex items-center gap-3 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/5"
      >
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
        </span>
        <span className="text-xs font-mono tracking-widest text-cyan-500/80">VECTOR SYSTEM ONLINE</span>
      </motion.div>

      {/* Main Content */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 text-center">
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="mb-6"
        >
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white via-blue-100 to-cyan-500 drop-shadow-[0_0_20px_rgba(0,255,255,0.2)]">
            VECTOR
          </h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 1 }}
          className="max-w-2xl mx-auto mb-12"
        >
          <h2 className="text-xl md:text-2xl text-zinc-300 font-light mb-4">
            AI Air Traffic Control for Enterprise Communication
          </h2>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 2 }}
            className="text-lg text-cyan-400/80 font-mono tracking-wider"
          >
            &gt; Emails don&apos;t arrive. They fly.
          </motion.p>
        </motion.div>

        {/* CTAs */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="flex flex-col sm:flex-row items-center gap-4 w-full max-w-lg mx-auto"
        >
          <CTAButton 
            variant="primary" 
            onClick={handleStartDemo}
            className="w-full sm:w-auto"
          >
            START LIVE DEMO
          </CTAButton>
          
          <CTAButton 
            variant="secondary" 
            onClick={() => router.push('/connect-inbox')}
            className="w-full sm:w-auto"
          >
            CONNECT EMAIL INBOX
          </CTAButton>
          
          <CTAButton 
            variant="tertiary" 
            onClick={() => setIsSimulating(!isSimulating)}
            className="w-full sm:w-auto"
          >
            {isSimulating ? 'STOP SIMULATION' : 'WATCH SIMULATION'}
          </CTAButton>
        </motion.div>

      </main>

      {/* Connect Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-8 max-w-md w-full shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden"
            >
              {/* Glass reflection */}
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              
              <h3 className="text-2xl font-semibold mb-2 text-white">Connect Data Source</h3>
              <p className="text-zinc-400 mb-8">Select how you want to route messages into Vector.</p>
              
              <div className="space-y-4">
                <button 
                  disabled
                  className="w-full p-4 rounded-xl border border-white/5 bg-white/5 flex items-center justify-between opacity-50 cursor-not-allowed"
                >
                  <span className="font-medium text-white">Google Workspace</span>
                  <span className="text-xs bg-white/10 px-2 py-1 rounded text-zinc-300">Coming Soon</span>
                </button>
                
                <button 
                  onClick={() => {
                    alert('Webhook endpoint generation would happen here in production.');
                    setIsModalOpen(false);
                  }}
                  className="w-full p-4 rounded-xl border border-cyan-500/30 bg-cyan-500/10 flex items-center justify-between hover:bg-cyan-500/20 transition-colors group"
                >
                  <span className="font-medium text-cyan-400">Custom Webhook</span>
                  <span className="text-xs bg-cyan-500/20 text-cyan-300 px-2 py-1 rounded group-hover:bg-cyan-500/30 transition-colors">Recommended</span>
                </button>
              </div>

              <button 
                onClick={() => setIsModalOpen(false)}
                className="mt-8 w-full py-3 text-sm text-zinc-500 hover:text-white transition-colors"
              >
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
