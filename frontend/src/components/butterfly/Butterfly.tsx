'use client';

import React, { useEffect, useState } from 'react';
import { motion, useAnimationControls } from 'framer-motion';
import { ButterflyEntity } from './butterfly.types';

interface ButterflyProps {
  data: ButterflyEntity;
  onComplete: (id: string) => void;
  isAmbient?: boolean;
}

export const Butterfly: React.FC<ButterflyProps> = ({ data, onComplete, isAmbient = false }) => {
  const controls = useAnimationControls();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    
    if (isAmbient) {
      // Ambient mode: very slow drift, low opacity, infinite loop
      controls.start({
        x: [data.startX, data.endX, data.startX],
        y: [data.startY, data.endY, data.startY],
        opacity: [0.1, 0.4, 0.1], // Very low opacity
        rotate: [data.rotation, data.rotation + 10, data.rotation],
        scale: data.scale,
        transition: {
          duration: 30 + Math.random() * 20, // 30-50 seconds for a full loop
          ease: "linear",
          repeat: Infinity,
        }
      });
      return;
    }

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

    // Priority specific overrides
    let customScale = data.scale;
    let customRotate: any = data.rotation;
    let customDuration = data.duration;
    
    if (data.priority === 'urgent') {
      customRotate = [data.rotation, data.rotation + 5, data.rotation - 5, data.rotation];
      customDuration = data.duration * 0.7; // fast
    } else if (data.priority === 'high') {
      customDuration = data.duration * 0.8;
    } else if (data.priority === 'low') {
      customDuration = data.duration * 1.5; // slow drift
    }

    controls.start({
      x: keyframesX,
      y: keyframesY,
      opacity: [0, 1, 1, 0], // Fade in, hold, fade out
      rotate: customRotate,
      scale: customScale,
      transition: {
        duration: customDuration,
        ease: "easeInOut",
        times: [0, 0.1, 0.8, 1], // Timing for the opacity fade
      }
    }).then(() => {
      onComplete(data.id);
    });

  }, [data, controls, onComplete]);

  if (!isMounted) return null;

  let filterClass = "drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]";
  if (!isAmbient) {
    if (data.priority === 'urgent') filterClass = "drop-shadow-[0_0_25px_rgba(255,50,50,0.9)]";
    else if (data.priority === 'high') filterClass = "drop-shadow-[0_0_20px_rgba(100,200,255,1)]";
    else if (data.priority === 'low') filterClass = "drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]";
  }

  return (
    <motion.div
      initial={{ x: data.startX, y: data.startY, opacity: 0, scale: data.scale, rotate: data.rotation }}
      animate={controls}
      className={`absolute top-0 left-0 mix-blend-screen z-[100] ${filterClass}`}
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
      
      {/* Tooltip / Floating Label */}
      {!isAmbient && data.metadata && (data.metadata.subject || data.metadata.original_subject) && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="absolute left-full top-1/2 -translate-y-1/2 ml-3 bg-black/80 backdrop-blur-md border border-cyan-500/30 rounded-lg py-1.5 px-3 text-white text-xs shadow-[0_0_15px_rgba(6,182,212,0.15)] z-[110] whitespace-nowrap pointer-events-none"
        >
          {data.metadata.subject ? (
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] font-mono text-cyan-400/80 tracking-wider uppercase">{data.metadata.provider || 'email'} alert</span>
              <span className="font-semibold text-zinc-100">{data.metadata.subject}</span>
              {data.metadata.from && <span className="text-[9px] text-zinc-400">from: {data.metadata.from}</span>}
            </div>
          ) : (
            <>
              <div className="font-semibold text-cyan-400 truncate">{data.metadata.original_sender}</div>
              <div className="text-zinc-300 truncate mt-0.5">{data.metadata.original_subject}</div>
            </>
          )}
        </motion.div>
      )}
    </motion.div>
  );
};
