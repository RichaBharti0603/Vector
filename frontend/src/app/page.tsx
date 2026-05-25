'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CTAButton } from '@/components/ui/CTAButton';
import { AmbientButterflyLayer } from '@/components/butterfly/AmbientButterflyLayer';
import { useButterflyManager } from '@/components/butterfly/useButterflyManager';
import { Butterfly } from '@/components/butterfly/Butterfly';

export default function LandingPage() {
  const router = useRouter();
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
    try {
      await fetch('/api/demo/start', { method: 'POST' }).catch(() => {});
    } catch (e) {}
    
    router.push('/overlay');
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#030303] text-white font-sans selection:bg-cyan-500/30">
      {/* Background Gradient Mesh with Cyan/Purple accents */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_30%,rgba(6,182,212,0.15),transparent_60%),radial-gradient(circle_at_70%_80%,rgba(168,85,247,0.12),transparent_60%)] z-0"></div>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[100px] z-0"></div>
      
      {/* Radar Sweep Line */}
      <div className="absolute inset-0 z-0 overflow-hidden opacity-10 pointer-events-none">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/2 left-1/2 w-[180vw] h-[180vw] -translate-x-1/2 -translate-y-1/2 origin-center rounded-full bg-[conic-gradient(from_0deg,transparent_0deg,transparent_300deg,rgba(6,182,212,0.25)_360deg)]"
        />
        {/* Radar grid circles */}
        <div className="absolute top-1/2 left-1/2 w-[35vw] h-[35vw] -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-500/10" />
        <div className="absolute top-1/2 left-1/2 w-[70vw] h-[70vw] -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-500/10" />
      </div>

      {/* Ambient Butterfly Layer */}
      <AmbientButterflyLayer />

      {/* Active Butterflies Layer (Simulation) */}
      {butterflies.map((b) => (
        <Butterfly key={b.id} data={b} onComplete={removeButterfly} />
      ))}

      {/* SYSTEM STATUS Badge */}
      <motion.div 
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3, duration: 1 }}
        className="absolute top-8 left-8 z-50 flex items-center gap-3 bg-white/5 backdrop-blur-md px-4 py-2 rounded-full border border-white/10"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
        </span>
        <span className="text-xs font-mono tracking-widest text-cyan-400 font-medium">SYSTEM STATUS: ONLINE</span>
      </motion.div>

      {/* Main Content */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen max-w-[1100px] mx-auto px-6 text-center">
        
        {/* Hero title & subtitle */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="mb-8"
        >
          <h1 className="text-7xl md:text-9xl font-black tracking-[0.25em] text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-purple-400 drop-shadow-[0_0_35px_rgba(6,182,212,0.25)] pl-4">
            VECTOR
          </h1>
          <div className="w-16 h-1 bg-gradient-to-r from-cyan-500 to-purple-500 mx-auto mt-4 rounded-full" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 1 }}
          className="max-w-2xl mx-auto mb-16 bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-6 md:p-8 shadow-[0_0_50px_rgba(0,0,0,0.4)] relative"
        >
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />
          <h2 className="text-xl md:text-2xl text-zinc-200 font-light mb-3 tracking-wide">
            AI Air Traffic Control for Enterprise Communication
          </h2>
          <p className="text-zinc-400 font-light text-sm md:text-base leading-relaxed">
            Intelligent triage, anomaly detection, and automated escalation pipelines powered by reinforcement learning. Securely stream your communication logs through an autonomous control tower.
          </p>
        </motion.div>

        {/* Centered CTA Row with Glow */}
        <div className="relative w-full max-w-3xl mx-auto flex justify-center py-4">
          <div className="absolute w-[450px] h-[150px] bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-full blur-[80px] -z-10 pointer-events-none" />
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-6 w-full"
          >
            <CTAButton 
              variant="primary" 
              onClick={handleStartDemo}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 border border-cyan-400/30 text-white font-bold tracking-wider shadow-[0_0_20px_rgba(6,182,212,0.4)]"
            >
              START LIVE DEMO
            </CTAButton>
            
            <CTAButton 
              variant="secondary" 
              onClick={() => router.push('/connect-inbox')}
              className="w-full sm:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-500/50 text-cyan-300 font-semibold tracking-wider transition-colors"
            >
              CONNECT EMAIL INBOX
            </CTAButton>
            
            <CTAButton 
              variant="tertiary" 
              onClick={() => setIsSimulating(!isSimulating)}
              className={`w-full sm:w-auto px-8 py-4 border font-medium tracking-wider transition-all duration-300 ${
                isSimulating 
                  ? 'bg-purple-950/40 border-purple-500/50 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.3)]' 
                  : 'bg-transparent border-white/5 hover:border-purple-500/30 text-zinc-400 hover:text-purple-300'
              }`}
            >
              {isSimulating ? 'STOP SIMULATION' : 'WATCH SIMULATION'}
            </CTAButton>
          </motion.div>
        </div>

      </main>
    </div>
  );
}
