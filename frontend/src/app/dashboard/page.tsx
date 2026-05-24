'use client';

import React from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';

export default function DashboardPage() {
  const { events } = useWebSocket('ws://localhost:8001/ws');

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

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        
        <header className="flex justify-between items-center mb-10 border-b border-slate-800 pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-cyan-400">ATC Command Center</h1>
            <p className="text-slate-400 mt-1">Autonomous Workplace Operations - Vector Engine Active</p>
          </div>
          <div className="space-x-3">
            <button 
              onClick={startSimulation}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-md font-medium transition-colors text-sm"
            >
              Start Live Sim
            </button>
            <button 
              onClick={stopSimulation}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-md font-medium transition-colors text-sm"
            >
              Stop Sim
            </button>
            <button 
              onClick={triggerDemo}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-md font-medium transition-colors shadow-[0_0_15px_rgba(79,70,229,0.5)]"
            >
              Trigger Demo Scenario
            </button>
          </div>
        </header>

        <div className="grid grid-cols-3 gap-6">
          
          <div className="col-span-2 bg-slate-900 rounded-xl p-6 border border-slate-800">
            <h2 className="text-xl font-semibold mb-4 text-slate-200 flex items-center">
              <span className="w-2 h-2 rounded-full bg-green-400 mr-2 animate-pulse"></span>
              Live Agent Map
            </h2>
            <div className="aspect-video bg-slate-950 rounded-lg border border-slate-800 relative overflow-hidden flex items-center justify-center">
              {/* Radar Grid Pattern */}
              <div className="absolute inset-0 opacity-20" style={{
                backgroundImage: 'radial-gradient(circle at center, #38bdf8 1px, transparent 1px), radial-gradient(circle at center, #38bdf8 1px, transparent 1px)',
                backgroundSize: '40px 40px',
                backgroundPosition: '0 0, 20px 20px'
              }}></div>
              
              <p className="text-slate-500 z-10">Map Visualization (Demo)</p>

              {events.map((event) => (
                <div key={event.payload.id} className="absolute inset-0 pointer-events-none flex items-center justify-center">
                   <div className="px-3 py-1 bg-slate-800/80 backdrop-blur-sm rounded-md border border-slate-700 text-xs text-cyan-300">
                     Agent {event.payload.agent_type.toUpperCase()} active
                   </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 rounded-xl p-6 border border-slate-800 flex flex-col h-full">
            <h2 className="text-xl font-semibold mb-4 text-slate-200">Event Timeline</h2>
            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
              {events.length === 0 ? (
                <p className="text-slate-500 text-sm">Waiting for incoming operations...</p>
              ) : (
                events.map((event, i) => (
                  <div key={i} className="flex flex-col p-3 rounded-lg bg-slate-950 border border-slate-800">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-xs font-bold text-indigo-400 uppercase">{event.event_type.replace('VECTOR_', '')} - {event.payload.agent_type}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-sm ${event.payload.priority === 'urgent' ? 'bg-red-900/50 text-red-400' : 'bg-slate-800 text-slate-400'}`}>
                        {event.payload.priority}
                      </span>
                    </div>
                    <span className="text-sm text-slate-200 mb-2">{event.payload.message}</span>
                    {event.payload.intelligence_trace && (
                      <div className="bg-slate-900 p-2 rounded text-[10px] text-slate-400 border border-slate-800 font-mono whitespace-pre-wrap">
                        {event.payload.intelligence_trace}
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
