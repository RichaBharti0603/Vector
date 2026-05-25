'use client';

import { useState, useCallback, useRef } from 'react';
import { ButterflyEntity, EVENT_BUTTERFLY_MAP } from './butterfly.types';

const MAX_BUTTERFLIES = 12;

function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export const useButterflyManager = () => {
  const [butterflies, setButterflies] = useState<ButterflyEntity[]>([]);
  // We use a ref to keep track of current length to avoid stale closures in spawn loops
  const countRef = useRef(0);

  const removeButterfly = useCallback((id: string) => {
    setButterflies((prev) => {
      const next = prev.filter((b) => b.id !== id);
      countRef.current = next.length;
      return next;
    });
  }, []);

  const spawnButterfly = useCallback((eventType: string, payload?: any) => {
    // Determine configuration
    const config = EVENT_BUTTERFLY_MAP[eventType];
    if (!config) return;

    let targetCount = config.count;
    
    // Add randomness for ranges (e.g. 3-6 fast -> average 4, but we can randomize)
    if (eventType === 'VECTOR_ESCALATION') targetCount = getRandomInt(3, 6);
    if (eventType === 'VECTOR_SECURITY_ALERT') targetCount = getRandomInt(6, 12);

    setButterflies((prev) => {
      let currentCount = prev.length;
      const newButterflies: ButterflyEntity[] = [];

      for (let i = 0; i < targetCount; i++) {
        if (currentCount >= MAX_BUTTERFLIES) break;

        // Screen dimensions (assuming window is available, otherwise default to a safe value)
        const w = typeof window !== 'undefined' ? window.innerWidth : 1920;
        const h = typeof window !== 'undefined' ? window.innerHeight : 1080;

        // Randomize trajectory
        const startX = getRandomInt(0, w);
        const startY = getRandomInt(h + 50, h + 200); // Start below screen

        const endX = getRandomInt(0, w);
        const endY = getRandomInt(-200, -50); // End above screen

        // Control point for quadratic bezier curve
        const controlX = getRandomInt(-w / 2, w * 1.5);
        const controlY = getRandomInt(h * 0.2, h * 0.8);

        // Speed mapping to duration (exact 4 seconds for lifecycle as requested, but can vary slightly for 'aggressive')
        let duration = 4.0;
        if (config.speed === 'fast') duration = 3.0 + Math.random() * 0.5;
        if (config.speed === 'aggressive') duration = 2.0 + Math.random() * 1.0;
        
        // Exact 4 seconds requirement overrides speed? Prompt says "complete lifecycle in exactly 4 seconds" 
        // and "velocity variation per butterfly" (bonus). Let's use 4.0 as base and vary by speed.
        if (config.speed === 'slow') duration = 4.0 + Math.random() * 1.0;
        else if (config.speed === 'fast') duration = 3.0 + Math.random() * 0.5;
        else duration = 2.5 + Math.random() * 0.5;

        // Scale and rotation randomness
        const scale = 0.5 + Math.random() * 0.5;
        const rotation = getRandomInt(-15, 15);

        newButterflies.push({
          id: `butterfly-${Date.now()}-${Math.random()}`,
          startX,
          startY,
          controlX,
          controlY,
          endX,
          endY,
          duration,
          scale,
          rotation,
          priority: payload?.priority || 'low',
          metadata: payload?.metadata || {}
        });

        currentCount++;
      }

      countRef.current = currentCount;
      return [...prev, ...newButterflies];
    });
  }, []);

  return {
    butterflies,
    spawnButterfly,
    removeButterfly
  };
};
