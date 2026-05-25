'use client';

import React, { useEffect, useState } from 'react';
import { ButterflyEntity } from './butterfly.types';
import { Butterfly } from './Butterfly';

const AMBIENT_COUNT = 5;

export const AmbientButterflyLayer = () => {
  const [ambientButterflies, setAmbientButterflies] = useState<ButterflyEntity[]>([]);

  useEffect(() => {
    // Generate static initial ambient butterflies
    const w = typeof window !== 'undefined' ? window.innerWidth : 1920;
    const h = typeof window !== 'undefined' ? window.innerHeight : 1080;

    const butterflies: ButterflyEntity[] = [];
    for (let i = 0; i < AMBIENT_COUNT; i++) {
      butterflies.push({
        id: `ambient-${i}`,
        startX: Math.random() * w,
        startY: Math.random() * h,
        endX: Math.random() * w,
        endY: Math.random() * h,
        controlX: 0,
        controlY: 0,
        duration: 0,
        scale: 0.3 + Math.random() * 0.4, // slightly smaller
        rotation: (Math.random() - 0.5) * 30
      });
    }
    setAmbientButterflies(butterflies);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {ambientButterflies.map((b) => (
        <Butterfly key={b.id} data={b} isAmbient={true} onComplete={() => {}} />
      ))}
    </div>
  );
};
