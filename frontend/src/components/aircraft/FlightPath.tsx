'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { getIconForAgent } from './AircraftIcons';

interface FlightPathProps {
  agentType: string;
  priority: string;
  onAnimationComplete?: () => void;
  index: number;
}

export const FlightPath: React.FC<FlightPathProps> = ({ agentType, priority, onAnimationComplete, index }) => {
  // Determine animation variants based on priority
  let duration = 10;
  let yPath = [0, -50, 0];
  let ease = "linear";

  switch (priority) {
    case 'low':
      duration = 12;
      yPath = [0, 20, -20, 0];
      ease = "easeInOut";
      break;
    case 'medium':
      duration = 8;
      yPath = [-20, -100, 20];
      ease = "easeInOut";
      break;
    case 'high':
      duration = 5;
      yPath = [50, -150, 50];
      ease = "circOut";
      break;
    case 'urgent':
      duration = 3;
      yPath = [100, -200, 100];
      ease = "backIn";
      break;
  }

  // Stagger start positions vertically
  const startY = 100 + (index * 80);

  return (
    <motion.div
      initial={{ x: '-10vw', y: startY, opacity: 0 }}
      animate={{ 
        x: '110vw', 
        y: yPath.map(y => startY + y),
        opacity: [0, 1, 1, 0] 
      }}
      transition={{ 
        duration, 
        ease,
        times: [0, 0.2, 0.8, 1]
      }}
      onAnimationComplete={onAnimationComplete}
      className="absolute z-40 pointer-events-none"
    >
      <div className={`relative flex items-center justify-center ${priority === 'urgent' ? 'animate-pulse' : ''}`}>
        {/* Glow effect for urgent/high */}
        {(priority === 'urgent' || priority === 'high') && (
          <div className={`absolute -inset-4 rounded-full blur-md opacity-50 ${priority === 'urgent' ? 'bg-red-500' : 'bg-orange-400'}`} />
        )}
        {getIconForAgent(agentType)}
      </div>
    </motion.div>
  );
};
