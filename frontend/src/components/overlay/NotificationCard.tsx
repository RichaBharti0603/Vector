'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface EventPayload {
  id: string;
  agent_type: string;
  priority: string;
  message: string;
  summary: string;
  recommended_action?: string;
  confidence_score: number;
}

interface NotificationCardProps {
  event: EventPayload;
  onDismiss: (id: string) => void;
}

export const NotificationCard: React.FC<NotificationCardProps> = ({ event, onDismiss }) => {
  const isUrgent = event.priority === 'urgent' || event.priority === 'high';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, x: 20 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.9, x: 20 }}
      className={`relative p-4 mb-4 rounded-xl backdrop-blur-md border border-white/10 shadow-2xl w-80 pointer-events-auto
        ${isUrgent ? 'bg-red-900/40 border-red-500/50' : 'bg-slate-900/60 border-slate-500/30'}`}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center space-x-2">
          <span className={`text-xs font-bold uppercase tracking-wider ${isUrgent ? 'text-red-400' : 'text-cyan-400'}`}>
            {event.agent_type}
          </span>
          <span className="text-xs text-slate-400 px-2 py-0.5 rounded-full bg-slate-800/50 border border-slate-700/50">
            {event.priority}
          </span>
        </div>
        <button 
          onClick={() => onDismiss(event.id)}
          className="text-slate-400 hover:text-white transition-colors"
        >
          &times;
        </button>
      </div>

      <h3 className="text-sm font-semibold text-white mb-1">{event.message}</h3>
      <p className="text-xs text-slate-300 mb-3">{event.summary}</p>

      {event.recommended_action && (
        <div className="mt-3 pt-3 border-t border-white/10">
          <p className="text-xs text-slate-400 mb-1">Recommended Action:</p>
          <p className="text-sm text-green-400">{event.recommended_action}</p>
        </div>
      )}

      <div className="mt-3 flex justify-between items-center text-xs">
        <span className="text-slate-400">Confidence:</span>
        <span className="text-cyan-400 font-mono">{(event.confidence_score * 100).toFixed(0)}%</span>
      </div>
    </motion.div>
  );
};
