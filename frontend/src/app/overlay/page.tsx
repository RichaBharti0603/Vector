'use client';

import React, { useState, useEffect } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { FlightPath } from '@/components/aircraft/FlightPath';
import { NotificationCard } from '@/components/overlay/NotificationCard';
import { AnimatePresence } from 'framer-motion';

export default function OverlayPage() {
  const { events, removeEvent } = useWebSocket('ws://localhost:8001/ws');
  const [activeFlights, setActiveFlights] = useState<any[]>([]);

  useEffect(() => {
    // Whenever a new event arrives, add it to active flights
    if (events.length > 0) {
      const latestEvent = events[events.length - 1];
      if (latestEvent.event_type.startsWith('VECTOR_') || latestEvent.event_type === 'agent_action') {
        setActiveFlights((prev) => {
          if (!prev.find(p => p.payload.id === latestEvent.payload.id)) {
            return [...prev, latestEvent];
          }
          return prev;
        });
      }
    }
  }, [events]);

  const handleAnimationComplete = (id: string) => {
    // Animation finished, remove from flights but keep notification card
    setActiveFlights((prev) => prev.filter(f => f.payload.id !== id));
  };

  return (
    <div className="w-screen h-screen overflow-hidden bg-transparent font-sans">
      
      {/* Aircraft Layer */}
      {activeFlights.map((flight, index) => (
        <FlightPath 
          key={`flight-${flight.payload.id}`}
          index={index}
          agentType={flight.payload.agent_type}
          priority={flight.payload.priority}
          onAnimationComplete={() => handleAnimationComplete(flight.payload.id)}
        />
      ))}

      {/* Notification Cards Layer */}
      <div className="absolute top-10 right-10 flex flex-col items-end z-50">
        <AnimatePresence>
          {events.map((event) => (
            (event.event_type.startsWith('VECTOR_') || event.event_type === 'agent_action') && (
              <NotificationCard 
                key={`card-${event.payload.id}`}
                event={event.payload}
                onDismiss={removeEvent}
              />
            )
          ))}
        </AnimatePresence>
      </div>

    </div>
  );
}
