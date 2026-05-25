'use client';

import React, { useEffect, useState } from 'react';
import { motion, useAnimationControls } from 'framer-motion';
import { ButterflyEntity } from './butterfly.types';

interface ButterflyProps {
  data: ButterflyEntity;
  onComplete: (id: string) => void;
}

export const Butterfly: React.FC<ButterflyProps> = ({ data, onComplete }) => {
  const controls = useAnimationControls();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    
    // We animate x and y over the given duration. 
    // To simulate a curve without SVG motion paths, we can use an array of keyframes for a bezier curve.
    const steps = 20;
    const keyframesX = [];
    const keyframesY = [];
    
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      // Quadratic bezier curve formula: (1-t)^2 * P0 + 2*(1-t)*t * P1 + t^2 * P2
      const x = Math.pow(1 - t, 2) * data.startX + 2 * (1 - t) * t * data.controlX + Math.pow(t, 2) * data.endX;
      const y = Math.pow(1 - t, 2) * data.startY + 2 * (1 - t) * t * data.controlY + Math.pow(t, 2) * data.endY;
      keyframesX.push(x);
      keyframesY.push(y);
    }

    controls.start({
      x: keyframesX,
      y: keyframesY,
      opacity: [0, 1, 1, 0], // Fade in, hold, fade out
      rotate: data.rotation,
      scale: data.scale,
      transition: {
        duration: data.duration, // Should be exactly 4 seconds as per core requirement, modified slightly by velocity bonus
        ease: "easeInOut",
        times: [0, 0.1, 0.8, 1], // Timing for the opacity fade
      }
    }).then(() => {
      onComplete(data.id);
    });

  }, [data, controls, onComplete]);

  if (!isMounted) return null;

  return (
    <motion.div
      initial={{ x: data.startX, y: data.startY, opacity: 0, scale: data.scale, rotate: data.rotation }}
      animate={controls}
      className="absolute top-0 left-0 pointer-events-none mix-blend-screen drop-shadow-[0_0_15px_rgba(255,255,255,0.8)] z-[100]"
      style={{ width: '100px', height: '100px' }} // Approximate size of butterfly
    >
      <video
        src="/assets/butterfly/butterfly.mp4"
        autoPlay
        loop
        muted
        playsInline
        className="w-full h-full object-contain pointer-events-none"
      />
    </motion.div>
  );
};
