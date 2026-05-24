'use client';

import { useEffect, useState, useRef } from 'react';

export const useWebSocket = (url: string) => {
  const [events, setEvents] = useState<any[]>([]);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    ws.current = new WebSocket(url);

    ws.current.onopen = () => console.log('WebSocket Connected');
    
    ws.current.onmessage = (message) => {
      try {
        const data = JSON.parse(message.data);
        setEvents((prev) => [...prev, data]);
      } catch (e) {
        console.error('Failed to parse WebSocket message', e);
      }
    };

    ws.current.onerror = (error) => console.error('WebSocket Error:', error);

    ws.current.onclose = () => console.log('WebSocket Disconnected');

    return () => {
      ws.current?.close();
    };
  }, [url]);

  const removeEvent = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.payload.id !== id));
  };

  return { events, removeEvent };
};
