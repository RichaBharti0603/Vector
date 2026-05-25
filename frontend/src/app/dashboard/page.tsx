'use client';

import React, { useState, useEffect } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';

export default function DashboardPage() {
  const { events } = useWebSocket('ws://localhost:8001/ws');
  
  const [health, setHealth] = useState({
    gateway: 'unknown',
    ingestion: 'unknown',
    redis: 'unknown'
  });

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const gwRes = await fetch('http://localhost:8001/health').catch(() => null);
        const inRes = await fetch('http://localhost:8000/health').catch(() => null);
        
        let gwData = gwRes ? await gwRes.json() : null;
        let inData = inRes ? await inRes.json() : null;
        
        setHealth({
          gateway: gwData ? 'online' : 'offline',
          ingestion: inData ? 'online' : 'offline',
          redis: (gwData?.redis_connected || inData?.redis_connected) ? 'online' : 'offline'
        });
      } catch (e) {
        console.error("Health check failed", e);
      }
    };
    
    checkHealth();
    const interval = setInterval(checkHealth, 3000);
    return () => clearInterval(interval);
  }, []);

  const triggerDemo = async () => {
    try {
      await fetch('http://localhost:8000/trigger/demo', { method: 'POST' });
    } catch (e) {
      console.error('Failed to trigger demo', e);
    }
  };

  const startSimulation = async () => {
    await fetch('http://localhost:8000/simulate/live/start', { method: 'POST' });
  };

  const stopSimulation = async () => {
    await fetch('http://localhost:8000/simulate/live/stop', { method: 'POST' });
  };

  const StatusIndicator = ({ name, status }: { name: string, status: string }) => (
    <div className="flex items-center justify-between bg-slate-900/50 p-3 rounded border border-slate-800">
      <span className="text-sm text-slate-400 uppercase tracking-wider">{name}</span>
      <span className={`text-xs px-2 py-1 rounded font-mono font-bold ${
        status === 'online' ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-800' :
        status === 'offline' ? 'bg-red-900/30 text-red-400 border border-red-800' :
        'bg-yellow-900/30 text-yellow-400 border border-yellow-800'
      }`}>
        {status}
      </span>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white p-6 font-sans">
      <div className="max-w-7xl mx-auto">
        
        <header className="flex justify-between items-end mb-8 border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 uppercase">
              Vector Control Tower
            </h1>
            <p className="text-slate-500 mt-1 font-mono text-sm tracking-widest">
              AUTONOMOUS WORKFLOW ROUTING ENGINE // STATUS: ACTIVE
            </p>
          </div>
          <div className="space-x-3 flex items-center">
            <button 
              onClick={startSimulation}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 rounded text-xs font-bold uppercase tracking-wider transition-colors shadow-[0_0_10px_rgba(5,150,105,0.4)]"
            >
              Start Live Sim
            </button>
            <button 
              onClick={stopSimulation}
              className="px-5 py-2 bg-slate-800 hover:bg-red-600 rounded text-xs font-bold uppercase tracking-wider transition-colors border border-slate-700 hover:border-red-500"
            >
              Stop Sim
            </button>
          </div>
        </header>

        <div className="grid grid-cols-4 gap-6">
          
          {/* Left Column: System Status */}
          <div className="col-span-1 space-y-6">
            <div className="bg-slate-950 rounded-xl p-5 border border-slate-800 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
              <h2 className="text-xs font-black tracking-widest text-slate-500 uppercase mb-4">System Health</h2>
              <div className="space-y-3">
                <StatusIndicator name="Redis Bus" status={health.redis} />
                <StatusIndicator name="Gateway" status={health.gateway} />
                <StatusIndicator name="Ingestion" status={health.ingestion} />
                <StatusIndicator name="Vector Worker" status="online" />
                <StatusIndicator name="Orchestrator" status="online" />
              </div>
            </div>

            <div className="bg-slate-950 rounded-xl p-5 border border-slate-800">
               <h2 className="text-xs font-black tracking-widest text-slate-500 uppercase mb-4">Operations</h2>
               <div className="flex flex-col gap-3">
                 <button 
                    onClick={triggerDemo}
                    className="w-full px-4 py-3 bg-indigo-600 hover:bg-indigo-500 rounded font-bold uppercase text-xs tracking-wider transition-colors shadow-[0_0_15px_rgba(79,70,229,0.3)] border border-indigo-400"
                  >
                    Force Demo Escalation
                  </button>
               </div>
            </div>
          </div>

          {/* Middle Column: Radar Map */}
          <div className="col-span-2 bg-slate-950 rounded-xl p-1 border border-slate-800 relative shadow-[0_0_30px_rgba(0,0,0,0.8)]">
            <div className="absolute top-4 left-4 z-20">
               <h2 className="text-xs font-black tracking-widest text-cyan-500 uppercase flex items-center bg-black/50 px-3 py-1 rounded backdrop-blur">
                <span className="w-2 h-2 rounded-full bg-cyan-400 mr-2 animate-pulse"></span>
                Global Routing Map
              </h2>
            </div>
            <div className="h-full min-h-[500px] bg-slate-950 rounded-lg relative overflow-hidden flex items-center justify-center">
              {/* Radar Grid Pattern */}
              <div className="absolute inset-0 opacity-30" style={{
                backgroundImage: 'radial-gradient(circle at center, #0ea5e9 1px, transparent 1px), radial-gradient(circle at center, #0ea5e9 1px, transparent 1px)',
                backgroundSize: '40px 40px',
                backgroundPosition: '0 0, 20px 20px'
              }}></div>
              
              {/* Scanner Line */}
              <div className="absolute inset-0 bg-[conic-gradient(from_90deg_at_50%_50%,rgba(0,0,0,0)_0%,rgba(14,165,233,0.2)_100%)] animate-[spin_4s_linear_infinite] opacity-50 rounded-full scale-[1.5]"></div>

              {events.slice(-5).map((event, i) => (
                <div key={event.payload.id || i} 
                     className="absolute"
                     style={{
                       left: `${Math.random() * 60 + 20}%`,
                       top: `${Math.random() * 60 + 20}%`
                     }}>
                   <div className="px-3 py-1 bg-black/80 backdrop-blur rounded border border-cyan-500/50 text-[10px] text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.5)] font-mono uppercase">
                     [{event.payload.agent_type}] {event.payload.priority}
                   </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Timeline */}
          <div className="col-span-1 bg-slate-950 rounded-xl p-5 border border-slate-800 flex flex-col h-full shadow-[0_0_20px_rgba(0,0,0,0.5)]">
            <h2 className="text-xs font-black tracking-widest text-slate-500 uppercase mb-4">Event Log</h2>
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-slate-700">
              {events.length === 0 ? (
                <p className="text-slate-600 text-xs font-mono">Listening for inbound traffic...</p>
              ) : (
                [...events].reverse().map((event, i) => (
                  <div key={i} className="flex flex-col p-3 rounded border border-slate-800 bg-black">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-bold text-blue-400 font-mono">
                        {event.event_type.replace('VECTOR_', '')}
                      </span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider ${
                        event.payload.priority === 'urgent' ? 'bg-red-900/50 text-red-400 border border-red-800' : 
                        event.payload.priority === 'high' ? 'bg-orange-900/50 text-orange-400 border border-orange-800' :
                        'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}>
                        {event.payload.priority}
                      </span>
                    </div>
                    <span className="text-xs text-slate-300 mb-2 truncate" title={event.payload.message}>
                      {event.payload.message || event.payload.subject}
                    </span>
                    {event.payload.intelligence_trace && (
                      <div className="bg-slate-900 p-2 rounded text-[9px] text-slate-500 font-mono whitespace-pre-wrap">
                        &gt; {event.payload.intelligence_trace.substring(0, 50)}...
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

