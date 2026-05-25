'use client';

import { useEffect, useState, useRef, useCallback } from 'react';

export const useWebSocket = (url: string) => {
  const [events, setEvents] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);
  const maxReconnectDelay = 10000;
  const reconnectDelay = useRef(1000);

  const connect = useCallback(() => {
    console.log(`Attempting WebSocket connection to ${url}...`);
    
    // Clean up existing socket
    if (ws.current) {
      ws.current.close();
    }

    try {
      const socket = new WebSocket(url);
      ws.current = socket;

      socket.onopen = () => {
        console.log('WebSocket Connected successfully');
        setIsConnected(true);
        reconnectDelay.current = 1000; // Reset delay on success
        if (reconnectTimeout.current) {
          clearTimeout(reconnectTimeout.current);
          reconnectTimeout.current = null;
        }
      };

      socket.onmessage = (message) => {
        try {
          const data = JSON.parse(message.data);
          setEvents((prev) => {
            // Avoid duplicate events by ID if present
            if (data.payload?.id && prev.some(e => e.payload?.id === data.payload.id)) {
              return prev;
            }
            return [...prev, data];
          });
        } catch (e) {
          console.error('Failed to parse WebSocket message', e);
        }
      };

      socket.onerror = (error) => {
        console.error('WebSocket encountered error:', error);
      };

      socket.onclose = (event) => {
        setIsConnected(false);
        console.log(`WebSocket Disconnected. Code: ${event.code}. Reason: ${event.reason}`);
        
        // Attempt to reconnect with exponential backoff
        if (reconnectTimeout.current) {
          clearTimeout(reconnectTimeout.current);
        }
        
        const nextDelay = reconnectDelay.current;
        reconnectDelay.current = Math.min(reconnectDelay.current * 1.5, maxReconnectDelay);
        
        console.log(`Scheduling reconnect in ${nextDelay}ms`);
        reconnectTimeout.current = setTimeout(() => {
          connect();
        }, nextDelay);
      };

    } catch (e) {
      console.error('WebSocket instantiation failed:', e);
      setIsConnected(false);
      
      // Retry
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
      reconnectTimeout.current = setTimeout(connect, 3000);
    }
  }, [url]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
      if (ws.current) {
        ws.current.onclose = null; // Prevent reconnect loop on unmount
        ws.current.close();
      }
    };
  }, [connect]);

  const removeEvent = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.payload.id !== id));
  };

  return { events, isConnected, removeEvent };
};
